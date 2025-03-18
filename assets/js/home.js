// Araba kartları slider
document.addEventListener('DOMContentLoaded', function() {
    // API'den araçları çek ve kartları oluştur
    fetchCarsAndCreateSlider();
    
    // Favoriye ekleme fonksiyonu
    document.addEventListener('click', function(e) {
        if (e.target.closest('.car-favorite')) {
            const button = e.target.closest('.car-favorite');
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
        
        // API'den dönen veriyi işleyin
        return vehicleData.map(car => {
            // Araç adını belirle
            const name = car.title || car.name || car.model || 'Bilinmeyen Araç';
            
            // Varsayılan görseller
            const defaultImages = [
                'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1164&q=80',
                'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1236&q=80',
                'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
                'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1125&q=80',
                'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
            ];
            
            // Rastgele bir görsel seç
            const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
            
            return {
                id: car.id,
                name: name,
                type: car.case_type || car.type || car.category || car.vehicleType || car.category_name || 'Bilinmeyen Tip',
                image: car.image_url || car.image || randomImage,
                transmission: car.gear_type || car.transmission || car.gearbox || 'Otomatik',
                price: car.price || car.amount || 100000,
                brand: car.brand || '',
                model: car.model || ''
            };
        });
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
    
    // Görsel için varsayılan bir placeholder kullan, API'den görsel gelmezse
    const defaultImages = [
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1164&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1236&q=80',
        'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1125&q=80',
        'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
    ];
    
    // Rastgele bir görsel seç (eğer car.image yoksa)
    const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];
    const image = car.image || randomImage;
    
    const transmission = car.transmission || 'Bilinmeyen';
    const price = car.price || 0;
    const brand = car.brand || '';
    const model = car.model || '';
    
    // Yeni kart elementi oluştur
    const cardElement = document.createElement('div');
    cardElement.className = 'car-card';
    
    cardElement.innerHTML = `
        <div class="car-content">
            <header class="car-header">
                <div class="car-title-row">
                    <h2 class="car-name">${name}</h2>
                    <button class="car-favorite" aria-label="Favorilere ekle">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <p class="car-type">${brand} ${model}</p>
            </header>
            <a href="car-detail.html?id=${car.id}" class="car-link">
                <img src="${image}" alt="${name}" class="car-image" onerror="this.onerror=null; this.src='${randomImage}';">
            </a>
            <footer class="car-details">
                <div class="car-specs">
                    <div class="spec-item">
                        <i class="fas fa-cog spec-icon"></i>
                        <span>${transmission}</span>
                    </div>
                </div>
                <p class="car-price">
                    <span class="price-amount">${typeof price === 'number' ? price.toLocaleString() : price} TL</span>
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
            model: 'Corolla'
        },
        {
            id: 47,
            name: '2023 Model Lüks Sedan',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1164&q=80',
            transmission: 'Otomatik',
            price: 1850000,
            brand: 'Mercedes',
            model: 'C-Serisi'
        },
        {
            id: 45,
            name: 'semihten ucuz Araba',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Otomatik',
            price: 1500000,
            brand: 'Audi',
            model: 'A3'
        },
        {
            id: 43,
            name: '2020 Model BMW',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Manuel',
            price: 500000,
            brand: 'BMW',
            model: '5 Serisi'
        },
        {
            id: 42,
            name: 'test data',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1236&q=80',
            transmission: 'Manuel',
            price: 100000,
            brand: 'Volkswagen',
            model: 'Passat'
        },
        {
            id: 41,
            name: 'data',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Manuel',
            price: 1000000,
            brand: 'Honda',
            model: 'Civic'
        },
        {
            id: 40,
            name: 'test',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1125&q=80',
            transmission: 'Manuel',
            price: 750000,
            brand: 'Ford',
            model: 'Focus'
        },
        {
            id: 39,
            name: 'BMW 320i',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
            transmission: 'Manuel',
            price: 1000000,
            brand: 'BMW',
            model: '320i'
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