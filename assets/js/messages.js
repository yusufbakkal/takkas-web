let selectedUserId = null;
let conversationsData = [];
let currentMessages = [];
let searchInput = null;

function setInitialLayout() {
    const conversationsListPanel = document.getElementById('conversations-list-panel');
    const conversationContainer = document.getElementById('conversation-container');
    const noConversationSelected = document.getElementById('no-conversation-selected');
    const conversationView = document.getElementById('conversation-view');

    if (window.innerWidth < 640) { // Mobil
        conversationsListPanel.classList.remove('hidden');
        conversationsListPanel.classList.add('flex');
        conversationContainer.classList.add('hidden');
        conversationContainer.classList.remove('flex');
    } else { // Masaüstü
        conversationsListPanel.classList.remove('hidden');
        conversationsListPanel.classList.add('flex');
        conversationContainer.classList.remove('hidden');
        conversationContainer.classList.add('flex');
        
        if (!selectedUserId) {
            noConversationSelected.classList.remove('hidden');
            noConversationSelected.classList.add('flex');
            conversationView.classList.add('hidden');
            conversationView.classList.remove('flex');
        } else {
            noConversationSelected.classList.add('hidden');
            noConversationSelected.classList.remove('flex');
            conversationView.classList.remove('hidden');
            conversationView.classList.add('flex');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/pages/signin.html';
        return;
    }

    setInitialLayout(); 
    window.addEventListener('resize', setInitialLayout); 

    searchInput = document.getElementById('conversation-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleConversationSearch);
    }

    fetchLastMessages(token);
    window.messagesInterval = setInterval(() => fetchLastMessages(token), 3000);

    const sendButton = document.getElementById('send-button');
    if (sendButton) sendButton.addEventListener('click', handleSendMessage);

    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSendMessage());
        messageInput.addEventListener('focus', () => {
            setTimeout(() => {
                messageInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        });
    }

    const mobileBackButton = document.getElementById('mobile-back-to-list');
    if (mobileBackButton) {
        mobileBackButton.addEventListener('click', () => {
            document.getElementById('conversation-container').classList.add('hidden');
            document.getElementById('conversation-container').classList.remove('flex');
            document.getElementById('conversations-list-panel').classList.remove('hidden');
            document.getElementById('conversations-list-panel').classList.add('flex');
            selectedUserId = null;
            if (window.conversationInterval) clearInterval(window.conversationInterval);
        });
    }

    const audioContainer = document.getElementById('audio-message-container');
    const cancelAudioBtn = document.getElementById('cancel-audio-btn');
    const sendAudioBtn = document.getElementById('send-audio-btn');
    
    if (sendButton) {
        let pressTimer;
        let isRecording = false;
        
        sendButton.addEventListener('mousedown', (e) => {
            pressTimer = setTimeout(() => {
                startRecording();
            }, 500);
        });
        
        sendButton.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
            if (!isRecording) {
                // Normal click handled by existing event listener
            }
        });
        
        sendButton.addEventListener('mouseleave', () => {
            clearTimeout(pressTimer);
        });
        
        if (cancelAudioBtn) {
            cancelAudioBtn.addEventListener('click', () => {
                stopRecording(true);
            });
        }
        
        if (sendAudioBtn) {
            sendAudioBtn.addEventListener('click', () => {
                stopRecording(false);
                simulateSendAudioMessage();
            });
        }
        
        function startRecording() {
            isRecording = true;
            if (audioContainer) {
                audioContainer.classList.remove('hidden');
                let seconds = 0;
                let minutes = 0;
                window.audioTimer = setInterval(() => {
                    seconds++;
                    if (seconds >= 60) {
                        minutes++;
                        seconds = 0;
                    }
                    document.getElementById('audio-time').textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
                }, 1000);
            }
        }
        
        function stopRecording(isCancelled) {
            isRecording = false;
            if (audioContainer) {
                audioContainer.classList.add('hidden');
                if (window.audioTimer) {
                    clearInterval(window.audioTimer);
                }
                document.getElementById('audio-time').textContent = '0:00';
            }
        }
        
        function simulateSendAudioMessage() {
            if (!selectedUserId) return;
            const token = localStorage.getItem('authToken');
            if (!token) return;
            const fakeAudioMessage = {
                content: 'audio:message', 
                created_at: new Date().toISOString(),
                is_sender: true,
                message_id: Math.floor(Math.random() * 10000),
                receiver_id: selectedUserId,
                sender_id: null 
            };
            currentMessages.push(fakeAudioMessage);
            renderMessages(currentMessages);
            scrollToBottom();
        }
    }

    const menuButton = document.getElementById('menu-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (menuButton && dropdownMenu) {
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            if (!dropdownMenu.classList.contains('hidden')) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }
    
    const deleteButton = document.getElementById('delete-conversation-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            if (selectedUserId) {
                deleteConversation(selectedUserId);
            }
        });
    }
});

