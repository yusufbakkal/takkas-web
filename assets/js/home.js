// Araba kartları slider
document.addEventListener('DOMContentLoaded', function() {
    // API'den araçları çek ve kartları oluştur
    fetchCarsAndCreateSlider();
    
    // API'den emlak ilanlarını çek ve kartları oluştur
    fetchEstatesAndCreateSlider();
    
    // Favoriye ekleme fonksiyonu
    document.addEventListener('click', function(e) {
        if (e.target.closest('.car-favorite') || e.target.closest('.estate-favorite')) {
            const button = e.target.closest('.car-favorite') || e.target.closest('.estate-favorite');
            button.classList.toggle('active');
            const icon = button.querySelector('i');
            icon.classList.toggle('far');
            icon.classList.toggle('fas');
        }
    });
});

// API'den araçları çek ve slider'ı oluştur
async function fetchCarsAndCreateSlider() {
    try {
        console.log('Ana sayfa için API isteği gönderiliyor...');
        
        // API'den araçları çek
        const cars = await fetchCars();
        console.log('Ana sayfa için araçlar alındı:', cars);
        
        // Slider container'ı temizle
        const sliderContainer = document.querySelector('.car-slider-container');
        sliderContainer.innerHTML = '';
        
        // Tüm araçları göster
        cars.forEach(car => {
            sliderContainer.appendChild(createCarCard(car));
        });
        
        // Sonsuz döngü için aynı kartların kopyasını ekle
        cars.forEach(car => {
            sliderContainer.appendChild(createCarCard(car));
        });
        
        // Slider'ı başlat
        initializeSlider();
        
    } catch (error) {
        console.error('Ana sayfa araçları yüklenirken hata oluştu:', error);
        // Hata durumunda örnek verilerle devam et
        loadSampleCars();
    }
}

// API'den araçları çek
async function fetchCars() {
    try {
        const response = await fetch('https://takkas-api.onrender.com/api/vehicle-listings');
        
        if (!response.ok) {
            throw new Error(`API isteği başarısız oldu: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Eğer data bir array değilse ve data.results varsa, data.results kullanın
        const vehicleData = Array.isArray(data) ? data : (data.results || data.data || []);
        
        // Araç verilerini işleme ve her araç için görsel çekme işlemi
        const carsPromises = vehicleData.map(async car => {
            // Araç adını belirle
            const name = car.title || car.name || car.model || 'Bilinmeyen Araç';
            
            // Ilan ID'si varsa fotoğrafları çekmeyi dene
            let carImage = null;
            if (car.id) {
                try {
                    const photoUrl = `https://takkas-api.onrender.com/api/listing-photos/${car.id}`;
                    console.log(`Ana sayfa slider: ${car.id} ID'li araç için fotoğraf isteği gönderiliyor:`, photoUrl);
                    
                    const photoResponse = await fetch(photoUrl);
                    if (photoResponse.ok) {
                        const photos = await photoResponse.json();
                        console.log(`Ana sayfa slider: ${car.id} ID'li araç için fotoğraf yanıtı:`, photos);
                        
                        // İlk fotoğrafı veya ana fotoğrafı (is_primary=true) kullan
                        if (photos && photos.length > 0) {
                            // Önce is_primary=true olan fotoğrafı ara
                            const primaryPhoto = photos.find(photo => photo.is_primary === true);
                            if (primaryPhoto) {
                                carImage = primaryPhoto.url;
                            } else {
                                // Ana fotoğraf yoksa ilk fotoğrafı kullan
                                carImage = photos[0].url;
                            }
                            console.log(`Ana sayfa slider: ${car.id} ID'li araç için fotoğraf bulundu:`, carImage);
                        }
                    } else {
                        console.log(`Ana sayfa slider: ${car.id} ID'li araç için fotoğraf bulunamadı, HTTP durumu:`, photoResponse.status);
                    }
                } catch (photoError) {
                    console.error(`Ana sayfa slider: ${car.id} ID'li araç için fotoğraf çekilirken hata:`, photoError);
                }
            }
            
            // Kilometre değeri belirle
            let kmValue = car.mileage || car.km || car.kilometer || null;
            
            // km değeri string olarak geldiyse sayıya çevir
            if (typeof kmValue === 'string' && !isNaN(kmValue)) {
                kmValue = parseInt(kmValue.replace(/[^0-9]/g, ''));
            }
            
            // km değeri yoksa yeni araç veya düşük km değeri atanabilir
            if (kmValue === null || kmValue === undefined) {
                // Eğer araç sıfır olarak belirtilmişse
                if (car.is_new || car.condition === 'new') {
                    kmValue = '0 km';
                } else {
                    kmValue = '-';
                }
            }
            
            // Lokasyon bilgisini belirle
            let locationText = '';
            if (car.city) {
                locationText = car.city;
                if (car.district) {
                    locationText += `, ${car.district}`;
                }
            } else if (car.location) {
                locationText = car.location;
            } else if (car.address) {
                locationText = car.address;
            } else {
                locationText = 'Konum belirtilmemiş';
            }
            
            return {
                id: car.id,
                name: name,
                type: car.case_type || car.type || car.category || car.vehicleType || car.category_name || 'Bilinmeyen Tip',
                image: carImage || car.image_url || car.image || null,
                transmission: car.gear_type || car.transmission || car.gearbox || 'Otomatik',
                price: car.price || car.amount || 100000,
                brand: car.brand || '',
                model: car.model || '',
                km: kmValue,
                location: locationText
            };
        });
        
        // Tüm Promise'ları çözümle
        return await Promise.all(carsPromises);
    } catch (error) {
        console.error('API\'den araçlar çekilirken hata oluştu:', error);
        throw error;
    }
}

