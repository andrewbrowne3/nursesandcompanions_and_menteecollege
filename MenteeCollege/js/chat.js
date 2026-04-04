document.addEventListener('DOMContentLoaded', () => {
    const chatPopup = document.getElementById('chat-popup');  // Chat container
    const openChatButton = document.getElementById('open-chat');  // Button to open chat
    const closeChatButton = document.getElementById('close-chat');  // Button to close chat
    const messagesContainer = document.getElementById('messages');  // Message display area
    const messageInput = document.getElementById('message-input');  // Input field for user message
    const sendMessageButton = document.getElementById('send-message');  // Button to send a message

    let socket;  // WebSocket variable
    const author = "Anonymous";  // Default author name (can be customized)
    const sessionId = crypto.randomUUID();  // Generate a session ID
    const startTime = new Date();  // Track the time when the page loads

    // Automatically open chat popup after 5 seconds
    setTimeout(() => {
        chatPopup.classList.add('visible');  // Show chat popup
        openChatButton.style.display = 'none';  // Hide "open chat" button
        setupWebSocket();  // Establish WebSocket connection
    }, 5000);

    // Open chat manually
    openChatButton.addEventListener('click', () => {
        chatPopup.classList.add('visible');  // Show chat
        openChatButton.style.display = 'none';  // Hide open button
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            setupWebSocket();  // Establish WebSocket connection if not already open
        }
    });

    // Close chat popup
    closeChatButton.addEventListener('click', () => {
        chatPopup.classList.remove('visible');  // Hide chat popup
        openChatButton.style.display = 'block';  // Show open button
        if (socket) socket.close();  // Close WebSocket connection
    });

    // Set up WebSocket connection
    function setupWebSocket() {
        console.log('Establishing WebSocket connection...');
        socket = new WebSocket('wss://api.menteecollege.com/ws/chatroom/');

        // When WebSocket is successfully opened
        socket.onopen = () => {
            console.log('WebSocket connection established');
        };

        // Handle incoming messages
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "bot_message" && data.options) {
                addOptionButtons(data.message, data.options);  // Display options as buttons
            } else {
                addMessage(data.message, false, data.author || 'Mentee College');
            }
        };

        socket.onerror = (error) => console.error('WebSocket error:', error);
        socket.onclose = () => console.log('WebSocket connection closed');
    }

    // Send a message via WebSocket
    sendMessageButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message === '') return;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ message, author }));
            addMessage(message, true, 'You');
            messageInput.value = '';
        } else {
            console.error('WebSocket is not connected');
        }
    });

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
        const timeSpent = Math.round((endTime - startTime) / 1000);  // Time spent in seconds
        const pageData = {
            session_id: sessionId,
            page_url: window.location.href,
            page_path: window.location.pathname,
            timestamp: startTime.toISOString(),
            time_spent: timeSpent,
        };
        console.log('Prepared page data:', pageData);

        // Use sendBeacon if available, fallback to fetch
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

    window.addEventListener('beforeunload', trackTimeSpent);  // Track time spent when the page unloads
});
