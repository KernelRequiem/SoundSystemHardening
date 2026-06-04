import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const prerender = true;

export async function GET() {
  const wikiDir = join(process.cwd(), 'src/content/wiki');
  
  const files = readdirSync(wikiDir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  const index = files.map((file) => {
    const slug = file.replace('.md', '');
    const raw = readFileSync(join(wikiDir, file), 'utf-8');

    // Titre depuis le premier H1
    const titleMatch = raw.match(/^#\s+(.+)$/m);
    const title = titleMatch
      ? titleMatch[1].replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()
      : slug.replace(/-/g, ' ');

    // Contenu texte brut : supprimer markdown, garder les mots
    const content = raw
      .replace(/^#{1,6}\s+/gm, '')       // titres
      .replace(/\*\*(.+?)\*\*/g, '$1')   // gras
      .replace(/\*(.+?)\*/g, '$1')        // italique
      .replace(/`{1,3}[^`]+`{1,3}/g, '') // code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // liens
      .replace(/\[\[([^\]]+)\]\]/g, '$1')      // wiki links
      .replace(/[>#\-*|]/g, ' ')          // symboles markdown
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500); // extrait pour le snippet

    // Extraire les H2/H3 comme tags
    const headings = [...raw.matchAll(/^#{2,3}\s+(.+)$/gm)]
      .map((m) => m[1].replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim())
      .slice(0, 8);

    return {
      slug,
      title,
      content,
      headings,
      url: `/wiki/${encodeURIComponent(slug)}`,
    };
  });

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
