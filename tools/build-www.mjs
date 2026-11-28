// Copia los archivos de la web a www/, que es la carpeta que Capacitor mete dentro del .apk.
// Uso: npm run build:www
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');
// Claude: todo script cargado por index.html debe copiarse aquí para que Android y la PWA sigan offline.
const files = ['index.html', 'styles.css', 'app.js', 'weight-xlsx.js', 'weight-extras.js', 'ranges.js', 'chart-ranges.js', 'gym.js', 'gym-note-visibility.js', 'gym-active-backup.js', 'gym-rest-state.js', 'exercise-guide.js', 'gym-exercise-enhancements.js', 'gymcalc.js', 'gym-plus.js', 'gym-workout-layout.js', 'gym-units.js', 'gym-exercise-history.js', 'gym-portability.js', 'gym-summary-comparison.js', 'gym-history-tools.js', 'gym-motivation.js', 'body.js', 'native.js', 'nutri.js', 'foods.js', 'prepared-foods.js', 'foods-db.js', 'foods-usda.js', 'diet.js', 'diet-get-info.js', 'sw.js', 'manifest.webmanifest'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of files) cpSync(join(root, f), join(out, f));
cpSync(join(root, 'icons'), join(out, 'icons'), { recursive: true });
cpSync(join(root, 'native', 'offline.html'), join(out, 'offline.html'));
console.log('www/ lista:', files.length + 2, 'elementos');
