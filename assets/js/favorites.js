// Authentication check
const authToken = localStorage.getItem('authToken');
if (!authToken) {
    showNotification('Giriş yapmanız gerekiyor. Giriş sayfasına yönlendiriliyorsunuz...', 'info');
    setTimeout(() => {
        window.location.href = 'pages/signin.html';
    }, 1000); // 2 saniye sonra yönlendir
}

// Bileşenleri yükle
Promise.all([
    fetch('components/property-detail-header.html').then(response => response.text()),
    fetch('components/footer.html').then(response => response.text())
]).then(([header, footer]) => {
    document.getElementById('header-component').innerHTML = header;
    document.getElementById('footer-component').innerHTML = footer;
    
    // Favorileri API'den yükle
    loadFavoritesFromAPI();
});

async function loadFavoritesFromAPI() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    const emptyFavorites = document.getElementById('emptyFavorites');
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        emptyFavorites.style.display = 'flex';
        return;
    }

    try {
        const response = await fetch('https://takkas-api.onrender.com/api/favorite-vehicles/my-favorites', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) throw new Error('Favoriler yüklenemedi');

        const favorites = await response.json();

        if (!favorites || favorites.length === 0) {
            emptyFavorites.style.display = 'flex';
            return;
        }

        emptyFavorites.style.display = 'none';

        favorites.forEach(fav => {
            const card = createFavoriteCard({
                id: fav.id,
                advertId: fav.id,
                title: fav.title,
                price: fav.price,
                location: fav.city || 'Belirtilmemiş',
                date: new Date(fav.favorite_created_at).toLocaleDateString('tr-TR'),
                image: fav.cover_photo || `https://via.placeholder.com/180x150/e0e0e0/333333?text=Fotoğraf+Bulunamadı`
            });
            favoritesContainer.appendChild(card);
        });
    } catch (error) {
        alert(error.message);
        emptyFavorites.style.display = 'flex';
    }
}

function createFavoriteCard(favorite) {
    const noImagePlaceholder = `https://via.placeholder.com/180x150/e0e0e0/333333?text=${encodeURIComponent('Fotoğraf Bulunamadı')}`;
    const image = favorite.image || noImagePlaceholder;
    
    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.dataset.id = favorite.id;
    card.dataset.advertId = favorite.advertId;
    
    card.innerHTML = `
        <div class="favorite-image">
            <img src="${image}" alt="${favorite.title}" onerror="this.onerror=null; this.src='${noImagePlaceholder}';">
        </div>
        <div class="favorite-content">
            <h3>${favorite.title}</h3>
            <p class="favorite-price">${typeof favorite.price === 'number' ? favorite.price.toLocaleString() : favorite.price} TL</p>
            <p class="favorite-location"><i class="fas fa-map-marker-alt"></i> ${favorite.location}</p>
            <p class="favorite-date"><i class="far fa-clock"></i> ${favorite.date}</p>
        </div>
        <div class="favorite-actions">
            <button class="btn-view" onclick="viewListing('${favorite.advertId}')">
                <i class="fas fa-eye"></i> Görüntüle
            </button>
            <button class="btn-remove" onclick="removeFavorite('${favorite.id}', '${favorite.advertId}')">
                <i class="fas fa-trash"></i> Kaldır
            </button>
        </div>
    `;
    
    return card;
}

function viewListing(advertId) {
    // İlan detay sayfasına yönlendir
    window.location.href = `car-detail.html?id=${advertId}`;
}

async function removeFavorite(favoriteId, advertId) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        showNotification('Bu işlemi gerçekleştirmek için giriş yapmalısınız', 'error');
        return;
    }
    
    // Önce kartı bul ve DOM'dan kaldır
    const card = document.querySelector(`.favorite-card[data-id="${favoriteId}"]`);
    if (!card) return;
    
    // Kartı DOM'dan kaldır
    card.remove();
    
    try {
        const response = await fetch(`https://takkas-api.onrender.com/api/favorite-vehicles/${advertId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Favori kaldırılırken hata oluştu');
        }

        // Başarılı bildirim göster
        showNotification('Favori başarıyla kaldırıldı', 'success');
        
        // Eğer favori kalmadıysa boş durum mesajını göster
        const favoritesContainer = document.getElementById('favoritesContainer');
        const remainingCards = favoritesContainer.querySelectorAll('.favorite-card').length;
        
        if (remainingCards === 0) {
            document.getElementById('emptyFavorites').style.display = 'flex';
        }
    } catch (error) {
        console.error('Favori kaldırılırken hata:', error);
        // Hata durumunda kartı geri ekle
        document.getElementById('favoritesContainer').appendChild(card);
        showNotification('Favori kaldırılırken bir hata oluştu', 'error');
    }
}

// Kullanıcı bilgilerini yükle
document.addEventListener('DOMContentLoaded', function() {
    // Header yüklendikten sonra kullanıcı bilgilerini ayarla
    setTimeout(() => {
        const userName = localStorage.getItem('userName') || "Yusuf Bakkal";
        const detailUserAvatar = document.querySelector('#detailUserAvatar');
        
        if (detailUserAvatar) {
            // Kullanıcı adının baş harflerini al
            const initials = userName.split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase()
                .substring(0, 2);
            
            // Avatar'a baş harfleri yerleştir
            const avatarInitials = detailUserAvatar.querySelector('.avatar-initials');
            if (avatarInitials) {
                avatarInitials.textContent = initials;
            }
            
            // Rastgele bir arka plan rengi oluştur
            const colors = [
                '#FF6370', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', 
                '#795548', '#607D8B', '#3F51B5', '#009688', '#FFC107'
            ];
            
            // Kullanıcı adına göre sabit bir renk seç
            const colorIndex = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
            const backgroundColor = colors[colorIndex];
            
            // Avatar'ın arka plan rengini ayarla
            detailUserAvatar.style.backgroundColor = backgroundColor;
        }
    }, 500); // Biraz gecikmeyle çalıştır, header yüklensin

    // Merkezi bildirim sistemini yükle
    if (!window.showNotification) {
        const script = document.createElement('script');
        script.src = 'assets/js/notification.js';
        document.head.appendChild(script);
    }
}); 