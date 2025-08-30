// JWT token yönetimi ve authentication servisi
const API_BASE_URL = 'http://localhost:5223/api';

class AuthService {
    // 4kayıt
    setToken(token) {
        localStorage.setItem('token', token);
    }

    // veri cekme
    getToken() {
        return localStorage.getItem('token');
    }

    // cıkıs yağ
    removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // kullanıcı biklgielrini kaydet
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    // kullancıı bilgilerini localstorage dan al
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // giriş yapılıdmı kontrol eder
    isAuthenticated() {
        return !!this.getToken();
    }

    // rol bilgisini alır
    getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }

    // API istekleri için authorization header'ı oluştur
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    // Giriş yap
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            const data = await response.json();
            
            // Token ve kullanıcı bilgilerini kaydet
            this.setToken(data.token);
            this.setUser(data.user);

            return data;
        } catch (error) {
            throw new Error(error.message || 'Giriş yapılırken hata oluştu');
        }
    }

    // Çıkış yap
    logout() {
        this.removeToken();
        window.location.href = '/';
    }

    // Profil bilgilerini getir
    async getProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Profil bilgileri alınamadı');
            }

            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Profil bilgileri getirilirken hata oluştu');
        }
    }

    // Şifre değiştir
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/change-password`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Şifre değiştirilirken hata oluştu');
        }
    }

    // Kayıt isteği gönder
    async submitRegistrationRequest(requestData) {
        try {
            const response = await fetch(`${API_BASE_URL}/registrationrequest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error);
            }

            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Kayıt isteği gönderilirken hata oluştu');
        }
    }

    // Kayıt isteği durumunu kontrol et
    async checkRegistrationStatus(requestId) {
        try {
            const response = await fetch(`${API_BASE_URL}/registrationrequest/${requestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Kayıt isteği durumu alınamadı');
            }

            return await response.json();
        } catch (error) {
            throw new Error(error.message || 'Kayıt isteği durumu kontrol edilirken hata oluştu');
        }
    }
}

// Singleton instance oluştur
const authService = new AuthService();
export default authService; 