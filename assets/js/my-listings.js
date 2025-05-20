// Authentication check
const authToken = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId') || '36'; // Varsayılan olarak 36 ID'li kullanıcı
const API_BASE_URL = 'https://takkas-api.onrender.com/api';

// DOM elemanları ve durum değişkenleri
let domReady = false;
let componentsLoaded = false;
let allListings = [];

// DOM yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    domReady = true;
    
    // Header ve footer elementlerinin varlığını kontrol et
    const headerElement = document.getElementById('header-component');
    const footerElement = document.getElementById('footer-component');
    
    if (headerElement && footerElement) {
        // Bileşenleri yükle
        loadComponents()
            .then(() => startApp())
            .catch(() => startApp());
    } else {
        startApp();
    }
});

// Sayfa hazır olduğunda çalışacak ana fonksiyon
function startApp() {
    if (!authToken) {
        showNotification('Giriş yapmanız gerekiyor. Giriş sayfasına yönlendiriliyorsunuz...', 'info');
        setTimeout(() => {
            window.location.href = 'pages/signin.html';
        }, 1000);
        return;
    }
    
    initPage();
}

function setupUserAvatar() {
    const userName = localStorage.getItem('userName') || "Yusuf Bakkal";
    const detailUserAvatar = document.querySelector('#detailUserAvatar');
    
    if (detailUserAvatar) {
        const initials = userName.split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        const avatarInitialsEl = detailUserAvatar.querySelector('.avatar-initials');
        if (avatarInitialsEl) {
            avatarInitialsEl.textContent = initials;
        }
        
        const colors = [
            '#FF6370', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800', 
            '#795548', '#607D8B', '#3F51B5', '#009688', '#FFC107'
        ];
        
        const colorIndex = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        const backgroundColor = colors[colorIndex];
        
        detailUserAvatar.style.backgroundColor = backgroundColor;
    }
}

function injectAvatarStyles() {
    if (document.getElementById('avatar-style')) return; // Stil zaten eklenmişse tekrar ekleme

    const style = document.createElement('style');
    style.id = 'avatar-style';
    style.textContent = `
        #detailUserAvatar {
            width: 40px;
            height: 40px;
            border-radius: 50%; /* Dairesel avatar */
            display: flex;
            align-items: center;
            justify-content: center;
            color: white; /* Baş harflerin rengi */
            font-weight: bold;
            font-size: 16px; /* Font boyutu, isteğe bağlı ayarlanabilir */
            /* Arka plan rengi JavaScript ile dinamik olarak ayarlanır */
        }

        /* .avatar-initials için ek stil gerekirse buraya eklenebilir */
    `;
    document.head.appendChild(style);
}

// Bileşenleri yükleme fonksiyonu
async function loadComponents() {
    try {
        const headerElement = document.getElementById('header-component');
        const footerElement = document.getElementById('footer-component');
        
        // Header ve footer HTML içeriğini getir
        const [headerResponse, footerResponse] = await Promise.all([
            fetch('components/property-detail-header.html'),
            fetch('components/footer.html')
        ]);
        
        if (!headerResponse.ok || !footerResponse.ok) {
            throw new Error("Bileşen dosyaları yüklenemedi");
        }
        
        const headerHtml = await headerResponse.text();
        const footerHtml = await footerResponse.text();
        
        // DOM'a ekle
        if (headerElement) {
            headerElement.innerHTML = headerHtml;
            injectAvatarStyles(); // Avatar stillerini ekle
            setupUserAvatar(); // Kullanıcı avatarını başlık yüklendikten sonra ayarla
        }
        if (footerElement) footerElement.innerHTML = footerHtml;
        
        componentsLoaded = true;
        return true;
    } catch (error) {
        return false;
    }
}

// Sayfa başlangıç
async function initPage() {
    const loadingContainer = document.getElementById('loadingContainer');
    const emptyListings = document.getElementById('emptyListings');
    
    // Sayfa yüklenirken önce boş durum ve yükleme göstergelerini ayarla
    if (emptyListings) emptyListings.style.display = 'none';
    if (loadingContainer) {
        loadingContainer.style.display = 'flex';
        loadingContainer.classList.add('active');
    }
    
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
    
    try {
        await loadAllListings();
    } catch (error) {
        showNotification("İlanlar yüklenirken bir sorun oluştu", "error");
        
        // Hata durumunda yükleme göstergesini gizle
        if (loadingContainer) {
            loadingContainer.classList.remove('active');
            loadingContainer.style.display = 'none';
        }
        
        // Boş durum mesajını göster
        if (emptyListings) emptyListings.style.display = 'flex';
    }
}

