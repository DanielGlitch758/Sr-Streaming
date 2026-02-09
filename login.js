import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TUS CREDENCIALES
const firebaseConfig = {
    apiKey: "AIzaSyCwND4K2tKyQD37R_Gt160PwskGNs-1LhU",
    authDomain: "sr-streaming-e13ac.firebaseapp.com",
    projectId: "sr-streaming-e13ac",
    storageBucket: "sr-streaming-e13ac.firebasestorage.app",
    messagingSenderId: "779948636138",
    appId: "1:779948636138:web:5ceaf4ce15caa88d5d6493",
    measurementId: "G-FLRJFC21L3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Verificar si ya estás logueado (para no pedir clave otra vez)
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "index.html";
    }
});

// Manejar el formulario de Login
const loginForm = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMessage');
const btnLogin = document.getElementById('btnLogin');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Feedback visual de "Cargando..."
    btnLogin.innerText = "Verificando...";
    btnLogin.disabled = true;
    errorMsg.classList.add('hidden');

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Si pasa, el onAuthStateChanged de arriba nos redirige solo
    } catch (error) {
        console.error(error);
        btnLogin.innerText = "Ingresar al Sistema";
        btnLogin.disabled = false;
        errorMsg.textContent = "Error: Correo o contraseña incorrectos.";
        errorMsg.classList.remove('hidden');
    }
});
