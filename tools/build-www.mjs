// Copia los archivos de la web a www/, que es la carpeta que Capacitor mete dentro del .apk.
// Uso: npm run build:www
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
const files = ['index.html', 'styles.css', 'app.js', 'weight-xlsx.js', 'weight-extras.js', 'ranges.js', 'chart-ranges.js', 'gym.js', 'exercise-guide.js', 'gymcalc.js', 'gym-plus.js', 'body.js', 'native.js', 'nutri.js', 'foods.js', 'prepared-foods.js', 'foods-db.js', 'foods-usda.js', 'diet.js', 'sw.js', 'manifest.webmanifest'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of files) cpSync(join(root, f), join(out, f));
cpSync(join(root, 'icons'), join(out, 'icons'), { recursive: true });
cpSync(join(root, 'native', 'offline.html'), join(out, 'offline.html'));
console.log('www/ lista:', files.length + 2, 'elementos');
