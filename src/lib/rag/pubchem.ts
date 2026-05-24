/** PubChem PUG REST — authoritative chemical data (NCBI) */

export interface PubChemFacts {
  name: string;
  cas?: string;
  molecularFormula?: string;
  molecularWeight?: number;
  canonicalSmiles?: string;
  sourceUrl: string;
}

export async function fetchPubChemByName(name: string): Promise<PubChemFacts | null> {
  const encoded = encodeURIComponent(name.trim());
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const props = data?.PropertyTable?.Properties?.[0];
    if (!props) return null;
    return {
      name,
      molecularFormula: props.MolecularFormula,
      molecularWeight: props.MolecularWeight,
      canonicalSmiles: props.CanonicalSMILES,
      sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/#query=${encoded}`,
    };
  } catch {
    return null;
  }
}

export async function fetchPubChemByCas(cas: string): Promise<PubChemFacts | null> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas)}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const props = data?.PropertyTable?.Properties?.[0];
    if (!props) return null;
    return {
      name: cas,
      cas,
      molecularFormula: props.MolecularFormula,
      molecularWeight: props.MolecularWeight,
      canonicalSmiles: props.CanonicalSMILES,
      sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(cas)}`,
    };
  } catch {
    return null;
  }
}

export function pubChemToText(facts: PubChemFacts): string {
  return [
    `PubChem record: ${facts.name}`,
    facts.cas ? `CAS: ${facts.cas}` : '',
    facts.molecularFormula ? `Molecular formula: ${facts.molecularFormula}` : '',
    facts.molecularWeight != null ? `Molecular weight: ${facts.molecularWeight} g/mol` : '',
    facts.canonicalSmiles ? `SMILES: ${facts.canonicalSmiles}` : '',
    `URL: ${facts.sourceUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Extract likely chemical names / CAS from query */
export function extractChemicalHints(query: string): { names: string[]; cas: string[] } {
  const cas = [...query.matchAll(/\b\d{2,7}-\d{2}-\d\b/g)].map((m) => m[0]);
  const names: string[] = [];
  const known = [
    'chlorpyrifos', 'glyphosate', 'imidacloprid', 'lambda-cyhalothrin', 'mancozeb',
    'abamectin', 'atrazine', 'tebuconazole', 'paraquat', 'azoxystrobin', '2,4-d',
  ];
  const lower = query.toLowerCase();
  for (const k of known) {
    if (lower.includes(k)) names.push(k);
  }
  const cap = query.match(/\b[A-Z][a-z]+(?:[- ][A-Z]?[a-z]+)*\b/g);
  if (cap) names.push(...cap.slice(0, 2));
  return { names: [...new Set(names)], cas: [...new Set(cas)] };
}
