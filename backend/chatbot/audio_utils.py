import os
import tempfile
import subprocess
import base64
import logging

logger = logging.getLogger(__name__)

def convert_wav_to_ogg_opus(wav_base64: str) -> tuple[str, str]:
    """
    Takes a base64 encoded WAV audio, saves it temporarily, converts it to OGG Opus via ffmpeg,
    and returns a tuple of (base64_audio, mime_type).
    
    If conversion fails, gracefully falls back to returning the original WAV.
    """
    original_size = len(wav_base64)
    logger.info(f"Incoming WAV audio size: {original_size} characters.")
    
    wav_bytes = base64.b64decode(wav_base64)
    
    temp_wav_path = None
    temp_ogg_path = None
    
    try:
        # Create temp files
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f_wav:
            f_wav.write(wav_bytes)
            temp_wav_path = f_wav.name
            
        with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as f_ogg:
            temp_ogg_path = f_ogg.name
            
        # Run ffmpeg to convert to ogg opus
        # ffmpeg -y -i input.wav -c:a libopus -b:a 32k output.ogg
        command = [
            "ffmpeg", "-y",
            "-i", temp_wav_path,
            "-c:a", "libopus",
            "-b:a", "32k",
            temp_ogg_path
        ]
        
        process = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        
        if process.returncode != 0:
            logger.error(f"FFmpeg conversion failed. Stderr: {process.stderr}")
            # Fallback to original WAV
            return wav_base64, "audio/wav"
            
        # Read the new OGG file
        with open(temp_ogg_path, "rb") as f:
            ogg_bytes = f.read()
            
        ogg_base64 = base64.b64encode(ogg_bytes).decode('utf-8')
        logger.info(f"Successfully converted to OGG. New size: {len(ogg_base64)} characters.")
        
        return ogg_base64, "audio/ogg"
        
    except Exception as e:
        logger.error(f"Error during audio conversion: {e}")
        return wav_base64, "audio/wav"
        
    finally:
        # Cleanup
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
        if temp_ogg_path and os.path.exists(temp_ogg_path):
            os.remove(temp_ogg_path)
