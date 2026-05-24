export interface WikipediaSnippet {
  title: string;
  extract: string;
  url: string;
}

export async function searchWikipedia(query: string, limit = 2): Promise<WikipediaSnippet[]> {
  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  searchUrl.searchParams.set('action', 'query');
  searchUrl.searchParams.set('list', 'search');
  searchUrl.searchParams.set('srsearch', query);
  searchUrl.searchParams.set('format', 'json');
  searchUrl.searchParams.set('origin', '*');
  searchUrl.searchParams.set('srlimit', String(limit));

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { 'User-Agent': 'FormuLab/1.0 (agrochemical R&D app)' },
    next: { revalidate: 3600 },
  });
  if (!searchRes.ok) return [];

  const searchData = await searchRes.json();
  const items: { title: string }[] = searchData?.query?.search ?? [];
  const results: WikipediaSnippet[] = [];

  for (const item of items.slice(0, limit)) {
    const extractUrl = new URL('https://en.wikipedia.org/w/api.php');
    extractUrl.searchParams.set('action', 'query');
    extractUrl.searchParams.set('prop', 'extracts');
    extractUrl.searchParams.set('explaintext', '1');
    extractUrl.searchParams.set('exintro', '0');
    extractUrl.searchParams.set('titles', item.title);
    extractUrl.searchParams.set('format', 'json');
    extractUrl.searchParams.set('origin', '*');

    const exRes = await fetch(extractUrl.toString(), {
      headers: { 'User-Agent': 'FormuLab/1.0 (agrochemical R&D app)' },
      next: { revalidate: 3600 },
    });
    if (!exRes.ok) continue;

    const exData = await exRes.json();
    const pages = exData?.query?.pages ?? {};
    const page = Object.values(pages)[0] as { extract?: string; title?: string };
    if (!page?.extract) continue;

    results.push({
      title: page.title ?? item.title,
      extract: page.extract.slice(0, 3500),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent((page.title ?? item.title).replace(/ /g, '_'))}`,
    });
  }

  return results;
}

/** Fetch one article by exact Wikipedia title (for bulk corpus seeding). */
export async function fetchWikipediaArticle(title: string): Promise<WikipediaSnippet | null> {
  const extractUrl = new URL('https://en.wikipedia.org/w/api.php');
  extractUrl.searchParams.set('action', 'query');
  extractUrl.searchParams.set('prop', 'extracts');
  extractUrl.searchParams.set('explaintext', '1');
  extractUrl.searchParams.set('exintro', '0');
  extractUrl.searchParams.set('titles', title);
  extractUrl.searchParams.set('format', 'json');
  extractUrl.searchParams.set('origin', '*');

  const exRes = await fetch(extractUrl.toString(), {
    headers: { 'User-Agent': 'FormuLab/1.0 (agrochemical R&D app)' },
    next: { revalidate: 86400 },
  });
  if (!exRes.ok) return null;

  const exData = await exRes.json();
  const pages = exData?.query?.pages ?? {};
  const page = Object.values(pages)[0] as { extract?: string; title?: string; missing?: string };
  if (!page?.extract || page.missing) return null;

  const pageTitle = page.title ?? title;
  return {
    title: pageTitle,
    extract: page.extract.slice(0, 8000),
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`,
  };
}
