// Manifest Engine v1.3 - Frontend Application
// Create Anything. Manifest Everything.

import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Chip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  LinearProgress,
  Badge,
  Avatar,
  Tooltip,
  Fab
} from '@mui/material';
import {
  CloudUpload,
  AutoAwesome,
  VideoLibrary,
  Dashboard,
  Settings,
  PlayCircle,
  ContentCut,
  TrendingUp,
  Schedule,
  Analytics,
  Menu as MenuIcon,
  Close,
  Check,
  Star,
  Sparkle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';

// Brand Theme Configuration
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9f7aea', // Purple from screenshot
      light: '#b794f4',
      dark: '#805ad5',
    },
    secondary: {
      main: '#667eea', // Blue-purple gradient
      light: '#7c3aed',
      dark: '#5b21b6',
    },
    background: {
      default: '#0f0f23', // Dark purple background
      paper: 'rgba(31, 31, 51, 0.9)', // Semi-transparent purple
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontSize: '1rem',
          fontWeight: 600,
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(31, 31, 51, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(159, 122, 234, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(159, 122, 234, 0.3)',
        },
      },
    },
  },
});

// Socket connection
const socket = io('http://localhost:3001');

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videos, setVideos] = useState<any[]>([]);
  const [promptText, setPromptText] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData();
    }

    // Socket listeners
    socket.on('processing-started', (data) => {
      showNotification('Video processing started', 'info');
    });

    socket.on('processing-complete', (data) => {
      showNotification(`Processing complete! ${data.clips} clips generated`, 'success');
      fetchVideos();
    });

    socket.on('processing-error', (data) => {
      showNotification('Processing failed. Please try again.', 'error');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/videos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const showNotification = (message: string, severity: string = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name);

    setLoading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        }
      });

      showNotification('Video uploaded successfully!', 'success');
      fetchVideos();
    } catch (error) {
      showNotification('Upload failed. Please try again.', 'error');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const generateAIPrompt = async () => {
    if (!promptText) return;

    setLoading(true);
    try {
      // Simulated AI prompt generation
      const enhanced = `🎬 Create a viral ${promptText} video that:
• Hooks viewers in the first 3 seconds
• Uses trending music and effects
• Includes engaging captions
• Optimized for YouTube Shorts, TikTok, and Instagram Reels
• Incorporates storytelling elements
• Ends with a strong call-to-action

#viral #trending #contentcreation`;
      
      setGeneratedPrompt(enhanced);
      showNotification('AI prompt generated!', 'success');
    } catch (error) {
      showNotification('Failed to generate prompt', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Background with gradient and particles effect */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a0033 50%, #2d1b69 100%)',
          zIndex: -1,
        }}
      >
        {/* Animated particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              background: 'rgba(159, 122, 234, 0.5)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </Box>

      {/* App Bar */}
      <AppBar position="fixed" sx={{ background: 'rgba(15, 15, 35, 0.95)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Sparkle sx={{ mr: 1, color: '#9f7aea' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              ManifestEngine.me
            </Typography>
          </Box>
          {user && (
            <Chip
              avatar={<Avatar>{user.username?.[0]?.toUpperCase()}</Avatar>}
              label={user.username}
              sx={{ background: 'rgba(159, 122, 234, 0.2)' }}
            />
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            background: 'rgba(15, 15, 35, 0.98)',
            backdropFilter: 'blur(10px)',
            width: 280,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Manifest Engine
          </Typography>
        </Box>
        <Divider sx={{ borderColor: 'rgba(159, 122, 234, 0.2)' }} />
        <List>
          {[
            { icon: <Dashboard />, text: 'Dashboard', id: 'dashboard' },
            { icon: <AutoAwesome />, text: 'AI Prompts', id: 'prompts' },
            { icon: <CloudUpload />, text: 'Upload', id: 'upload' },
            { icon: <VideoLibrary />, text: 'Library', id: 'library' },
            { icon: <ContentCut />, text: 'Clips', id: 'clips' },
            { icon: <Analytics />, text: 'Analytics', id: 'analytics' },
            { icon: <Schedule />, text: 'Schedule', id: 'schedule' },
            { icon: <Settings />, text: 'Settings', id: 'settings' },
          ].map((item) => (
            <ListItem
              button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setDrawerOpen(false);
              }}
              sx={{
                '&:hover': {
                  background: 'rgba(159, 122, 234, 0.1)',
                },
                ...(activeSection === item.id && {
                  background: 'rgba(159, 122, 234, 0.2)',
                  borderLeft: '3px solid #9f7aea',
                }),
              }}
            >
              <ListItemIcon sx={{ color: '#9f7aea' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
        <AnimatePresence mode="wait">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h3" sx={{ mb: 4, fontWeight: 700 }}>
                Welcome to Manifest Engine
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: 'text.secondary' }}>
                Create Anything. Manifest Everything.
              </Typography>
              
              <Grid container spacing={3}>
                {[
                  { title: 'Videos Processed', value: '127', icon: <VideoLibrary />, color: '#667eea' },
                  { title: 'Clips Generated', value: '1,842', icon: <ContentCut />, color: '#9f7aea' },
                  { title: 'Total Views', value: '2.4M', icon: <TrendingUp />, color: '#764ba2' },
                  { title: 'Scheduled Posts', value: '45', icon: <Schedule />, color: '#667eea' },
                ].map((stat, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                              {stat.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stat.value}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {stat.title}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          )}

          {/* AI Prompts Section */}
          {activeSection === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h3" sx={{ mb: 4, fontWeight: 700 }}>
                AI Prompt Generator
              </Typography>
              
              <Paper sx={{ p: 4, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  What would you like to create today?
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Describe your video idea..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(159, 122, 234, 0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(159, 122, 234, 0.5)',
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoAwesome />}
                  onClick={generateAIPrompt}
                  disabled={!promptText || loading}
                  fullWidth
                >
                  Generate AI Prompt
                </Button>
              </Paper>

              {generatedPrompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <Sparkle sx={{ mr: 1, color: '#9f7aea' }} />
                      Enhanced Prompt
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {generatedPrompt}
                    </Typography>
                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button variant="outlined" onClick={() => navigator.clipboard.writeText(generatedPrompt)}>
                        Copy to Clipboard
                      </Button>
                      <Button variant="contained">
                        Use This Prompt
                      </Button>
                    </Box>
                  </Paper>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Upload Section */}
          {activeSection === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h3" sx={{ mb: 4, fontWeight: 700 }}>
                Upload Video
              </Typography>
              
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  border: '2px dashed rgba(159, 122, 234, 0.5)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: '#9f7aea',
                    background: 'rgba(159, 122, 234, 0.05)',
                  },
                }}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="video-upload"
                />
                <label htmlFor="video-upload" style={{ cursor: 'pointer' }}>
                  <CloudUpload sx={{ fontSize: 64, color: '#9f7aea', mb: 2 }} />
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Drop your video here or click to browse
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Supports MP4, AVI, MOV, MKV (Max 2GB)
                  </Typography>
                </label>
                
                {uploadProgress > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Uploading... {uploadProgress}%
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity as any} onClose={() => setNotification({ ...notification, open: false })}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        onClick={() => setActiveSection('upload')}
      >
        <CloudUpload />
      </Fab>
    </ThemeProvider>
  );
};

export default App;