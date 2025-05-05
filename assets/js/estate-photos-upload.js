/**
 * İlan Fotoğraf Yükleme İşlemleri
 * Bu dosya, emlak ve arsa ilanı fotoğraf yükleme adımını yönetir.
 * Cloudinary'ye fotoğrafları yükler ve ardından API üzerinden ilana bağlar.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Header ve Footer bileşenlerini yükle
    loadComponents();

    // Kullanıcının giriş yapmış olduğunu kontrol et
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        showAuthError();
        return;
    }

    // URL'den ilan ID'sini ve türünü al
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('id');
    const listingType = urlParams.get('type') || 'estate'; // varsayılan olarak estate
    
    if (!listingId) {
        showListingError();
        return;
    }

    console.log('İlan yükleme sayfası başlatılıyor:', listingId, listingType);

    // Sayfa başlığını ilan türüne göre güncelle
    updatePageTitle(listingType);
    
    // Yüklenen fotoğrafları saklamak için dizi
    const uploadedPhotos = [];
    
    try {
        // Dropzone yapılandırması
        const dropzone = initializeDropzone(listingId, listingType, authToken, uploadedPhotos);
        
        // Buton tıklaması için dinleyici, her zaman görünür olmasını sağla
        const uploadBtn = document.getElementById('photoUploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function(e) {
                console.log('Fotoğraf yükleme butonu tıklandı');
                e.stopPropagation(); // Olay yayılımını durdur
                
                try {
                    if (dropzone && dropzone.hiddenFileInput) {
                        dropzone.hiddenFileInput.click();
                    } else {
                        console.warn('Dropzone dosya seçicisi bulunamadı, alternatif yöntem kullanılacak');
                        // Alternatif dosya seçici oluştur
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = true;
                        input.accept = '.jpg,.jpeg,.png';
                        input.click();
                        
                        // Dosya seçildiğinde
                        input.onchange = function() {
                            if (input.files && input.files.length) {
                                // Seçilen dosyaları Dropzone'a ekle
                                for (let i = 0; i < input.files.length; i++) {
                                    dropzone.addFile(input.files[i]);
                                }
                            }
                        };
                    }
                } catch (error) {
                    console.error('Dosya seçici açılırken hata:', error);
                }
            });
        }
        
    } catch (error) {
        console.error('Dropzone başlatılırken hata oluştu:', error);
    }
    
    // Geri butonuna tıklama
    document.getElementById('backButton').addEventListener('click', function() {
        window.history.back();
    });
});

/**
 * Sayfa başlığını ilan türüne göre günceller
 * @param {string} listingType - İlan türü (estate, land, vb.)
 */
function updatePageTitle(listingType) {
    const pageTitle = document.getElementById('pageTitle');
    const sectionTitle = document.getElementById('sectionTitle');
    
    let title = "İlan Fotoğrafları";
    
    if (listingType === 'estate') {
        title = "Emlak İlanı Fotoğrafları";
    } else if (listingType === 'land') {
        title = "Arsa İlanı Fotoğrafları";
    }
    
    if (pageTitle) pageTitle.textContent = title;
    if (sectionTitle) sectionTitle.textContent = title;
    
    // Sayfa başlığını da güncelle
    document.title = title + " - TAKKAS";
}

/**
 * Bileşenleri yükler (Header ve Footer)
 */
function loadComponents() {
    fetch('components/header.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('header-component').innerHTML = data;
        });

    fetch('components/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-component').innerHTML = data;
        });
}

/**
 * Kullanıcı girişi hata mesajını gösterir ve yönlendirir
 */
function showAuthError() {
    alert('İlan verebilmek için giriş yapmanız gerekmektedir. Giriş sayfasına yönlendiriliyorsunuz.');
    window.location.href = 'pages/signin.html';
}

/**
 * İlan bulunamadı hata mesajını gösterir ve yönlendirir
 */
function showListingError() {
    alert('Geçerli bir ilan bulunamadı. Ana sayfaya yönlendiriliyorsunuz.');
    window.location.href = 'index.html';
}

/**
 * Dropzone'u ayarlar ve olay dinleyicileri ekler
 * @param {string} listingId - İlan ID'si
 * @param {string} listingType - İlan türü (estate, land)
 * @param {string} authToken - Kullanıcı yetkilendirme token'ı
 * @param {Array} uploadedPhotos - Yüklenen fotoğrafları saklamak için dizi
 */
