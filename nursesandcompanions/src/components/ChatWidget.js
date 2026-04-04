import React, { useState, useRef, useEffect } from 'react';
import { Button, Form } from 'react-bootstrap';
import '../styles/ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can we help you today?", sender: "agent" }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // WebSocket connection logic - commented out for future implementation
  /*
  useEffect(() => {
    if (isOpen && !isConnected) {
      // Initialize WebSocket connection
      connectWebSocket();
    }

    return () => {
      // Clean up WebSocket connection if component unmounts
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isOpen, isConnected]);
  */

  // WebSocket connection function - placeholder for future implementation
  const connectWebSocket = () => {
    // This function will be implemented when you're ready to connect to your WebSocket
    console.log('WebSocket connection would be established here');
    
    /*
    // Example implementation:
    const socket = new WebSocket('ws://your-websocket-url');
    
    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      socketRef.current = socket;
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleIncomingMessage(data);
    };
    
    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      socketRef.current = null;
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
    */
  };

  // Handle incoming WebSocket message - placeholder for future implementation
  const handleIncomingMessage = (data) => {
    // This function will process incoming messages from your WebSocket
    /*
    const newMessage = {
      id: messages.length + 1,
      text: data.message,
      sender: 'agent'
    };
    setMessages(prev => [...prev, newMessage]);
    */
  };

  // Send message over WebSocket - placeholder for future implementation
  const sendMessageOverWebSocket = (message) => {
    // This function will send messages over your WebSocket
    /*
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        message: message,
        type: 'chat'
      }));
    }
    */
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // Add user message
    const userMessage = { id: messages.length + 1, text: newMessage, sender: "user" };
    setMessages([...messages, userMessage]);
    
    // Call WebSocket send (currently commented out)
    // sendMessageOverWebSocket(newMessage);
    
    setNewMessage('');

    // Simulate agent response (will be replaced with WebSocket)
    setTimeout(() => {
      const agentMessage = { 
        id: messages.length + 2, 
        text: "Thanks for your message. Our team will respond shortly.", 
        sender: "agent" 
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  return (
    <div className="chat-widget">
      {isOpen ? (
        <div className="chat-container">
          <div className="chat-header">
            <h5>Customer Support {isConnected && <span className="connection-status connected">●</span>}</h5>
            <button 
              className="close-button" 
              onClick={toggleChat}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.sender === 'agent' ? 'agent' : 'user'}`}
              >
                {message.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <Form onSubmit={handleSubmit} className="chat-input-form">
            <Form.Group className="message-input">
              <Form.Control
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button variant="primary" type="submit">
                <i className="fas fa-paper-plane"></i>
              </Button>
            </Form.Group>
          </Form>
        </div>
      ) : (
        <Button 
          className="chat-bubble" 
          onClick={toggleChat}
          aria-label="Open chat"
        >
          {/* Font Awesome icon with text fallback */}
          <i className="fas fa-comments"></i>
          <span className="visually-hidden">Chat</span>
        </Button>
      )}
    </div>
  );
};

export default ChatWidget; 