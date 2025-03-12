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
        
        // En fazla 8 aracı göster (4 orijinal + 4 kopya)
        const carsToShow = cars.slice(0, 8);
        
        // Araç kartlarını oluştur
        carsToShow.forEach(car => {
            sliderContainer.appendChild(createCarCard(car));
        });
        
        // Sonsuz döngü için aynı kartların kopyasını ekle
        carsToShow.forEach(car => {
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
            
            return {
                id: car.id || Math.random().toString(36).substr(2, 9),
                name: name,
                type: car.case_type || car.type || car.category || car.vehicleType || 'Bilinmeyen Tip',
                image: null, // Görsel yok, createCarCard varsayılan görsel kullanacak
                transmission: car.gear_type || car.transmission || car.gearbox || 'Otomatik',
                price: car.price || car.amount || 100000
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
    const defaultImage = `https://via.placeholder.com/400x250/e0e0e0/333333?text=${encodeURIComponent(name)}`;
    const image = car.image || defaultImage;
    
    const transmission = car.transmission || 'Bilinmeyen';
    const price = car.price || 0;
    
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
                <p class="car-type">${type}</p>
            </header>
            <a href="cars.html" class="car-link">
                <img src="${image}" alt="${name}" class="car-image" onerror="this.onerror=null; this.src='${defaultImage}';">
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
    const cardWidth = cards[0].offsetWidth + 24; // 24px gap
    let currentIndex = 0;

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
        const maxIndex = cards.length - 1;
        
        if (direction === 'next') {
            currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        } else {
            currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        }

        slider.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    };
}

// Örnek araçları yükle (API bağlantısı başarısız olduğunda)
function loadSampleCars() {
    console.log('Örnek araçlar yükleniyor...');
    
    const sampleCars = [
        {
            id: 1,
            name: 'Porshe 718 Cayman S',
            type: 'Coupe',
            image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&h=1000',
            transmission: 'Manual',
            price: 400000
        },
        {
            id: 2,
            name: 'BMW M4 Competition',
            type: 'Sedan',
            image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&h=1000',
            transmission: 'Automatic',
            price: 450000
        },
        {
            id: 3,
            name: 'Mercedes-AMG GT',
            type: 'Sports Car',
            image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&h=1000',
            transmission: 'DCT',
            price: 500000
        },
        {
            id: 4,
            name: 'Audi RS7',
            type: 'Sportback',
            image: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=800&h=1000',
            transmission: 'Manual',
            price: 550000
        },
        {
            id: 5,
            name: '2020 Model BMW',
            type: 'Sedan',
            image: null,
            transmission: 'Otomatik',
            price: 600000
        },
        {
            id: 6,
            name: 'Mercedes C200',
            type: 'Sedan',
            image: null,
            transmission: 'Manuel',
            price: 650000
        },
        {
            id: 7,
            name: 'Audi A3',
            type: 'Hatchback',
            image: null,
            transmission: 'Otomatik',
            price: 700000
        },
        {
            id: 8,
            name: 'Volkswagen Passat',
            type: 'Sedan',
            image: null,
            transmission: 'Manuel',
            price: 750000
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