import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Avatar, Paper, Chip
} from '@mui/material';
import {
  Send, SmartToy, Person
} from '@mui/icons-material';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ChatAssistantProps {
  // messages: any[]; // No longer needed as chatMessages will come from useWebSocket
}

const ChatAssistant: React.FC<ChatAssistantProps> = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendChatMessage, connected, chatMessages } = useWebSocket('ws://localhost:8000');
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    console.log('Sending message:', inputMessage);
    setIsTyping(true);
    
    // Send the message
    sendChatMessage(inputMessage);
    setInputMessage('');
    
    // Simulate typing delay
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    '💧 Check irrigation status',
    '🌱 Show crop health',
    '🌤️ Weather forecast',
    '📊 Farm overview'
  ];

  const MessageBubble = ({ message, isUser }: { message: any, isUser: boolean }) => (
    <Box
      display="flex"
      justifyContent={isUser ? 'flex-end' : 'flex-start'}
      mb={2}
    >
      <Box display="flex" alignItems="flex-start" gap={1} maxWidth="80%">
        {!isUser && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <SmartToy fontSize="small" />
          </Avatar>
        )}
        
        <Paper
          elevation={2}
          sx={{
            p: 2,
            bgcolor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
            maxWidth: '100%'
          }}
        >
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.message}
          </Typography>
          
          <Typography
            variant="caption"
            color={isUser ? 'rgba(255,255,255,0.7)' : 'text.secondary'}
            display="block"
            mt={1}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </Typography>
        </Paper>
        
        {isUser && (
          <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
            <Person fontSize="small" />
          </Avatar>
        )}
      </Box>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" height="calc(100vh - 200px)">
      {/* Header */}
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6">🤖 Farm AI Assistant</Typography>
              <Typography variant="body2" color="text.secondary">
                Your intelligent farming companion with predictive analytics
              </Typography>
            </Box>
            <Box ml="auto">
              <Chip 
                label={connected ? 'Online' : 'Offline'} 
                color={connected ? 'success' : 'error'}
                size="small" 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Connection Status */}
      {!connected && (
        <Card elevation={2} sx={{ mb: 2, bgcolor: 'warning.light' }}>
          <CardContent>
            <Typography variant="body2">
              ⚠️ Connection lost. Make sure your backend is running at http://localhost:8000
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            ⚡ Quick Actions
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {quickActions.map((action, index) => (
              <Chip
                key={index}
                label={action}
                variant="outlined"
                size="small"
                clickable
                onClick={() => setInputMessage(action)}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Messages Container */}
      <Card elevation={2} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
            {/* Welcome Message */}
            {chatMessages.length === 0 && (
              <Box textAlign="center" py={4}>
                <SmartToy sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Welcome to your Smart Farm Assistant! 🌾
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  I can help you with irrigation, crop health, weather analysis, and predictions.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try asking: "How is my farm doing?" or click a quick action above!
                </Typography>
              </Box>
            )}
            
            {/* Chat Messages */}
            {chatMessages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                isUser={message.type === 'user'}
              />
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <SmartToy fontSize="small" />
                </Avatar>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: '20px 20px 20px 5px'
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    🤔 Analyzing farm data...
                  </Typography>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box display="flex" gap={2} mt={2}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder={connected ? "Ask me about your farm..." : "Connect to backend first..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              disabled={!connected}
            />
            <Button
              variant="contained"
              endIcon={<Send />}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !connected}
              sx={{ minWidth: 100 }}
            >
              Send
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatAssistant;
