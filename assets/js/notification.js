/**
 * Merkezi Bildirim Sistemi
 * Bu dosya, uygulama genelinde kullanılacak bildirim (notification) fonksiyonlarını içerir.
 */

// Bildirim stillerini bir kez ekleme
function addNotificationStyles() {
    // Eğer stil zaten eklenmiş ise tekrar ekleme
    if (document.getElementById('notification-styles')) {
        return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'notification-styles';
    styleElement.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            background: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        
        .notification.success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification.error {
            border-left: 4px solid #f44336;
        }
        
        .notification.info {
            border-left: 4px solid #2196F3;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification i {
            font-size: 20px;
        }
        
        .notification.success i {
            color: #4CAF50;
        }
        
        .notification.error i {
            color: #f44336;
        }
        
        .notification.info i {
            color: #2196F3;
        }
        
        .notification.fade-out {
            animation: fadeOut 0.3s ease-out forwards;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styleElement);
}

// Sayfa yüklendiğinde stilleri ekleme
document.addEventListener('DOMContentLoaded', addNotificationStyles);

/**
 * Bildirim gösterme fonksiyonu
 * @param {string} message - Bildirimde gösterilecek mesaj
 * @param {string} type - Bildirim tipi: 'success', 'error', 'info'
 * @param {number} duration - Bildirimin ekranda kalma süresi (ms)
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Eğer stil element eklenmemişse ekle
    addNotificationStyles();
    
    // Eğer zaten bir bildirim varsa kaldır
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Yeni bildirim oluştur
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Belirtilen süre sonra bildirimi kaldır
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Global scope'a ekle
window.showNotification = showNotification; 