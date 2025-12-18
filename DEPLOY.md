# Guía de Despliegue en GitHub Pages

Esta es la forma más sencilla y gratuita de poner tu juego en internet para que tus alumnos accedan.

## Paso 1: Subir a GitHub
1. Crea una cuenta en [github.com](https://github.com/) si no tienes una.
2. Crea un **Nuevo Repositorio** (New Repository).
   - Nombre: `andys-race-game` (o lo que quieras).
   - Público (Public).
   - Marca: "Add a README file" (opcional).
3. Haz clic en **Create repository**.

## Paso 2: Cargar Archivos
1. En tu nuevo repositorio, haz clic en **Add file** > **Upload files**.
2. Arrastra a la ventana TODOS los archivos de tu carpeta (menos la carpeta `.git` si existiera).
   - `index.html`
   - `style.css`
   - `script.js`
   - `sentences.js`
   - `firebase-config.js`
   - `admin.html`
   - `SETUP_FIREBASE.md` (opcional)
3. Espera a que carguen y haz clic en **Commit changes** (botón verde abajo).

## Paso 3: Activar GitHub Pages
1. En tu repositorio, ve a la pestaña **Settings** (Configuración) arriba a la derecha.
2. En el menú de la izquierda, baja hasta la sección "Cde and automation" y busca **Pages**.
3. En **Source**, selecciona `Deploy from a branch`.
4. En **Branch**, elige `main` (o `master`) y carpeta `/ (root)`.
5. Haz clic en **Save**.

## Paso 4: ¡Listo!
Verás un mensaje arriba que dice que tu sitio se está construyendo. Espera unos minutos y refresca la página.
Aparecerá un enlace como: `https://tu-usuario.github.io/andys-race-game/`

### Enlaces Importantes
- **Juego para Alumnos**: `https://tu-usuario.github.io/andys-race-game/`
- **Panel de Admin (para ti)**: `https://tu-usuario.github.io/andys-race-game/admin.html`
