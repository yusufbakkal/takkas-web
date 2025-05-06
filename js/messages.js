let selectedUserId = null;
let conversationsData = [];
let currentMessages = [];

document.addEventListener('DOMContentLoaded', () => {
    // Token kontrolü
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        // Token yoksa login sayfasına yönlendir
        window.location.href = '/pages/signin.html';
        return;
    }

    // Son mesajları getir
    fetchLastMessages(token);

    // Kısa aralıklarla son mesajları kontrol et (2 saniye)
    window.messagesInterval = setInterval(() => {
        fetchLastMessages(token);
    }, 2000);

    // Mesaj gönderme işlemi
    const sendButton = document.getElementById('send-button');
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }

    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }

    // 3 nokta menüsü işlevselliği
    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });
        
        // Sayfanın başka bir yerine tıklandığında menüyü kapat
        document.addEventListener('click', () => {
            if (!dropdownMenu.classList.contains('hidden')) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }
    
    // Konuşma silme işlevselliği
    const deleteButton = document.getElementById('delete-conversation-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (selectedUserId) {
                deleteConversation(selectedUserId);
            }
        });
    }
});

async function fetchLastMessages(token) {
    try {
        const response = await fetch('https://takkas-api.onrender.com/api/messages/last-messages', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Mesajlar yüklenirken bir hata oluştu');
        }

        const messages = await response.json();
        
        // Yeni mesaj olup olmadığını kontrol et
        if (conversationsData.length > 0) {
            // Son mesajın ID'si öncekinden farklıysa yeni mesaj gelmiş demektir
            const latestMessage = messages[0];
            const previousLatestMessage = conversationsData[0];
            
            if (latestMessage && previousLatestMessage && 
                latestMessage.id !== previousLatestMessage.id &&
                !selectedUserId) {
                // Seçili bir konuşma yoksa ve yeni mesaj gelmişse bildirim göster
                showNewMessageNotification(latestMessage);
            }
        }
        
        conversationsData = messages;
        renderConversations(messages);
    } catch (err) {
        showError(err.message);
    }
}

function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversations-list');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="px-4 py-3 text-center text-gray-500">
                Henüz mesajınız bulunmuyor.
            </div>
        `;
        return;
    }

    const conversationsHTML = conversations.map(conversation => {
        // İlk harfi almak için
        const initial = conversation.other_user_name.charAt(0).toUpperCase();
        
        // Mesaj içeriğini kısaltma ve emoji desteği
        const shortContent = conversation.content.length > 30 
            ? conversation.content.substring(0, 30) + '...' 
            : conversation.content;

        // Tarih formatını ayarlama
        const date = new Date(conversation.created_at);
        const today = new Date();
        
        let timeStr;
        if (date.toDateString() === today.toDateString()) {
            // Bugün içinse sadece saat
            timeStr = date.toLocaleTimeString('tr-TR', {
                hour: '2-digit', 
                minute: '2-digit'
            });
        } else {
            // Farklı bir gün için tarih
            timeStr = date.toLocaleDateString('tr-TR', {
                day: '2-digit', 
                month: '2-digit'
            });
        }

        return `
            <div class="px-4 py-3 border-b flex items-center hover:bg-gray-50 cursor-pointer ${
                !conversation.is_read ? 'bg-indigo-50' : ''
            }" onclick="selectConversation(${conversation.other_user_id})">
                <div class="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    ${initial}
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold truncate text-gray-800">${conversation.other_user_name}</h3>
                        <span class="text-xs text-gray-500 whitespace-nowrap ml-2">${timeStr}</span>
                    </div>
                    <p class="text-sm text-gray-600 truncate">${shortContent}</p>
                </div>
                ${!conversation.is_read ? '<div class="w-2 h-2 bg-indigo-500 rounded-full ml-2 flex-shrink-0"></div>' : ''}
            </div>
        `;
    }).join('');
    
    conversationsList.innerHTML = conversationsHTML;
}

// Konuşma seçme işlemi
function selectConversation(userId) {
    selectedUserId = userId;
    
    // Görünüm değişikliği
    document.getElementById('no-conversation-selected').classList.add('hidden');
    document.getElementById('conversation-view').classList.remove('hidden');
    
    // Seçilen kullanıcının bilgilerini gösterme
    const selectedConversation = conversationsData.find(c => c.other_user_id === userId);
    if (selectedConversation) {
        document.getElementById('contact-name').textContent = selectedConversation.other_user_name;
        document.getElementById('contact-initial').textContent = selectedConversation.other_user_name.charAt(0).toUpperCase();
    }
    
    // Mesajları yükleme
    fetchConversation(userId);
    
    // Konuşmanın okunduğunu bildir
    markConversationAsRead(userId);
    
    // Konuşma mesajlarını düzenli aralıklarla güncelle (1.5 saniye)
    if (window.conversationInterval) {
        clearInterval(window.conversationInterval);
    }
    
    window.conversationInterval = setInterval(() => {
        if (selectedUserId) {
            fetchConversation(selectedUserId);
        }
    }, 1500);
}

async function fetchConversation(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch(`https://takkas-api.onrender.com/api/messages/conversation/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Mesajlar yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        if (JSON.stringify(currentMessages) !== JSON.stringify(data)) {
            currentMessages = data || [];
            renderMessages(currentMessages);
            scrollToBottom();
        }
    } catch (err) {
        showError(err.message);
    }
}