// Araç kartı oluştur
function createCarCard(car) {
    // Eksik verilere karşı koruma
    const name = car.name || 'Bilinmeyen Araç';
    const type = car.type || 'Bilinmeyen Tip';
    
    // Görsel yoksa "Fotoğraf Bulunamadı" görseli kullan
    const noImagePlaceholder = `https://via.placeholder.com/400x250/e0e0e0/333333?text=${encodeURIComponent('Fotoğraf Bulunamadı')}`;
    const image = car.image || noImagePlaceholder;
    
    const transmission = car.transmission || 'Bilinmeyen';
    const price = car.price || 0;
    const brand = car.brand || '';
    const model = car.model || '';
    const km = car.km || car.mileage || '0 km';
    const location = car.location || car.city || car.address || '';
    
    // Fiyatı formatlama
    const formattedPrice = typeof price === 'number' 
        ? new Intl.NumberFormat('tr-TR').format(price) 
        : (typeof price === 'string' ? new Intl.NumberFormat('tr-TR').format(parseFloat(price)) : price);
    
    // KM formatla
    const formattedKm = typeof km === 'number' 
        ? new Intl.NumberFormat('tr-TR').format(km) + ' km'
        : km;
    
    // Yeni kart elementi oluştur
    const cardElement = document.createElement('div');
    cardElement.className = 'car-card';
    
    cardElement.innerHTML = `
        <div class="car-content">
            <header class="car-header">
                <div class="car-title-row">
                    <h2 class="car-name">${name}</h2>
                </div>
                <p class="car-type">${brand} ${model}</p>
            </header>
            <div class="car-image-container">
                <a href="car-detail.html?id=${car.id}" class="car-link">
                    <img src="${image}" alt="${name}" class="car-image" onerror="this.onerror=null; this.src='${noImagePlaceholder}';">
                </a>
                <span class="car-km-badge">${formattedKm}</span>
                <span class="car-transmission-badge"><i class="fas fa-cog"></i> ${transmission}</span>
            </div>
            <footer class="car-details">
                <div class="car-specs">
                    <div class="spec-item location-item">
                        <span>${location}</span>
                    </div>
                </div>
                <p class="car-price">
                    <span class="price-amount">${formattedPrice} TL</span>
                </p>
            </footer>
        </div>
    `;
    
    return cardElement;
}

