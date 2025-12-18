# Configuración de Firebase

Para que el juego pueda guardar los resultados y permitir el inicio de sesión con Google, necesitas configurar un proyecto gratuito en Firebase.

## Paso 1: Crear Proyecto
1. Ve a [Firebase Console](https://console.firebase.google.com/).
2. Haz clic en **"Agregar proyecto"**.
3. Ponle un nombre (ej. `Andys-Race`).
4. Desactiva Google Analytics (no es necesario) y crea el proyecto.

## Paso 2: Configurar Autenticación
1. En el menú de la izquierda, busca **Compilación** > **Authentication**.
2. Haz clic en **"Comenzar"**.
3. En la pestaña **"Sign-in method"**, selecciona **Google**.
4. Dale a **Habilitar**.
5. Elige un correo de soporte y guarda.

## Paso 3: Configurar Base de Datos
1. En el menú de la izquierda, busca **Compilación** > **Firestore Database**.
2. Haz clic en **"Crear base de datos"**.
3. Elige la ubicación (us-central1 está bien).
4. **IMPORTANTE**: Elige comenzar en **modo de prueba** (Test mode). Esto permitirá escribir datos fácilmente por ahora.
   - *Nota: En un entorno real de producción cambiaríamos esto, pero para este uso escolar es suficiente.*

## Paso 4: Obtener las Claves
1. Ve a la **Configuración del Proyecto** (el engranaje ⚙️ al lado de "Descripción general").
2. Baja hasta la sección **"Tus apps"**.
3. Haz clic en el icono de **Web** (`</>`).
4. Ponle un nombre (ej. `Juego Web`) y registra la app.
5. Aparecerá un código con `const firebaseConfig = { ... }`.
6. **Copia solo lo que está entre las llaves `{ ... }`**.

## Paso 5: Pegar en el Código
1. Abre el archivo `firebase-config.js` en tu carpeta del proyecto.
2. Reemplaza el contenido de ejemplo con tus claves reales.
