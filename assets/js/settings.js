// Sekme geçişleri
function showSection(sectionId) {
    // Tüm sekmeleri gizle
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Tüm menü linklerinden active sınıfını kaldır
    document.querySelectorAll('.settings-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Seçilen sekmeyi göster
    document.getElementById(sectionId).classList.add('active');
    
    // Seçilen menü linkini aktif yap
    document.querySelector(`[href="#${sectionId}"]`).classList.add('active');
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Profil fotoğrafı işlemleri
    const photoInput = document.getElementById('photoInput');
    const profilePhoto = document.getElementById('profilePhoto');
    const defaultPhoto = 'assets/images/avatar.png';

    if (photoInput && profilePhoto) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Dosya türü kontrolü
                if (!file.type.startsWith('image/')) {
                    showNotification('Lütfen geçerli bir resim dosyası seçin.', 'error');
                    return;
                }

                // Dosya boyutu kontrolü (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Dosya boyutu 5MB\'dan küçük olmalıdır.', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePhoto.src = e.target.result;
                    
                    // Profil fotoğrafını localStorage'a kaydet
                    localStorage.setItem('profilePhoto', e.target.result);
                    
                    showNotification('Profil fotoğrafı başarıyla güncellendi.', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Şifre gücü kontrolü için event listener
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function(e) {
            checkPasswordStrength(e.target.value);
        });
    }

    // Sayfa yüklendiğinde profil fotoğrafını kontrol et
    const savedPhoto = localStorage.getItem('profilePhoto');
    if (savedPhoto) {
        document.getElementById('profilePhoto').src = savedPhoto;
    }
});

// Tab geçişleri
function showTab(tabId) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Tüm tab butonlarından active sınıfını kaldır
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçilen tab'ı göster
    document.getElementById(tabId).classList.add('active');
    
    // Tıklanan butonu aktif yap
    event.currentTarget.classList.add('active');
}

// Şifre görünürlüğünü değiştir
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Şifre gücünü kontrol et
function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    strengthBar.className = 'strength-bar';
    switch (strength) {
        case 0:
        case 1:
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Şifre gücü: Zayıf';
            break;
        case 2:
        case 3:
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Şifre gücü: Orta';
            break;
        case 4:
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Şifre gücü: Güçlü';
            break;
    }
}

// Profil fotoğrafını sil
function deletePhoto() {
    const img = document.getElementById('profilePhoto');
    img.src = 'assets/images/avatar.png';
    
    // localStorage'dan profil fotoğrafını sil
    localStorage.removeItem('profilePhoto');
    
    showNotification('Profil fotoğrafı başarıyla silindi.', 'success');
}

// Bildirim gösterme fonksiyonu
function showNotification(message, type) {
    // Eğer zaten bir bildirim varsa kaldır
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Yeni bildirim oluştur
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
    `;

    // Bildirim stillerini ekle
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.style.transition = 'all 0.3s ease';
    notification.style.animation = 'slideIn 0.3s ease forwards';

    if (type === 'success') {
        notification.style.backgroundColor = '#10B981';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = '#EF4444';
        notification.style.color = 'white';
    }

    // Stili için animation keyframes ekle
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes slideIn {
            0% { transform: translateX(100%); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(styleSheet);

    // Bildirim ekle
    document.body.appendChild(notification);

    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}