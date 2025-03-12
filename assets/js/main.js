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