function renderMessages(messages) {
    const messagesContainer = document.getElementById('messages-container');
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center text-gray-500">
                    <p>Henüz mesaj bulunmuyor.</p>
                    <p class="text-sm mt-2">Sohbete başlamak için aşağıdan mesaj gönderebilirsiniz.</p>
                </div>
            </div>
        `;
        return;
    }

    const messagesHTML = messages.map(message => {
        // is_sender alanını kullan
        const isSentByMe = message.is_sender;
        const date = new Date(message.created_at);
        const timeStr = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="flex ${isSentByMe ? 'justify-end' : 'justify-start'}">
                <div class="chat-bubble ${isSentByMe ? 'sent' : 'received'}">
                    <p>${message.content}</p>
                    <div class="message-time text-right">${timeStr}</div>
                </div>
            </div>
        `;
    }).join('');
    
    messagesContainer.innerHTML = messagesHTML;
}

async function handleSendMessage() {
    if (!selectedUserId) return;
    
    const messageInput = document.getElementById('message-input');
    const content = messageInput.value.trim();
    
    if (!content) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/pages/signin.html';
        return;
    }

    try {
        const response = await fetch('https://takkas-api.onrender.com/api/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receiverId: selectedUserId,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error('Mesaj gönderilirken bir hata oluştu');
        }

        // Başarıyla gönderilen mesajın bilgilerini al
        const sentMessage = await response.json();
        console.log('Mesaj gönderildi:', sentMessage);

        // Mesaj başarıyla gönderildikten sonra formu sıfırla
        messageInput.value = '';
        
        // Görünümü hızlıca güncellemek için yeni mesajı ekle
        // Not: is_sender true olarak ayarlanır çünkü kullanıcı tarafından gönderildi
        if (Array.isArray(currentMessages)) {
            const newMessage = {
                ...sentMessage,
                is_sender: true
            };
            currentMessages.push(newMessage);
            renderMessages(currentMessages);
            scrollToBottom();
        }
        
        // Ardından tüm mesajları güncellemek için isteği yap
        fetchConversation(selectedUserId);
        
        // Son mesajlar listesini güncelle
        fetchLastMessages(token);
    } catch (err) {
        showError(err.message);
    }
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showError(errorMessage) {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
        messagesContainer.innerHTML = `
            <div class="bg-red-50 border border-red-200 text-red-700 p-4 rounded m-4">
                <strong class="font-bold">Hata!</strong>
                <span class="block sm:inline ml-1">${errorMessage}</span>
            </div>
        `;
    }
}

// Konuşma silme fonksiyonu
async function deleteConversation(userId) {
    if (!confirm('Bu konuşmayı silmek istediğinize emin misiniz?')) {
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch(`https://takkas-api.onrender.com/api/messages/conversation/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Konuşma silinirken bir hata oluştu');
        }

        // Silme işlemi başarılı olduysa ana görünüme dön
        document.getElementById('conversation-view').classList.add('hidden');
        document.getElementById('no-conversation-selected').classList.remove('hidden');
        selectedUserId = null;
        
        // Son mesajlar listesini güncelle
        fetchLastMessages(token);
        
        // Bildirim göster
        showNotification('Konuşma başarıyla silindi');
    } catch (err) {
        showError(err.message);
    }
}

// Bildirimi gösterme
function showNotification(message, type = 'success') {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-indigo-600';
    
    const notificationElement = document.createElement('div');
    notificationElement.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-500`;
    notificationElement.textContent = message;
    
    document.body.appendChild(notificationElement);
    
    // 3 saniye sonra bildirimi kaldır
    setTimeout(() => {
        notificationElement.classList.add('opacity-0');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 500);
    }, 3000);
}

// Konuşmayı okundu olarak işaretle
async function markConversationAsRead(userId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const response = await fetch(`https://takkas-api.onrender.com/api/messages/mark-read/${userId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Mesajlar okundu olarak işaretlenirken hata oluştu');
        }
        
        // Son mesajlar listesini güncelle
        fetchLastMessages(token);
    } catch (err) {
        console.error('Okundu işaretleme hatası:', err);
    }
}

// Yeni mesaj bildirimi göster
function showNewMessageNotification(message) {
    const senderName = message.other_user_name || 'Kullanıcı';
    const messageContent = message.content.length > 30 
        ? message.content.substring(0, 30) + '...' 
        : message.content;
    
    const notificationElement = document.createElement('div');
    notificationElement.className = 'fixed top-4 right-4 bg-indigo-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-start cursor-pointer transition-opacity duration-500';
    notificationElement.innerHTML = `
        <div class="mr-3 w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
            ${senderName.charAt(0).toUpperCase()}
        </div>
        <div class="flex-grow">
            <p class="font-semibold">${senderName}</p>
            <p class="text-sm">${messageContent}</p>
        </div>
        <button class="ml-3 text-white hover:text-indigo-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Bildirimi tıklayınca konuşmayı aç
    notificationElement.addEventListener('click', function(e) {
        // Kapatma düğmesine tıklanmadıysa
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
            selectConversation(message.other_user_id);
            this.remove();
        }
    });
    
    // Kapatma düğmesine tıklayınca bildirimi kapat
    const closeButton = notificationElement.querySelector('button');
    closeButton.addEventListener('click', function(e) {
        e.stopPropagation();
        notificationElement.classList.add('opacity-0');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 500);
    });
    
    document.body.appendChild(notificationElement);
    
    // 5 saniye sonra bildirimi kaldır
    setTimeout(() => {
        notificationElement.classList.add('opacity-0');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 500);
    }, 5000);
}

// Sayfa kapatıldığında interval'i temizle
window.addEventListener('beforeunload', () => {
    if (window.messagesInterval) {
        clearInterval(window.messagesInterval);
    }
    if (window.conversationInterval) {
        clearInterval(window.conversationInterval);
    }
}); 