// Slider'ı başlat
function initializeSlider() {
    const slider = document.querySelector('.car-slider-container');
    const cards = document.querySelectorAll('.car-card');
    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // kartlar arası boşluk
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    // Görünür kart sayısını hesapla
    const sliderWidth = document.querySelector('.car-slider').offsetWidth;
    const visibleCards = Math.floor(sliderWidth / (cardWidth + gap));

    // Kaydırma butonlarını ekle
    const sliderContainer = document.querySelector('.car-slider');
    
    // Önceki butonları temizle
    const existingButtons = sliderContainer.querySelectorAll('.slider-nav');
    existingButtons.forEach(button => button.remove());
    
    // Yeni butonları ekle
    sliderContainer.insertAdjacentHTML('beforeend', `
        <button class="slider-nav prev" onclick="slideCards('prev')">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="slider-nav next" onclick="slideCards('next')">
            <i class="fas fa-chevron-right"></i>
        </button>
    `);

    // Dokunmatik olayları ekle
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = startX;
        isDragging = true;
        slider.style.transition = 'none';
    });

    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const currentTransform = currentIndex * (cardWidth + gap);
        slider.style.transform = `translateX(${-currentTransform + diff}px)`;
    });

    slider.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        const diff = currentX - startX;
        
        // Kaydırma mesafesine göre yönü belirle
        if (Math.abs(diff) > cardWidth / 3) { // Kartın 1/3'ünden fazla kaydırıldıysa
            if (diff > 0) {
                slideCards('prev');
            } else {
                slideCards('next');
            }
        } else {
            // Yeterli kaydırma yoksa mevcut pozisyona geri dön
            slider.style.transition = 'transform 0.3s ease';
            slider.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
        }
    });

    // Kaydırma fonksiyonu
    window.slideCards = function(direction) {
        const totalCards = cards.length;
        const maxIndex = totalCards - visibleCards;
        
        if (direction === 'next') {
            currentIndex = (currentIndex + visibleCards) >= maxIndex ? 0 : currentIndex + visibleCards;
        } else {
            currentIndex = currentIndex <= 0 ? maxIndex - (maxIndex % visibleCards) : currentIndex - visibleCards;
        }

        // Smooth scroll efekti ile kaydır
        slider.style.transition = 'transform 0.5s ease';
        slider.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
        
        // Sonsuz döngü için pozisyonu sıfırla
        if (currentIndex === 0) {
            setTimeout(() => {
                slider.style.transition = 'none';
                slider.style.transform = 'translateX(0)';
            }, 500);
        }
    };
}

// API'den emlak ilanlarını çek ve slider'ı oluştur
async function fetchEstatesAndCreateSlider() {
    try {
        console.log('Ana sayfa için emlak API isteği gönderiliyor...');
        
        // API'den emlak ilanlarını çek
        const estates = await fetchEstates();
        console.log('Ana sayfa için emlak ilanları alındı:', estates);
        
        // Slider container'ı temizle
        const sliderContainer = document.querySelector('.estate-slider-container');
        if (!sliderContainer) {
            console.error('Emlak slider container bulunamadı!');
            return;
        }
        
        sliderContainer.innerHTML = '';
        
        // Veri kontrolü
        if (!estates || estates.length === 0) {
            console.warn('Emlak verileri boş veya hatalı, örnek veriler yükleniyor...');
            loadSampleEstates();
            return;
        }
        
        // Görselleri önbelleğe almak için görsel URL'leri kontrol et
        const preloadImages = estates.filter(estate => estate.image).map(estate => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = estate.image;
            });
        });
        
        // Görsel önbelleğe alma işlemini başlat (arka planda devam eder)
        Promise.all(preloadImages).then(results => {
            console.log(`Emlak görselleri önbelleğe alındı, başarılı: ${results.filter(Boolean).length}/${results.length}`);
        });
        
        // Tüm emlak ilanlarını göster
        estates.forEach(estate => {
            sliderContainer.appendChild(createEstateCard(estate));
        });
        
        // Sonsuz döngü için aynı kartların kopyasını ekle
        estates.forEach(estate => {
            sliderContainer.appendChild(createEstateCard(estate));
        });
        
        // Slider'ı başlat
        initializeEstateSlider();
        
    } catch (error) {
        console.error('Ana sayfa emlak ilanları yüklenirken hata oluştu:', error);
        // Hata durumunda örnek verilerle devam et
        loadSampleEstates();
    }
}

