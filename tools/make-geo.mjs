// Regenerates src/geo.js from Natural Earth 1:50m land (via the world-atlas package).
//
//   curl -L -o land-50m.json https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-50m.json
//   node tools/make-geo.mjs land-50m.json
//
// Output: two strings of delta-encoded integer coordinates, rings separated by "|".
//   GEO_LAND  every land ring, simplified with Douglas-Peucker at 0.12°, in tenths of a degree
//   GEO_TW    Taiwan and Penghu at full 1:50m detail, in thousandths of a degree
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2];
if (!src) { console.error('usage: node tools/make-geo.mjs land-50m.json'); process.exit(1); }

// TopoJSON → rings of [lon, lat]
const topo = JSON.parse(fs.readFileSync(src, 'utf8'));
const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
const arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; }); });
const arc = i => (i < 0 ? arcs[~i].slice().reverse() : arcs[i]);
const ring = r => r.flatMap((i, k) => (k ? arc(i).slice(1) : arc(i)));
const rings = [];
for (const g of topo.objects.land.geometries)
  for (const poly of g.type === 'Polygon' ? [g.arcs] : g.arcs)
    for (const r of poly) rings.push(ring(r));

// Douglas-Peucker. A closed ring starts and ends on the same point, so simplify each half separately.
function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1e-9;
  let dmax = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const d = Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / len;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax <= eps) return [pts[0], pts[pts.length - 1]];
  return dp(pts.slice(0, idx + 1), eps).slice(0, -1).concat(dp(pts.slice(idx), eps));
}
const simplifyRing = (r, eps) => { const h = r.length >> 1; return dp(r.slice(0, h + 1), eps).concat(dp(r.slice(h), eps).slice(1)); };

const encode = (rs, mult) => rs.map(r => {
  let px = 0, py = 0;
  return r.map(([x, y]) => { const X = Math.round(x * mult), Y = Math.round(y * mult), s = `${X - px},${Y - py}`; px = X; py = Y; return s; }).join(' ');
}).join('|');

const land = rings.map(r => simplifyRing(r, 0.12)).filter(r => r.length >= 4);
const centroid = r => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
const taiwan = rings.filter(r => { const [cx, cy] = centroid(r); return cx > 119 && cx < 122.5 && cy > 21.5 && cy < 25.8; });

fs.writeFileSync(path.join(root, 'src/geo.js'), `const GEO_LAND="${encode(land, 10)}";\nconst GEO_TW="${encode(taiwan, 1000)}";\n`);
console.log(`land: ${land.length} rings, ${land.reduce((s, r) => s + r.length, 0)} points · taiwan: ${taiwan.length} rings`);
