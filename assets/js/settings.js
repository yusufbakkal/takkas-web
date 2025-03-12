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
                    alert('Lütfen bir görsel dosyası seçin.');
                    return;
                }

                // Dosya boyutu kontrolü (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePhoto.src = e.target.result;
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
    const profilePhoto = document.getElementById('profilePhoto');
    if (profilePhoto) {
        profilePhoto.src = 'assets/images/avatar.png';
    }
}