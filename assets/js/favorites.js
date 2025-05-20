// Authentication check
const authToken = localStorage.getItem('authToken');
if (!authToken) {
    showNotification('Giriş yapmanız gerekiyor. Giriş sayfasına yönlendiriliyorsunuz...', 'info');
    setTimeout(() => {
        window.location.href = 'pages/signin.html';
    }, 1000); // 2 saniye sonra yönlendir
}

// Not: Bileşenlerin yüklenmesi artık favorites.html içinde yapılıyor

async function loadAllFavorites() {
    const favoritesContainer = document.getElementById('favoritesContainer');
    const emptyFavorites = document.getElementById('emptyFavorites');
    emptyFavorites.style.display = 'none'; // Başlangıçta gizle, hiç favori yoksa sonra göstereceğiz
    
    // Yükleniyor göstergesi ekle
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-container';
    loadingDiv.innerHTML = '<div class="loading-spinner"></div><p>Favoriler yükleniyor...</p>';
    favoritesContainer.appendChild(loadingDiv);
    
    // Hem araç hem de emlak favorilerini yükle
    const [vehicleFavorites, estateFavorites] = await Promise.all([
        loadFavorites('vehicles'),
        loadFavorites('estates')
    ]);
    
    // Yükleniyor göstergesini kaldır
    loadingDiv.remove();
    
    // Tüm favorileri birleştir ve kontrol et
    const allFavorites = [...vehicleFavorites, ...estateFavorites];
    
    if (allFavorites.length === 0) {
        emptyFavorites.style.display = 'flex';
        return;
    }
    
    // Her favori için kart oluştur ve ekle
    allFavorites.forEach(favorite => {
        favoritesContainer.appendChild(createFavoriteCard(favorite));
    });
}

async function loadFavorites(type) {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return [];
    
    try {
        const response = await fetch(`https://takkas-api.onrender.com/api/favorite-${type}/my-favorites`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`${type} favorileri yüklenemedi. Durum kodu:`, response.status);
            return [];
        }
        
        const favorites = await response.json();
        console.log(`${type} favorileri yüklendi:`, favorites);
        
        if (!Array.isArray(favorites) || favorites.length === 0) {
            return [];
        }
        
        // Favorileri işleyelim ve ilan türünü (araç/emlak) belirtelim
        return favorites.map(fav => {
            // API yanıtı yapısı değişiklik gösterebilir
            // Gerçek veriyi bulmak için farklı property'leri kontrol edelim
            
            let itemData;
            let actualData = fav;
            
            // API yapısını kontrol et ve gerçek veriyi bul
            if (type === 'estates') {
                // Favori API'si bazen estate objesi içinde veriyi döndürür
                if (fav.estate) {
                    itemData = fav.estate;
                    // Favori ID'sini sakla
                    actualData.id = fav.id || fav.favorite_id;
                    actualData.favorite_created_at = fav.created_at || fav.favorite_created_at;
                } else {
                    itemData = fav;
                }
            } else {
                // Favori API'si bazen vehicle objesi içinde veriyi döndürür
                if (fav.vehicle) {
                    itemData = fav.vehicle;
                    // Favori ID'sini sakla
                    actualData.id = fav.id || fav.favorite_id;
                    actualData.favorite_created_at = fav.created_at || fav.favorite_created_at;
                } else {
                    itemData = fav;
                }
            }
            
            // Veri yapısını konsola yazdır (debug için)
            console.log(`İşlenen veri (${type}):`, {
                original: fav,
                parsed: itemData,
                actualData: actualData
            });
            
            // Ortak bir model oluştur
            const result = {
                id: actualData.id || fav.favorite_id || fav.id || '',
                advertId: type === 'estates' ? 
                    (fav.estate_id || (itemData && itemData.id) || '') : 
                    (fav.vehicle_id || (itemData && itemData.id) || ''),
                title: itemData.title || itemData.name || fav.title || fav.name || (type === 'estates' ? 'Bilinmeyen Emlak' : 'Bilinmeyen Araç'),
                price: itemData.price || itemData.amount || fav.price || fav.amount || 0,
                location: itemData.city || itemData.location || itemData.address || fav.city || fav.location || fav.address || 'Belirtilmemiş',
                type: type === 'vehicles' ? 'vehicle' : 'estate'
            };
            
            // Tarih bilgisini al
            const dateValue = actualData.favorite_created_at || actualData.created_at || 
                            fav.favorite_created_at || fav.created_at || 
                            itemData.created_at || new Date().toISOString();
            
            // Tarih alanını formatlama
            try {
                result.date = new Date(dateValue).toLocaleDateString('tr-TR');
            } catch (e) {
                console.error('Tarih formatlanırken hata:', e);
                result.date = 'Belirtilmemiş';
            }
            
            // Görsel URL'sini bul
            if (type === 'estates') {
                // Emlak için görsel öncelik sırası
                if (itemData.primary_photo && itemData.primary_photo.url) {
                    result.image = itemData.primary_photo.url;
                } else if (fav.primary_photo && fav.primary_photo.url) {
                    result.image = fav.primary_photo.url;
                } else if (fav.estate && fav.estate.primary_photo && fav.estate.primary_photo.url) {
                    result.image = fav.estate.primary_photo.url;
                } else if (itemData.cover_photo) {
                    result.image = itemData.cover_photo;
                } else if (fav.cover_photo) {
                    result.image = fav.cover_photo;
                } else if (itemData.image_url) {
                    result.image = itemData.image_url;
                } else if (itemData.image) {
                    result.image = itemData.image;
                } else if (fav.image_url) {
                    result.image = fav.image_url;
                } else if (fav.image) {
                    result.image = fav.image;
                } else {
                    result.image = null;
                }
            } else {
                // Araç için görsel öncelik sırası
                if (itemData.cover_photo) {
                    result.image = itemData.cover_photo;
                } else if (fav.cover_photo) {
                    result.image = fav.cover_photo;
                } else if (itemData.primary_photo && itemData.primary_photo.url) {
                    result.image = itemData.primary_photo.url;
                } else if (fav.primary_photo && fav.primary_photo.url) {
                    result.image = fav.primary_photo.url;
                } else if (itemData.image_url) {
                    result.image = itemData.image_url;
                } else if (itemData.image) {
                    result.image = itemData.image;
                } else if (fav.image_url) {
                    result.image = fav.image_url;
                } else if (fav.image) {
                    result.image = fav.image;
                } else {
                    result.image = null;
                }
            }
            
            console.log(`İşlenmiş sonuç (${type}):`, result);
            
            return result;
        });
    } catch (error) {
        console.error(`${type} favorileri yüklenirken hata:`, error);
        return [];
    }
}