// API'den emlak ilanlarını çek
async function fetchEstates() {
    try {
        const response = await fetch('https://takkas-api.onrender.com/api/estates');
        
        if (!response.ok) {
            throw new Error(`API isteği başarısız oldu: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Emlak API yanıtı:', data);
        
        // Eğer data bir array değilse ve data.results varsa, data.results kullanın
        const estateData = Array.isArray(data) ? data : (data.results || data.data || []);
        
        if (estateData.length === 0) {
            console.warn('API\'den gelen emlak verisi boş!');
        }
        
        // Emlak verilerini işle
        const estatesPromises = estateData.map(async estate => {
            // Emlak adını belirle
            const name = estate.title || estate.name || 'Bilinmeyen Emlak';
            
            // Görsel kaynağını belirle
            let estateImage = null;
            
            // Öncelikle primary_photo alanlarını kontrol et
            if (estate.primary_photo && estate.primary_photo.url) {
                estateImage = estate.primary_photo.url;
                console.log(`${estate.id} ID'li emlak için primary_photo.url kullanılıyor:`, estateImage);
            }
            // primary_photo yoksa diğer görsel alanlarını kontrol et
            else if (estate.photo_url) {
                estateImage = estate.photo_url;
                console.log(`${estate.id} ID'li emlak için photo_url kullanılıyor:`, estateImage);
            } else if (estate.image_url) {
                estateImage = estate.image_url;
                console.log(`${estate.id} ID'li emlak için image_url kullanılıyor:`, estateImage);
            } else if (estate.cover_image) {
                estateImage = estate.cover_image;
                console.log(`${estate.id} ID'li emlak için cover_image kullanılıyor:`, estateImage);
            } else if (estate.image) {
                estateImage = estate.image;
                console.log(`${estate.id} ID'li emlak için image kullanılıyor:`, estateImage);
            } 
            // Diğer koşullara rağmen görsel yoksa, fotoğraf API'sine istek
            else if (estate.id) {
                try {
                    const photoUrl = `https://takkas-api.onrender.com/api/listing-photos/${estate.id}`;
                    console.log(`${estate.id} ID'li emlak için fotoğraf isteği gönderiliyor:`, photoUrl);
                    
                    const photoResponse = await fetch(photoUrl);
                    if (photoResponse.ok) {
                        const photos = await photoResponse.json();
                        
                        if (photos && Array.isArray(photos) && photos.length > 0) {
                            // Önce is_primary=true olan fotoğrafı ara
                            const primaryPhoto = photos.find(photo => photo.is_primary === true);
                            if (primaryPhoto && primaryPhoto.url) {
                                estateImage = primaryPhoto.url;
                                console.log(`${estate.id} ID'li emlak için ana fotoğraf bulundu:`, estateImage);
                            } else if (photos[0] && photos[0].url) {
                                // Ana fotoğraf yoksa ilk fotoğrafı kullan
                                estateImage = photos[0].url;
                                console.log(`${estate.id} ID'li emlak için ilk fotoğraf kullanılıyor:`, estateImage);
                            }
                        } else {
                            console.log(`${estate.id} ID'li emlak için fotoğraf verisi boş veya hatalı format:`, photos);
                        }
                    } else {
                        console.log(`${estate.id} ID'li emlak için fotoğraf bulunamadı, HTTP durumu:`, photoResponse.status);
                    }
                } catch (photoError) {
                    console.error(`${estate.id} ID'li emlak için fotoğraf çekilirken hata:`, photoError);
                }
            }
            
            // Konum bilgisi: önce adres alanlarını dene (city, district, neighborhood)
            let locationText = '';
            if (estate.city && estate.district) {
                locationText = `${estate.city}, ${estate.district}`;
            } else {
                locationText = estate.location || estate.address || 'Bilinmeyen Konum';
            }
            
            // Alan bilgisi: brüt veya net m²
            let areaText = '';
            if (estate.square_meters_gross) {
                areaText = `${estate.square_meters_gross} m² (Brüt)`;
            } else if (estate.square_meters_net) {
                areaText = `${estate.square_meters_net} m² (Net)`;
            } else if (estate.square_meters) {
                areaText = `${estate.square_meters} m²`;
            } else if (estate.area) {
                areaText = estate.area;
            } else if (estate.size) {
                areaText = `${estate.size} m²`;
            } else {
                areaText = 'Alan Belirtilmemiş';
            }
            
            // Veri temizleme
            return {
                id: estate.id || `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                name: name,
                type: estate.category_name || estate.estate_type || estate.property_type || estate.type || estate.category || 'Bilinmeyen Tip',
                image: estateImage, // null ise placeholder görsel createEstateCard'da eklenecek
                location: locationText,
                price: estate.price || estate.amount || estate.listing_price || 0,
                area: areaText,
                room: estate.room_number || ''
            };
        });
        
        // Tüm Promise'ları çözümle
        return await Promise.all(estatesPromises);
    } catch (error) {
        console.error('API\'den emlak ilanları çekilirken hata oluştu:', error);
        throw error;
    }
}

// Emlak kartı oluştur
function createEstateCard(estate) {
    // Eksik verilere karşı koruma
    const name = estate.name || 'Bilinmeyen Emlak';
    const type = estate.type || 'Bilinmeyen Tip';
    
    // Görsel yoksa "Fotoğraf Bulunamadı" görseli kullan
    const noImagePlaceholder = `https://via.placeholder.com/400x250/e0e0e0/333333?text=${encodeURIComponent('Fotoğraf Bulunamadı')}`;
    const image = estate.image || noImagePlaceholder;
    
    const location = estate.location || 'Bilinmeyen Konum';
    const price = estate.price || 0;
    const area = estate.area || '';
    const room = estate.room || '';
    
    // Fiyatı formatlama
    const formattedPrice = typeof price === 'number' 
        ? new Intl.NumberFormat('tr-TR').format(price) 
        : (typeof price === 'string' ? new Intl.NumberFormat('tr-TR').format(parseFloat(price)) : price);
    
    // Yeni kart elementi oluştur
    const cardElement = document.createElement('div');
    cardElement.className = 'estate-card';
    
    cardElement.innerHTML = `
        <div class="estate-content">
            <header class="estate-header">
                <div class="estate-title-row">
                    <h2 class="estate-name">${name}</h2>
                </div>
                <p class="estate-type">${type} ${room ? `(${room})` : ''}</p>
            </header>
            <div class="estate-image-container">
                <a href="property-detail.html?id=${estate.id}" class="estate-link">
                    <img src="${image}" alt="${name}" class="estate-image" onerror="this.onerror=null; this.src='${noImagePlaceholder}';">
                </a>
                <span class="estate-area-badge">${area}</span>
            </div>
            <footer class="estate-details">
                <div class="estate-specs">
                    <div class="spec-item">
                        <i class="fas fa-map-marker-alt spec-icon"></i>
                        <span>${location}</span>
                    </div>
                </div>
                <p class="estate-price">
                    <span class="price-amount">${formattedPrice} TL</span>
                </p>
            </footer>
        </div>
    `;
    
    return cardElement;
}

// Emlak Slider'ını başlat
function initializeEstateSlider() {
    const slider = document.querySelector('.estate-slider-container');
    const cards = document.querySelectorAll('.estate-card');
    
    if (cards.length === 0) {
        console.log('Emlak kartları bulunamadı, slider başlatılamıyor.');
        return;
    }
    
    const cardWidth = cards[0].offsetWidth;
    const gap = 24; // kartlar arası boşluk
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    // Görünür kart sayısını hesapla
    const sliderWidth = document.querySelector('.estate-slider').offsetWidth;
    const visibleCards = Math.floor(sliderWidth / (cardWidth + gap));

    // Kaydırma butonlarını ekle
    const sliderContainer = document.querySelector('.estate-slider');
    
    // Önceki butonları temizle
    const existingButtons = sliderContainer.querySelectorAll('.slider-nav');
    existingButtons.forEach(button => button.remove());
    
    // Yeni butonları ekle
    sliderContainer.insertAdjacentHTML('beforeend', `
        <button class="slider-nav prev" onclick="slideEstateCards('prev')">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="slider-nav next" onclick="slideEstateCards('next')">
            <i class="fas fa-chevron-right"></i>
        </button>
    `);

    // Dokunmatik olayları ekle
    slider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = startX;
        isDragging = true;
        slider.style.transition = 'none';
    });

    slider.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        const currentTransform = currentIndex * (cardWidth + gap);
        slider.style.transform = `translateX(${-currentTransform + diff}px)`;
    });

    slider.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        const diff = currentX - startX;
        
        // Kaydırma mesafesine göre yönü belirle
        if (Math.abs(diff) > cardWidth / 3) { // Kartın 1/3'ünden fazla kaydırıldıysa
            if (diff > 0) {
                slideEstateCards('prev');
            } else {
                slideEstateCards('next');
            }
        } else {
            // Yeterli kaydırma yoksa mevcut pozisyona geri dön
            slider.style.transition = 'transform 0.3s ease';
            slider.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
        }
    });

    // Kaydırma fonksiyonu
    window.slideEstateCards = function(direction) {
        const totalCards = cards.length;
        const maxIndex = totalCards - visibleCards;
        
        if (direction === 'next') {
            currentIndex = (currentIndex + visibleCards) >= maxIndex ? 0 : currentIndex + visibleCards;
        } else {
            currentIndex = currentIndex <= 0 ? maxIndex - (maxIndex % visibleCards) : currentIndex - visibleCards;
        }

        // Smooth scroll efekti ile kaydır
        slider.style.transition = 'transform 0.5s ease';
        slider.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
    };
}

