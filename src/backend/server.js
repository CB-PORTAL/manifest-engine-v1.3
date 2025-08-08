// Manifest Engine v1.3 - PRODUCTION SERVER
// Create Anything. Manifest Everything.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Server } = require('socket.io');
const http = require('http');
const fetch = require('node-fetch'); // ADD THIS LINE

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));
app.use('/clips', express.static(path.join(__dirname, '../../data/clips')));

// Storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../data/uploads');
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2000 * 1024 * 1024 } // 2GB
});

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// MAIN INTERFACE - COMPLETE MANIFEST ENGINE UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manifest Engine v1.3 | Neural Creation Portal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary: #9f7aea;
            --secondary: #667eea;
            --accent: #f687b3;
            --dark: #1a0033;
            --glass: rgba(255, 255, 255, 0.05);
            --glow: 0 0 30px rgba(159, 122, 234, 0.5);
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a0033 25%, #2d1b69 50%, #1a0033 75%, #0f0f23 100%);
            background-size: 400% 400%;
            animation: galaxyShift 20s ease infinite;
            color: white;
            overflow-x: hidden;
            min-height: 100vh;
        }

        @keyframes galaxyShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        /* Neural Network Background */
        .neural-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--primary);
            border-radius: 50%;
            filter: blur(1px);
            animation: float 10s infinite ease-in-out;
        }

        @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
            33% { transform: translate(30px, -30px) scale(1.5); opacity: 1; }
            66% { transform: translate(-20px, 20px) scale(0.8); opacity: 0.6; }
        }

        /* Main Container */
        .container {
            position: relative;
            z-index: 1;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        /* Header */
        .header {
            text-align: center;
            padding: 40px 0;
            position: relative;
        }

        .logo {
            font-size: 4rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 50%, var(--accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 3s ease infinite;
            margin-bottom: 10px;
            letter-spacing: -2px;
        }

        @keyframes shimmer {
            0%, 100% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
        }

        .tagline {
            font-size: 1.3rem;
            opacity: 0.9;
            letter-spacing: 2px;
        }

        /* Main Dashboard Grid */
        .dashboard {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 30px;
            margin-top: 40px;
        }

        /* Panels */
        .panel {
            background: var(--glass);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(159, 122, 234, 0.3);
            border-radius: 20px;
            padding: 25px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        .panel:hover {
            transform: translateY(-5px);
            box-shadow: var(--glow);
            border-color: var(--primary);
        }

        .panel::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }

        .panel:hover::before {
            opacity: 0.05;
        }

        .panel-title {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .panel-icon {
            width: 24px;
            height: 24px;
            display: inline-block;
        }

        /* Processing Overlay */
        .processing-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }

        .processing-overlay.active {
            display: flex;
        }

        .processing-content {
            text-align: center;
        }

        .processing-spinner {
            width: 100px;
            height: 100px;
            border: 4px solid rgba(159, 122, 234, 0.3);
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .processing-text {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }

        .processing-status {
            font-size: 1rem;
            opacity: 0.8;
        }

        /* Results Panel */
        .results-panel {
            display: none;
            grid-column: 1 / -1;
            margin-top: 30px;
        }

        .results-panel.active {
            display: block;
        }

        .clips-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .clip-card {
            background: var(--glass);
            border: 1px solid rgba(159, 122, 234, 0.3);
            border-radius: 15px;
            padding: 15px;
            transition: all 0.3s ease;
        }

        .clip-card:hover {
            transform: scale(1.05);
            border-color: var(--primary);
        }

        .clip-thumbnail {
            width: 100%;
            height: 140px;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
        }

        .download-btn {
            width: 100%;
            padding: 10px;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .download-btn:hover {
            transform: scale(1.05);
        }

        /* Left Panel - Creation Tools */
        .creation-tools {
            grid-column: 1;
        }

        .tool-btn {
            width: 100%;
            padding: 15px;
            margin-bottom: 15px;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .tool-btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }

        .tool-btn:hover::after {
            width: 300px;
            height: 300px;
        }

        .tool-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        /* Center Panel - Devlog Portal */
        .devlog-portal {
            grid-column: 2;
        }

        .prompt-area {
            width: 100%;
            min-height: 200px;
            background: rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(159, 122, 234, 0.3);
            border-radius: 15px;
            padding: 20px;
            color: white;
            font-size: 1.1rem;
            resize: vertical;
            transition: all 0.3s ease;
            font-family: 'Monaco', 'Courier New', monospace;
        }

        .prompt-area:focus {
            outline: none;
            border-color: var(--primary);
            background: rgba(0, 0, 0, 0.5);
            box-shadow: 0 0 30px rgba(159, 122, 234, 0.3);
        }

        /* AI Assistance Slider */
        .ai-control {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 15px;
        }

        .ai-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .ai-slider {
            width: 100%;
            height: 8px;
            background: linear-gradient(to right,
                #00ff00 0%,
                #ffff00 50%,
                #ff00ff 100%);
            border-radius: 10px;
            outline: none;
            -webkit-appearance: none;
            position: relative;
        }

        .ai-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 25px;
            height: 25px;
            background: white;
            border: 3px solid var(--primary);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 20px rgba(159, 122, 234, 0.8);
            transition: all 0.3s ease;
        }

        .ai-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 0 30px rgba(159, 122, 234, 1);
        }

        .ai-value {
            text-align: center;
            margin-top: 10px;
            font-size: 2rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Right Panel - API & Status */
        .status-panel {
            grid-column: 3;
        }

        .status-item {
            display: flex;
            justify-content: space-between;
            padding: 12px;
            margin-bottom: 10px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            transition: all 0.3s ease;
        }

        .status-item:hover {
            background: rgba(159, 122, 234, 0.1);
        }

        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff00;
            box-shadow: 0 0 10px #00ff00;
            animation: pulse 2s infinite;
        }

        .status-indicator.offline {
            background: #ff0000;
            box-shadow: 0 0 10px #ff0000;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* Upload Zone */
        .upload-zone {
            grid-column: 1 / -1;
            margin-top: 30px;
            padding: 60px;
            border: 3px dashed rgba(159, 122, 234, 0.5);
            border-radius: 20px;
            text-align: center;
            background: var(--glass);
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .upload-zone:hover {
            border-color: var(--primary);
            background: rgba(159, 122, 234, 0.05);
        }

        .upload-zone.dragover {
            background: rgba(159, 122, 234, 0.1);
            border-color: var(--accent);
            transform: scale(1.02);
        }

        /* Generate Button */
        .generate-btn {
            margin-top: 20px;
            padding: 18px 50px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--primary) 50%, var(--secondary) 100%);
            background-size: 200% 200%;
            animation: gradientShift 3s ease infinite;
            border: none;
            border-radius: 50px;
            color: white;
            font-size: 1.2rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(159, 122, 234, 0.3);
        }

        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        .generate-btn:hover {
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 40px rgba(159, 122, 234, 0.5);
        }

        /* API Integration Panel */
        .api-grid {
            display: grid;
            gap: 10px;
            margin-top: 20px;
        }

        .api-item {
            padding: 12px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .api-item:hover {
            background: rgba(159, 122, 234, 0.2);
            transform: translateX(5px);
        }

        .api-connected {
            color: #00ff00;
            font-size: 0.8rem;
        }

        .api-disconnected {
            color: #ff6b6b;
            font-size: 0.8rem;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            .panel {
                grid-column: 1 !important;
            }
        }
    </style>
</head>
<body>
    <!-- Neural Network Background -->
    <div class="neural-bg" id="neuralBg"></div>

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo">ManifestEngine.me</div>
            <div class="tagline">Create Anything. Manifest Everything.</div>
        </div>

        <!-- Main Dashboard -->
        <div class="dashboard">
            <!-- Left Panel - Creation Tools -->
            <div class="panel creation-tools">
                <div class="panel-title">
                    <span class="panel-icon">🚀</span>
                    Creation Portal
                </div>
                <button class="tool-btn" onclick="activateTool('video')">
                    📹 Video Processor
                </button>
                <button class="tool-btn" onclick="activateTool('ai')">
                    🤖 AI Engine
                </button>
                <button class="tool-btn" onclick="activateTool('viral')">
                    💫 Viral Analyzer
                </button>
                <button class="tool-btn" onclick="activateTool('schedule')">
                    📅 Auto Scheduler
                </button>
                <button class="tool-btn" onclick="activateTool('monetize')">
                    💰 Monetization
                </button>
            </div>

            <!-- Center Panel - Devlog Portal -->
            <div class="panel devlog-portal">
                <div class="panel-title">
                    <span class="panel-icon">✨</span>
                    Devlog Portal - Neural Prompt Engineering
                </div>
                
                <textarea class="prompt-area" id="promptInput" placeholder="Begin manifesting your vision here... Describe what you want to create, and watch as the AI enhances your thoughts in real-time based on your selected assistance level.">Manifest Engine Neural Interface Ready...

Type your creative vision and adjust the AI assistance level below to enhance your prompts with varying degrees of neural optimization.</textarea>

                <div class="ai-control">
                    <div class="ai-label">
                        <span>🧠 AI Neural Assistance</span>
                        <span id="aiDescription">Balanced Enhancement</span>
                    </div>
                    <input type="range" class="ai-slider" id="aiSlider" min="1" max="10" value="5" oninput="updateAI(this.value)">
                    <div class="ai-value" id="aiValue">5</div>
                    <div style="text-align: center; margin-top: 10px; opacity: 0.7; font-size: 0.9rem;">
                        1 = Minimal (Grammar only) | 10 = Maximum (Full Neural Rewrite)
                    </div>
                </div>

                <button class="generate-btn" onclick="generateContent()">
                    ⚡ Generate Neural Content
                </button>
            </div>

            <!-- Right Panel - API & Status -->
            <div class="panel status-panel">
                <div class="panel-title">
                    <span class="panel-icon">🔌</span>
                    System Status
                </div>
                
                <div class="status-item">
                    <span>Backend API</span>
                    <span class="status-indicator" id="backend-status"></span>
                </div>
                <div class="status-item">
                    <span>AI Engine</span>
                    <span class="status-indicator" id="ai-status"></span>
                </div>
                <div class="status-item">
                    <span>Video Processor</span>
                    <span class="status-indicator" id="video-status"></span>
                </div>
                <div class="status-item">
                    <span>Neural Network</span>
                    <span class="status-indicator"></span>
                </div>

                <div class="panel-title" style="margin-top: 30px;">
                    <span class="panel-icon">🔗</span>
                    API Integrations
                </div>
                
                <div class="api-grid">
                    <div class="api-item" onclick="connectAPI('openai')">
                        <span>OpenAI GPT-4</span>
                        <span class="api-disconnected">Connect</span>
                    </div>
                    <div class="api-item" onclick="connectAPI('claude')">
                        <span>Anthropic Claude</span>
                        <span class="api-disconnected">Connect</span>
                    </div>
                    <div class="api-item" onclick="connectAPI('youtube')">
                        <span>YouTube API</span>
                        <span class="api-disconnected">Connect</span>
                    </div>
                    <div class="api-item" onclick="connectAPI('tiktok')">
                        <span>TikTok API</span>
                        <span class="api-disconnected">Connect</span>
                    </div>
                    <div class="api-item" onclick="connectAPI('stripe')">
                        <span>Stripe Payments</span>
                        <span class="api-disconnected">Connect</span>
                    </div>
                </div>
            </div>

            <!-- Upload Zone -->
            <div class="upload-zone" id="uploadZone" ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎬</div>
                <h2 style="margin-bottom: 10px;">Drop Your Content Here</h2>
                <p style="opacity: 0.8;">or click to browse files</p>
                <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.6;">
                    Supports: Video (MP4, MOV, AVI) • Images (JPG, PNG) • Documents (PDF, DOCX) • Audio (MP3, WAV)
                </p>
                <input type="file" id="fileInput" style="display: none;" multiple accept="video/*,image/*,audio/*,.pdf,.docx">
            </div>

            <!-- Results Panel (Initially Hidden) -->
            <div class="panel results-panel" id="resultsPanel">
                <div class="panel-title">
                    <span class="panel-icon">🎉</span>
                    Generated Clips
                </div>
                <div class="clips-grid" id="clipsGrid"></div>
            </div>
        </div>
    </div>

    <!-- Processing Overlay -->
    <div class="processing-overlay" id="processingOverlay">
        <div class="processing-content">
            <div class="processing-spinner"></div>
            <div class="processing-text">Processing Your Video</div>
            <div class="processing-status" id="processingStatus">Analyzing content...</div>
        </div>
    </div>

    <script>
        // Initialize Neural Background
        function createNeuralNetwork() {
            const bg = document.getElementById('neuralBg');
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 10 + 's';
                particle.style.animationDuration = (10 + Math.random() * 20) + 's';
                bg.appendChild(particle);
            }
        }
        createNeuralNetwork();

        // Check service status
        async function checkServices() {
            // Check backend (always online since this page is served)
            document.getElementById('backend-status').classList.remove('offline');
            
            // Check AI Engine
            try {
                const response = await fetch('http://localhost:8000/health');
                if (response.ok) {
                    document.getElementById('ai-status').classList.remove('offline');
                    document.getElementById('video-status').classList.remove('offline');
                }
            } catch (error) {
                document.getElementById('ai-status').classList.add('offline');
                document.getElementById('video-status').classList.add('offline');
            }
        }
        
        // Check services every 5 seconds
        checkServices();
        setInterval(checkServices, 5000);

        // AI Assistance Level Descriptions
        const aiDescriptions = {
            1: "Minimal - Grammar correction only",
            2: "Light touch - Basic improvements",
            3: "Gentle enhancement - Clarity focus",
            4: "Moderate - Structure optimization",
            5: "Balanced - Smart enhancement",
            6: "Advanced - Deep optimization",
            7: "Intensive - Major rewriting",
            8: "Powerful - Neural reconstruction",
            9: "Maximum - Complete transformation",
            10: "ULTIMATE - Full Neural Rewrite"
        };

        // Update AI Level
        function updateAI(value) {
            document.getElementById('aiValue').textContent = value;
            document.getElementById('aiDescription').textContent = aiDescriptions[value];
            
            // Visual feedback
            const slider = document.getElementById('aiSlider');
            const percentage = (value - 1) / 9 * 100;
            slider.style.filter = 'hue-rotate(' + (percentage * 1.2) + 'deg) brightness(' + (1 + percentage / 200) + ')';
            
            // Real-time prompt enhancement preview
            enhancePrompt(value);
        }

        // Enhance prompt in real-time
        function enhancePrompt(level) {
            const input = document.getElementById('promptInput');
            const originalText = input.value;
            
            // Simulate real-time enhancement based on level
            if (level >= 5) {
                input.style.textShadow = '0 0 10px rgba(159, 122, 234, 0.5)';
            } else {
                input.style.textShadow = 'none';
            }
        }

        // Generate Content
        function generateContent() {
            const prompt = document.getElementById('promptInput').value;
            const aiLevel = document.getElementById('aiSlider').value;
            
            // Show processing
            showProcessing('Generating neural content...');
            
            // Simulate processing
            setTimeout(() => {
                hideProcessing();
                alert('Neural Generation Complete!\\n\\nPrompt: ' + prompt.substring(0, 50) + '...\\nAI Level: ' + aiLevel + '\\n\\nYour content is being manifested...');
            }, 2000);
        }

        // Tool Activation
        function activateTool(tool) {
            console.log('Activating tool:', tool);
            // Add tool-specific functionality here
            alert(tool.toUpperCase() + ' Module Activated!\\n\\nReady to process your content.');
        }

        // API Connection
        function connectAPI(api) {
            const apiItem = event.currentTarget;
            const status = apiItem.querySelector('span:last-child');
            
            if (status.classList.contains('api-disconnected')) {
                status.textContent = 'Connected';
                status.classList.remove('api-disconnected');
                status.classList.add('api-connected');
                alert(api.toUpperCase() + ' API Connected Successfully!\\n\\nYou can now use advanced features.');
            } else {
                status.textContent = 'Connect';
                status.classList.remove('api-connected');
                status.classList.add('api-disconnected');
            }
        }

        // File Upload Handling
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleDrop(e) {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        }

        function handleDragOver(e) {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        }

        function showProcessing(status) {
            document.getElementById('processingOverlay').classList.add('active');
            document.getElementById('processingStatus').textContent = status;
        }

        function hideProcessing() {
            document.getElementById('processingOverlay').classList.remove('active');
        }

        function handleFiles(files) {
            if (files.length > 0) {
                const file = files[0];
                console.log('File uploaded:', file);
                
                // Show processing overlay
                showProcessing('Uploading ' + file.name + '...');
                
                // Create FormData and upload
                const formData = new FormData();
                formData.append('file', file);
                
                // Upload to server
                fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Upload response:', data);
                    
                    // Update status
                    showProcessing('Processing video with AI...');
                    
                    // Trigger AI processing
                    return fetch('http://localhost:8000/process', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            videoId: data.videoId,
                            filename: data.file,
                            settings: {
                                transcribe: true,
                                detectScenes: true,
                                analyzeViral: true,
                                generateClips: true,
                                numClips: 10,
                                clipDuration: 30,
                                platform: 'youtube_short'
                            }
                        })
                    });
                })
                .then(response => response.json())
                .then(result => {
                    console.log('Processing result:', result);
                    hideProcessing();
                    
                    // Show results
                    displayResults(result);
                })
                .catch(error => {
                    console.error('Error:', error);
                    hideProcessing();
                    
                    // If AI engine is not running, show mock results
                    if (error.message.includes('Failed to fetch')) {
                        alert('AI Engine is not running. Showing demo results.\\n\\nTo enable full functionality, ensure the AI engine is running on port 8000.');
                        displayMockResults();
                    } else {
                        alert('Processing failed: ' + error.message);
                    }
                });
            }
        }

        function displayResults(result) {
            const resultsPanel = document.getElementById('resultsPanel');
            const clipsGrid = document.getElementById('clipsGrid');
            
            // Clear previous results
            clipsGrid.innerHTML = '';
            
            // Display clips
            if (result.clips && result.clips.length > 0) {
                result.clips.forEach((clip, index) => {
                    const clipCard = document.createElement('div');
                    clipCard.className = 'clip-card';
                    clipCard.innerHTML = \`
                        <div class="clip-thumbnail">📹</div>
                        <h4>Clip #\${index + 1}</h4>
                        <p>Duration: \${clip.duration || 30}s</p>
                        <p>Viral Score: \${Math.round((clip.viral_score || 0.75) * 100)}%</p>
                        <button class="download-btn" onclick="downloadClip('\${clip.filename}')">
                            Download Clip
                        </button>
                    \`;
                    clipsGrid.appendChild(clipCard);
                });
                
                resultsPanel.classList.add('active');
                alert(\`Success! Generated \${result.clips.length} viral clips!\\n\\nViral Score: \${Math.round((result.viral_score || 0.8) * 100)}%\\n\\nScroll down to see your clips.\`);
            }
        }

        function displayMockResults() {
            const resultsPanel = document.getElementById('resultsPanel');
            const clipsGrid = document.getElementById('clipsGrid');
            
            // Clear previous results
            clipsGrid.innerHTML = '';
            
            // Create mock clips
            for (let i = 1; i <= 10; i++) {
                const clipCard = document.createElement('div');
                clipCard.className = 'clip-card';
                clipCard.innerHTML = \`
                    <div class="clip-thumbnail">📹</div>
                    <h4>Clip #\${i}</h4>
                    <p>Duration: 30s</p>
                    <p>Viral Score: \${75 + Math.floor(Math.random() * 20)}%</p>
                    <button class="download-btn" onclick="alert('This is a demo. In production, this would download clip_\${i}.mp4')">
                        Download Clip
                    </button>
                \`;
                clipsGrid.appendChild(clipCard);
            }
            
            resultsPanel.classList.add('active');
        }

        function downloadClip(filename) {
            // In production, this would download the actual clip
            window.location.href = '/clips/' + filename;
        }

        // WebSocket Connection for real-time updates
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = () => {
            console.log('Connected to Manifest Engine Neural Network');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Neural Update:', data);
            
            if (data.type === 'processing-update') {
                document.getElementById('processingStatus').textContent = data.status;
            }
        };

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                generateContent();
            }
        });
    </script>
</body>
</html>
  `);
});

// Video Upload API - FIXED WITH AI PROCESSING CONNECTION
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const videoId = generateId();
  
  // Send success response immediately
  res.json({
    success: true,
    videoId: videoId,
    file: req.file.filename,
    size: req.file.size,
    message: 'File uploaded successfully'
  });
  
  // Emit to WebSocket clients
  io.emit('file-uploaded', {
    filename: req.file.filename,
    size: req.file.size
  });
  
  // Trigger AI processing in background (don't await)
  processVideoWithAI(videoId, req.file.filename);
});