function handleConversationSearch() {
    applyCurrentSearchFilterAndRender();
}

function applyCurrentSearchFilterAndRender() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    if (!conversationsData || conversationsData.length === 0) {
        renderConversations([]); 
        return;
    }
    if (searchTerm === "") {
        renderConversations(conversationsData); 
    } else {
        const filteredConversations = conversationsData.filter(conversation =>
            conversation.other_user_name.toLowerCase().includes(searchTerm)
        );
        renderConversations(filteredConversations);
    }
}

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
            throw new Error('Mesajlar yüklenirken bir hata oluştu. Durum: ' + response.status);
        }
        const newApiMessages = await response.json();
        if (conversationsData && conversationsData.length > 0 && newApiMessages.length > 0) {
            const latestNewMessage = newApiMessages[0];
            let maxOldTimestamp = 0;
            if (conversationsData.length > 0) {
                const validConversations = conversationsData.filter(c => c.created_at);
                if (validConversations.length > 0) {
                    maxOldTimestamp = Math.max(...validConversations.map(c => new Date(c.created_at).getTime()));
                }
            }
            if (latestNewMessage.created_at) {
                const latestNewMessageTimestamp = new Date(latestNewMessage.created_at).getTime();
                if (latestNewMessageTimestamp > maxOldTimestamp &&
                    (!selectedUserId || selectedUserId !== latestNewMessage.other_user_id) &&
                    !latestNewMessage.is_sender) {
                    // showNewMessageNotification(latestNewMessage);
                }
            }
        }
        conversationsData = newApiMessages; 
        applyCurrentSearchFilterAndRender();
    } catch (err) {
        console.error("fetchLastMessages Hata:", err);
        showErrorInConversationList(err.message);
    }
}

function renderConversations(conversations) {
    const conversationsList = document.getElementById('conversations-list');
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="px-4 py-3 text-center text-gray-500">
                ${searchInput && searchInput.value.trim() !== "" ? 'Aramanızla eşleşen konuşma bulunamadı.' : 'Henüz mesajınız bulunmuyor.'}
            </div>
        `;
        return;
    }
    const conversationsHTML = conversations.map((conversation, index) => {
        const initial = conversation.other_user_name.charAt(0).toUpperCase();
        let shortContent = '';
        if (conversation.content) {
            if (conversation.content.startsWith('audio:')) {
                shortContent = '<i class="fas fa-microphone text-xs mr-1"></i> Ses Kaydı';
            } else {
                shortContent = conversation.content.length > 30 
                    ? conversation.content.substring(0, 30) + '...' 
                    : conversation.content;
            }
        }
        const date = new Date(conversation.created_at);
        const today = new Date();
        let timeStr;
        if (date.toDateString() === today.toDateString()) {
            timeStr = date.toLocaleTimeString('tr-TR', {
                hour: '2-digit', 
                minute: '2-digit'
            });
        } else {
            timeStr = date.toLocaleDateString('tr-TR', {
                day: '2-digit', 
                month: '2-digit'
            });
        }
        const isSelected = selectedUserId === conversation.other_user_id;
        return `
            <div class="px-4 py-3 border-b flex items-center cursor-pointer ${
                !conversation.is_read ? 'bg-indigo-50' : ''
            } ${
                isSelected ? 'bg-indigo-100' : ''
            }" onclick="selectConversation(${conversation.other_user_id})">
                <div class="relative">
                    <div class="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        ${initial}
                    </div>
                    ${conversation.is_active ? '<span class="absolute bottom-0 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>' : ''} 
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold truncate text-gray-800">${conversation.other_user_name}</h3>
                        <div class="flex items-center">
                            <span class="text-xs text-gray-500 whitespace-nowrap ml-2">${timeStr}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-600 truncate">${shortContent}</p>
                        ${!conversation.is_read ? '<div class="w-2 h-2 bg-indigo-500 rounded-full ml-2 flex-shrink-0"></div>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    conversationsList.innerHTML = conversationsHTML;
}