function initializeDropzone(listingId, listingType, authToken, uploadedPhotos) {
    try {
        // Önce eski bir Dropzone örneği varsa kaldır
        if (Dropzone.instances && Dropzone.instances.length > 0) {
            Dropzone.instances.forEach(instance => {
                if (instance.element.id === 'photoDropzone') {
                    instance.destroy();
                    console.log('Eski Dropzone örneği kaldırıldı');
                }
            });
        }
        
        // Dropzone otomatik bulma özelliğini devre dışı bırak
        Dropzone.autoDiscover = false;
        
        // Dropzone'un yüklenmemiş olma ihtimaline karşı kontrol
        if (typeof Dropzone === 'undefined') {
            console.error('Dropzone kütüphanesi yüklenemedi! Alternatif yöntem kullanılacak.');
            setupAlternativeUpload(listingId, listingType, authToken, uploadedPhotos);
            return null;
        }
        
        const photoDropzone = new Dropzone("#photoDropzone", {
            url: `https://api.cloudinary.com/v1_1/dzfozycq8/upload`,
            paramName: "file",
            maxFilesize: 5, // MB
            acceptedFiles: ".jpeg,.jpg,.png",
            maxFiles: 15,
            addRemoveLinks: true,
            autoProcessQueue: false,
            uploadMultiple: false,
            createImageThumbnails: true,
            thumbnailMethod: "contain",
            clickable: true, // Sadece tüm dropzone alanını tıklanabilir yap, buton için özel kontrol ekledik
            dictRemoveFile: "Kaldır",
            dictCancelUpload: "İptal",
            dictDefaultMessage: "Fotoğrafları buraya sürükleyin veya tıklayın",
            
            init: function() {
                const dropzone = this;
                const saveButton = document.getElementById('saveButton');
                const uploadBtn = document.getElementById('photoUploadBtn');
                
                // Fotoğraf yükleme butonunu her zaman görünür yap
                const dzMessage = document.querySelector('.dz-message');
                if (dzMessage) {
                    dzMessage.style.display = 'flex';
                    dzMessage.style.flexDirection = 'column';
                    dzMessage.style.alignItems = 'center';
                    dzMessage.style.justifyContent = 'center';
                }
                
                // Fotoğraf eklendiğinde
                this.on("addedfile", function(file) {
                    console.log("Dosya eklendi:", file.name);
                    
                    // Yükleme butonunu etkinleştir
                    if (dropzone.files.length > 0) {
                        saveButton.disabled = false;
                    }
                    
                    // Fotoğraf yükleme butonunu her zaman görünür tut
                    if (dzMessage) {
                        dzMessage.style.display = 'flex';
                    }
                    
                    // Dosyaları photosGrid'de görüntüle
                    updatePhotosGrid(dropzone.files);
                });
                
                // Dosya kaldırıldığında
                this.on("removedfile", function() {
                    if (dropzone.files.length === 0) {
                        saveButton.disabled = true;
                    }
                    
                    // Dosyaları photosGrid'de güncelle
                    updatePhotosGrid(dropzone.files);
                });
                
                // Kaydet butonuna tıklandığında
                saveButton.addEventListener('click', function() {
                    if (dropzone.files.length === 0) {
                        alert('Lütfen en az bir fotoğraf yükleyin.');
                        return;
                    }
                    
                    // Modal'ı göster ve yükleme işlemini başlat
                    showUploadingModal(dropzone);
                    processNextFile(0, dropzone, listingId, listingType, authToken, uploadedPhotos);
                });
                
                // Dropzone CSS değişikliklerini geçersiz kılmak için özelleştirme
                dropzone.on("reset", function() {
                    if (dzMessage) {
                        dzMessage.style.display = 'flex';
                    }
                });
            }
        });
        
        // Özel CSS sınıfını ekleyerek yükleme butonunu her zaman görünür kılma
        const dropzoneElement = document.getElementById('photoDropzone');
        if (dropzoneElement) {
            dropzoneElement.classList.add('always-show-button');
        }
        
        console.log("Dropzone başarıyla başlatıldı");
        return photoDropzone;
    } catch (error) {
        console.error('Dropzone başlatılırken hata:', error);
        // Alternatif yükleme yöntemini kur
        setupAlternativeUpload(listingId, listingType, authToken, uploadedPhotos);
        return null;
    }
}

