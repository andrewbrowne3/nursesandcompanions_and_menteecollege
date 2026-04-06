document.addEventListener('DOMContentLoaded', () => {
    const chatPopup = document.getElementById('chat-popup');
    const openChatButton = document.getElementById('open-chat');
    const closeChatButton = document.getElementById('close-chat');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-message');

    let socket;
    let chatOpened = false;
    const author = "Anonymous";
    const sessionId = crypto.randomUUID();
    const startTime = new Date();
    const currentPage = window.location.pathname;

    function openChat() {
        if (chatOpened) return;
        chatOpened = true;
        chatPopup.classList.add('visible');
        openChatButton.style.display = 'none';
        setupWebSocket();
    }

    // Automatically open chat popup after 5 seconds
    setTimeout(openChat, 5000);

    // Open chat manually
    openChatButton.addEventListener('click', () => {
        if (!chatOpened) {
            openChat();
        } else {
            // Reopen — just show existing conversation
            chatPopup.classList.add('visible');
            openChatButton.style.display = 'none';
        }
    });

    // Close chat popup (just hide it, keep connection alive)
    closeChatButton.addEventListener('click', () => {
        chatPopup.classList.remove('visible');
        openChatButton.style.display = 'block';
    });

    // Set up WebSocket connection to the FAQ agent
    function setupWebSocket() {
        console.log('Establishing WebSocket connection...');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(protocol + '//' + window.location.host + '/ws/chat/');

        socket.onopen = () => {
            console.log('WebSocket connection established');
            // Send current page context as first message
            socket.send(JSON.stringify({ page: currentPage }));
            // Show typing indicator for incoming greeting
            showTypingIndicator();
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Show typing dots for at least 3 seconds before revealing message
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();

                if (data.navigate_to) {
                    addMessage(data.message, false, 'Mentee College');
                    setTimeout(() => {
                        window.location.href = data.navigate_to;
                    }, 2000);
                    return;
                }

                if (data.type === "bot_message" && data.options) {
                    addOptionButtons(data.message, data.options);
                } else {
                    addMessage(data.message, false, data.author || 'Mentee College');
                }
            }, 3000);
        };

        socket.onerror = (error) => console.error('WebSocket error:', error);
        socket.onclose = () => console.log('WebSocket connection closed');
    }

    // Send a message via WebSocket
    sendMessageButton.addEventListener('click', () => {
        sendUserMessage();
    });

    // Send on Enter key (Shift+Enter for new line)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });

    function sendUserMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ message, author, page: currentPage }));
            addMessage(message, true, 'You');
            messageInput.value = '';
            showTypingIndicator();
        } else {
            console.error('WebSocket is not connected');
        }
    }

    // Typing indicator
    function showTypingIndicator() {
        const existing = document.getElementById('typing-indicator');
        if (existing) return;

        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('message', 'received');
        typingDiv.innerHTML = '<div class="message-bubble typing-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    // Add a message to the chat display
    function addMessage(text, sent, author) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sent ? 'sent' : 'received');
        messageDiv.innerHTML = '<div class="message-bubble"><strong>' + author + ':</strong> ' + text + '</div>';
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Add clickable buttons for guided options
    function addOptionButtons(question, options) {
        addMessage(question, false, 'Mentee College');
        const optionsContainer = document.createElement('div');
        optionsContainer.style.display = 'flex';
        optionsContainer.style.flexWrap = 'wrap';
        optionsContainer.style.marginTop = '10px';
        options.forEach((option) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.style.backgroundColor = '#007bff';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.padding = '10px 20px';
            button.style.margin = '5px';
            button.style.borderRadius = '17px';
            button.style.cursor = 'pointer';
            button.style.fontSize = '14px';
            button.style.transition = 'background-color 0.3s, transform 0.2s';

            button.onmouseover = () => (button.style.backgroundColor = '#0056b3');
            button.onmouseout = () => (button.style.backgroundColor = '#007bff');

            button.addEventListener('click', () => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ message: option, author, page: currentPage }));
                }
                addMessage(option, true, 'You');
                optionsContainer.remove();
                showTypingIndicator();
            });
            optionsContainer.appendChild(button);
        });
        messagesContainer.appendChild(optionsContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Track time spent on the page
    function trackTimeSpent() {
        const endTime = new Date();
        const timeSpent = Math.round((endTime - startTime) / 1000);
        const pageData = {
            session_id: sessionId,
            page_url: window.location.href,
            page_path: currentPage,
            timestamp: startTime.toISOString(),
            time_spent: timeSpent,
        };

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(pageData)], { type: 'application/json' });
            navigator.sendBeacon('https://api.menteecollege.com/api/track-page/', blob);
        }
    }

    window.addEventListener('beforeunload', trackTimeSpent);
});