function selectConversation(userId) {
    selectedUserId = userId;
    const conversationsListPanel = document.getElementById('conversations-list-panel');
    const conversationContainer = document.getElementById('conversation-container');
    const noConversationSelected = document.getElementById('no-conversation-selected');
    const conversationView = document.getElementById('conversation-view');
    noConversationSelected.classList.add('hidden');
    noConversationSelected.classList.remove('flex');
    conversationView.classList.remove('hidden');
    conversationView.classList.add('flex');
    if (window.innerWidth < 640) { 
        conversationsListPanel.classList.add('hidden');
        conversationsListPanel.classList.remove('flex');
        conversationContainer.classList.remove('hidden');
        conversationContainer.classList.add('flex');
    } else {
        conversationsListPanel.classList.remove('hidden'); 
        conversationsListPanel.classList.add('flex');
        conversationContainer.classList.remove('hidden'); 
        conversationContainer.classList.add('flex');
    }
    const selectedConvData = conversationsData.find(c => c.other_user_id === userId);
    if (selectedConvData) {
        document.getElementById('contact-name').textContent = selectedConvData.other_user_name;
    }
    fetchConversation(userId);
    markConversationAsRead(userId);
    if (window.conversationInterval) clearInterval(window.conversationInterval);
    window.conversationInterval = setInterval(() => selectedUserId && fetchConversation(selectedUserId), 1500);
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
    const messagesHTML = [];
    let currentDate = '';
    messages.forEach((message, index) => {
        const messageDate = new Date(message.created_at);
        const formattedDate = messageDate.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        if (formattedDate !== currentDate) {
            currentDate = formattedDate;
            messagesHTML.push(`
                <div class="message-date-divider">
                    <span>${formattedDate}</span>
                </div>
            `);
        }
        const timeStr = messageDate.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const isSentByMe = message.is_sender;
        const bubbleClass = isSentByMe ? 'sent' : 'received';
        const alignClass = isSentByMe ? 'items-end' : 'items-start';
        if (message.content && message.content.startsWith('audio:')) {
            messagesHTML.push(`
                <div class="flex flex-col ${alignClass} mb-3">
                    <div class="audio-message ${bubbleClass}">
                        <div class="audio-play-button">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="audio-waveform">
                            <div class="w-1 h-3 mx-0.5"></div> <div class="w-1 h-4 mx-0.5"></div> <div class="w-1 h-6 mx-0.5"></div>
                            <div class="w-1 h-5 mx-0.5"></div> <div class="w-1 h-3 mx-0.5"></div> <div class="w-1 h-4 mx-0.5"></div>
                            <div class="w-1 h-7 mx-0.5"></div> <div class="w-1 h-5 mx-0.5"></div> <div class="w-1 h-3 mx-0.5"></div>
                            <div class="w-1 h-2 mx-0.5"></div>
                        </div>
                        <span class="audio-time">1:25</span>
                    </div>
                    <div class="message-status text-xs">
                        ${timeStr} ${isSentByMe ? '<i class="fas fa-check-double"></i>' : ''}
                    </div>
                </div>
            `);
        } else {
            messagesHTML.push(`
                <div class="flex flex-col ${alignClass} mb-3">
                    <div class="chat-bubble ${bubbleClass}">
                        <p>${message.content}</p>
                    </div>
                    <div class="message-status text-xs">
                        ${timeStr} ${isSentByMe ? '<i class="fas fa-check-double"></i>' : ''}
                    </div>
                </div>
            `);
        }
    });
    messagesContainer.innerHTML = messagesHTML.join('');
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
        const sentMessage = await response.json();
        messageInput.value = '';
        if (Array.isArray(currentMessages)) {
            const newMessage = {
                ...sentMessage,
                is_sender: true
            };
            currentMessages.push(newMessage);
            renderMessages(currentMessages);
            scrollToBottom();
        }
        fetchConversation(selectedUserId);
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
        document.getElementById('conversation-view').classList.add('hidden');
        document.getElementById('no-conversation-selected').classList.remove('hidden');
        selectedUserId = null;
        fetchLastMessages(token);
        showNotification('Konuşma başarıyla silindi');
    } catch (err) {
        showError(err.message);
    }
}

function showNotification(message, type = 'success') {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-indigo-600';
    const notificationElement = document.createElement('div');
    notificationElement.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-500`;
    notificationElement.textContent = message;
    document.body.appendChild(notificationElement);
    setTimeout(() => {
        notificationElement.classList.add('opacity-0');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 500);
    }, 3000);
}

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
        fetchLastMessages(token);
    } catch (err) {
        console.error('Okundu işaretleme hatası:', err);
    }
}

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
    notificationElement.addEventListener('click', function(e) {
        if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'I') {
            selectConversation(message.other_user_id);
            this.remove();
        }
    });
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
    setTimeout(() => {
        notificationElement.classList.add('opacity-0');
        setTimeout(() => {
            if (notificationElement.parentElement) {
                notificationElement.parentElement.removeChild(notificationElement);
            }
        }, 500);
    }, 5000);
}

window.addEventListener('beforeunload', () => {
    if (window.messagesInterval) {
        clearInterval(window.messagesInterval);
    }
    if (window.conversationInterval) {
        clearInterval(window.conversationInterval);
    }
});

function showErrorInConversationList(errorMessage) {
    const conversationsList = document.getElementById('conversations-list');
    if (conversationsList) {
        conversationsList.innerHTML = `
            <div class="px-4 py-3 text-center text-red-600">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Mesajlar yüklenemedi: ${errorMessage}
            </div>
        `;
    }
} 