"""
Manifest Engine v1.3 - AI Processing Engine
Create Anything. Manifest Everything.
"""

import os
import sys
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

import cv2
import numpy as np
from moviepy.editor import VideoFileClip, concatenate_videoclips
import whisper
import torch
from transformers import pipeline
import redis
from celery import Celery

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Manifest Engine AI",
    description="AI-powered video processing engine",
    version="1.3.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI models
device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

# Load Whisper model for transcription
whisper_model = whisper.load_model("base", device=device)

# Load sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis", device=0 if device == "cuda" else -1)

# Redis connection for caching
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Celery configuration
celery_app = Celery(
    'manifest_engine',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Data models
class VideoProcessRequest(BaseModel):
    videoId: str
    filename: str
    settings: Dict[str, Any]

class VideoAnalysis(BaseModel):
    transcript: Optional[str]
    keywords: List[str]
    viral_score: float
    suggested_titles: List[str]
    suggested_hashtags: List[str]
    scenes: List[Dict[str, Any]]
    clips: List[Dict[str, Any]]

class ClipData(BaseModel):
    filename: str
    start_time: float
    end_time: float
    duration: float
    platform: str
    viral_score: float
    thumbnail: Optional[str]

# Video Processing Class
class VideoProcessor:
    def __init__(self):
        self.upload_dir = Path("../../data/uploads")
        self.clips_dir = Path("../../data/clips")
        self.processed_dir = Path("../../data/processed")
        
        # Create directories if they don't exist
        for dir_path in [self.upload_dir, self.clips_dir, self.processed_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    async def process_video(self, video_id: str, filename: str, settings: Dict[str, Any]) -> VideoAnalysis:
        """Main video processing pipeline"""
        try:
            video_path = self.upload_dir / filename
            
            if not video_path.exists():
                raise FileNotFoundError(f"Video file not found: {filename}")
            
            logger.info(f"Processing video: {filename}")
            
            # Load video
            video = VideoFileClip(str(video_path))
            duration = video.duration
            fps = video.fps
            
            # Initialize results
            results = {
                "transcript": None,
                "keywords": [],
                "viral_score": 0.0,
                "suggested_titles": [],
                "suggested_hashtags": [],
                "scenes": [],
                "clips": [],
                "duration": duration
            }
            
            # Step 1: Transcribe audio if requested
            if settings.get("transcribe", True):
                logger.info("Transcribing audio...")
                transcript = await self.transcribe_audio(video_path)
                results["transcript"] = transcript
                results["keywords"] = self.extract_keywords(transcript)
            
            # Step 2: Detect scenes
            if settings.get("detectScenes", True):
                logger.info("Detecting scenes...")
                scenes = await self.detect_scenes(video_path)
                results["scenes"] = scenes
            
            # Step 3: Analyze for viral potential
            if settings.get("analyzeViral", True):
                logger.info("Analyzing viral potential...")
                viral_analysis = await self.analyze_viral_potential(video_path, results.get("transcript"))
                results["viral_score"] = viral_analysis["score"]
                results["suggested_titles"] = viral_analysis["titles"]
                results["suggested_hashtags"] = viral_analysis["hashtags"]
            
            # Step 4: Generate clips
            if settings.get("generateClips", True):
                logger.info("Generating clips...")
                clips = await self.generate_clips(video, results["scenes"], settings)
                results["clips"] = clips
            
            # Cache results
            redis_client.setex(
                f"video_analysis:{video_id}",
                3600,  # Cache for 1 hour
                json.dumps(results)
            )
            
            logger.info(f"Processing complete for video: {filename}")
            return VideoAnalysis(**results)
            
        except Exception as e:
            logger.error(f"Error processing video: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def transcribe_audio(self, video_path: Path) -> str:
        """Transcribe audio using Whisper"""
        try:
            result = whisper_model.transcribe(str(video_path))
            return result["text"]
        except Exception as e:
            logger.error(f"Transcription error: {str(e)}")
            return ""
    
    def extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from transcript"""
        if not text:
            return []
        
        # Simple keyword extraction (can be enhanced with NLP libraries)
        import re
        from collections import Counter
        
        # Remove common stop words
        stop_words = set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                         'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were'])
        
        # Extract words
        words = re.findall(r'\b[a-z]+\b', text.lower())
        words = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Get most common words
        word_freq = Counter(words)
        keywords = [word for word, _ in word_freq.most_common(10)]
        
        return keywords
    
    async def detect_scenes(self, video_path: Path) -> List[Dict[str, Any]]:
        """Detect scene changes in video"""
        scenes = []
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            return scenes
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Simple scene detection based on frame differences
        prev_frame = None
        scene_start = 0
        threshold = 30  # Adjust based on needs
        
        for i in range(0, frame_count, int(fps)):  # Check every second
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ret, frame = cap.read()
            
            if not ret:
                break
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            if prev_frame is not None:
                diff = cv2.absdiff(prev_frame, gray)
                mean_diff = np.mean(diff)
                
                if mean_diff > threshold:
                    # Scene change detected
                    scenes.append({
                        "start": scene_start / fps,
                        "end": i / fps,
                        "duration": (i - scene_start) / fps
                    })
                    scene_start = i
            
            prev_frame = gray
        
        # Add final scene
        if scene_start < frame_count:
            scenes.append({
                "start": scene_start / fps,
                "end": frame_count / fps,
                "duration": (frame_count - scene_start) / fps
            })
        
        cap.release()
        return scenes
    
    async def analyze_viral_potential(self, video_path: Path, transcript: Optional[str]) -> Dict[str, Any]:
        """Analyze video for viral potential"""
        score = 0.0
        titles = []
        hashtags = []
        
        # Analyze visual quality
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            # Check resolution
            width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            # Higher quality = higher viral potential
            if width >= 1920 and height >= 1080:
                score += 20
            elif width >= 1280 and height >= 720:
                score += 10
            
            if fps >= 30:
                score += 10
            
            cap.release()
        
        # Analyze transcript sentiment if available
        if transcript:
            try:
                sentiment = sentiment_analyzer(transcript[:512])  # Limit text length
                if sentiment[0]['label'] == 'POSITIVE':
                    score += sentiment[0]['score'] * 30
            except:
                pass
            
            # Generate titles based on content
            words = transcript.split()[:20]
            titles = [
                f"You Won't Believe What Happens Next! {' '.join(words[:5])}...",
                f"The Truth About {' '.join(words[5:8])}",
                f"This Changed Everything: {' '.join(words[:7])}"
            ]
            
            # Generate hashtags
            from .extract_keywords import keywords
            hashtags = [f"#{kw}" for kw in keywords[:5]]
            hashtags.extend(["#viral", "#trending", "#fyp", "#foryou", "#mustwatch"])
        
        # Random boost for demonstration
        import random
        score += random.randint(10, 40)
        
        # Normalize score to 0-100
        score = min(100, max(0, score))
        
        return {
            "score": score / 100,  # Convert to 0-1 scale
            "titles": titles[:3] if titles else ["Amazing Video", "Must Watch!", "Incredible Content"],
            "hashtags": hashtags[:10] if hashtags else ["#viral", "#trending", "#video"]
        }
    
    async def generate_clips(self, video: VideoFileClip, scenes: List[Dict], settings: Dict) -> List[Dict]:
        """Generate clips from video based on scenes"""
        clips_data = []
        num_clips = min(settings.get("numClips", 5), len(scenes))
        target_duration = settings.get("clipDuration", 30)
        platform = settings.get("platform", "youtube_short")
        
        # Sort scenes by duration (prefer longer scenes)
        scenes_sorted = sorted(scenes, key=lambda x: x["duration"], reverse=True)
        
        for i, scene in enumerate(scenes_sorted[:num_clips]):
            try:
                # Calculate clip boundaries
                start_time = scene["start"]
                end_time = min(scene["end"], start_time + target_duration)
                
                # Extract clip
                clip = video.subclip(start_time, end_time)
                
                # Apply platform-specific formatting
                if platform in ["youtube_short", "tiktok", "instagram_reel"]:
                    # Vertical format (9:16)
                    clip = clip.resize(height=1920)
                    clip = clip.crop(x_center=clip.w/2, width=1080)
                
                # Generate filename
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                clip_filename = f"clip_{timestamp}_{i+1}.mp4"
                clip_path = self.clips_dir / clip_filename
                
                # Save clip
                clip.write_videofile(
                    str(clip_path),
                    codec='libx264',
                    audio_codec='aac',
                    temp_audiofile='temp-audio.m4a',
                    remove_temp=True,
                    logger=None
                )
                
                # Generate thumbnail
                thumbnail_path = self.generate_thumbnail(clip, clip_filename)
                
                clips_data.append({
                    "filename": clip_filename,
                    "duration": clip.duration,
                    "platform": platform,
                    "published": False,
                    "viral_score": 0.7 + (i * 0.05),  # Simulated score
                    "thumbnail": thumbnail_path
                })
                
            except Exception as e:
                logger.error(f"Error generating clip {i}: {str(e)}")
                continue
        
        return clips_data
    
    def generate_thumbnail(self, clip: VideoFileClip, filename: str) -> str:
        """Generate thumbnail from clip"""
        try:
            # Get frame at 1/3 of the clip duration
            frame_time = clip.duration / 3
            frame = clip.get_frame(frame_time)
            
            # Convert to image
            import PIL.Image
            image = PIL.Image.fromarray(frame)
            
            # Save thumbnail
            thumb_filename = filename.replace('.mp4', '_thumb.jpg')
            thumb_path = self.processed_dir / thumb_filename
            image.save(str(thumb_path), 'JPEG', quality=85)
            
            return thumb_filename
        except Exception as e:
            logger.error(f"Error generating thumbnail: {str(e)}")
            return None

# Initialize processor
processor = VideoProcessor()

# API Routes
@app.get("/")
async def root():
    return {
        "name": "Manifest Engine AI",
        "version": "1.3.0",
        "status": "operational",
        "device": device,
        "models": {
            "whisper": "base",
            "sentiment": "loaded"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/process")
async def process_video(request: VideoProcessRequest, background_tasks: BackgroundTasks):
    """Process video with AI"""
    try:
        # Check cache first
        cached = redis_client.get(f"video_analysis:{request.videoId}")
        if cached:
            return JSONResponse(content=json.loads(cached))
        
        # Process video
        analysis = await processor.process_video(
            request.videoId,
            request.filename,
            request.settings
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_video(file: UploadFile = File(...)):
    """Transcribe video audio"""
    try:
        # Save uploaded file temporarily
        temp_path = Path(f"/tmp/{file.filename}")
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Transcribe
        transcript = await processor.transcribe_audio(temp_path)
        
        # Clean up
        temp_path.unlink()
        
        return {"transcript": transcript}
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-viral")
async def analyze_viral(file: UploadFile = File(...)):
    """Analyze video for viral potential"""
    try:
        # Save uploaded file temporarily
        temp_path = Path(f"/tmp/{file.filename}")
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Analyze
        analysis = await processor.analyze_viral_potential(temp_path, None)
        
        # Clean up
        temp_path.unlink()
        
        return analysis
        
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Celery Tasks
@celery_app.task
def process_video_task(video_id: str, filename: str, settings: dict):
    """Background task for video processing"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        result = loop.run_until_complete(
            processor.process_video(video_id, filename, settings)
        )
        return result.dict()
    finally:
        loop.close()

if __name__ == "__main__":
    # Print startup banner
    print("""
    ============================================
       MANIFEST ENGINE AI v1.3
    ============================================
       
       AI Processing Engine Started
       
       API: http://localhost:8000
       Docs: http://localhost:8000/docs
       
       Device: {}
       
    ============================================
    """.format(device))
    
    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )