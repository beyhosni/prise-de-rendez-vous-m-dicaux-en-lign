import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Box, Paper, TextField, Button, List, ListItem, ListItemText, Avatar, Divider, IconButton, CircularProgress, Alert, Badge, Chip, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { ME_QUERY } from '../graphql/auth';
import { CONVERSATIONS_QUERY, MESSAGES_QUERY, SEND_MESSAGE_MUTATION, MARK_MESSAGES_READ_MUTATION, NEW_MESSAGE_SUBSCRIPTION } from '../graphql/messaging';
import { useAuth } from '../contexts/AuthContext';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

// Configuration de dayjs en français
dayjs.locale('fr');

// Composants stylisés
const MessagingContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  height: 'calc(100vh - 120px)',
  display: 'flex',
  flexDirection: 'column',
}));

const ConversationsPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const ConversationList = styled(List)(({ theme }) => ({
  maxHeight: 'calc(100vh - 240px)',
  overflow: 'auto',
  flex: 1,
}));

const ChatPaper = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const MessagesList = styled(List)(({ theme }) => ({
  maxHeight: 'calc(100vh - 360px)',
  overflow: 'auto',
  padding: theme.spacing(2),
  flex: 1,
}));

const MessageInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const MessageItem = styled(ListItem)(({ theme, isOwn }) => ({
  flexDirection: isOwn ? 'row-reverse' : 'row',
  justifyContent: isOwn ? 'flex-end' : 'flex-start',
  padding: theme.spacing(1, 2),
  '& .message-bubble': {
    backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[200],
    color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
    borderRadius: 18,
    padding: theme.spacing(1, 2),
    maxWidth: '70%',
    wordBreak: 'break-word',
  },
}));