async function loadFavoritesFromAPI() {
    // Bu fonksiyonu loadAllFavorites ile değiştirdik, geriye uyumluluk için bırakıyoruz
    loadAllFavorites();
}

function createFavoriteCard(favorite) {
    const noImagePlaceholder = `https://via.placeholder.com/180x150/e0e0e0/333333?text=${encodeURIComponent('Fotoğraf Bulunamadı')}`;
    const image = favorite.image || noImagePlaceholder;
    
    const card = document.createElement('div');
    card.className = 'favorite-card';
    card.dataset.id = favorite.id;
    card.dataset.advertId = favorite.advertId;
    card.dataset.type = favorite.type; // İlan türünü data attribute olarak ekle
    
    card.innerHTML = `
        <div class="favorite-image">
            <img src="${image}" alt="${favorite.title}" onerror="this.onerror=null; this.src='${noImagePlaceholder}';">
        </div>
        <div class="favorite-content">
            <h3>${favorite.title}</h3>
            <p class="favorite-price">${typeof favorite.price === 'number' ? favorite.price.toLocaleString() : favorite.price} TL</p>
            <p class="favorite-location"><i class="fas fa-map-marker-alt"></i> ${favorite.location}</p>
            <p class="favorite-date"><i class="far fa-clock"></i> ${favorite.date}</p>
            <span class="favorite-badge ${favorite.type}">${favorite.type === 'vehicle' ? 'Araç' : 'Emlak'}</span>
        </div>
        <div class="favorite-actions">
            <button class="btn-view" onclick="viewListing('${favorite.advertId}', '${favorite.type}')">
                <i class="fas fa-eye"></i> Görüntüle
            </button>
            <button class="btn-remove" onclick="removeFavorite('${favorite.id}', '${favorite.advertId}', '${favorite.type}')">
                <i class="fas fa-trash"></i> Kaldır
            </button>
        </div>
    `;
    
    return card;
}

function viewListing(advertId, type) {
    // İlan türüne göre doğru sayfaya yönlendir
    if (type === 'vehicle') {
        window.location.href = `car-detail.html?id=${advertId}`;
    } else {
        window.location.href = `property-detail.html?id=${advertId}`;
    }
}

async function removeFavorite(favoriteId, advertId, type) {
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
        // İlan türüne göre doğru endpoint'i kullan
        const endpoint = type === 'vehicle' ? 
            `https://takkas-api.onrender.com/api/favorite-vehicles/${advertId}` : 
            `https://takkas-api.onrender.com/api/favorite-estates/${advertId}`;
        
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
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