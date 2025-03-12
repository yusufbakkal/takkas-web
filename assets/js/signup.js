document.addEventListener('DOMContentLoaded', function() {
    // Form elementi
    const signupForm = document.getElementById('signupForm');
    
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
    if (signupForm) {
        console.log('Signup form bulundu, event listener ekleniyor...');
        
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log('Form submit edildi');
            
            const username = document.getElementById('firstName').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            
            console.log('Kullanıcı Adı:', username);
            console.log('Email:', email);
            console.log('Telefon:', phone);
            console.log('Password girişi yapıldı (güvenlik için gösterilmiyor)');
            
            // Form doğrulama
            if (!username || !email || !phone || !password) {
                showError('Lütfen tüm alanları doldurun');
                return;
            }
            
            // Loading göster
            showLoading();
            
            try {
                console.log('API isteği gönderiliyor...');
                
                // API URL'sini değiştirdim - register endpoint'i kullanılıyor
                const apiUrl = 'https://takkas-api.onrender.com/api/auth/register';
                console.log('API URL:', apiUrl);
                
                // API'nin beklediği formata uygun veri yapısı
                const requestData = {
                    name: username, // Artık sadece kullanıcı adı gönderiliyor
                    email: email,
                    password: password,
                    phone: phone,
                    type: 'user' // Varsayılan kullanıcı tipi
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
                    
                    let errorMessage = 'Kayıt işlemi başarısız';
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
                    console.log('Kayıt başarılı:', data);
                    
                    // Başarılı kayıt sonrası kullanıcıyı giriş sayfasına yönlendir
                    alert('Kayıt işlemi başarılı! Giriş sayfasına yönlendiriliyorsunuz.');
                    
                    // Kısa bir gecikme ekleyerek alert'in görünmesini sağla
                    setTimeout(function() {
                        window.location.href = 'signin.html';
                    }, 1000);
                    
                    return; // İşlemi burada sonlandır
                } catch (e) {
                    console.error('Yanıt JSON olarak ayrıştırılamadı:', e);
                    throw new Error('Sunucu yanıtı işlenemedi');
                }
                
            } catch (error) {
                console.error('Kayıt sırasında bir hata oluştu:', error);
                hideLoading();
                showError(error.message || 'Kayıt işlemi sırasında bir hata oluştu');
            }
        });
    } else {
        console.error('Signup form bulunamadı!');
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
    const form = document.getElementById('signupForm');
    if (form) {
        form.appendChild(errorDiv);
    } else {
        document.querySelector('.signup-form-wrapper').appendChild(errorDiv);
    }
}

function showLoading() {
    const submitBtn = document.querySelector('.submit-button');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kayıt yapılıyor...';
    }
}

function hideLoading() {
    const submitBtn = document.querySelector('.submit-button');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Kayıt Ol';
    }
} 