// Tüm ilanları yükle
async function loadAllListings() {
    const listingsContainer = document.getElementById('listingsContainer');
    const emptyListings = document.getElementById('emptyListings');
    const loadingContainer = document.getElementById('loadingContainer');
    
    if (!listingsContainer || !emptyListings || !loadingContainer) {
        showNotification("Sayfa yapısında bir sorun var, lütfen sayfayı yenileyin", "error");
        return;
    }
    
    // Yükleniyor göstergesini göster
    loadingContainer.style.display = 'flex';
    loadingContainer.classList.add('active');
    
    // Önce diğer içeriği gizle
    emptyListings.style.display = 'none';
    listingsContainer.innerHTML = '';
    
    try {
        // Hem araç hem de emlak ilanlarını sırayla çek
        const vehicleListings = await loadListings('vehicle') || [];
        const estateListings = await loadListings('estate') || [];
        
        // İlanları birleştir
        allListings = [...vehicleListings, ...estateListings];
        
        // İlanları tarih sırasına göre sırala (en yeni en üstte)
        if (allListings.length > 0) {
            allListings.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });
        }
        
        // Yükleniyor göstergesini gizle
        loadingContainer.classList.remove('active');
        loadingContainer.style.display = 'none';
        
        // İlan var mı kontrol et
        if (allListings.length === 0) {
            emptyListings.style.display = 'flex';
            return;
        }
        
        // İlanları ekrana ekle
        displayListings(allListings);
        
    } catch (error) {
        loadingContainer.classList.remove('active');
        loadingContainer.style.display = 'none';
        emptyListings.style.display = 'flex';
        showNotification('İlanlar yüklenirken bir hata oluştu', 'error');
    }
}

// Belirli türdeki ilanları yükle (vehicle/estate)
async function loadListings(type) {
    const apiEndpoint = `${API_BASE_URL}/users/${userId}/${type}-listings`;
    
    try {
        // Fetch API isteği oluştur
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout
        
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId); // timeout'u temizle
        
        if (!response.ok) {
            throw new Error(`${type} ilanları yüklenemedi`);
        }
        
        // API yanıtını JSON olarak çözümle
        const text = await response.text();
        
        // Boş yanıt kontrolü
        if (!text || text.trim() === '') {
            return [];
        }
        
        // JSON parse et
        const data = JSON.parse(text);
        
        // API yanıtının yapısını kontrol et
        let listings = [];
        
        // Veri yapısını kontrol et ve uygun dizi yapısını bul
        if (!data) {
            return [];
        }
        
        if (Array.isArray(data)) {
            listings = data;
        } else if (typeof data === 'object') {
            // Yaygın API yanıt yapıları kontrolü
            if (data.data && Array.isArray(data.data)) {
                listings = data.data;
            } else if (data.listings && Array.isArray(data.listings)) {
                listings = data.listings;
            } else if (data.results && Array.isArray(data.results)) {
                listings = data.results;
            } else if (type === 'estate' && data.estates && Array.isArray(data.estates)) {
                listings = data.estates;
            } else if (type === 'vehicle' && data.vehicles && Array.isArray(data.vehicles)) {
                listings = data.vehicles;
            } else if (data[type + 's'] && Array.isArray(data[type + 's'])) {
                listings = data[type + 's'];
            } else {
                // Otomatik olarak bir dizi özelliği bulmaya çalış
                for (const key in data) {
                    if (Array.isArray(data[key])) {
                        listings = data[key];
                        break;
                    }
                }
                
                // Hala bulunamadıysa ve yine de nesne ise, nesneyi dizi olarak kullan
                if (listings.length === 0 && data) {
                    listings = [data];
                }
            }
        } else {
            return [];
        }
        
        if (!Array.isArray(listings) || listings.length === 0) {
            return [];
        }
        
        // İlanları standart formata dönüştür
        return listings.map((listing, index) => {
            if (!listing) return null;
            
            try {
                // Ortak özellikler
                const result = {
                    id: listing.id || listing._id || `${type}-${index}`,
                    title: listing.title || listing.name || `Bilinmeyen ${type === 'vehicle' ? 'Araç' : 'Emlak'}`,
                    price: listing.price || listing.amount || 0,
                    location: listing.city || listing.location || listing.address || 'Belirtilmemiş',
                    type: type,
                    status: listing.approval_status || listing.status || 'pending',
                    created_at: listing.created_at || listing.createdAt || new Date().toISOString()
                };
                
                // Görsel URL'ini belirle
                const imageFields = ['primary_photo', 'cover_photo', 'image_url', 'image', 'photos'];
                
                for (const field of imageFields) {
                    if (listing[field]) {
                        if (field === 'primary_photo' && listing[field].url) {
                            result.image = listing[field].url;
                            break;
                        } else if (field === 'photos' && Array.isArray(listing[field]) && listing[field].length > 0) {
                            if (typeof listing[field][0] === 'object' && listing[field][0].url) {
                                result.image = listing[field][0].url;
                            } else {
                                result.image = listing[field][0];
                            }
                            break;
                        } else if (typeof listing[field] === 'string') {
                            result.image = listing[field];
                            break;
                        }
                    }
                }
                
                if (!result.image) {
                    result.image = null;
                }
                
                // Türe özgü özellikler
                if (type === 'estate') {
                    result.estateType = listing.estate_type || listing.estateType || 'Belirtilmemiş';
                } else {
                    result.brand = listing.brand || listing.marka || 'Belirtilmemiş';
                    result.model = listing.model || 'Belirtilmemiş';
                    result.year = listing.year || listing.yil || 'Belirtilmemiş';
                }
                
                // Tarih formatla
                if (result.created_at) {
                    try {
                        result.formattedDate = new Date(result.created_at).toLocaleDateString('tr-TR');
                    } catch (e) {
                        result.formattedDate = 'Belirtilmemiş';
                    }
                }
                
                return result;
            } catch (error) {
                return null;
            }
        }).filter(item => item !== null); // Null değerleri filtrele
    } catch (error) {
        return [];
    }
}

