const translations = {
    tr: {
        "OYNA": "OYNA",
        "DÜNYA TURU": "DÜNYA TURU",
        "Klasik": "Klasik",
        "Zamanlı": "Zamanlı",
        "Zor": "Zor",
        "Yazma": "Yazma",
        "SEVİYE": "SEVİYE",
        "Ülke adını yazın...": "Ülke adını yazın...",
        "GÖNDER": "GÖNDER",
        "Game Over": "Oyun Bitti",
        "Success": "Başarılı",
        "Next Level": "Sonraki Seviye",
        "Retry": "Tekrar Dene",
        "Main Menu": "Ana Menü",
        "Score": "Skor",
        "Gold": "Altın",
        "Correct!": "Doğru!",
        "Wrong!": "Yanlış!",
        "No Mistakes Round": "Hatasız Tur",
        "10 Correct in a Row": "10 Doğru Üst Üste",
        "Guess 50 Countries": "50 Ülke Tahmin Et",
        "Hint: Capital City": "İpucu: Başkent",
        "Hint: First Letter": "İpucu: İlk Harf",
        "Watching Ad...": "Reklam İzleniyor...",
        "Extra Life Earned!": "Ekstra Can Kazanıldı!",
        "Sound": "Ses",
        "Language": "Dil"
    },
    en: {
        "OYNA": "PLAY",
        "DÜNYA TURU": "WORLD TOUR",
        "Klasik": "Classic",
        "Zamanlı": "Timed",
        "Zor": "Hard",
        "Yazma": "Typing",
        "SEVİYE": "LEVEL",
        "Ülke adını yazın...": "Type country name...",
        "GÖNDER": "SUBMIT",
        "Game Over": "Game Over",
        "Success": "Success",
        "Next Level": "Next Level",
        "Retry": "Retry",
        "Main Menu": "Main Menu",
        "Score": "Score",
        "Gold": "Gold",
        "Correct!": "Correct!",
        "Wrong!": "Wrong!",
        "No Mistakes Round": "No Mistakes Round",
        "10 Correct in a Row": "10 Correct in a Row",
        "Guess 50 Countries": "Guess 50 Countries",
        "Hint: Capital City": "Hint: Capital City",
        "Hint: First Letter": "Hint: First Letter",
        "Watching Ad...": "Watching Ad...",
        "Extra Life Earned!": "Extra Life Earned!",
        "Sound": "Sound",
        "Language": "Language"
    }
};

class Localization {
    constructor() {
        this.currentLang = 'tr';
    }

    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            this.updateUI();
        }
    }

    translate(key) {
        return translations[this.currentLang][key] || key;
    }

    updateUI() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.translate(key);
        });

        // Update placeholders
        const inputs = document.querySelectorAll('[data-i18n-placeholder]');
        inputs.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.translate(key);
        });
    }
}

export const localization = new Localization();
