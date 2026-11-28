// Comprueba las normas de CLAUDE.md en los cambios de una rama frente a main.
// Uso: node tools/check-pr.mjs [base] [rama]   (por defecto: origin/main y la rama actual)
// En GitHub Actions lo lanza .github/workflows/checks.yml en cada Pull Request.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const base = process.argv[2] || 'origin/main';
const branch = process.argv[3] || git('rev-parse', '--abbrev-ref', 'HEAD').trim();
const range = `${base}...HEAD`;
const problems = [];
const bad = msg => problems.push(msg);

const BIG_FILES = ['app.js', 'gym.js', 'diet.js'];
const CODEX_FORBIDDEN = [/^android\//, /^native\//, /^\.github\//, /^\.claude\//, /^capacitor\.config\.json$/, /^CLAUDE\.md$/,
  /^AGENTS\.md$/, /^docs\//, /^foods-usda\.js$/, /^tools\/(?!(foods-es\.txt|build-www\.mjs)$)/, /^package-lock\.json$/];
const WEB_JS = f => /\.js$/.test(f) && !/^(tests|tools|android|native|www|node_modules|CODEX_HANDOFF)\//.test(f) && !/^foods-(db|usda)\.js$/.test(f);

function changedFiles() {
  return git('diff', '--name-status', range).trim().split('\n').filter(Boolean)
    .map(line => { const [status, ...paths] = line.split('\t'); return { status: status[0], file: paths.at(-1) }; });
}

function checkBigFiles() {
  for (const line of git('diff', '--numstat', range, '--', ...BIG_FILES).trim().split('\n').filter(Boolean)) {
    const [added, removed, file] = line.split('\t');
    if (+added > +removed) bad(`${file} crece ${added - removed} líneas: ya pasa de 800, pon el código nuevo en un archivo nuevo.`);
  }
}

function checkNewFiles(files) {
  for (const { status, file } of files) {
    if (status !== 'A' || !WEB_JS(file) || !existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n').length;
    if (lines > 800) bad(`${file} tiene ${lines} líneas (máximo 800 en archivos nuevos).`);
  }
}

function addedLines(file) {
  const out = [];
  let lineNo = 0;
  for (const line of git('diff', '-U0', range, '--', file).split('\n')) {
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (hunk) { lineNo = +hunk[1]; continue; }
    if (line.startsWith('+') && !line.startsWith('+++')) out.push([lineNo++, line.slice(1)]);
  }
  return out;
}

function checkCodeRules(files) {
  for (const { status, file } of files) {
    if (status === 'D' || !WEB_JS(file)) continue;
    for (const [n, text] of addedLines(file)) {
      if (/catch\s*(\([^)]*\))?\s*\{\s*\}/.test(text)) bad(`${file}:${n} error silenciado (catch vacío).`);
      if (/console\.log\(/.test(text)) bad(`${file}:${n} console.log de depuración.`);
    }
  }
}

function checkScriptsRegistered() {
  const html = readFileSync('index.html', 'utf8');
  const sw = readFileSync('sw.js', 'utf8');
  const www = readFileSync('tools/build-www.mjs', 'utf8');
  for (const [, src] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    if (/^https?:/.test(src)) { bad(`index.html carga ${src} de internet: la app debe funcionar sin conexión.`); continue; }
    if (!existsSync(src)) bad(`index.html carga ${src}, pero el archivo no existe.`);
    if (!sw.includes(`'./${src}'`) && !sw.includes(`'${src}'`)) bad(`${src} no está en ASSETS de sw.js (no funcionaría sin conexión).`);
    if (!www.includes(`'${src}'`)) bad(`${src} no está en files de tools/build-www.mjs (faltaría en el APK).`);
  }
}

function checkCodexLimits(files) {
  if (!branch.startsWith('handoff/')) return;
  for (const { file } of files) {
    if (CODEX_FORBIDDEN.some(re => re.test(file))) bad(`Codex no puede tocar ${file} (ver CLAUDE.md → «Qué puede tocar y qué no»).`);
  }
  const versions = git('diff', '-U0', range, '--', 'sw.js', 'app.js', 'package.json');
  if (/^\+.*(VERSION = |"version":)/m.test(versions)) bad('Codex no puede cambiar la versión (VERSION, APP_VERSION o package.json): la sube Claude al publicar.');
}

const files = changedFiles();
if (files.some(({ file }) => file.startsWith('CODEX_HANDOFF/'))) bad('La carpeta CODEX_HANDOFF/ ya no se usa: el informe va en la descripción de la Pull Request.');
checkBigFiles();
checkNewFiles(files);
checkCodeRules(files);
checkScriptsRegistered();
checkCodexLimits(files);

console.log(`Normas de CLAUDE.md · rama ${branch} frente a ${base} · ${files.length} archivo(s) cambiados`);
if (problems.length) {
  problems.forEach(p => console.log(`  ✗ ${p}`));
  console.log(`\n✗ ${problems.length} problema(s)`);
  process.exit(1);
}
console.log('✓ Se cumplen las normas');