// İlanları filtrele ve göster
function filterListings(filterType) {
    if (!allListings) return;
    
    let filteredListings;
    
    if (filterType === 'all') {
        filteredListings = allListings;
    } else if (filterType === 'vehicles') {
        filteredListings = allListings.filter(listing => listing.type === 'vehicle');
    } else if (filterType === 'estates') {
        filteredListings = allListings.filter(listing => listing.type === 'estate');
    }
    
    displayListings(filteredListings);
}

// İlanları ekranda göster
function displayListings(listings) {
    const listingsContainer = document.getElementById('listingsContainer');
    const emptyListings = document.getElementById('emptyListings');
    
    if (!listingsContainer) return;
    
    // İçeriği temizle
    listingsContainer.innerHTML = '';
    
    // İlan var mı kontrol et
    if (!listings || listings.length === 0) {
        if (emptyListings) emptyListings.style.display = 'flex';
        return;
    }
    
    if (emptyListings) emptyListings.style.display = 'none';
    
    // İlanları ekle
    listings.forEach(listing => {
        try {
            const listingCard = createListingCard(listing);
            listingsContainer.appendChild(listingCard);
        } catch (error) {
            console.error(`İlan kartı oluşturulurken hata:`, error);
        }
    });
}

// İlan kartı oluştur
function createListingCard(listing) {
    if (!listing || !listing.id) {
        throw new Error("Geçersiz ilan verisi");
    }
    
    const noImagePlaceholder = `https://via.placeholder.com/400x250/e0e0e0/333333?text=${encodeURIComponent('Fotoğraf Bulunamadı')}`;
    const image = listing.image || noImagePlaceholder;
    
    // Durum bilgisi
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
    
    // DOM elementleri oluştur
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.dataset.id = listing.id;
    card.dataset.type = listing.type;
    
    // 1. Resim bölümü
    const imageSection = document.createElement('div');
    imageSection.className = 'listing-image';
    
    const imgElement = document.createElement('img');
    imgElement.src = image;
    imgElement.alt = listing.title;
    imgElement.onerror = function() { this.onerror = null; this.src = noImagePlaceholder; };
    imageSection.appendChild(imgElement);
    
    // Mobil görünüm için durum etiketi
    const mobileStatus = document.createElement('span');
    mobileStatus.className = `listing-status mobile-status ${statusClass}`;
    mobileStatus.textContent = statusText;
    imageSection.appendChild(mobileStatus);
    
    card.appendChild(imageSection);
    
    // 2. İçerik bölümü
    const contentSection = document.createElement('div');
    contentSection.className = 'listing-content';
    
    // İçerik elementlerini oluştur ve ekle
    const title = document.createElement('h3');
    title.textContent = listing.title;
    contentSection.appendChild(title);
    
    // Masaüstü görünüm için durum etiketi
    const desktopStatus = document.createElement('span');
    desktopStatus.className = `listing-status desktop-status ${statusClass}`;
    desktopStatus.textContent = statusText;
    contentSection.appendChild(desktopStatus);
    
    const priceElement = document.createElement('p');
    priceElement.className = 'listing-price';
    priceElement.textContent = `${price} TL`;
    contentSection.appendChild(priceElement);
    
    // Konum bilgisi
    const locationEl = document.createElement('p');
    locationEl.className = 'listing-location';
    const locationIcon = document.createElement('i');
    locationIcon.className = 'fas fa-map-marker-alt';
    locationEl.appendChild(locationIcon);
    locationEl.appendChild(document.createTextNode(` ${listing.location}`));
    contentSection.appendChild(locationEl);
    
    // Tarih bilgisi
    const dateEl = document.createElement('p');
    dateEl.className = 'listing-date';
    const dateIcon = document.createElement('i');
    dateIcon.className = 'far fa-calendar-alt';
    dateEl.appendChild(dateIcon);
    dateEl.appendChild(document.createTextNode(` ${listing.formattedDate || 'Belirtilmemiş'}`));
    contentSection.appendChild(dateEl);
    
    // İlan türü etiketi
    const badgeElement = document.createElement('span');
    badgeElement.className = `listing-badge ${listing.type}`;
    badgeElement.textContent = listing.type === 'vehicle' ? 'ARAÇ' : 'EMLAK';
    contentSection.appendChild(badgeElement);
    
    card.appendChild(contentSection);
    
    // 3. Butonlar bölümü
    const actionsSection = document.createElement('div');
    actionsSection.className = 'listing-actions';
    
    // Görüntüle butonu
    const viewButton = document.createElement('button');
    viewButton.className = 'btn-view';
    const viewIcon = document.createElement('i');
    viewIcon.className = 'fas fa-eye';
    viewButton.appendChild(viewIcon);
    viewButton.appendChild(document.createTextNode(' Görüntüle'));
    viewButton.addEventListener('click', () => viewListing(listing.id, listing.type));
    actionsSection.appendChild(viewButton);
    
    // Düzenle butonu
    const editButton = document.createElement('button');
    editButton.className = 'btn-edit';
    const editIcon = document.createElement('i');
    editIcon.className = 'fas fa-edit';
    editButton.appendChild(editIcon);
    editButton.appendChild(document.createTextNode(' Düzenle'));
    editButton.addEventListener('click', () => editListing(listing.id, listing.type));
    actionsSection.appendChild(editButton);
    
    // Sil butonu
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fas fa-trash';
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(' Sil'));
    deleteButton.addEventListener('click', () => deleteListing(listing.id, listing.type));
    actionsSection.appendChild(deleteButton);
    
    card.appendChild(actionsSection);
    
    return card;
}

