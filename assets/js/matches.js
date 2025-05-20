document.addEventListener('DOMContentLoaded', function() {
    const cardStack = document.querySelector('.card-stack');
    let currentCardIndex = 0;
    let allCards = []; // API'den gelecek veriler için boş array
    
    // Araç fotoğraflarını çeken fonksiyon
    async function fetchCarImages(carId) {
        try {
            const imageUrl = `https://takkas-api.onrender.com/api/listing-photos/${carId}`;
            console.log('Görsel API isteği gönderiliyor:', imageUrl);
            
            const response = await fetch(imageUrl);
            console.log('Görsel API yanıt durumu:', response.status, response.statusText);
            
            if (!response.ok) {
                console.warn(`${carId} ID'li araç için görseller bulunamadı. HTTP Durumu: ${response.status}`);
                return null;
            }
            
            const imagesData = await response.json();
            console.log('Görsel API yanıtı:', imagesData);
            
            if (!imagesData || imagesData.length === 0) {
                console.warn(`${carId} ID'li araç için görseller bulunamadı veya boş dizi döndü.`);
                return null;
            }
            
            // API'den gelen görselleri döndür
            return imagesData.map(img => img.url);
        } catch (error) {
            console.error(`${carId} ID'li araç için görseller çekilirken hata:`, error);
            return null;
        }
    }
    
    // Favori durumu kontrol fonksiyonu
    async function checkFavoriteStatus(vehicleId) {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        
        try {
            console.log('Favori durumu kontrol ediliyor. Araç ID:', vehicleId);
            const response = await fetch(`https://takkas-api.onrender.com/api/favorite-vehicles/check/${vehicleId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });
            
            if (!response.ok) return false;
            
            const data = await response.json();
            console.log('Favori durumu yanıtı:', data);
            
            return data === true || data.is_favorite === true;
        } catch (error) {
            console.error('Favori durumu kontrol edilirken hata:', error);
            return false;
        }
    }
    
    // Favoriye ekleme fonksiyonu
    async function addToFavorites(vehicleId) {
        try {
            // LocalStorage'dan token al (oturum açılmışsa)
            const token = localStorage.getItem('authToken');
            
            if (!token) {
                console.error('Kullanıcı girişi yapılmamış veya token bulunamadı');
                showToast('Favorilere eklemek için giriş yapmalısınız', 'error');
                return false;
            }
            
            // Önce ilan zaten favorilerde mi kontrol et
            const isFavorite = await checkFavoriteStatus(vehicleId);
            if (isFavorite) {
                console.log('İlan zaten favorilerde:', vehicleId);
                showToast('Bu ilan zaten favorilerinizde', 'info');
                return true; // Zaten favorilerde olduğu için işlem başarılı sayılır
            }
            
            console.log('Favoriye ekleme isteği gönderiliyor. Araç ID:', vehicleId);
            
            const response = await fetch(`https://takkas-api.onrender.com/api/favorite-vehicles/${vehicleId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('Favori API yanıt durumu:', response.status, response.statusText);
            
            const data = await response.json();
            console.log('Favori API yanıtı:', data);
            
            if (response.ok) {
                showToast('İlan favorilere eklendi', 'success');
                return true;
            } else {
                console.error('Favorilere ekleme hatası:', data);
                showToast(data.message || 'Favorilere eklenirken bir hata oluştu', 'error');
                return false;
            }
        } catch (error) {
            console.error('Favorilere eklenirken hata:', error);
            showToast('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
            return false;
        }
    }
    
    // Basit toast bildirim fonksiyonu
    function showToast(message, type = 'info') {
        // Eğer toast container yoksa oluştur
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Yeni toast oluştur
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Toast'u ekle
        toastContainer.appendChild(toast);
        
        // Animasyon için zaman tanı
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3 saniye sonra kaldır
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    // API'den araçları çek
    async function fetchVehicles() {
        try {
            const response = await fetch('https://takkas-api.onrender.com/api/vehicle-listings');
            if (!response.ok) {
                throw new Error('API isteği başarısız oldu');
            }
            const data = await response.json();
            console.log('API\'den gelen veriler:', data);
            
            // Araç verilerini işle ve her araç için fotoğrafları çek
            const vehiclesWithImages = await Promise.all(data.map(async vehicle => {
                let carImages = await fetchCarImages(vehicle.id);
                
                // Eğer API'den fotoğraf yoksa, boş dizi olarak bırak
                // Görseli olmayan araçlar için carImages = []
                if (!carImages) {
                    carImages = [];
                }
                
                return {
                    id: vehicle.id,
                    title: vehicle.title || `${vehicle.brand} ${vehicle.model}`,
                    type: vehicle.case_type || 'Araç',
                    price: parseFloat(vehicle.price),
                    year: vehicle.production_year,
                    mileage: vehicle.kilometer,
                    fuel: vehicle.fuel_type,
                    images: carImages,
                    hasImages: (carImages && carImages.length > 0)
                };
            }));
            
            // Artık filtreleme yapmıyoruz, tüm araçlar gösterilecek
            allCards = vehiclesWithImages;
            
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
        // Görseli olan araçlar için normal slider göster
        // Görseli olmayan araçlar için "görsel yok" mesajı göster
        let imagesHTML = '';
        let indicatorsHTML = '';
        
        if (cardData.hasImages && cardData.images.length > 0) {
            // Normal görsel slider'ı
            imagesHTML = cardData.images.map(img => `
                <img src="${img}" alt="${cardData.title}">
            `).join('');
            
            indicatorsHTML = cardData.images.map((_, i) => `
                <div class="indicator ${i === 0 ? 'active' : ''}"></div>
            `).join('');
        } else {
            // Görsel yoksa, "görsel yok" mesajı
            imagesHTML = `<div class="no-image-placeholder">Bu ilan için görsel bulunmamaktadır</div>`;
            indicatorsHTML = '';
        }
        
        const cardHTML = `
            <div class="card">
                <div class="card-image">
                    <div class="image-slider ${!cardData.hasImages ? 'no-images' : ''}">
                        <div class="slider-images">
                            ${imagesHTML}
                        </div>
                        <div class="slider-indicators">
                            ${indicatorsHTML}
                        </div>
                        ${cardData.hasImages ? `
                        <button class="slider-nav prev">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="slider-nav next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        ` : ''}
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
        if (cardData.hasImages) {
            initializeCardFeatures(card);
        } else {
            // Görseli olmayan kartlar için sadece butonları etkinleştir
            initializeButtons(card);
            initializeDragFeature(card);
        }
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
        const slider = card.querySelector('.image-slider');
        const sliderImages = card.querySelector('.slider-images');
        const prevBtn = card.querySelector('.slider-nav.prev');
        const nextBtn = card.querySelector('.slider-nav.next');
        const indicators = card.querySelectorAll('.indicator');
        
        if (!sliderImages || sliderImages.children.length <= 1) return;
        
        let currentIndex = 0;
        let imageCount = sliderImages.children.length;
        let startX, moveX, currentTranslate = 0;
        let isDragging = false;
        
        function showImage(index) {
            if (index < 0) index = imageCount - 1;
            if (index >= imageCount) index = 0;
            
            currentIndex = index;
            currentTranslate = -index * 100;
            sliderImages.style.transform = `translateX(${currentTranslate}%)`;
            
            // Göstergeleri güncelle
            indicators.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });
        }
        
        // Dokunmatik hareketler için olay dinleyicileri
        sliderImages.addEventListener('touchstart', touchStart, {passive: true});
        sliderImages.addEventListener('touchmove', touchMove, {passive: true});
        sliderImages.addEventListener('touchend', touchEnd, {passive: true});
        
        function touchStart(e) {
            startX = e.touches[0].clientX;
            isDragging = true;
        }
        
        function touchMove(e) {
            if (!isDragging) return;
            moveX = e.touches[0].clientX;
            const diff = moveX - startX;
            const movePercent = (diff / window.innerWidth) * 100;
            
            // Sınırlama ekle (tam kart genişliğinden fazla kaydırmayı engelle)
            const totalTranslate = currentTranslate + movePercent;
            if (totalTranslate > 10 || totalTranslate < -(imageCount - 0.9) * 100) return;
            
            sliderImages.style.transform = `translateX(${totalTranslate}%)`;
        }
        
        function touchEnd(e) {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = moveX - startX;
            if (Math.abs(diff) > 50) { // 50px'den fazla kaydırma yapıldıysa görsel değiştir
                if (diff > 0) {
                    showImage(currentIndex - 1);
                } else {
                    showImage(currentIndex + 1);
                }
            } else {
                // Yetersiz kaydırma, mevcut görsele geri dön
                sliderImages.style.transform = `translateX(${currentTranslate}%)`;
            }
        }
        
        // Düğme ve yön tuşlarıyla gezinme
        if (prevBtn) prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
        
        // İlk görseli göster
        showImage(0);
    }

    function initializeButtons(card) {
        const likeBtn = card.querySelector('.action-button.like');
        const rejectBtn = card.querySelector('.action-button.reject');
        const currentVehicle = allCards[currentCardIndex];

        likeBtn.addEventListener('click', async () => {
            // Favoriye ekleme işlemi
            const success = await addToFavorites(currentVehicle.id);
            
            // Animasyonu başlat
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
        const currentVehicle = allCards[currentCardIndex];

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
                
                // Eğer sağa kaydırıldıysa (beğenildiyse) favorilere ekle
                if (direction === 'right') {
                    addToFavorites(currentVehicle.id);
                }
                
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
                    overlay.textContent = 'FAVORİ';
                } else {
                    overlay.className = 'swipe-overlay nope';
                    overlay.textContent = 'GEÇŞ';
                }
            } else {
                overlay.style.opacity = '0';
            }
        }
    }
    
    // Toast bildirimleri için CSS ekleme
    const style = document.createElement('style');
    style.textContent = `
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        }
        
        .toast {
            min-width: 250px;
            margin-bottom: 10px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            color: white;
            font-weight: 500;
            transform: translateX(120%);
            transition: transform 0.3s ease;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .toast.success {
            background-color: #4CAF50;
        }
        
        .toast.error {
            background-color: #F44336;
        }
        
        .toast.info {
            background-color: #2196F3;
        }
    `;
    document.head.appendChild(style);
}); 