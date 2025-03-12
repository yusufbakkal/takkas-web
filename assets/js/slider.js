// Hero Slider için JavaScript
function initSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let currentSlide = 0;
    let slideInterval;

    // Slider'ı otomatik olarak başlat
    startSlider();

    // Slider'ı başlat
    function startSlider() {
        // Önceki interval'ı temizle
        clearInterval(slideInterval);
        
        // Yeni interval oluştur
        slideInterval = setInterval(() => {
            // Bir sonraki slide'a geç
            currentSlide = (currentSlide + 1) % slides.length;
            updateSlider();
        }, 5000); // 5 saniyede bir değiştir
    }

    // Slider'ı güncelle
    function updateSlider() {
        // Tüm slide'ları gizle
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Tüm dot'ları pasif yap
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Aktif slide'ı göster
        slides[currentSlide].classList.add('active');
        
        // Aktif dot'u işaretle
        dots[currentSlide].classList.add('active');
    }

    // Dot'lara tıklama olayı ekle
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateSlider();
            startSlider(); // Tıklandığında otomatik geçişi sıfırla
        });
    });
}

// Global olarak erişilebilir olması için window nesnesine ekle
window.initSlider = initSlider; 