// İlanı görüntüle
function viewListing(id, type) {
    window.location.href = type === 'vehicle' 
        ? `car-detail.html?id=${id}` 
        : `property-detail.html?id=${id}`;
}

// İlanı düzenle
function editListing(id, type) {
    window.location.href = type === 'vehicle' 
        ? `edit-vehicle.html?id=${id}` 
        : `edit-property.html?id=${id}`;
}

// İlanı sil
async function deleteListing(id, type) {
    // Kullanıcıya silme işlemini onayla
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    const endpoint = type === 'vehicle' 
        ? `${API_BASE_URL}/vehicles/${id}`
        : `${API_BASE_URL}/estates/${id}`;
    
    try {
        const response = await fetch(endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('İlan silinemedi');
        }
        
        // İlan başarıyla silindi, UI'dan kaldır
        const card = document.querySelector(`.listing-card[data-id="${id}"]`);
        if (card) {
            card.remove();
        }
        
        // Tüm ilanlarda sil
        allListings = allListings.filter(listing => !(listing.id == id && listing.type === type));
        
        // Boş durum kontrolü
        const listingsContainer = document.getElementById('listingsContainer');
        const emptyListings = document.getElementById('emptyListings');
        
        if (listingsContainer.querySelectorAll('.listing-card').length === 0) {
            emptyListings.style.display = 'flex';
        }
        
        showNotification('İlan başarıyla silindi', 'success');
    } catch (error) {
        showNotification('İlan silinirken bir hata oluştu', 'error');
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    // Check if notification.js is loaded
    if (window.showNotification) {
        window.showNotification(message, type);
        return;
    }

    // Önceki bildirimleri temizle
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });
    
    // Bildirim elementini oluştur
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icon seç
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    else if (type === 'error') iconClass = 'fa-exclamation-circle';
    else if (type === 'warning') iconClass = 'fa-exclamation-triangle';
    else if (type === 'info') iconClass = 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // CSS ekle
    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: white;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                padding: 15px 20px;
                z-index: 1000;
                transition: transform 0.3s ease, opacity 0.3s ease;
                max-width: 350px;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification i {
                font-size: 1.2rem;
            }
            
            .notification.success i { color: #4CAF50; }
            .notification.error i { color: #F44336; }
            .notification.warning i { color: #FF9800; }
            .notification.info i { color: #2196F3; }
            
            .notification.fade-out {
                opacity: 0;
                transform: translateY(-20px);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Bildirimi body'e ekle
    document.body.appendChild(notification);
    
    // 3 saniye sonra bildirimi kaldır
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
 