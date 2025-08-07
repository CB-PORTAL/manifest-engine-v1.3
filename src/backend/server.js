// Manifest Engine v1.3 - Backend Server
// Create Anything. Manifest Everything.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Server } = require('socket.io');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Initialize Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));
app.use('/clips', express.static(path.join(__dirname, '../../data/clips')));
app.use('/processed', express.static(path.join(__dirname, '../../data/processed')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manifest-engine', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✓ Connected to MongoDB');
}).catch(err => {
  console.error('✗ MongoDB connection error:', err);
});

// Database Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, default: 'free' },
  apiKeys: {
    youtube: String,
    tiktok: String,
    instagram: String
  },
  usage: {
    videosProcessed: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    creditsRemaining: { type: Number, default: 100 }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const VideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFile: String,
  title: String,
  description: String,
  duration: Number,
  size: Number,
  status: { type: String, default: 'pending' },
  clips: [{
    filename: String,
    duration: Number,
    platform: String,
    published: { type: Boolean, default: false },
    analytics: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 }
    }
  }],
  aiAnalysis: {
    transcript: String,
    keywords: [String],
    viralScore: Number,
    suggestedTitles: [String],
    suggestedHashtags: [String]
  },
  createdAt: { type: Date, default: Date.now },
  processedAt: Date
});

const ProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  description: String,
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  settings: {
    autoProcess: { type: Boolean, default: true },
    platforms: [String],
    schedule: {
      enabled: Boolean,
      times: [String]
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const User = mongoose.model('User', UserSchema);
const Video = mongoose.model('Video', VideoSchema);
const Project = mongoose.model('Project', ProjectSchema);

// File Upload Configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../data/uploads');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_VIDEO_SIZE_MB || 2000) * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm|flv|wmv|mpg|mpeg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.3.0',
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({
      $or: [{ email: username }, { username }]
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription,
        usage: user.usage
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Video Upload Route
app.post('/api/videos/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    // Create video record
    const video = new Video({
      userId: req.user.id,
      originalFile: req.file.filename,
      title: req.body.title || 'Untitled Video',
      description: req.body.description || '',
      size: req.file.size,
      status: 'uploaded'
    });
    
    await video.save();
    
    // Emit upload event
    io.emit('video-uploaded', {
      videoId: video._id,
      userId: req.user.id,
      filename: req.file.filename
    });
    
    // Trigger AI processing
    processVideo(video._id);
    
    res.json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        filename: req.file.filename,
        size: req.file.size,
        status: video.status
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get User Videos
app.get('/api/videos', authenticateToken, async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ videos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get Video Details
app.get('/api/videos/:id', authenticateToken, async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({ video });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// Process Video Function
async function processVideo(videoId) {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;
    
    // Update status
    video.status = 'processing';
    await video.save();
    
    // Emit processing start
    io.emit('processing-started', { videoId });
    
    // Call AI Engine API
    const aiResponse = await fetch(`${process.env.AI_ENGINE_URL || 'http://localhost:8000'}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: videoId.toString(),
        filename: video.originalFile,
        settings: {
          generateClips: true,
          transcribe: true,
          detectScenes: true,
          analyzeViral: true
        }
      })
    });
    
    if (!aiResponse.ok) {
      throw new Error('AI processing failed');
    }
    
    const result = await aiResponse.json();
    
    // Update video with results
    video.status = 'completed';
    video.processedAt = new Date();
    video.clips = result.clips || [];
    video.aiAnalysis = result.analysis || {};
    video.duration = result.duration;
    await video.save();
    
    // Emit completion
    io.emit('processing-complete', {
      videoId,
      clips: video.clips.length,
      analysis: video.aiAnalysis
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update status to failed
    const video = await Video.findById(videoId);
    if (video) {
      video.status = 'failed';
      await video.save();
    }
    
    // Emit error
    io.emit('processing-error', { videoId, error: error.message });
  }
}

// WebSocket Events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
============================================
   MANIFEST ENGINE BACKEND v1.3
============================================
   
   Server running on port ${PORT}
   API: http://localhost:${PORT}/api
   WebSocket: ws://localhost:${PORT}
   
   Environment: ${process.env.NODE_ENV || 'development'}
   
============================================
  `);
});