// Örnek emlak verileri
function loadSampleEstates() {
    console.log('Örnek emlak verileri yükleniyor...');
    const sampleEstates = [
        {
            id: 'sample-1',
            name: 'Merkezi Konumda 3+1 Daire',
            type: 'Daire',
            image: null, // Örnek görsel kullanmayacağız
            location: 'İstanbul, Kadıköy',
            price: 1850000,
            area: '120 m²'
        },
        {
            id: 'sample-2',
            name: 'Deniz Manzaralı Villa',
            type: 'Villa',
            image: null, // Örnek görsel kullanmayacağız
            location: 'İzmir, Çeşme',
            price: 5500000,
            area: '280 m²'
        },
        {
            id: 'sample-3',
            name: 'Bahçeli Müstakil Ev',
            type: 'Müstakil Ev',
            image: null, // Örnek görsel kullanmayacağız
            location: 'Ankara, Çankaya',
            price: 3200000,
            area: '190 m²'
        },
        {
            id: 'sample-4',
            name: 'Yatırımlık Arsa',
            type: 'Arsa',
            image: null, // Örnek görsel kullanmayacağız
            location: 'Muğla, Bodrum',
            price: 2850000,
            area: '720 m²'
        }
    ];
    
    // Slider container'ı temizle
    const sliderContainer = document.querySelector('.estate-slider-container');
    if (sliderContainer) {
        sliderContainer.innerHTML = '';
        
        // Örnek emlak verilerini ekle
        sampleEstates.forEach(estate => {
            sliderContainer.appendChild(createEstateCard(estate));
        });
        
        // Slider'ı başlat
        initializeEstateSlider();
    } else {
        console.error('Emlak slider container bulunamadı!');
    }
}

