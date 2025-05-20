// Global çıkış fonksiyonu
window.handleLogout = function() {
    // LocalStorage'dan kullanıcı verilerini temizle
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    // Kullanıcıyı giriş sayfasına yönlendir
    alert('Çıkış yapıldı!');
    
    // Yönlendirme yolunu düzelt
    const currentPath = window.location.pathname;
    
    // Eğer zaten ana sayfadaysak
    if (currentPath.endsWith('/index.html') || currentPath.endsWith('/')) {
        window.location.href = 'pages/signin.html';
    } else {
        // Alt sayfadaysak
        window.location.href = '../pages/signin.html';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı oturum durumunu kontrol et
    checkAuthStatus();
    
    // Çıkış butonunu dinle (varsa)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', window.handleLogout);
    }
});

// Kullanıcı oturum durumunu kontrol et
function checkAuthStatus() {
    const authToken = localStorage.getItem('authToken');
    const userDataString = localStorage.getItem('userData');
    
    if (authToken && userDataString) {
        try {
            // Kullanıcı verilerini parse et
            const userData = JSON.parse(userDataString);
            console.log('Oturum açık, kullanıcı:', userData);
            
            // Kullanıcı bilgilerini göster
            showUserInfo(userData);
            
            // Giriş gerektiren içeriği göster
            showAuthenticatedContent();
        } catch (e) {
            console.error('Kullanıcı verileri ayrıştırılamadı:', e);
            redirectToLogin();
        }
    } else {
        console.log('Oturum açık değil');
        
        // Sayfanın URL'sini kontrol et
        const currentPath = window.location.pathname;
        
        // Eğer korumalı bir sayfadaysa ve oturum açık değilse, giriş sayfasına yönlendir
        if (isProtectedPage(currentPath)) {
            redirectToLogin();
        } else {
            // Giriş gerektirmeyen içeriği göster
            showUnauthenticatedContent();
        }
    }
}

// Kullanıcı bilgilerini göster
function showUserInfo(userData) {
    // Kullanıcı adını göster
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = userData.name || 'Kullanıcı';
    });
    
    // Kullanıcı e-postasını göster
    const userEmailElements = document.querySelectorAll('.user-email');
    userEmailElements.forEach(element => {
        element.textContent = userData.email || '';
    });
    
    // Kullanıcı profil resmini göster (varsa)
    const userAvatarElements = document.querySelectorAll('.user-avatar');
    userAvatarElements.forEach(element => {
        if (userData.avatar) {
            element.src = userData.avatar;
        } else {
            // Varsayılan avatar
            element.src = '../assets/images/default-avatar.png';
        }
    });
    
    // Kullanıcı tipini göster (varsa)
    const userTypeElements = document.querySelectorAll('.user-type');
    userTypeElements.forEach(element => {
        element.textContent = userData.type || 'Kullanıcı';
    });
    
    // Kullanıcı telefon numarasını göster (varsa)
    const userPhoneElements = document.querySelectorAll('.user-phone');
    userPhoneElements.forEach(element => {
        element.textContent = userData.phone || '';
    });
}

// Giriş yapmış kullanıcılara özel içeriği göster
function showAuthenticatedContent() {
    const authContent = document.querySelectorAll('.auth-content');
    authContent.forEach(element => {
        element.style.display = 'block';
    });
    
    const unauthContent = document.querySelectorAll('.unauth-content');
    unauthContent.forEach(element => {
        element.style.display = 'none';
    });
    
    // Navbar'daki giriş/kayıt butonlarını gizle, profil/çıkış butonlarını göster
    const loginButtons = document.querySelectorAll('.login-button, .signup-button');
    loginButtons.forEach(element => {
        element.style.display = 'none';
    });
    
    const profileButtons = document.querySelectorAll('.profile-button, .logout-button');
    profileButtons.forEach(element => {
        element.style.display = 'block';
    });
}

