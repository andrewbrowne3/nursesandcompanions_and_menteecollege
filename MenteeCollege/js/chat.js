document.addEventListener('DOMContentLoaded', () => {
    const chatPopup = document.getElementById('chat-popup');
    const openChatButton = document.getElementById('open-chat');
    const closeChatButton = document.getElementById('close-chat');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendMessageButton = document.getElementById('send-message');

    let socket;
    const author = "Anonymous";
    const sessionId = crypto.randomUUID();
    const startTime = new Date();

    // Automatically open chat popup after 5 seconds
    setTimeout(() => {
        chatPopup.classList.add('visible');
        openChatButton.style.display = 'none';
        setupWebSocket();
    }, 5000);

    // Open chat manually
    openChatButton.addEventListener('click', () => {
        chatPopup.classList.add('visible');
        openChatButton.style.display = 'none';
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setupWebSocket();
        }
    });

    // Close chat popup
    closeChatButton.addEventListener('click', () => {
        chatPopup.classList.remove('visible');
        openChatButton.style.display = 'block';
        if (socket) socket.close();
    });

    // Set up WebSocket connection to the FAQ agent
    function setupWebSocket() {
        console.log('Establishing WebSocket connection...');
        // Connect through nginx (same host, /ws/chat/ route)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(protocol + '//' + window.location.host + '/ws/chat/');

        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // Handle navigation if the agent wants to send the user to a page
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
            socket.send(JSON.stringify({ message, author }));
            addMessage(message, true, 'You');
            messageInput.value = '';
        } else {
            console.error('WebSocket is not connected');
        }
    }

    // Add a message to the chat display
    function addMessage(text, sent, author) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sent ? 'sent' : 'received');
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <strong>${author}:</strong> ${text}
            </div>
        `;
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
                    socket.send(JSON.stringify({ message: option, author }));
                }
                addMessage(option, true, 'You');
                optionsContainer.remove();
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
            page_path: window.location.pathname,
            timestamp: startTime.toISOString(),
            time_spent: timeSpent,
        };
        console.log('Prepared page data:', pageData);

        if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(pageData)], { type: 'application/json' });
            const success = navigator.sendBeacon('https://api.menteecollege.com/api/track-page/', blob);
            console.log('SendBeacon success:', success);
        } else {
            fetch('https://api.menteecollege.com/api/track-page/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pageData),
                keepalive: true,
            })
            .then(response => console.log('Fetch fallback success:', response))
            .catch(error => console.error('Fetch fallback error:', error));
        }
    }

    window.addEventListener('beforeunload', trackTimeSpent);
});