/**
 * Dropzone çalışmadığında kullanılacak alternatif yükleme yöntemi
 */
function setupAlternativeUpload(listingId, listingType, authToken, uploadedPhotos) {
    console.log('Alternatif yükleme yöntemi kuruluyor...');
    
    // Dropzone alanını input alanı olarak güncelle
    const dropzoneArea = document.getElementById('photoDropzone');
    if (!dropzoneArea) return;
    
    // Alanı temizle
    dropzoneArea.innerHTML = `
        <div class="dz-message">
            <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
            </div>
            <h3>Fotoğrafları Ekleyin</h3>
            <p>Dosyalarınızı seçmek için aşağıdaki butona tıklayın</p>
            <input type="file" id="manualFileInput" multiple accept=".jpg,.jpeg,.png" style="display:none;">
            <button type="button" id="alternativeUploadBtn" class="upload-btn">
                <i class="fas fa-images"></i> Bilgisayardan Fotoğraf Seç
            </button>
            <div id="manualPreviewArea" class="manual-preview-area"></div>
        </div>
    `;
    
    // Seçilen dosyaları tutacak dizi
    const selectedFiles = [];
    const saveButton = document.getElementById('saveButton');
    
    // Manuel dosya inputu ve butonu
    const fileInput = document.getElementById('manualFileInput');
    const uploadButton = document.getElementById('alternativeUploadBtn');
    const previewArea = document.getElementById('manualPreviewArea');
    
    // Dosya seçme butonunu ayarla
    if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Dosya seçildiğinde
        fileInput.addEventListener('change', function() {
            if (fileInput.files && fileInput.files.length) {
                // Seçilen dosyaları işle
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    selectedFiles.push(file);
                    
                    // Dosyayı önizleme olarak göster
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const preview = document.createElement('div');
                        preview.className = 'manual-preview-item';
                        preview.innerHTML = `
                            <div class="preview-image">
                                <img src="${e.target.result}" alt="${file.name}">
                            </div>
                            <div class="preview-info">
                                <div class="preview-actions">
                                    <button type="button" class="remove-btn" data-index="${selectedFiles.length - 1}">
                                        <i class="fas fa-trash"></i> Kaldır
                                    </button>
                                </div>
                            </div>
                        `;
                        previewArea.appendChild(preview);
                        
                        // Kaydet butonunu etkinleştir
                        saveButton.disabled = false;
                    };
                    reader.readAsDataURL(file);
                }
                
                // Dosyaları photosGrid'de görüntüle
                updatePhotosGrid({ files: selectedFiles });
            }
        });
        
        // Fotoğraf kaldırma işlemini dinle
        document.addEventListener('click', function(e) {
            if (e.target && e.target.closest('.remove-btn')) {
                const button = e.target.closest('.remove-btn');
                const index = parseInt(button.getAttribute('data-index'));
                
                // Dosyayı diziden kaldır
                selectedFiles.splice(index, 1);
                
                // Önizlemeyi kaldır
                const previewItem = button.closest('.manual-preview-item');
                if (previewItem) {
                    previewItem.remove();
                }
                
                // Eğer dosya kalmadıysa kaydet butonunu devre dışı bırak
                if (selectedFiles.length === 0) {
                    saveButton.disabled = true;
                }
                
                // Dosyaları photosGrid'de güncelle
                updatePhotosGrid({ files: selectedFiles });
            }
        });
        
        // Kaydet butonunu ayarla
        saveButton.addEventListener('click', function() {
            if (selectedFiles.length === 0) {
                alert('Lütfen en az bir fotoğraf yükleyin.');
                return;
            }
            
            // Modal'ı göster
            showUploadingModal({ files: selectedFiles });
            
            // Dosyaları yükle
            uploadManualFiles(0, selectedFiles, listingId, listingType, authToken, uploadedPhotos);
        });
    }
}

/**
 * Yüklenen fotoğrafları grid içinde görüntüler
 * @param {Object} files - Yüklenen dosyalar
 */
