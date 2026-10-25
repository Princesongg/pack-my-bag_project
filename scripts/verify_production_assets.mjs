import fs from 'node:fs';
import { createHash } from 'node:crypto';
const origin = 'https://pack-my-bagproject.vercel.app';
const output = 'docs/verification/production-2026-10-26';
const ui = JSON.parse(fs.readFileSync('docs/verification/production-ui/2026-10-26/ui-results.json'));
const urls = new Set(ui.responses.filter(r => r.url.startsWith(origin) && /\.(js|css|svg|png|jpe?g|webp|woff2?)(\?|$)/.test(r.url)).map(r => r.url));
for (const name of fs.readdirSync('dist/assets')) urls.add(`${origin}/assets/${name}`);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const resources = [];
for (const url of urls) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const local = 'dist' + new URL(url).pathname;
  resources.push({ url, status: response.status, contentType: response.headers.get('content-type'), bytes: bytes.length, sha256: sha(bytes), matchesBuild: fs.existsSync(local) ? sha(fs.readFileSync(local)) === sha(bytes) : null });
}
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(output + '/assets.json', JSON.stringify({ checkedAt: new Date().toISOString(), resources }, null, 2));
console.log(JSON.stringify({ count: resources.length, failed: resources.filter(r => r.status !== 200 || r.matchesBuild === false) }));