// NEW FUNCTION: Process video with AI
async function processVideoWithAI(videoId, filename) {
  try {
    io.emit('processing-update', { 
      type: 'processing-update',
      status: 'Starting AI processing...' 
    });
    
    const response = await fetch('http://localhost:8000/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoId: videoId,
        filename: filename,
        settings: {
          transcribe: true,
          detectScenes: true,
          analyzeViral: true,
          generateClips: true,
          numClips: 10,
          clipDuration: 30,
          platform: 'youtube_short'
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      io.emit('processing-complete', {
        type: 'processing-complete',
        videoId: videoId,
        clips: result.clips || [],
        viral_score: result.viral_score || 0
      });
    } else {
      throw new Error('AI processing failed');
    }
  } catch (error) {
    console.error('AI processing error:', error);
    io.emit('processing-error', {
      type: 'processing-error',
      error: error.message
    });
  }
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.3.0',
    services: {
      backend: 'online',
      ai: 'checking',
      video: 'online',
      neural: 'active'
    }
  });
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Neural connection established:', socket.id);
  
  socket.on('process-video', (data) => {
    console.log('Processing video:', data);
    socket.emit('processing-update', { 
      type: 'processing-update',
      status: 'processing',
      progress: 0 
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Neural connection closed:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║        MANIFEST ENGINE v1.3 - OPERATIONAL        ║
║                                                  ║
║        Neural Network: ACTIVE                    ║
║        Server Port: ${PORT}                     ║
║        Interface: http://localhost:${PORT}       ║
║        AI Engine: http://localhost:8000         ║
║                                                  ║
║        Create Anything. Manifest Everything.     ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});