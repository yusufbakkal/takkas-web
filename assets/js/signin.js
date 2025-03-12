document.addEventListener('DOMContentLoaded', function() {
    // Form elementi
    const loginForm = document.getElementById('loginForm');
    
    // Password toggle
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.querySelector('.password-toggle');
    
    // Sosyal medya butonları
    const socialButtons = document.querySelectorAll('.google-button, .facebook-button');
    
    // Şifre göster/gizle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // İkon değiştir
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Form submit
    if (loginForm) {
        console.log('Login form bulundu, event listener ekleniyor...');
        
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('Form submit edildi');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
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
                
                const requestData = {
                    email: email,
                    password: password
                };
                
                console.log('İstek verisi:', JSON.stringify(requestData));
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestData)
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
                
                const responseText = await response.text();
                console.log('API yanıt metni:', responseText);
                
                let data;
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                    console.log('Giriş başarılı:', data);
                    
                    // Token'ı localStorage'a kaydet
                    if (data.token) {
                        localStorage.setItem('authToken', data.token);
                        localStorage.setItem('userData', JSON.stringify(data));
                        console.log('Token ve kullanıcı verileri kaydedildi');
                    } else {
                        console.warn('Token bulunamadı!');
                    }
                    
                    // Başarılı giriş sonrası kullanıcıyı ana sayfaya yönlendir
                    alert('Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz.');
                    
                    // Kısa bir gecikme ekleyerek alert'in görünmesini sağla
                    setTimeout(function() {
                        window.location.href = '../index.html';
                    }, 1000);
                    
                    return; // İşlemi burada sonlandır
                } catch (e) {
                    console.error('Yanıt JSON olarak ayrıştırılamadı:', e);
                    throw new Error('Sunucu yanıtı işlenemedi');
                }
                
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