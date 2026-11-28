// Genera las bases de alimentos a partir de la base de datos SR28 del USDA (dominio público):
//   foods-db.js    lista básica en español (tools/foods-es.txt)
//   foods-usda.js  base completa en inglés
// Uso: npm run build:foods
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'node_modules', 'fda-nutrient-database', 'data');
const rows = f => readFileSync(join(dataDir, f), 'latin1').split(/\r?\n/).filter(Boolean)
  .map(l => l.split('^').map(c => c.replace(/^~|~$/g, '')));
const num = v => (v === '' || v == null ? 0 : Number(v));
const r2 = v => Math.round(v * 100) / 100;
const printMatches = typeof process !== 'undefined' && process.argv.includes('--check');

// Claude: si falta el paquete de datos, la base USDA ya empaquetada permite regenerar la lista española sin red.
const hasSourcePackage = existsSync(join(dataDir, 'ABBREV.txt'));
function loadBundledFoods() {
  const source = readFileSync(join(root, 'foods-usda.js'), 'utf8');
  const prefix = 'window.FOODS_USDA = ';
  const start = source.indexOf(prefix);
  if (start < 0) throw new Error('No encuentro la base USDA local para reconstruir foods-db.js');
  const json = source.slice(start + prefix.length).replace(/;\s*$/, '');
  return JSON.parse(json).map(([id, n, k, p, c, f, fi, su, na, ps]) => ({ id, n, k, p, c, f, fi, su, na, ps, hasK: true }));
}
const longDesc = new Map(hasSourcePackage ? rows('FOOD_DES.txt').map(r => [r[0], r[2]]) : []);
const sourceFoods = hasSourcePackage ? rows('ABBREV.txt') : null;
const foods = sourceFoods ? sourceFoods.map(r => {
  const ps = [];
  if (num(r[48]) > 0 && r[49]) ps.push([r[49], num(r[48])]);
  if (num(r[50]) > 0 && r[51]) ps.push([r[51], num(r[50])]);
  return { id: r[0], n: longDesc.get(r[0]) || r[1], k: num(r[3]), p: num(r[4]), f: num(r[5]), c: num(r[7]), fi: num(r[8]), su: num(r[9]), na: num(r[15]), ps, hasK: r[3] !== '' };
}).filter(f => f.hasK) : loadBundledFoods();
const byId = new Map(foods.map(f => [f.id, f]));
const pack = f => [f.id, f.n, r2(f.k), r2(f.p), r2(f.c), r2(f.f), r2(f.fi), r2(f.su), r2(f.na), f.ps];

// ---- Lista básica en español
const es = [];
const problems = [];
let cat = '';
for (const line of readFileSync(join(root, 'tools', 'foods-es.txt'), 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  const [name, c, spec, portions] = line.split('|').map(s => s.trim());
  cat = c || cat;
  let pick;
  if (/^\d{5}$/.test(spec)) pick = byId.get(spec);
  else {
    const toks = spec.split(';').map(s => s.trim().toLowerCase()).filter(Boolean);
    const must = toks.filter(t => !t.startsWith('!')), not = toks.filter(t => t.startsWith('!')).map(t => t.slice(1).trim());
    const cands = foods.filter(f => { const d = f.n.toLowerCase(); return must.every(t => d.includes(t)) && !not.some(t => d.includes(t)); })
      .sort((a, b) => a.n.length - b.n.length);
    pick = cands[0];
  }
  if (!pick) { problems.push(name + '  <-  ' + spec); continue; }
  const ps = (portions || '').split(';').map(s => s.trim()).filter(Boolean).map(s => { const [n, g] = s.split('='); return [n.trim(), Number(g)]; });
  es.push({ name, cat, pick, ps });
}
if (printMatches) {
  for (const e of es) console.log(`${e.name}  =>  [${e.pick.id}] ${e.pick.n}  (${e.pick.k} kcal, P${e.pick.p} C${e.pick.c} G${e.pick.f})`);
}
if (problems.length) { console.error('SIN COINCIDENCIA:\n' + problems.join('\n')); process.exit(1); }
const dup = es.map(e => e.pick.id).filter((id, i, a) => a.indexOf(id) !== i);
if (dup.length) { console.error('Códigos repetidos: ' + dup.join(', ')); process.exit(1); }

const header = '/* Datos: USDA National Nutrient Database for Standard Reference, Release 28 (dominio público).\n   Generado con tools/build-foods.mjs. No editar a mano.\n   Campos: [código, nombre, kcal, proteína, carbohidratos, grasa, fibra, azúcar, sodio (mg), porciones [[nombre, gramos]]] por 100 g';
writeFileSync(join(root, 'foods-db.js'),
  `${header}, categoría] */\nwindow.FOODS_ES = ${JSON.stringify(es.map(e => { const a = pack(e.pick); a[1] = e.name; a[9] = e.ps; a.push(e.cat); return a; }))};\n`);
if (hasSourcePackage) writeFileSync(join(root, 'foods-usda.js'), `${header}] */\nwindow.FOODS_USDA = ${JSON.stringify(foods.map(pack))};\n`);
console.log(`foods-db.js: ${es.length} alimentos · foods-usda.js: ${foods.length} alimentos`);