const Messaging = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});

  // Récupérer les informations de l'utilisateur
  const { data: userData, loading: userLoading } = useQuery(ME_QUERY);

  // Récupérer les conversations
  const { data: conversationsData, loading: conversationsLoading } = useQuery(CONVERSATIONS_QUERY, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  // Récupérer les messages de la conversation sélectionnée
  const { data: messagesData, loading: messagesLoading, refetch } = useQuery(MESSAGES_QUERY, {
    variables: { conversationId },
    skip: !conversationId,
  });

  // S'abonner aux nouveaux messages
  const { data: newMessageData } = useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { conversationId },
    skip: !conversationId,
  });

  // Mutation pour envoyer un message
  const [sendMessage] = useMutation(SEND_MESSAGE_MUTATION, {
    onCompleted: (data) => {
      if (data && data.sendMessage) {
        refetch();
        setMessageText('');
      }
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  // Mutation pour marquer les messages comme lus
  const [markMessagesRead] = useMutation(MARK_MESSAGES_READ_MUTATION, {
    onCompleted: (data) => {
      if (data && data.markMessagesRead) {
        // Mettre à jour les comptes de messages non lus
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: 0
        }));
      }
    }
  });

  useEffect(() => {
    if (conversationsData && conversationsData.conversations) {
      setConversations(conversationsData.conversations);
      setLoading(false);

      // Calculer les comptes de messages non lus
      const counts = {};
      conversationsData.conversations.forEach(conv => {
        counts[conv.id] = conv.unreadCount || 0;
      });
      setUnreadCounts(counts);

      // Si un ID de conversation est fourni dans l'URL, sélectionner cette conversation
      if (conversationId) {
        const conv = conversationsData.conversations.find(c => c.id === conversationId);
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    }
  }, [conversationsData, conversationId]);

  useEffect(() => {
    if (messagesData && messagesData.messages) {
      setMessages(messagesData.messages);

      // Marquer les messages comme lus
      if (messagesData.messages.some(m => !m.isRead && m.senderId !== user.id)) {
        markMessagesRead({
          variables: { conversationId }
        });
      }
    }
  }, [messagesData, conversationId, user.id, markMessagesRead]);

  useEffect(() => {
    if (newMessageData && newMessageData.newMessage) {
      setMessages(prev => [...prev, newMessageData.newMessage]);
    }
  }, [newMessageData]);

  useEffect(() => {
    // Faire défiler vers le bas lorsque de nouveaux messages sont ajoutés
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messaging/${conversation.id}`);
  };

  const handleSendMessage = () => {
    if (messageText.trim() === '') return;

    sendMessage({
      variables: {
        input: {
          conversationId: selectedConversation.id,
          content: messageText.trim()
        }
      }
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipant = (conversation) => {
    if (user.role === 'PATIENT') {
      return conversation.doctor;
    } else if (user.role === 'DOCTOR') {
      return conversation.patient;
    }
    return null;
  };

  const formatMessageTime = (timestamp) => {
    const messageDate = dayjs(timestamp);
    const now = dayjs();

    if (messageDate.isSame(now, 'day')) {
      return messageDate.format('HH:mm');
    } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
      return 'Hier';
    } else {
      return messageDate.format('DD/MM/YYYY');
    }
  };

  if (loading) {
    return (
      <MessagingContainer maxWidth="lg">
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress size={60} />
        </Box>
      </MessagingContainer>
    );
  }

  return (
    <MessagingContainer maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Messagerie
      </Typography>

      <Grid container spacing={2} sx={{ height: '100%' }}>
        {/* Liste des conversations */}
        <Grid item xs={12} md={4}>
          <ConversationsPaper elevation={2}>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6">
                Conversations
              </Typography>
            </Box>
            <ConversationList>
              {conversations.length === 0 ? (
                <Box p={2} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucune conversation
                  </Typography>
                </Box>
              ) : (
                conversations.map((conversation) => {
                  const otherParticipant = getOtherParticipant(conversation);
                  const unreadCount = unreadCounts[conversation.id] || 0;

                  return (
                    <ListItem
                      key={conversation.id}
                      button
                      selected={selectedConversation?.id === conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      alignItems="flex-start"
                    >
                      <Badge badgeContent={unreadCount} color="primary">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </Badge>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="subtitle1">
                              {otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Inconnu'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatMessageTime(conversation.lastMessageAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {conversation.lastMessage}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })
              )}
            </ConversationList>
          </ConversationsPaper>
        </Grid>

        {/* Zone de chat */}
        <Grid item xs={12} md={8}>
          <ChatPaper elevation={2}>
            {selectedConversation ? (
              <>
                <Box p={2} borderBottom={1} borderColor="divider" display="flex" alignItems="center">
                  <IconButton onClick={() => navigate('/messaging')} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                  </IconButton>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                  <Typography variant="h6">
                    {getOtherParticipant(selectedConversation) 
                      ? `${getOtherParticipant(selectedConversation).firstName} ${getOtherParticipant(selectedConversation).lastName}`
                      : 'Inconnu'
                    }
                  </Typography>
                </Box>

                <MessagesList>
                  {messages.length === 0 ? (
                    <Box p={2} textAlign="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucun message dans cette conversation
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((message) => (
                      <MessageItem key={message.id} isOwn={message.senderId === user.id}>
                        <Avatar sx={{ mr: 1, bgcolor: message.senderId === user.id ? 'primary.main' : 'grey[500]' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box className="message-bubble">
                          <Typography variant="body1">
                            {message.content}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7 }}>
                            {formatMessageTime(message.createdAt)}
                          </Typography>
                        </Box>
                      </MessageItem>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </MessagesList>

                <MessageInputContainer>
                  <TextField
                    fullWidth
                    placeholder="Écrivez votre message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            color="primary"
                            onClick={handleSendMessage}
                            disabled={!messageText.trim()}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    multiline
                    maxRows={4}
                  />
                </MessageInputContainer>
              </>
            ) : (
              <Box p={2} display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="body1" color="text.secondary">
                  Sélectionnez une conversation pour commencer à discuter
                </Typography>
              </Box>
            )}
          </ChatPaper>
        </Grid>
      </Grid>
    </MessagingContainer>
  );
};

export default Messaging;
