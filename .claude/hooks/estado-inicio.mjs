// Hook SessionStart: al abrir Claude Code, carga las primeras 60 líneas de docs/ESTADO.md.
// Si el proyecto no tiene ese archivo, no muestra nada.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const file = join(root, 'docs', 'ESTADO.md');

if (existsSync(file)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).slice(0, 60);
  process.stdout.write('Estado del proyecto (docs/ESTADO.md):\n' + lines.join('\n') + '\n');
}
