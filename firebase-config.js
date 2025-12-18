// --------------------------------------------------------------
// CONFIGURACIÓN DE FIREBASE
// --------------------------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyDVkODqotNEMq0vAKDovUT6VQhxw80tswM",
    authDomain: "andy-race.firebaseapp.com",
    projectId: "andy-race",
    storageBucket: "andy-race.firebasestorage.app",
    messagingSenderId: "533434605508",
    appId: "1:533434605508:web:a15fae088cb6aabba98e91",
    measurementId: "G-G4PEEYRJ2Z"
};

// Exponer globalmente para que script.js y admin.html lo usen
window.firebaseConfig = firebaseConfig;
