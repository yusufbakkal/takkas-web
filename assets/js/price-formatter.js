/**
 * Fiyat Formatlama İşlemleri
 * Bu dosya, fiyat girişlerini otomatik olarak formatlayan fonksiyonları içerir.
 */

// Sayfalardaki tüm fiyat inputlarını formatlamak için gerekli event listener'ları ekler
document.addEventListener('DOMContentLoaded', function() {
    // Fiyat formatlaması yapılacak inputları seç
    // Bu seçiciyi formlarınızdaki gerçek fiyat inputlarınıza göre düzenleyin
    const priceInputs = document.querySelectorAll('input[name="price"], input[data-type="price"], .price-input');
    
    // Her bir fiyat inputuna event listener'lar ekle
    priceInputs.forEach(input => {
        input.addEventListener('input', formatPriceAsTyping);
        
        // Sayfa yüklendiğinde mevcut değeri formatla
        if (input.value) {
            input.value = formatPrice(input.value);
        }
    });
});

/**
 * Kullanıcı yazarken fiyatı otomatik formatlar
 * @param {Event} e - Input event
 */
function formatPriceAsTyping(e) {
    const input = e.target;
    
    // Cursor pozisyonunu al
    const cursorPos = input.selectionStart;
    
    // Sadece rakamları tut (nokta ve virgüller olmadan)
    const numericValue = input.value.replace(/[^\d]/g, '');
    
    // Yeni değeri formatla
    const formattedValue = formatPrice(numericValue);
    
    // Orijinal ve formatlanmış değer arasındaki fark
    const lengthDiff = formattedValue.length - input.value.length;
    
    // Input değerini güncelle
    input.value = formattedValue;
    
    // Cursor pozisyonunu ayarla
    const newPos = cursorPos + lengthDiff;
    input.setSelectionRange(newPos, newPos);
}

/**
 * Fiyatı formatlar (1000 -> 1.000)
 * @param {string} price - Formatlanacak fiyat
 * @returns {string} Formatlanmış fiyat
 */
function formatPrice(price) {
    // Boş değer kontrolü
    if (!price) return '';
    
    // Sadece rakamları temizle
    const clean = price.toString().replace(/[^\d]/g, '');
    
    // Binlik ayırıcıları ekle (1000 -> 1.000)
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Form gönderme öncesinde fiyatı temizler (veri tabanına kaydetmek için)
 * @param {string} formattedPrice - Formatlanmış fiyat (ör: 1.000)
 * @returns {string} Temizlenmiş fiyat (ör: 1000)
 */
function cleanPriceForSubmit(formattedPrice) {
    return formattedPrice.replace(/\./g, '');
}

// Global kapsamda fonksiyonları erişilebilir yap
window.formatPrice = formatPrice;
window.cleanPriceForSubmit = cleanPriceForSubmit; 