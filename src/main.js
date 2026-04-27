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
        // Giriş yapmamış, giriş ekranını yönet
        loginScreen.classList.add('active');
        loadingScreen.classList.remove('active');

        const nameInput = document.getElementById('login-username');
        const loginBtn = document.getElementById('btn-login');

        const handleLogin = async () => {
            const username = nameInput.value.trim();
            if (username.length < 3) {
                alert("İsim en az 3 karakter olmalı!");
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = 'Kontrol ediliyor...';
            
            try {
                // SupabaseService importunu burada dinamik olarak kullanıyoruz
                const { supabaseService } = await import('./systems/SupabaseService.js');
                
                // İsim müsait mi kontrol et
                const isAvailable = await supabaseService.isUsernameAvailable(username);
                
                if (!isAvailable) {
                    // İsim alınmış, öneri sun
                    const suggestions = supabaseService.suggestUsernames(username);
                    
                    // Eski önerileri temizle
                    const oldContainer = document.querySelector('.suggestions-container');
                    if (oldContainer) oldContainer.remove();

                    const suggestionsDiv = document.createElement('div');
                    suggestionsDiv.className = 'suggestions-container';
                    suggestionsDiv.style.cssText = 'margin-top: 15px; text-align: center; animation: fadeIn 0.3s ease;';
                    suggestionsDiv.innerHTML = `
                        <p style="color: #ffb3b3; font-size: 0.85em; margin-bottom: 8px;">Bu isim alınmış. Şunları dene:</p>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
                            ${suggestions.map(s => `<button class="btn-suggestion" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 6px 12px; border-radius: 20px; cursor: pointer; font-size: 0.8em; transition: all 0.2s;">${s}</button>`).join('')}
                        </div>
                    `;
                    
                    loginBtn.parentElement.appendChild(suggestionsDiv);
                    
                    // Önerilere tıklama özelliği
                    suggestionsDiv.querySelectorAll('.btn-suggestion').forEach(btn => {
                        btn.onclick = () => {
                            nameInput.value = btn.textContent;
                            suggestionsDiv.remove();
                            loginBtn.disabled = false;
                            loginBtn.textContent = 'OYUNA GİR';
                        };
                    });

                    loginBtn.disabled = false;
                    loginBtn.textContent = 'BAŞKA İSİM DENE';
                    return;
                }

                // İsim müsait, devam et
                await supabaseService.createProfile(username);
                progression.playerName = username;
                progression.save();
                
                // Yükleme ekranına geç
                loginScreen.classList.remove('active');
                location.reload(); // Sayfayı yenilemek en temizi
            } catch (e) {
                console.error("Login error:", e);
                // Hata olsa bile en azından yerel devam et
                progression.playerName = username;
                progression.save();
                location.reload();
            }
        };

        loginBtn.onclick = handleLogin;
        nameInput.onkeypress = (e) => { if (e.key === 'Enter') handleLogin(); };
    }
});


// Handle resize for mobile height
const setVH = () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
};

window.addEventListener('resize', setVH);
setVH();
