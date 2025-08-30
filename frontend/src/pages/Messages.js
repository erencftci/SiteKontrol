import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import ImageIcon from '@mui/icons-material/Image';
import { getChatMessages, sendMessage, markThreadRead, getChats, getContacts } from '../api/messageApi';
import { uploadPhoto } from '../api/photoApi';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Autocomplete from '@mui/material/Autocomplete';
import { HubConnectionBuilder } from '@microsoft/signalr';

// Mesajlaşma sayfası
function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Kullanıcı bilgisi
  const user = JSON.parse(localStorage.getItem('user'));

  // Sohbet ve mesaj listesi
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [newMsgUser, setNewMsgUser] = useState(null);
  const [conn, setConn] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState('');

  // sohbetleri yükle tüm kullanıcılar 
  useEffect(() => {
    loadChats();
    (async ()=>{
      try { const list = await getContacts(); setAllUsers(list); } catch {}
    })();
    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5223/hubs/chat', { accessTokenFactory: ()=> localStorage.getItem('token')||'' })
      .withAutomaticReconnect()
      .build();
    connection.start().catch(()=>{});
    connection.on('MessageReceived', async (payload)=>{
      if (selectedChat && payload && selectedChat.userId === payload.senderId) {
        await loadMessages(selectedChat.userId);
      }
      await loadChats();
    });
    connection.on('ChatUpdated', async ()=>{ await loadChats(); });
    setConn(connection);
    return ()=>{ connection.stop().catch(()=>{}); };
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatList = await getChats();
      setChats(chatList);
      setError(null);
    } catch (err) {
      setError('Sohbetler yüklenirken hata oluştu: ' + err.message);
      console.error('Sohbetler yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await getChatMessages(userId);
      setMessages(data.map(m => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        receiverId: m.receiverId,
        createdAt: m.createdAt
      })));
      await markThreadRead(userId);
    } catch (err) {
      setError('Mesajlar yüklenirken hata oluştu: ' + err.message);
      console.error('Mesajlar yüklenirken hata:', err);
    }
  };

  const handleSendMessage = async (text) => {
    const content = (text ?? messageText).trim();
    if (!content || !selectedChat) return;
    try {
      await sendMessage({ receiverId: selectedChat.userId, content });
      setMessageText('');
      await loadMessages(selectedChat.userId);
      await loadChats();
    } catch (err) {
      setError('Mesaj gönderilirken hata oluştu: ' + err.message);
      console.error('Mesaj gönderilirken hata:', err);
    }
  };

  const handleImagePick = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !selectedChat) return;
    try {
      const res = await uploadPhoto(file, 'messages');
      const url = res?.url || res?.Url;
      if (url) {
        await handleSendMessage(url);
      }
    } catch (err) {
      setError('Fotoğraf yüklenemedi: ' + (err.message||''));
    } finally {
      e.target.value = '';
    }
  };

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    await loadMessages(chat.userId);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredChats = chats.filter(c => (c.userName||'').toLowerCase().includes(search.trim().toLowerCase()));

  const isImageUrl = (text) => {
    if (!text) return false;
    const t = String(text);
    return t.startsWith('http') && (/(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(t) || t.includes('res.cloudinary.com'));
  };

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 72px)', width: '100%' }}>
      <Typography variant="h4" gutterBottom>Mesajlar</Typography>

      {/* Hata mesajı */}
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 1 }}>
          <Typography>{error}</Typography>
        </Box>
      )}

      {/* Yükleniyor */}
      {loading && (
        <Box sx={{ mb: 2, p: 2, textAlign: 'center' }}>
          <Typography>Sohbetler yükleniyor...</Typography>
        </Box>
      )}
      
      <Grid container spacing={2} sx={{ height: 'calc(100% - 80px)' }}>
        {/* Sohbet listesi */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 5, display: 'flex', gap: 1 }}>
              <TextField value={search} onChange={(e)=>setSearch(e.target.value)} fullWidth size="small" placeholder="Kişi ara" />
              <Button size="small" variant="contained" onClick={()=>setNewMsgOpen(true)}>YENİ</Button>
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {filteredChats.map((chat) => (
                <React.Fragment key={chat.userId}>
                  <ListItem 
                    button 
                    selected={selectedChat?.userId === chat.userId}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <ListItemAvatar>
                      <Avatar>{(chat.userName||'?').charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{chat.userName}</Typography>
                          {chat.unread > 0 && (
                            <Box sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{chat.unread}</Box>
                          )}
                        </Box>
                      }
                      secondary={<Typography variant="body2" color="textSecondary" noWrap>{chat.lastMessage || chat.userRole}</Typography>}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Mesaj alanı */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
            {selectedChat ? (
              <>
                {/* Sohbet başlığı */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">{selectedChat.userName}</Typography>
                  <Typography variant="body2" color="textSecondary">{selectedChat.userRole}</Typography>
                </Box>

                {/* Mesaj listesi (SABİT 300px) */}
                <Box sx={{ p: 5, height: 350, overflowY: 'auto' }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{ display: 'flex', justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start', mb: 2 }}
                    >
                      <Card sx={{ maxWidth: '100%', bgcolor: message.senderId === user?.id ? 'primary.main' : 'rgba(255,255,255,0.06)', color: message.senderId === user?.id ? 'white' : 'text.primary' }}>
                        <CardContent sx={{ py: 1, px: 2 }}>
                          {isImageUrl(message.content) ? (
                            <img src={message.content} alt="media" style={{ maxWidth: 250, maxHeight: 250, width: '100%', height: 'auto', objectFit: 'contain', borderRadius: 8, cursor: 'zoom-in' }} onClick={()=>{setViewerSrc(message.content); setViewerOpen(true);}} />
                          ) : (
                            <Typography variant="body2">{message.content}</Typography>
                          )}
                          <Typography variant="caption" sx={{ color: message.senderId === user?.id ? 'rgba(255,255,255,0.7)' : 'text.secondary', display: 'block', mt: 0.5 }}>
                            {new Date(message.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Box>

                {/* Mesaj gönderme alanı */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField fullWidth placeholder="Mesajınızı yazın..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyPress={handleKeyPress} multiline maxRows={3} />
                    <input id="msg-image-input" type="file" accept="image/*" hidden onChange={handleImagePick} />
                    <IconButton color="default" onClick={()=>document.getElementById('msg-image-input').click()}>
                      <ImageIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={()=>handleSendMessage()} disabled={!messageText.trim()}>
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h6" color="textSecondary">Sohbet seçin</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Yeni Mesaj Dialog */}
      <Dialog open={newMsgOpen} onClose={()=>setNewMsgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Mesaj</DialogTitle>
        <DialogContent>
          <Autocomplete options={allUsers} getOptionLabel={(o)=>o.name||''} onChange={(e,val)=>setNewMsgUser(val)} renderInput={(params)=>(<TextField {...params} label="Kişi seç" />)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setNewMsgOpen(false)}>İptal</Button>
          <Button onClick={async()=>{ if(newMsgUser){ const chat={ userId:newMsgUser.id, userName:newMsgUser.name, userRole:newMsgUser.role, unread:0}; setNewMsgOpen(false); await handleChatSelect(chat);} }}>Aç</Button>
        </DialogActions>
      </Dialog>

      {/* Fotoğraf görüntüleyici */}
      <Dialog open={viewerOpen} onClose={()=>setViewerOpen(false)} maxWidth="lg">
        <Box sx={{ p: 0 }}>
          {viewerSrc && (
            <img src={viewerSrc} alt="full" style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }} />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}

export default Messages; 