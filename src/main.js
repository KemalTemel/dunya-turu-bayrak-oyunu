import { uiManager } from './ui/UIManager.js';
import { localization } from './systems/Localization.js';
import { progression } from './systems/Progression.js';

window.addEventListener('DOMContentLoaded', () => {
    // Initial systems load
    progression.load();
    localization.setLanguage('tr');

    const loginScreen = document.getElementById('login-screen');
    const loadingScreen = document.getElementById('loading-screen');
    const mainMenu = document.getElementById('main-menu');
    const progress = document.getElementById('loading-progress');
    let width = 0;

    if (progression.playerName) {
        // User zaten giriş yapmış, yükleme ekranını göster
        loginScreen.classList.remove('active');
        loadingScreen.classList.add('active');
        
        const welcomeEl = document.getElementById('user-welcome');
        if (welcomeEl) welcomeEl.textContent = `HOŞGELDİN, ${progression.playerName.toUpperCase()}!`;

        const interval = setInterval(() => {
            width += Math.random() * 30;
            if (width >= 100) {
                width = 100;
                clearInterval(interval);
                setTimeout(() => {
                    loadingScreen.classList.remove('active');
                    mainMenu.classList.add('active');
                }, 500);
            }
            if (progress) progress.style.width = width + '%';
        }, 200);
    } else {
        // Giriş yapmamış, direkt giriş ekranını göster
        loginScreen.classList.add('active');
        loadingScreen.classList.remove('active');
    }
});


// Handle resize for mobile height
const setVH = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', setVH);
setVH();