function updatePhotosGrid(files) {
    const photosGrid = document.getElementById('photosGrid');
    if (!photosGrid) return;
    
    // Grid'i temizle
    photosGrid.innerHTML = '';
    
    // Files bir dizi değilse (Dropzone objesi olabilir)
    const fileArray = files.files || files;
    
    // Her dosya için bir önizleme öğesi oluştur
    for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // Dosya önizleme öğesi oluştur
        const previewItem = document.createElement('div');
        previewItem.className = 'photo-preview-item';
        
        // Dosyanın önizleme URL'sini al
        let imageUrl;
        if (file.dataURL) {
            // Dropzone dosyası
            imageUrl = file.dataURL;
        } else if (file instanceof File) {
            // Normal dosya, URL.createObjectURL kullan
            imageUrl = URL.createObjectURL(file);
        }
        
        if (imageUrl) {
            previewItem.innerHTML = `
                <div class="preview-image">
                    <img src="${imageUrl}" alt="${file.name || 'Resim'}" />
                </div>
            `;
            photosGrid.appendChild(previewItem);
        }
    }
}

/**
 * Manuel seçilen dosyaları yükle
 */
function uploadManualFiles(index, files, listingId, listingType, authToken, uploadedPhotos) {
    if (index >= files.length) {
        // Tüm dosyalar işlendiyse, tamamlandı mesajını göster ve ilan başarı sayfasına yönlendir
        finishUpload(listingId, listingType);
        return;
    }
    
    const file = files[index];
    const formData = new FormData();
    
    // Cloudinary parametreleri
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('cloud_name', 'dzfozycq8');
    formData.append('folder', `${listingType}-photos`); // İlan türüne göre klasör adı
    
    // Progress bar güncelleme
    const progressBar = document.getElementById('uploadProgressBar');
    const uploadedCount = document.getElementById('uploadedCount');
    
    uploadToCloudinary(formData)
        .then(cloudinaryData => {
            // Cloudinary'den gelen yanıt bilgilerini al
            const photoData = {
                url: cloudinaryData.secure_url,
                public_id: cloudinaryData.public_id,
                description: '',
                is_primary: index === 0, // İlk fotoğraf ana fotoğraf
                order_index: index
            };
            
            // Takkas API'sine fotoğraf bilgilerini gönder
            return savePhotoToAPI(listingId, listingType, photoData, authToken);
        })
        .then(data => {
            // Yüklenen fotoğraf bilgilerini diziye ekle
            uploadedPhotos.push(data);
            
            // Progress bar ve sayaç güncelleme
            updateProgressBar(index, files.length, progressBar, uploadedCount);
            
            // Sonraki dosyayı işle
            uploadManualFiles(index + 1, files, listingId, listingType, authToken, uploadedPhotos);
        })
        .catch(error => {
            handleUploadError(error);
        });
}

/**
 * Yükleme modalını gösterir ve başlangıç ayarlarını yapar
 * @param {Object} dropzone - Dropzone nesnesi
 */
function showUploadingModal(dropzone) {
    // Modal'ı göster
    const modal = document.getElementById('uploadStatusModal');
    modal.style.display = 'flex';
    
    // Toplam ve yüklenen sayıları güncelle
    document.getElementById('totalCount').textContent = dropzone.files.length;
    document.getElementById('uploadedCount').textContent = '0';
    
    // Progress bar'ı sıfırla
    const progressBar = document.getElementById('uploadProgressBar');
    progressBar.style.width = '0%';
}

/**
 * Sırayla dosyaları işler ve API'ye gönderir
 * @param {number} index - İşlenecek dosya indeksi
 * @param {Object} dropzone - Dropzone nesnesi
 * @param {string} listingId - İlan ID'si
 * @param {string} listingType - İlan türü (estate, land)
 * @param {string} authToken - Kullanıcı yetkilendirme token'ı
 * @param {Array} uploadedPhotos - Yüklenen fotoğrafları saklamak için dizi
 */
