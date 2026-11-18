// Hook UserPromptSubmit: cuenta los mensajes de la sesión. A partir del 20 (y luego cada 10)
// pide a Claude que sugiera /cerrar + /clear para no arrastrar un contexto enorme.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { input = {}; }

const session = String(input.session_id || 'sin-sesion').replace(/[^\w-]/g, '');
const dir = join(tmpdir(), 'claude-aviso-compactar');
const file = join(dir, session + '.txt');
mkdirSync(dir, { recursive: true });

let count = 0;
try { count = Number(readFileSync(file, 'utf8')) || 0; } catch { count = 0; }
count += 1;
writeFileSync(file, String(count));

if (count >= 20 && (count - 20) % 10 === 0) {
  process.stdout.write(
    `Aviso: esta sesión ya lleva ${count} mensajes. Al terminar tu respuesta, sugiere al usuario ` +
    'ejecutar /cerrar y después /clear para ahorrar tokens.\n'
  );
}
