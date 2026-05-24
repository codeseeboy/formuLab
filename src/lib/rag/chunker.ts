const CHUNK_SIZE = 900;
const OVERLAP = 120;

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ +/g, ' ').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buffer = '';

  const flush = (force?: string) => {
    const piece = (force ?? buffer).trim();
    if (piece.length >= 80) chunks.push(piece.slice(0, 12000));
    buffer = force ? '' : buffer;
  };

  for (const para of paragraphs) {
    if ((buffer + ' ' + para).length <= CHUNK_SIZE) {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    } else {
      if (buffer) flush();
      if (para.length <= CHUNK_SIZE) {
        buffer = para;
      } else {
        let start = 0;
        while (start < para.length) {
          const end = Math.min(start + CHUNK_SIZE, para.length);
          flush(para.slice(start, end));
          start = end - OVERLAP;
          if (start < 0) start = 0;
          if (end >= para.length) break;
        }
      }
    }
  }
  if (buffer) flush();

  return chunks;
}
