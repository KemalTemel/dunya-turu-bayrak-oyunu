/**
 * Supabase Service
 * Küresel skor tablosu ve kullanıcı verilerini yönetir.
 */

// NOT: Bu değerleri Supabase panelinden alıp buraya yapıştırmalısın.
const SUPABASE_URL = 'https://zmcnoilqjrmloykirqsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptY25vaWxxanJtbG95a2lycXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDgxNzQsImV4cCI6MjA5Mjg4NDE3NH0.qFJvMZ_ug96QtZAMdR2bBOA65RvTsbLcLHL6Hw8rhLo';

class SupabaseService {
    constructor() {
        this.client = null;
        if (SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            this.client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    }

    async saveScore(name, score, countryCode) {
        if (!this.client) return console.warn('Supabase henüz yapılandırılmadı.');

        const { data, error } = await this.client
            .from('leaderboard')
            .insert([
                { name, score, country_code: countryCode }
            ]);

        if (error) console.error('Skor kaydedilirken hata oluştu:', error);
        return { data, error };
    }

    async getProfile(username) {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();
        return { data, error };
    }

    async createProfile(username) {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('profiles')
            .insert([{ username }])
            .select()
            .single();
        return { data, error };
    }

    async updateProfile(username, updates) {
        if (!this.client) return null;
        const { data, error } = await this.client
            .from('profiles')
            .update(updates)
            .eq('username', username);
        return { data, error };
    }

    async isUsernameAvailable(username) {
        if (!this.client) return true;
        const { data, error } = await this.client
            .from('profiles')
            .select('username')
            .eq('username', username)
            .maybeSingle();
        
        if (error) return true;
        return !data; // Veri yoksa kullanılabilir demektir
    }

    suggestUsernames(base) {
        const suffixes = ['123', 'TR', '_01', 'Pro', 'Master', Math.floor(Math.random() * 999)];
        const suggestions = [];
        for (let i = 0; i < 3; i++) {
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            suggestions.push(`${base}${suffix}`);
        }
        return suggestions;
    }

    async getTopScores(limit = 10) {
        if (!this.client) return this.getFakeScores();

        const { data, error } = await this.client
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Skorlar çekilirken hata oluştu:', error);
            return this.getFakeScores();
        }
        return data;
    }

    getFakeScores() {
        // Supabase henüz bağlanmadıysa gösterilecek sahte veriler
        return [
            { name: "CanYılmaz", score: 25400, country_code: 'tr' },
            { name: "FlagMaster99", score: 22150, country_code: 'us' },
            { name: "Deniz_G", score: 18900, country_code: 'az' },
            { name: "Kemal", score: 15000, country_code: 'tr' },
            { name: "Selin", score: 12400, country_code: 'tr' }
        ].sort((a, b) => b.score - a.score);
    }
}

export const supabaseService = new SupabaseService();
