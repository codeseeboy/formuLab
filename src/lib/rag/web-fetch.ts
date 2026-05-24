import { extractTextFromFile } from './extract';

export async function fetchUrlContent(url: string): Promise<{ text: string; title: string; mimeHint: string }> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'FormuLab/1.0 Research Bot (agrochemical R&D)',
      Accept: 'text/html,application/pdf,application/xhtml+xml,text/plain,*/*',
    },
    redirect: 'follow',
  });

  if (!res.ok) throw new Error(`URL fetch failed: HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await res.arrayBuffer());
  const title = new URL(url).hostname + new URL(url).pathname;

  if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
    const text = await extractTextFromFile(buffer, 'document.pdf', 'application/pdf');
    return { text, title: url, mimeHint: 'application/pdf' };
  }

  if (url.toLowerCase().endsWith('.pptx')) {
    const text = await extractPptxText(buffer);
    return { text, title: url, mimeHint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
  }

  if (contentType.includes('text/html') || contentType.includes('text/plain')) {
    const html = buffer.toString('utf8');
    const text = contentType.includes('html') ? await htmlToText(html) : html;
    return { text, title: extractHtmlTitle(html) || title, mimeHint: contentType };
  }

  throw new Error(`Unsupported content type: ${contentType || 'unknown'}`);
}

function extractHtmlTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

async function htmlToText(html: string): Promise<string> {
  const { load } = await import('cheerio');
  const $ = load(html);
  $('script, style, nav, footer, header, noscript').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

export async function extractPptxText(buffer: Buffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const parts: string[] = [];
  const slideFiles = Object.keys(zip.files).filter((n) => n.match(/ppt\/slides\/slide\d+\.xml$/));
  for (const path of slideFiles.sort()) {
    const xml = await zip.files[path].async('string');
    const texts = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((m) => m[1]);
    if (texts.length) parts.push(texts.join(' '));
  }
  return parts.join('\n\n');
}
