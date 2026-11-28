/* Prueba de humo: abre la app en un navegador de móvil y recorre lo básico.
   Detecta lo que los tests de lógica no ven: app colgada, errores en consola y pantallas más anchas que el móvil.
   Uso: npm run smoke   (necesita Playwright con Chromium; en GitHub Actions se instala solo)
   Datos de entreno inventados: nunca se usan datos reales. */
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const BASE = 'http://localhost:8766/';
const TYPES = { html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json', webmanifest: 'application/manifest+json', png: 'image/png', svg: 'image/svg+xml' };
const fails = [];
const fail = msg => { fails.push(msg); console.log(`  ✗ ${msg}`); };
const ok = msg => console.log(`  ✓ ${msg}`);

function hevyCsv() {
  const head = 'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_kg,reps,distance_km,duration_seconds,rpe';
  const plan = { Pierna: ['Sentadilla con barra', 'Curl de pierna sentado'], Pecho: ['Press de banca con barra', 'Tríceps en polea'], Espalda: ['Remo sentado con cable', 'Jalón al pecho en cable'] };
  const rows = [head];
  Object.entries(plan).forEach(([title, exercises], t) => {
    for (let week = 0; week < 3; week++) {
      const day = 1 + week * 7 + t;
      exercises.forEach((name, e) => {
        for (let s = 0; s < 3; s++) rows.push([title, `${day} jun 2026, 18:05`, `${day} jun 2026, 19:01`, '', name, '', '', s, 'normal', 40 + e * 10 + week * 2.5, 10 - s, '', '', ''].map(v => `"${v}"`).join(','));
      });
    }
  });
  return rows.join('\n');
}

async function serve(ctx) {
  await ctx.route(`${BASE}**`, route => {
    const file = new URL(route.request().url()).pathname.slice(1) || 'index.html';
    const full = path.join(ROOT, file);
    if (file.includes('..') || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return route.fulfill({ status: 404, body: '' });
    route.fulfill({ status: 200, contentType: TYPES[file.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(full) });
  });
}

async function alive(page) {
  const answer = await Promise.race([page.evaluate(() => 'ok'), new Promise(r => setTimeout(() => r('colgada'), 5000))]);
  return answer === 'ok';
}

async function checkWidth(page, where) {
  const [doc, screen] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  if (doc > screen) fail(`${where}: la página mide ${doc}px y la pantalla ${screen}px (se sale por la derecha)`);
  else ok(`${where}: cabe en la pantalla`);
}

async function importHevy(page, csvPath) {
  await page.setInputFiles('#file-input', csvPath);
  await page.click('[data-h="go"]', { timeout: 5000 });
  await page.waitForFunction(() => typeof G !== 'undefined' && G.workouts.length > 0, null, { timeout: 8000 });
  await page.waitForTimeout(600);
  const stuck = await page.locator('[data-h="go"]:visible').count();
  if (stuck) fail('importar Hevy: la pantalla de importación se queda abierta');
  else ok(`importar Hevy: ${await page.evaluate(() => G.workouts.length)} entrenos`);
}

async function visitTabs(page) {
  for (const tab of ['peso', 'entreno', 'dieta', 'ajustes']) {
    await page.click(`[data-tab="${tab}"]`, { timeout: 5000 });
    await page.waitForTimeout(300);
    await checkWidth(page, `pestaña ${tab}`);
  }
  await page.evaluate(() => document.querySelectorAll('#view-ajustes details, details.settings-group').forEach(d => { d.open = true; }));
  await page.waitForTimeout(300);
  await checkWidth(page, 'Ajustes con todo desplegado');
}

async function workoutFlow(page) {
  await page.click('[data-tab="entreno"]');
  await page.click('#gym-seg [data-view="historial"]', { timeout: 5000 });
  await page.click('.wk-item >> nth=0', { timeout: 5000 });
  await page.waitForTimeout(500);
  await checkWidth(page, 'detalle de un entreno');
  await page.click('.page.open [data-d="back"]', { timeout: 5000 });
  await page.click('#gym-seg [data-view="rutinas"]', { timeout: 5000 });
  await page.click('.routine [data-g="start"] >> nth=0', { timeout: 5000 });
  await page.waitForTimeout(500);
  await page.click('.ex-card >> nth=0 >> .set-chk >> nth=0', { timeout: 5000 });
  await page.waitForTimeout(500);
  const done = await page.locator('.set-row.done').count();
  if (done < 1) fail('entreno: no se pudo marcar la primera serie');
  else ok('entreno: rutina empezada y primera serie marcada');
  await checkWidth(page, 'entreno en curso');
}

async function step(page, name, fn) {
  try { await fn(); }
  catch (e) { fail(`${name}: ${String(e.message || e).split('\n')[0]}`); }
  if (!(await alive(page))) throw new Error(`la app se ha colgado durante «${name}»`);
}

async function run() {
  const csvPath = path.join(require('os').tmpdir(), `tracking-smoke-${process.pid}.csv`);
  fs.writeFileSync(csvPath, hevyCsv());
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'es-ES', timezoneId: 'Europe/Madrid' });
  await serve(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', e => fail(`error en la página: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') fail(`error en consola: ${m.text()}`); });
  console.log(`Prueba de humo sobre ${ROOT}`);
  try {
    await page.goto(BASE);
    await page.waitForTimeout(1000);
    if (!(await alive(page))) throw new Error('la app se cuelga al abrirla');
    ok('la app abre y responde');
    await step(page, 'importar Hevy', () => importHevy(page, csvPath));
    await step(page, 'pestañas', () => visitTabs(page));
    await step(page, 'entreno', () => workoutFlow(page));
  } catch (e) {
    fail(e.message);
  } finally {
    await browser.close();
    fs.rmSync(csvPath, { force: true });
  }
  console.log(fails.length ? `\n✗ ${fails.length} problema(s)` : '\n✓ Todo bien');
  process.exit(fails.length ? 1 : 0);
}

run();
