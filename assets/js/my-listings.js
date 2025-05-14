// Authentication check
const authToken = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId') || '36'; // Varsayılan olarak 36 ID'li kullanıcı

if (!authToken) {
    showNotification('Giriş yapmanız gerekiyor. Giriş sayfasına yönlendiriliyorsunuz...', 'info');
    setTimeout(() => {
        window.location.href = 'pages/signin.html';
    }, 1000);
}

// Bileşenleri yükle
Promise.all([
    fetch('components/property-detail-header.html').then(response => response.text()),
    fetch('components/footer.html').then(response => response.text())
]).then(([header, footer]) => {
    document.getElementById('header-component').innerHTML = header;
    document.getElementById('footer-component').innerHTML = footer;
    
    // Sayfayı yükle
    initPage();
});

// Sayfa başlangıç
async function initPage() {
    // Tab butonlarına tıklama olaylarını ekle
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Aktif tab'ı değiştir
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Seçilen tab'a göre ilanları göster
            filterListings(btn.dataset.tab);
        });
    });
    
    // İlanları yükle
    await loadAllListings();
}

// Tüm ilanları yükle
async function loadAllListings() {
    const listingsContainer = document.getElementById('listingsContainer');
    const emptyListings = document.getElementById('emptyListings');
    const loadingContainer = document.getElementById('loadingContainer');
    
    // Yükleniyor göstergesini göster
    loadingContainer.classList.add('active');
    emptyListings.style.display = 'none';
    
    try {
        // Hem araç hem de emlak ilanlarını paralel olarak çek
        const [vehicleListings, estateListings] = await Promise.all([
            loadListings('vehicle'),
            loadListings('estate')
        ]);
        
        console.log("Yüklenen araç ilanları:", vehicleListings);
        console.log("Yüklenen emlak ilanları:", estateListings);
        
        // Tüm ilanları birleştir
        window.allListings = [...vehicleListings, ...estateListings];
        console.log("Birleştirilmiş tüm ilanlar:", window.allListings);
        
        // Yükleniyor göstergesini gizle
        loadingContainer.classList.remove('active');
        
        // İlan var mı kontrol et
        if (!window.allListings || window.allListings.length === 0) {
            console.log("Hiç ilan bulunamadı.");
            emptyListings.style.display = 'flex';
            return;
        }
        
        // İlanları ekrana ekle
        displayListings(window.allListings);
        
    } catch (error) {
        console.error('İlanlar yüklenirken hata:', error);
        loadingContainer.classList.remove('active');
        emptyListings.style.display = 'flex';
        showNotification('İlanlar yüklenirken bir hata oluştu', 'error');
    }
}