function processNextFile(index, dropzone, listingId, listingType, authToken, uploadedPhotos) {
    if (index >= dropzone.files.length) {
        // Tüm dosyalar işlendiyse, tamamlandı mesajını göster ve ilan başarı sayfasına yönlendir
        finishUpload(listingId, listingType);
        return;
    }
    
    const file = dropzone.files[index];
    const formData = new FormData();
    
    // Cloudinary parametreleri
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('cloud_name', 'dzfozycq8');
    formData.append('folder', `${listingType}-photos`); // İlan türüne göre klasör adı
    
    // Progress bar güncelleme
    const progressBar = document.getElementById('uploadProgressBar');
    const uploadedCount = document.getElementById('uploadedCount');
    
    uploadToCloudinary(formData)
        .then(cloudinaryData => {
            // Cloudinary'den gelen yanıt bilgilerini al
            const photoData = {
                url: cloudinaryData.secure_url,
                public_id: cloudinaryData.public_id,
                description: '',
                is_primary: index === 0, // İlk fotoğraf ana fotoğraf
                order_index: index
            };
            
            // Takkas API'sine fotoğraf bilgilerini gönder
            return savePhotoToAPI(listingId, listingType, photoData, authToken);
        })
        .then(data => {
            // Yüklenen fotoğraf bilgilerini diziye ekle
            uploadedPhotos.push(data);
            
            // Progress bar ve sayaç güncelleme
            updateProgressBar(index, dropzone.files.length, progressBar, uploadedCount);
            
            // Sonraki dosyayı işle
            processNextFile(index + 1, dropzone, listingId, listingType, authToken, uploadedPhotos);
        })
        .catch(error => {
            handleUploadError(error);
        });
}

/**
 * Cloudinary'ye fotoğraf yükler
 * @param {FormData} formData - Yüklenecek dosya verileri
 * @returns {Promise} - Yükleme sonucu
 */
function uploadToCloudinary(formData) {
    return fetch('https://api.cloudinary.com/v1_1/dzfozycq8/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Cloudinary yükleme hatası');
        }
        return response.json();
    });
}

/**
 * Takkas API'sine fotoğraf bilgilerini kaydeder
 * @param {string} listingId - İlan ID'si
 * @param {string} listingType - İlan türü (estate, land)
 * @param {Object} photoData - Fotoğraf verileri
 * @param {string} authToken - Kullanıcı yetkilendirme token'ı
 * @returns {Promise} - Kaydetme sonucu
 */
function savePhotoToAPI(listingId, listingType, photoData, authToken) {
    // Araç ilanı için farklı endpoint, diğerleri için estate endpoint
    let apiUrl;
    if (listingType === 'vehicle') {
        apiUrl = `https://takkas-api.onrender.com/api/listing-photos/url/${listingId}`;
    } else {
        apiUrl = `https://takkas-api.onrender.com/api/estate-photos/estate/url/${listingId}`;
    }
    
    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(photoData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('API fotoğraf kaydetme hatası');
        }
        return response.json();
    });
}

/**
 * Progress bar'ı ve yükleme sayacını günceller
 * @param {number} index - Mevcut dosya indeksi
 * @param {number} totalFiles - Toplam dosya sayısı
 * @param {HTMLElement} progressBar - Progress bar elementi
 * @param {HTMLElement} uploadedCount - Yüklenen dosya sayısı elementi
 */
function updateProgressBar(index, totalFiles, progressBar, uploadedCount) {
    const progress = ((index + 1) / totalFiles) * 100;
    progressBar.style.width = `${progress}%`;
    uploadedCount.textContent = index + 1;
}

/**
 * Yükleme hatalarını işler
 * @param {Error} error - Hata objesi
 */
function handleUploadError(error) {
    console.error('Fotoğraf yükleme hatası:', error);
    alert(`Fotoğraf yüklenirken bir hata oluştu: ${error.message}`);
    
    // Modal'ı kapat
    document.getElementById('uploadStatusModal').style.display = 'none';
}

/**
 * Tüm yüklemeler tamamlandığında çağrılacak fonksiyon
 * @param {string} listingId - İlan ID'si
 * @param {string} listingType - İlan türü (estate, land)
 */
function finishUpload(listingId, listingType) {
    // Modal mesajını güncelle
    document.getElementById('uploadStatusText').textContent = 'Tüm fotoğraflar başarıyla yüklendi!';
    
    // 2 saniye bekleyip ilan başarı sayfasına yönlendir
    setTimeout(() => {
        // İlan başlığını almak için varsa localStorage'dan okuyabiliriz
        const listingTitle = localStorage.getItem('currentListingTitle') || '';
        
        // İlan türüne göre kategori belirle
        const category = 'estate'; // Emlak ve arsa için hep estate
        const type = listingType === 'estate' ? 'apartment' : 'land';
        
        window.location.href = `listing-success.html?id=${listingId}&title=${encodeURIComponent(listingTitle)}&type=${type}&category=${category}`;
    }, 2000);
} 