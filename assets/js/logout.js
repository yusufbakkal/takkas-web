document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner');
    const checkIcon = document.getElementById('checkIcon');
    const redirectLabel = document.getElementById('redirectLabel');
    const logoutContainer = document.getElementById('logoutContainer');
    
    // Sayfa açılış animasyonu
    logoutContainer.style.opacity = '0';
    logoutContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        logoutContainer.style.opacity = '1';
        logoutContainer.style.transform = 'translateY(0)';
        
        // Spinner animasyonu
        spinner.style.animation = 'spin 1s linear infinite';
        
        // Oturum bilgilerini temizle
        clearUserSession();
        
        // Çıkış işlemi tamamlandı
        setTimeout(() => {
            completeLogout();
            
            // Ana sayfaya yönlendir
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }, 1800);
    }, 300);
    
    // Tüm oturum bilgilerini temizle
    function clearUserSession() {
        const keysToRemove = ['authToken', 'userName', 'userEmail', 'userId', 'userRole'];
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // API isteği ile çıkış yap (opsiyonel)
        const token = localStorage.getItem('authToken');
        if (token) {
            fetch('https://takkas-api.onrender.com/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }).catch(error => console.error('API çıkış hatası:', error));
        }
    }
    
    // Çıkış işlemi tamamlandı animasyonunu göster
    function completeLogout() {
        // Spinner animasyonunu durdur
        spinner.style.animation = 'none';
        spinner.style.opacity = '0';
        
        // Onay işaretini göster
        checkIcon.style.opacity = '1';
        checkIcon.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            checkIcon.style.transform = 'scale(1)';
        }, 200);
        
        // Yönlendirme yazısını göster
        setTimeout(() => {
            redirectLabel.style.opacity = '1';
        }, 300);
    }
    
    // Spin animasyonu tanımı
    if (!document.querySelector('@keyframes spin')) {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}); 