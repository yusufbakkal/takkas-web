document.addEventListener('DOMContentLoaded', function() {
    // Form elementi
    const loginForm = document.getElementById('loginForm');
    
    // Password toggle
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.querySelector('.password-toggle');
    
    // Sosyal medya butonları
    const socialButtons = document.querySelectorAll('.google-button, .facebook-button');
    
    // Şifre göster/gizle
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // İkon değiştir
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
    
    // Form submit
    if (loginForm) {
        console.log('Login form bulundu, event listener ekleniyor...');
        
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Form submit edildi');
            
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            const rememberMe = document.querySelector('.checkbox').checked;
            
            console.log('Email:', email);
            console.log('Password girişi yapıldı (güvenlik için gösterilmiyor)');
            
            // Form doğrulama
            if (!email || !password) {
                showError('Lütfen tüm alanları doldurun');
                return;
            }
            
            // Loading göster
            showLoading();
            
            try {
                console.log('API isteği gönderiliyor...');
                
                const apiUrl = 'https://takkas-api.onrender.com/api/auth/login';
                console.log('API URL:', apiUrl);
                
                const formData = {
                    email: email,
                    password: password
                };
                
                console.log('İstek verisi:', JSON.stringify(formData));
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log('API yanıtı alındı, durum kodu:', response.status);
                
                // API yanıtını kontrol et
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API hata yanıtı:', errorText);
                    
                    let errorMessage = 'Giriş başarısız';
                    try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        console.error('Hata yanıtı JSON olarak ayrıştırılamadı:', e);
                    }
                    
                    throw new Error(errorMessage);
                }
                
                const userData = await response.json();
                console.log('API Response (Raw):', userData);
                console.log('API Response Structure:', {
                    token: userData.token,
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    type: userData.type,
                    created_at: userData.created_at
                });
                    
                // Token ve kullanıcı bilgilerini localStorage'a kaydet
                localStorage.setItem('authToken', userData.token);
                localStorage.setItem('userId', userData.id);
                localStorage.setItem('userName', userData.name);
                localStorage.setItem('userEmail', userData.email);
                localStorage.setItem('userPhone', userData.phone || '');
                localStorage.setItem('userType', userData.type || '');
                localStorage.setItem('userCreatedAt', userData.created_at || '');
                
                // localStorage'a kaydedilen değerleri kontrol et
                console.log('LocalStorage Values After Save:', {
                    name: localStorage.getItem('userName'),
                    email: localStorage.getItem('userEmail'),
                    phone: localStorage.getItem('userPhone'),
                    type: localStorage.getItem('userType'),
                    created_at: localStorage.getItem('userCreatedAt')
                });
                
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    } else {
                    localStorage.removeItem('rememberMe');
                    }
                    
                // Giriş başarılı mesajı
                showNotification('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                    
                // Ana sayfaya yönlendir (1.5 saniye sonra)
                setTimeout(() => {
                        window.location.href = '../index.html';
                }, 1500);
                    
                    return; // İşlemi burada sonlandır
            } catch (error) {
                console.error('Giriş sırasında bir hata oluştu:', error);
                hideLoading();
                showError(error.message || 'Giriş işlemi sırasında bir hata oluştu');
            }
        });
    } else {
        console.error('Login form bulunamadı!');
    }
    
    // Sosyal medya butonlarına shake efekti
    socialButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            addShakeEffect(this);
        });
    });
    
    // Shake efekti fonksiyonu
    function addShakeEffect(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    }

    // Merkezi bildirim sistemini yükle
    if (!window.showNotification) {
        const script = document.createElement('script');
        script.src = '../assets/js/notification.js';
        document.head.appendChild(script);
    }
});

function showError(message) {
    // Önceki hata mesajlarını temizle
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(el => el.remove());
    
    // Yeni hata mesajı oluştur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.padding = '10px';
    errorDiv.style.backgroundColor = '#ffeeee';
    errorDiv.style.borderRadius = '4px';
    errorDiv.textContent = message;
    
    // Hata mesajını forma ekle
    const form = document.getElementById('loginForm');
    if (form) {
        form.appendChild(errorDiv);
    } else {
        document.querySelector('.auth-form-container').appendChild(errorDiv);
    }
}

function showLoading() {
    const submitBtn = document.querySelector('.submit-button');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş yapılıyor...';
    }
}

function hideLoading() {
    const submitBtn = document.querySelector('.submit-button');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Giriş Yap';
    }
}

// Çıkış yapma fonksiyonu
function logout() {
    // localStorage'dan tüm kullanıcı bilgilerini temizle
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userType');
    localStorage.removeItem('userCreatedAt');
    localStorage.removeItem('rememberMe');

    // Ana sayfaya yönlendir
    window.location.href = '../index.html';
}

// Global scope'a logout fonksiyonunu ekle
window.logout = logout; 