// Örnek araçları yükle (API bağlantısı başarısız olduğunda)
function loadSampleCars() {
    console.log('Örnek araçlar yükleniyor...');
    
    const sampleCars = [
        {
            id: 52,
            name: '2023 Model Lüks Sedan',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Otomatik',
            price: 1850000,
            brand: 'Toyota',
            model: 'Corolla',
            km: 15000,
            location: 'İstanbul, Kadıköy'
        },
        {
            id: 47,
            name: '2023 Model Lüks Sedan',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1164&q=80',
            transmission: 'Otomatik',
            price: 1850000,
            brand: 'Mercedes',
            model: 'C-Serisi',
            km: 8500,
            location: 'İstanbul, Beşiktaş'
        },
        {
            id: 45,
            name: 'semihten ucuz Araba',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Otomatik',
            price: 1500000,
            brand: 'Audi',
            model: 'A3',
            km: 25000,
            location: 'Ankara, Çankaya'
        },
        {
            id: 43,
            name: '2020 Model BMW',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Manuel',
            price: 500000,
            brand: 'BMW',
            model: '5 Serisi',
            km: 120000,
            location: 'İzmir, Karşıyaka'
        },
        {
            id: 42,
            name: 'test data',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1236&q=80',
            transmission: 'Manuel',
            price: 100000,
            brand: 'Volkswagen',
            model: 'Passat',
            km: 95000,
            location: 'Bursa, Nilüfer'
        },
        {
            id: 41,
            name: 'data',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Manuel',
            price: 1000000,
            brand: 'Honda',
            model: 'Civic',
            km: 45000,
            location: 'Antalya, Konyaaltı'
        },
        {
            id: 40,
            name: 'test',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1125&q=80',
            transmission: 'Manuel',
            price: 750000,
            brand: 'Ford',
            model: 'Focus',
            km: 78000,
            location: 'Ankara, Etimesgut'
        },
        {
            id: 39,
            name: 'BMW 320i',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Manuel',
            price: 1000000,
            brand: 'BMW',
            model: '320i',
            km: 62000,
            location: 'İstanbul, Beylikdüzü'
        }
    ];
    
    // Slider container'ı temizle
    const sliderContainer = document.querySelector('.car-slider-container');
    sliderContainer.innerHTML = '';
    
    // Araç kartlarını oluştur
    sampleCars.forEach(car => {
        sliderContainer.appendChild(createCarCard(car));
    });
    
    // Sonsuz döngü için aynı kartların kopyasını ekle
    sampleCars.forEach(car => {
        sliderContainer.appendChild(createCarCard(car));
    });
    
    // Slider'ı başlat
    initializeSlider();
} 