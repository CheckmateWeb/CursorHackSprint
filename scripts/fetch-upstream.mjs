/**
 * Fetches upstream Canvas Dreams sources into this folder.
 * Preserves Paul's customized src/lib/imageAnalysis.ts and audioEngine.ts.
 *
 * Usage: node scripts/fetch-upstream.mjs
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRESERVE = new Set(['src/lib/imageAnalysis.ts', 'src/lib/audioEngine.ts']);
const REPO = 'CheckmateWeb/CursorHackSprint';
const REF = 'master';

async function gh(path) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'canvas-dreams-bootstrap' },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

const tree = await gh(`/git/trees/${REF}?recursive=1`);
const blobs = tree.tree.filter((n) => n.type === 'blob' && !PRESERVE.has(n.path));

for (const node of blobs) {
  const raw = await fetch(
    `https://raw.githubusercontent.com/${REPO}/${REF}/${node.path}`,
  );
  if (!raw.ok) throw new Error(`raw ${node.path} → ${raw.status}`);
  const out = join(ROOT, node.path);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(await raw.arrayBuffer()));
  console.log('wrote', node.path);
}

console.log('\nDone. Paul lib files preserved. Next:');
console.log('  cd', ROOT);
console.log('  git checkout -B feature/paul-scene-analysis-audio');
console.log('  npm install && npm run build');