// Belirli türdeki ilanları yükle (vehicle/estate)
async function loadListings(type) {
    const apiEndpoint = type === 'vehicle' 
        ? `https://takkas-api.onrender.com/api/users/${userId}/vehicle-listings`
        : `https://takkas-api.onrender.com/api/users/${userId}/estate-listings`;
    
    console.log(`${type} ilanları için API isteği gönderiliyor:`, apiEndpoint);
    
    try {
        const response = await fetch(apiEndpoint, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`${type} API yanıt durumu:`, response.status);
        
        if (!response.ok) {
            console.error(`${type} ilanları yüklenemedi. Durum kodu:`, response.status);
            return [];
        }
        
        const data = await response.json();
        console.log(`${type} API yanıtı:`, data);
        
        // API yanıtının yapısını kontrol et
        let listings = [];
        
        if (Array.isArray(data)) {
            // Doğrudan dizi döndüyse
            listings = data;
        } else {
            // Obje döndüyse (yaygın API yapıları)
            if (data.data) listings = data.data;
            else if (data.listings) listings = data.listings;
            else if (data.results) listings = data.results;
            else if (type === 'estate' && Array.isArray(data.estates)) listings = data.estates;
            else if (type === 'vehicle' && Array.isArray(data.vehicles)) listings = data.vehicles;
            else listings = []; // Uygun yapı bulunamadı
        }
        
        console.log(`İşlenecek ${type} ilanları:`, listings);
        
        if (!Array.isArray(listings) || listings.length === 0) {
            console.log(`Hiç ${type} ilanı bulunamadı.`);
            return [];
        }
        
        // İlanları standart formata dönüştür
        const processedListings = listings.map(listing => {
            console.log(`İşlenen ${type} ilanı:`, listing);
            
            // Ortak özellikler
            const result = {
                id: listing.id,
                title: listing.title || listing.name || `Bilinmeyen ${type === 'vehicle' ? 'Araç' : 'Emlak'}`,
                price: listing.price || listing.amount || 0,
                location: listing.city || listing.location || listing.address || 'Belirtilmemiş',
                type: type,
                status: listing.approval_status || 'pending',
                created_at: listing.created_at || new Date().toISOString()
            };
            
            // Görsel URL'ini belirle
            if (type === 'estate') {
                if (listing.primary_photo && listing.primary_photo.url) {
                    result.image = listing.primary_photo.url;
                } else if (listing.cover_photo) {
                    result.image = listing.cover_photo;
                } else if (listing.image_url) {
                    result.image = listing.image_url;
                } else if (listing.image) {
                    result.image = listing.image;
                } else {
                    result.image = null;
                }
                
                // Emlak tipini ekle
                result.estateType = listing.estate_type || 'Belirtilmemiş';
            } else {
                if (listing.cover_photo) {
                    result.image = listing.cover_photo;
                } else if (listing.primary_photo && listing.primary_photo.url) {
                    result.image = listing.primary_photo.url;
                } else if (listing.image_url) {
                    result.image = listing.image_url;
                } else if (listing.image) {
                    result.image = listing.image;
                } else {
                    result.image = null;
                }
                
                // Araç bilgilerini ekle
                result.brand = listing.brand || 'Belirtilmemiş';
                result.model = listing.model || 'Belirtilmemiş';
                result.year = listing.year || 'Belirtilmemiş';
            }
            
            // Tarih formatla
            if (result.created_at) {
                try {
                    result.formattedDate = new Date(result.created_at).toLocaleDateString('tr-TR');
                } catch (e) {
                    console.error('Tarih formatlanırken hata:', e);
                    result.formattedDate = 'Belirtilmemiş';
                }
            }
            
            console.log(`İşlenmiş ${type} ilanı:`, result);
            return result;
        });
        
        console.log(`Dönüştürülmüş ${type} ilanları:`, processedListings);
        return processedListings;
    } catch (error) {
        console.error(`${type} ilanları yüklenirken hata:`, error);
        return [];
    }
}

// İlanları filtrele ve göster
function filterListings(filterType) {
    if (!window.allListings) {
        console.log("Filtrelenecek ilan bulunamadı, window.allListings boş.");
        return;
    }
    
    console.log(`İlanlar "${filterType}" filtresine göre filtreleniyor.`);
    
    let filteredListings;
    
    if (filterType === 'all') {
        filteredListings = window.allListings;
    } else if (filterType === 'vehicles') {
        filteredListings = window.allListings.filter(listing => listing.type === 'vehicle');
    } else if (filterType === 'estates') {
        filteredListings = window.allListings.filter(listing => listing.type === 'estate');
    }
    
    console.log("Filtrelenmiş ilanlar:", filteredListings);
    displayListings(filteredListings);
}

// İlanları ekranda göster
function displayListings(listings) {
    const listingsContainer = document.getElementById('listingsContainer');
    const emptyListings = document.getElementById('emptyListings');
    
    console.log("Ekranda gösterilecek ilanlar:", listings);
    
    // İçeriği temizle
    listingsContainer.innerHTML = '';
    
    // İlan var mı kontrol et
    if (!listings || listings.length === 0) {
        console.log("Gösterilecek ilan bulunamadı, boş durum mesajı gösteriliyor.");
        emptyListings.style.display = 'flex';
        return;
    }
    
    console.log(`${listings.length} adet ilan gösteriliyor.`);
    emptyListings.style.display = 'none';
    
    // İlanları ekle
    listings.forEach((listing, index) => {
        console.log(`${index + 1}. ilan kartı oluşturuluyor:`, listing);
        try {
            const listingCard = createListingCard(listing);
            listingsContainer.appendChild(listingCard);
            console.log(`${index + 1}. ilan kartı başarıyla eklendi.`);
        } catch (error) {
            console.error(`${index + 1}. ilan kartı oluşturulurken hata:`, error);
        }
    });
}

