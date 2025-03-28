document.addEventListener('DOMContentLoaded', function() {
    const cardStack = document.querySelector('.card-stack');
    let currentCardIndex = 0;
    let allCards = []; // API'den gelecek veriler için boş array
    
    // API'den araçları çek
    async function fetchVehicles() {
        try {
            const response = await fetch('https://takkas-api.onrender.com/api/vehicle-listings');
            if (!response.ok) {
                throw new Error('API isteği başarısız oldu');
            }
            const data = await response.json();
            console.log('API\'den gelen veriler:', data);
            
            // API'den gelen verileri formatlayarak allCards'a aktar
            allCards = data.map(vehicle => ({
                id: vehicle.id,
                title: vehicle.title || `${vehicle.brand} ${vehicle.model}`,
                type: vehicle.case_type || 'Araç',
                price: parseFloat(vehicle.price),
                year: vehicle.production_year,
                mileage: vehicle.kilometer,
                fuel: vehicle.fuel_type,
                images: [
                    // Eğer araç görseli yoksa varsayılan görseller kullan
                    vehicle.image_url || 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738',
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537',
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e'
                ]
            }));
            
            // İlk kartı göster
            if (allCards.length > 0) {
                renderCard(allCards[currentCardIndex]);
            }
        } catch (error) {
            console.error('Araçlar yüklenirken hata:', error);
            // Hata durumunda örnek verilerle devam et
            loadSampleData();
        }
    }

    // Örnek veriler (sadece API hatası durumunda kullanılacak)
    function loadSampleData() {
        allCards = [
            {
                id: 1,
                title: 'BMW M4 Competition',
                type: 'Spor Araç',
                price: 2450000,
                year: 2023,
                mileage: 15000,
                fuel: 'Benzin',
                images: [
                    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738',
                    'https://images.unsplash.com/photo-1580273916550-e323be2ae537',
                    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e'
                ]
            }
            // Diğer örnek kartlar buraya eklenebilir
        ];
        renderCard(allCards[currentCardIndex]);
    }

    // Sayfa yüklendiğinde API'den verileri çek
    fetchVehicles();

    function renderCard(cardData) {
        const cardHTML = `
            <div class="card">
                <div class="card-image">
                    <div class="image-slider">
                        <div class="slider-images">
                            ${cardData.images.map(img => `
                                <img src="${img}" alt="${cardData.title}">
                            `).join('')}
                        </div>
                        <div class="slider-indicators">
                            ${cardData.images.map((_, i) => `
                                <div class="indicator ${i === 0 ? 'active' : ''}"></div>
                            `).join('')}
                        </div>
                        <button class="slider-nav prev">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="slider-nav next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="card-gradient"></div>
                </div>
                <div class="card-content">
                    <div class="card-info">
                        <h2>${cardData.title}</h2>
                        <p class="car-type">${cardData.type}</p>
                        <div class="car-specs">
                            <span><i class="fas fa-calendar"></i> ${cardData.year}</span>
                            <span><i class="fas fa-road"></i> ${cardData.mileage} km</span>
                            <span><i class="fas fa-gas-pump"></i> ${cardData.fuel}</span>
                        </div>
                        <div class="car-price">₺${cardData.price.toLocaleString()}</div>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="action-button reject">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="action-button like">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="swipe-overlay"></div>
            </div>
        `;

        cardStack.innerHTML = cardHTML;
        const card = cardStack.querySelector('.card');
        
        // Kart özelliklerini aktifleştir
        initializeCardFeatures(card);
    }

    function initializeCardFeatures(card) {
        // Slider özelliklerini aktifleştir
        initializeSlider(card);
        
        // Like/Reject butonlarını aktifleştir
        initializeButtons(card);
        
        // Sürükleme özelliğini aktifleştir
        initializeDragFeature(card);
    }

    function showNextCard() {
        currentCardIndex = (currentCardIndex + 1) % allCards.length;
        renderCard(allCards[currentCardIndex]);
    }

    function initializeSlider(card) {
        const sliderImages = card.querySelector('.slider-images');
        const indicators = card.querySelectorAll('.indicator');
        const prevBtn = card.querySelector('.slider-nav.prev');
        const nextBtn = card.querySelector('.slider-nav.next');
        let currentImageIndex = 0;

        function showImage(index) {
            sliderImages.style.transform = `translateX(-${index * 100}%)`;
            indicators.forEach((ind, i) => ind.classList.toggle('active', i === index));
        }

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex - 1 + indicators.length) % indicators.length;
            showImage(currentImageIndex);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentImageIndex = (currentImageIndex + 1) % indicators.length;
            showImage(currentImageIndex);
        });
    }

    function initializeButtons(card) {
        const likeBtn = card.querySelector('.action-button.like');
        const rejectBtn = card.querySelector('.action-button.reject');

        likeBtn.addEventListener('click', () => {
            card.classList.add('swipe-right');
            setTimeout(showNextCard, 300);
        });

        rejectBtn.addEventListener('click', () => {
            card.classList.add('swipe-left');
            setTimeout(showNextCard, 300);
        });
    }

    function initializeDragFeature(card) {
        let isDragging = false;
        let startX = 0;
        let currentX = 0;

        card.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);

        function startDragging(e) {
            if (e.target.closest('.slider-nav') || e.target.closest('.action-button')) return;
            isDragging = true;
            startX = e.pageX - currentX;
            card.style.transition = 'none';
        }

        function drag(e) {
            if (!isDragging) return;
            currentX = e.pageX - startX;
            const rotate = currentX * 0.1;
            card.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
            updateOverlay(currentX);
        }

        function stopDragging() {
            if (!isDragging) return;
            isDragging = false;
            card.style.transition = 'transform 0.3s ease';
            
            if (Math.abs(currentX) > 100) {
                const direction = currentX > 0 ? 'right' : 'left';
                card.classList.add(`swipe-${direction}`);
                setTimeout(showNextCard, 300);
            } else {
                card.style.transform = '';
            }
            currentX = 0;
        }

        function updateOverlay(offset) {
            const overlay = card.querySelector('.swipe-overlay');
            if (Math.abs(offset) > 50) {
                overlay.style.opacity = '1';
                if (offset > 0) {
                    overlay.className = 'swipe-overlay like';
                    overlay.textContent = 'LIKE';
                } else {
                    overlay.className = 'swipe-overlay nope';
                    overlay.textContent = 'NOPE';
                }
            } else {
                overlay.style.opacity = '0';
            }
        }
    }
}); 