// Giriş yapmamış kullanıcılara özel içeriği göster
function showUnauthenticatedContent() {
    const authContent = document.querySelectorAll('.auth-content');
    authContent.forEach(element => {
        element.style.display = 'none';
    });
    
    const unauthContent = document.querySelectorAll('.unauth-content');
    unauthContent.forEach(element => {
        element.style.display = 'block';
    });
    
    // Navbar'daki profil/çıkış butonlarını gizle, giriş/kayıt butonlarını göster
    const profileButtons = document.querySelectorAll('.profile-button, .logout-button');
    profileButtons.forEach(element => {
        element.style.display = 'none';
    });
    
    const loginButtons = document.querySelectorAll('.login-button, .signup-button');
    loginButtons.forEach(element => {
        element.style.display = 'block';
    });
}

// Giriş sayfasına yönlendir
function redirectToLogin() {
    window.location.href = 'pages/signin.html';
}

// Korumalı sayfa kontrolü
function isProtectedPage(path) {
    // Korumalı sayfaların listesi
    const protectedPages = [
        '/profile.html',
        '/dashboard.html',
        '/settings.html'
        // Diğer korumalı sayfaları buraya ekleyin
    ];
    
    return protectedPages.some(page => path.endsWith(page));
}

// GitHub Pages'te doğru yolları belirle
const repoBase = location.pathname.includes('/takkas-web/') ? '/takkas-web' : '';

/**
 * Bileşenleri yükleyen yardımcı fonksiyon
 * @param {Object} options - Bileşen yükleme seçenekleri
 * @param {boolean} options.header - Header bileşenini yüklemek istiyorsanız true
 * @param {boolean} options.navbar - Navbar bileşenini yüklemek istiyorsanız true
 * @param {boolean} options.footer - Footer bileşenini yüklemek istiyorsanız true
 * @param {string} options.headerType - Özel header tipini belirtir (örn. 'property-detail-header')
 * @param {Function} options.callback - Bileşenler yüklendikten sonra çalışacak callback fonksiyonu
 */
function loadComponents(options = {}) {
    const defaultOptions = {
        header: true,
        navbar: false,
        footer: true,
        headerType: 'header',
        callback: null
    };

    const opts = { ...defaultOptions, ...options };
    const promises = [];

    if (opts.header) {
        promises.push(
            fetch(`${repoBase}/components/${opts.headerType}.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Header bileşeni yüklenemedi: ${response.status}`);
                    }
                    return response.text();
                })
        );
    }

    if (opts.navbar) {
        promises.push(
            fetch(`${repoBase}/components/navbar.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Navbar bileşeni yüklenemedi: ${response.status}`);
                    }
                    return response.text();
                })
        );
    }

    if (opts.footer) {
        promises.push(
            fetch(`${repoBase}/components/footer.html`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Footer bileşeni yüklenemedi: ${response.status}`);
                    }
                    return response.text();
                })
        );
    }

    Promise.all(promises)
        .then(results => {
            let index = 0;
            
            if (opts.header) {
                const headerElement = document.getElementById('header-component');
                if (headerElement) headerElement.innerHTML = results[index++];
            }
            
            if (opts.navbar) {
                const navbarElement = document.getElementById('navbar-component');
                if (navbarElement) navbarElement.innerHTML = results[index++];
            }
            
            if (opts.footer) {
                const footerElement = document.getElementById('footer-component');
                if (footerElement) footerElement.innerHTML = results[index++];
            }
            
            if (typeof opts.callback === 'function') {
                opts.callback();
            }
        })
        .catch(error => {
            console.error('Bileşenler yüklenirken hata oluştu:', error);
        });
}

// Bildirim gösterme fonksiyonu (favoriteler.js için)
function showNotification(message, type = 'info') {
    // Mevcut bildirimler
    const existingNotifications = document.querySelectorAll('.notification');
    
    // Bildirim oluştur
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // Bildirim pozisyonunu ayarla
    notification.style.top = `${10 + (existingNotifications.length * 60)}px`;
    
    // Bildirim kapatma butonu
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(notification);
        
        // Diğer bildirimlerin pozisyonunu güncelle
        updateNotificationPositions();
    });
    
    // Bildirim süre sonunda kapansın
    const notificationTimeout = setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
            updateNotificationPositions();
        }
    }, 5000); // 5 saniye sonra kaldır
    
    // Bildirim DOM'a ekle
    document.body.appendChild(notification);
    
    // Bildirim gösterildi efekti
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Bildirim pozisyonu güncelleme fonksiyonu
    function updateNotificationPositions() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach((n, index) => {
            n.style.top = `${10 + (index * 60)}px`;
        });
    }
} 