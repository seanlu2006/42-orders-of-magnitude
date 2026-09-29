// Inlines the coastline data into the page and writes two files:
//   index.html          standalone page, served by GitHub Pages
//   dist/fragment.html  body-only version, for hosts that supply their own <head>
// It also parses the inline script, so a syntax error fails the build.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const page = read('src/page.html');
const geo = read('src/geo.js').trim();
if (!page.includes('/*__GEO__*/')) throw new Error('src/page.html has no /*__GEO__*/ placeholder');
const fragment = page.replace('/*__GEO__*/', () => geo);

const script = fragment.slice(fragment.indexOf('<script>') + 8, fragment.lastIndexOf('</script>'));
new Function(script); // throws on a syntax error

const cut = fragment.indexOf('<canvas id="c"');
const head = fragment.slice(0, cut).trim();
const body = fragment.slice(cut).trim();

const SITE = 'https://seanlu2006.github.io/42-orders-of-magnitude/';
const DESC = 'A continuous zoom from the edge of the observable universe to the inside of a proton, about 42 orders of magnitude, drawn live in one HTML file.';

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${DESC}">
<meta name="theme-color" content="#04050A">
<meta property="og:type" content="website">
<meta property="og:title" content="42 Orders of Magnitude">
<meta property="og:description" content="${DESC}">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}docs/og.png">
<meta name="twitter:card" content="summary_large_image">
${head}
</head>
<body>
${body}
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/fragment.html'), fragment);
console.log(`index.html ${(html.length / 1024).toFixed(0)} KB · dist/fragment.html ${(fragment.length / 1024).toFixed(0)} KB · script parses`);
