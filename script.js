document.addEventListener('DOMContentLoaded', () => {
    // Örnek kullanıcı ve mesaj verileri
    const users = [
        {
            id: 1,
            name: 'Kilian James',
            avatar: 'https://i.pravatar.cc/150?img=3',
            status: 'Active Now',
            lastMessage: 'Hi, I hope you are doing well, yesterday you have gave a pen This very nice',
            lastMessageTime: '4:30 PM',
            isOnline: true,
            isPinned: true,
            unreadCount: 2,
            isTyping: true
        },
        {
            id: 2,
            name: 'Desian Tam',
            avatar: 'https://i.pravatar.cc/150?img=5',
            status: 'Last seen 2h ago',
            lastMessage: 'That sounds great! I will check it out',
            lastMessageTime: '9:16 AM',
            isOnline: false,
            isPinned: false,
            unreadCount: 0,
            isTyping: false
        },
        {
            id: 3,
            name: 'Ahmed Medi',
            avatar: 'https://i.pravatar.cc/150?img=8',
            status: 'Last seen 3h ago',
            lastMessage: 'Wow really Cool 🔥',
            lastMessageTime: '1:15 AM',
            isOnline: false,
            isPinned: false,
            unreadCount: 0,
            isTyping: false
        },
        {
            id: 4,
            name: 'Claudia Maudi',
            avatar: 'https://i.pravatar.cc/150?img=9',
            status: 'Last seen yesterday',
            lastMessage: 'Nice',
            lastMessageTime: '4:30 PM',
            isOnline: false,
            isPinned: false,
            unreadCount: 0,
            isTyping: false
        },
        {
            id: 5,
            name: 'Novita',
            avatar: 'https://i.pravatar.cc/150?img=12',
            status: 'Active Now',
            lastMessage: 'yah nice design',
            lastMessageTime: '4:30 PM',
            isOnline: true,
            isPinned: false,
            unreadCount: 1,
            isTyping: false
        },
        {
            id: 6,
            name: 'Millie Nose',
            avatar: 'https://i.pravatar.cc/150?img=14',
            status: 'Active Now',
            lastMessage: 'Awesome 🔥',
            lastMessageTime: '8:20 PM',
            isOnline: true,
            isPinned: false,
            unreadCount: 1,
            isTyping: false
        },
        {
            id: 7,
            name: 'Ikhsan SD',
            avatar: 'https://i.pravatar.cc/150?img=15',
            status: 'Last seen 3d ago',
            lastMessage: '🎤 Voice message',
            lastMessageTime: 'yesterday',
            isOnline: false,
            isPinned: false,
            unreadCount: 0,
            isTyping: false,
            isVoiceMessage: true
        },
        {
            id: 8,
            name: 'Aditya',
            avatar: 'https://i.pravatar.cc/150?img=20',
            status: 'Active Now',
            lastMessage: 'publish now',
            lastMessageTime: 'yesterday',
            isOnline: true,
            isPinned: false,
            unreadCount: 0,
            isTyping: false
        }
    ];

    // Örnek mesaj verileri - aktif sohbet için
    const activeChat = {
        userId: 1,
        messages: [
            {
                id: 1,
                senderId: 1,
                text: 'Hi, I hope you are doing well, yesterday you have gave a pen This very nice 😊',
                time: '4:30 PM',
                date: 'today',
                status: 'read'
            },
            {
                id: 2,
                senderId: 'me',
                text: 'yes I\'m well. Thank you. I am very happy for this,yesterday you have gave a pen This very nice',
                time: '4:30 PM',
                date: 'today',
                status: 'read'
            },
            {
                id: 3,
                senderId: 1,
                text: 'I am very happy for this,yesterday you have gave a pen This very nice',
                time: '4:30 PM',
                date: 'today',
                status: 'read'
            },
            {
                id: 4,
                senderId: 'me',
                text: 'yes I\'m well. Thank you. I am very happy for this,yesterday you have gave a pen This very nice',
                time: '4:30 PM',
                date: 'today',
                status: 'read'
            },
            {
                id: 5,
                senderId: 1,
                isVoiceMessage: true,
                duration: '1:25',
                time: '4:35 PM',
                date: 'today',
                status: 'read'
            }
        ]
    };

    // DOM elementleri
    const pinnedContactsEl = document.getElementById('pinnedContacts');
    const allContactsEl = document.getElementById('allContacts');
    const chatHeaderEl = document.getElementById('chatHeader');
    const messagesContainerEl = document.getElementById('messagesContainer');
    const messageInputEl = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const searchInputEl = document.getElementById('searchInput');

    // Kişi listesini oluştur
    const renderContacts = () => {
        // Sabitlenmiş kişileri temizle ve yeniden oluştur
        pinnedContactsEl.innerHTML = '';
        
        // Diğer kişileri temizle ve yeniden oluştur
        allContactsEl.innerHTML = '';
        
        // Filtreleme için arama metni al
        const searchText = searchInputEl.value.toLowerCase();
        
        // Kullanıcıları filtrele ve render et
        users.filter(user => user.name.toLowerCase().includes(searchText)).forEach(user => {
            const contactEl = createContactElement(user);
            
            if (user.isPinned) {
                pinnedContactsEl.appendChild(contactEl);
            } else {
                allContactsEl.appendChild(contactEl);
            }
            
            // Aktif sohbet kişisini seç
            if (user.id === activeChat.userId) {
                contactEl.classList.add('active');
            }
            
            // Kişiye tıklama event listener ekle
            contactEl.addEventListener('click', () => {
                // Aktif kişiyi güncelle ve sohbet alanını yeniden render et
                document.querySelectorAll('.contact-item').forEach(el => {
                    el.classList.remove('active');
                });
                contactEl.classList.add('active');
                renderChatHeader(user);
                renderMessages(activeChat.messages, user.id);
            });
        });
    };

    // Kişi elementi oluştur
    const createContactElement = (user) => {
        const contactEl = document.createElement('div');
        contactEl.className = 'contact-item';
        contactEl.dataset.userId = user.id;
        
        contactEl.innerHTML = `
            <div class="contact-avatar">
                <img src="${user.avatar}" alt="${user.name}">
                ${user.isOnline ? '<span class="online-indicator"></span>' : ''}
            </div>
            <div class="contact-info">
                <div class="contact-header">
                    <h4 class="contact-name">${user.name}</h4>
                    <span class="contact-time">${user.lastMessageTime}</span>
                </div>
                <p class="contact-message">
                    ${user.isTyping ? '<span class="typing-indicator">Typing...</span>' :
                    user.isVoiceMessage ? '🎤 Voice message' : user.lastMessage}
                </p>
            </div>
            ${user.unreadCount > 0 ? `<div class="unread-badge">${user.unreadCount}</div>` : ''}
        `;
        
        return contactEl;
    };

    // Sohbet başlığını render et
    const renderChatHeader = (user) => {
        chatHeaderEl.innerHTML = `
            <div class="chat-avatar">
                <img src="${user.avatar}" alt="${user.name}">
            </div>
            <div class="chat-user-info">
                <h3>${user.name}</h3>
                <p>${user.status}</p>
            </div>
            <div class="chat-actions">
                <button class="chat-action-btn">
                    <i class="fas fa-video"></i>
                </button>
                <button class="chat-action-btn">
                    <i class="fas fa-phone-alt"></i>
                </button>
                <button class="chat-action-btn">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        `;
    };

    // Mesajları render et
    const renderMessages = (messages, currentUserId) => {
        messagesContainerEl.innerHTML = '';
        
        messages.forEach(message => {
            const messageEl = document.createElement('div');
            const isSent = message.senderId === 'me';
            messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
            
            if (message.isVoiceMessage) {
                messageEl.innerHTML = `
                    <div class="voice-message">
                        <div class="voice-message-play">
                            <i class="fas fa-play"></i>
                        </div>
                        <div class="voice-message-visualizer">
                            <svg width="150" height="24" viewBox="0 0 150 24">
                                <path d="M0.5,12 L3,12 L5.5,7 L8,18 L10.5,2 L13,22 L15.5,7 L18,12 L20.5,7 L23,18 L25.5,2 L28,22 L30.5,7 L33,12 L35.5,7 L38,18 L40.5,2 L43,22 L45.5,7 L48,12 L50.5,7 L53,18 L55.5,2 L58,22 L60.5,7 L63,12 L65.5,7 L68,18 L70.5,2 L73,22 L75.5,7 L78,12 L80.5,7 L83,18 L85.5,2 L88,22 L90.5,7 L93,12 L95.5,7 L98,18 L100.5,2 L103,22 L105.5,7 L108,12 L110.5,7 L113,18 L115.5,2 L118,22 L120.5,7 L123,12 L125.5,7 L128,18 L130.5,2 L133,22 L135.5,7 L138,12 L140.5,7 L143,18 L145.5,2 L148,22" fill="none" stroke="${isSent ? 'white' : 'white'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </div>
                        <div class="voice-message-time">${message.duration}</div>
                    </div>
                    <div class="message-info">
                        <span>${message.time}</span>
                        ${isSent ? '<i class="fas fa-check-double"></i>' : ''}
                    </div>
                `;
            } else {
                messageEl.innerHTML = `
                    <p>${message.text}</p>
                    <div class="message-info">
                        <span>${message.time}</span>
                        ${isSent ? '<i class="fas fa-check-double"></i>' : ''}
                    </div>
                `;
            }
            
            messagesContainerEl.appendChild(messageEl);
        });
        
        // Otomatik olarak en alttaki mesaja scroll
        messagesContainerEl.scrollTop = messagesContainerEl.scrollHeight;
    };

    // Mesaj gönderme fonksiyonu
    const sendMessage = () => {
        const messageText = messageInputEl.value.trim();
        if (messageText) {
            const newMessage = {
                id: activeChat.messages.length + 1,
                senderId: 'me',
                text: messageText,
                time: getCurrentTime(),
                date: 'today',
                status: 'sent'
            };
            
            activeChat.messages.push(newMessage);
            renderMessages(activeChat.messages, activeChat.userId);
            messageInputEl.value = '';
        }
    };

    // Güncel saat bilgisini döndür
    const getCurrentTime = () => {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    // Event listener'ları ekle
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    searchInputEl.addEventListener('input', renderContacts);

    // İlk yükleme
    renderContacts();
    renderChatHeader(users.find(user => user.id === activeChat.userId));
    renderMessages(activeChat.messages, activeChat.userId);
}); 