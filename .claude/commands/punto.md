---
description: Commit de seguridad antes de un cambio grande (sin .env ni basura)
argument-hint: [siguiente tarea]
---

Haz un **punto de control** con git antes de: $ARGUMENTS

1. `git status`. Si no hay cambios, dime el commit actual y ya está.
2. Revisa qué se va a añadir. **No incluyas** `.env*`, claves (`*.jks`, `*.keystore`, `*.pem`), `node_modules/`, `www/`, builds, logs ni archivos temporales. Si alguno no está en `.gitignore`, propón añadirlo.
3. Añade solo los archivos correctos (por nombre, no `git add -A` a ciegas) y haz commit con el mensaje `chore: punto de control antes de <siguiente tarea>`.
4. Dime el hash del commit y cómo volver atrás:
   - Descartar todo lo que se haga después: `git reset --hard <hash>`
   - Recuperar un solo archivo: `git checkout <hash> -- <archivo>`
