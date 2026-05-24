export async function extractTextFromFile(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mimeType.includes('text/') || lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.csv')) {
    return buffer.toString('utf8');
  }

  if (lower.endsWith('.json')) {
    try {
      const j = JSON.parse(buffer.toString('utf8'));
      return typeof j === 'string' ? j : JSON.stringify(j, null, 2);
    } catch {
      return buffer.toString('utf8');
    }
  }

  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') {
    const pdfParse = (await import('pdf-parse')).default as (b: Buffer) => Promise<{ text?: string }>;
    const data = await pdfParse(buffer);
    return data.text ?? '';
  }

  if (lower.endsWith('.pptx')) {
    const { extractPptxText } = await import('./web-fetch');
    return extractPptxText(buffer);
  }

  throw new Error(`Unsupported file type: ${filename}. Use PDF, PPTX, TXT, MD, CSV, or JSON.`);
}