// İlan kartı oluştur
function createListingCard(listing) {
    if (!listing || !listing.id) {
        console.error("Geçersiz ilan verisi:", listing);
        throw new Error("Geçersiz ilan verisi");
    }
    
    console.log("İlan kartı oluşturuluyor:", listing);
    
    const noImagePlaceholder = `https://via.placeholder.com/400x250/e0e0e0/333333?text=${encodeURIComponent('Fotoğraf Bulunamadı')}`;
    const image = listing.image || noImagePlaceholder;
    
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.dataset.id = listing.id;
    card.dataset.type = listing.type;
    
    // Durum metni
    let statusText = 'Beklemede';
    let statusClass = 'pending';
    
    if (listing.status === 'approved') {
        statusText = 'Onaylandı';
        statusClass = 'approved';
    } else if (listing.status === 'rejected') {
        statusText = 'Reddedildi';
        statusClass = 'rejected';
    }
    
    // Fiyat formatı
    const price = typeof listing.price === 'number' ? 
        listing.price.toLocaleString() : 
        listing.price;
    
    // Kart içeriği
    card.innerHTML = `
        <div class="listing-image">
            <img src="${image}" alt="${listing.title}" onerror="this.onerror=null; this.src='${noImagePlaceholder}';">
        </div>
        <div class="listing-content">
            <h3>${listing.title}</h3>
            <span class="listing-status ${statusClass}">${statusText}</span>
            <p class="listing-price">${price} TL</p>
            <p class="listing-location"><i class="fas fa-map-marker-alt"></i> ${listing.location}</p>
            <p class="listing-date"><i class="far fa-calendar-alt"></i> ${listing.formattedDate || 'Belirtilmemiş'}</p>
            <span class="listing-badge ${listing.type}">${listing.type === 'vehicle' ? 'Araç' : 'Emlak'}</span>
        </div>
        <div class="listing-actions">
            <button class="btn-view" onclick="viewListing('${listing.id}', '${listing.type}')">
                <i class="fas fa-eye"></i> Görüntüle
            </button>
            <button class="btn-edit" onclick="editListing('${listing.id}', '${listing.type}')">
                <i class="fas fa-edit"></i> Düzenle
            </button>
            <button class="btn-delete" onclick="deleteListing('${listing.id}', '${listing.type}')">
                <i class="fas fa-trash"></i> Sil
            </button>
        </div>
    `;
    
    return card;
}

// İlanı görüntüle
function viewListing(id, type) {
    console.log(`İlan görüntüleniyor: ID=${id}, Tür=${type}`);
    if (type === 'vehicle') {
        window.location.href = `car-detail.html?id=${id}`;
    } else {
        window.location.href = `property-detail.html?id=${id}`;
    }
}

// İlanı düzenle
function editListing(id, type) {
    console.log(`İlan düzenleniyor: ID=${id}, Tür=${type}`);
    // Düzenleme sayfasına yönlendir
    if (type === 'vehicle') {
        window.location.href = `edit-vehicle.html?id=${id}`;
    } else {
        window.location.href = `edit-property.html?id=${id}`;
    }
}

// İlanı sil
async function deleteListing(id, type) {
    console.log(`İlan silme isteği: ID=${id}, Tür=${type}`);
    // Kullanıcıya silme işlemini onayla
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const endpoint = type === 'vehicle' 
        ? `https://takkas-api.onrender.com/api/vehicles/${id}`
        : `https://takkas-api.onrender.com/api/estates/${id}`;
    
    console.log(`Silme API isteği: ${endpoint}`);
    
    try {
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Silme API yanıtı: ${response.status}`);
        
        if (!response.ok) {
            throw new Error('İlan silinemedi');
        }
        
        // İlan başarıyla silindi, UI'dan kaldır
        const card = document.querySelector(`.listing-card[data-id="${id}"]`);
        if (card) {
            card.remove();
        }
        
        // Tüm ilanlarda sil
        if (window.allListings) {
            window.allListings = window.allListings.filter(listing => !(listing.id == id && listing.type === type));
        }
        
        // Boş durum kontrolü
        const listingsContainer = document.getElementById('listingsContainer');
        const emptyListings = document.getElementById('emptyListings');
        
        if (listingsContainer.querySelectorAll('.listing-card').length === 0) {
            emptyListings.style.display = 'flex';
        }
        
        showNotification('İlan başarıyla silindi', 'success');
    } catch (error) {
        console.error('İlan silinirken hata:', error);
        showNotification('İlan silinirken bir hata oluştu', 'error');
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    // Check if notification.js is loaded and provides the showNotification function
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }

    // Fallback bildirim fonksiyonu
    console.log('showNotification fonksiyonu çağrıldı:', message, type);
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 3 saniye sonra bildirimi kaldır
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
} 