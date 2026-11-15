# Tracking como app de Android

La app de Android es un contenedor nativo hecho con [Capacitor](https://capacitorjs.com/) que muestra la misma web que hay en este repositorio. Tiene ventana propia, icono en el cajón de aplicaciones y funciona sin conexión.

## Cómo funciona

- **El `.apk` carga la app desde GitHub Pages** (`https://igor-0102.github.io/tracking/`) y la guarda en el móvil. Por eso:
  - La primera vez que se abre hace falta internet. Después funciona sin conexión.
  - Los cambios normales de la app (`index.html`, `app.js`, `gym.js`, `styles.css`) llegan solos: al abrirla aparece «Nueva versión disponible · Actualizar». No hay que reinstalar nada.
  - Solo hay que recompilar el `.apk` si cambia la parte nativa: nombre, icono, permisos o plugins.
- **Los datos** se guardan dentro de la app (IndexedDB). Además, la app escribe una copia automática (`tracking-auto.json`) en su carpeta privada, que Android incluye en la copia de seguridad de la cuenta de Google. Si la app arranca vacía y encuentra esa copia, ofrece restaurarla.
- **El `.apk` se compila en GitHub**, no en tu ordenador: el flujo `.github/workflows/android.yml` lo genera, lo firma y lo publica en *Releases*.

## Instalar en el móvil

1. En el móvil, abre <https://github.com/igor-0102/tracking/releases/latest> y descarga **Tracking.apk**.
2. Abre el archivo descargado. Android pedirá permiso para «instalar aplicaciones desconocidas» desde el navegador: acéptalo.
3. Pulsa **Instalar**. Si Play Protect avisa de que no conoce al desarrollador, elige **Instalar de todos modos**.

### Pasar los datos de la versión web a la app

Los datos de la versión web (Chrome) no pasan solos: son almacenes distintos.

1. En la versión web: **Ajustes → Exportar copia completa** y guarda el archivo `.json`.
2. En la app nueva: **Ajustes → Importar archivo** y elige ese `.json`.
3. Comprueba que está todo y, si quieres, desinstala la versión web.

## Estructura de carpetas

```
tracking/
├── index.html, styles.css, app.js, gym.js, sw.js, manifest.webmanifest, icons/   ← la app (web)
├── capacitor.config.json      ← nombre, identificador y dirección que carga la app
├── package.json               ← dependencias de Capacitor y comandos
├── tools/build-www.mjs        ← copia la web a www/ (carpeta que se empaqueta)
├── native/offline.html        ← pantalla «Sin conexión» del primer arranque
├── android/                   ← proyecto nativo de Android (generado por Capacitor)
│   ├── app/build.gradle       ← versión y firma (la clave llega por secretos de GitHub)
│   └── app/src/main/AndroidManifest.xml, res/           ← permisos, iconos, pantalla de inicio
└── .github/workflows/android.yml   ← compila y publica el .apk
```

## Sacar una versión nueva

- **Cambios en la app (lo habitual):** se suben a `main`, con el número de versión cambiado en `sw.js` (`VERSION`) y `app.js` (`APP_VERSION`). La app instalada se actualiza sola.
- **Cambios en la parte nativa:** al subirlos a `main`, GitHub compila un `.apk` nuevo y lo publica en *Releases*. También se puede lanzar a mano: pestaña **Actions → Compilar APK de Android → Run workflow**. Se instala encima del anterior y los datos se conservan, porque va firmado con la misma clave.

## Cambiar el nombre o el icono

- **Nombre:** `appName` en `capacitor.config.json` y los textos `app_name` y `title_activity_main` en `android/app/src/main/res/values/strings.xml`.
- **Icono:** sustituye los PNG de `android/app/src/main/res/mipmap-*/` (`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png`) y el color de fondo en `res/values/ic_launcher_background.xml`. La forma más cómoda es Android Studio: clic derecho en `res` → *New → Image Asset*.
- **No cambies `appId`** (`io.github.igor0102.tracking`): Android lo trataría como otra app distinta, sin tus datos.

## Compilar en tu ordenador (opcional, Windows 10)

No hace falta, pero se puede.

**Instalar una vez:**

| Qué | Versión | Enlace |
|---|---|---|
| Node.js | 22 LTS o superior | <https://nodejs.org/> |
| Android Studio | la estable actual (trae el JDK 21 y el SDK) | <https://developer.android.com/studio> |
| Git | cualquiera reciente | <https://git-scm.com/download/win> |

En Android Studio, la primera vez: *More Actions → SDK Manager* y marca **Android SDK Platform 36** y **Android SDK Build-Tools**.

**Comandos, en orden, desde PowerShell:**

```powershell
git clone https://github.com/igor-0102/tracking.git
cd tracking
npm install                 # a) instala dependencias
npm run sync                # copia la web a www/ y la sincroniza con el proyecto Android
npm run open                # b) abre Android Studio: pulsa ▶ para probar en el móvil (con depuración USB) o en un emulador
cd android
.\gradlew.bat assembleRelease   # c) genera el .apk firmado
```

El `.apk` queda en `android\app\build\outputs\apk\release\app-release.apk`. Pásalo al móvil (cable, Drive, correo) y ábrelo para instalarlo.

Si `gradlew` no encuentra Java o el SDK, define estas variables (ajusta la ruta a tu usuario) y abre una terminal nueva:

```powershell
setx JAVA_HOME "C:\Program Files\Android\Android Studio\jbr"
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
```

## Errores habituales

| Error | Causa y solución |
|---|---|
| `SDK location not found` | Falta `ANDROID_HOME`, o abre el proyecto una vez con Android Studio (crea `android/local.properties`). |
| `Unsupported class file major version` / `invalid source release: 21` | Gradle está usando otro Java. Apunta `JAVA_HOME` al JDK 21 de Android Studio (carpeta `jbr`). |
| `Failed to find target with hash string 'android-36'` | Instala *Android SDK Platform 36* en el SDK Manager. |
| `www directory not found` / la app sale en blanco | Ejecuta `npm run sync` antes de compilar. |
| Al instalar: «App no instalada» o conflicto de firma | Hay instalada una versión firmada con otra clave (por ejemplo, una de depuración). Exporta tus datos, desinstala e instala de nuevo. |
| La app muestra «Sin conexión» | Es el primer arranque sin internet. Conéctate y pulsa *Reintentar*. |
| Los cambios de la web no aparecen | Cierra la app del todo y ábrela; pulsa «Actualizar» cuando salga el aviso. |

## Sobre la clave de firma

Android solo permite actualizar una app sin borrar sus datos si todas las versiones van firmadas con la misma clave.

- La clave **no está en el repositorio**. GitHub Actions la recibe de dos secretos del repositorio (*Settings → Secrets and variables → Actions*): `KEYSTORE_BASE64` (el archivo de la clave codificado en base64) y `KEYSTORE_PASSWORD` (su contraseña). El alias de la clave es `tracking`.
- **Guarda una copia de esos dos valores en un sitio seguro** (un gestor de contraseñas, por ejemplo). GitHub no permite volver a leer un secreto. Si se pierden, habrá que crear una clave nueva y reinstalar la app: exportar los datos, desinstalar, instalar e importar.
- Para compilar en local, guarda el archivo de la clave como `android/app/tracking.keystore` y crea `android/app/signing.properties` (git los ignora):

```
storeFile=tracking.keystore
storePassword=LA_CONTRASEÑA
keyAlias=tracking
keyPassword=LA_CONTRASEÑA
```
