from flask import Flask, render_template, request, jsonify
from diffusers import StableDiffusionPipeline
import torch
from PIL import Image
import io
import base64
import os

# Initialize Flask app
app = Flask(__name__, 
            template_folder=os.path.dirname(__file__),
            static_folder=os.path.dirname(__file__))

# -------------------------
# Load Model (only once)
# -------------------------
print("Loading AI model... This may take a moment.")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

pipe = StableDiffusionPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16 if device == "cuda" else torch.float32
)
pipe = pipe.to(device)
print("Model loaded successfully!")

# -------------------------
# Style Templates
# -------------------------
STYLE_PROMPTS = {
    "Anime": "masterpiece, best quality, anime style, vibrant colors",
    "Cartoon": "cartoon style, pixar style, 3d render, soft lighting",
    "Sketch": "pencil sketch, black and white, detailed shading",
    "Cinematic": "cinematic lighting, ultra detailed, 4k, dramatic",
    "Photorealistic": "photorealistic, highly detailed, professional photography, sharp focus",
    "Oil Painting": "oil painting, classical art, textured brushstrokes, museum quality",
    "Watercolor": "watercolor painting, soft edges, artistic, dreamy"
}

# -------------------------
# Routes
# -------------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_image():
    try:
        data = request.json
        
        prompt = data.get('prompt', '').strip()
        style = data.get('style', 'Anime')
        negative_prompt = data.get('negative_prompt', '')
        guidance_scale = float(data.get('guidance_scale', 7.5))
        num_inference_steps = int(data.get('num_inference_steps', 50))
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Apply style template
        style_prefix = STYLE_PROMPTS.get(style, '')
        final_prompt = f"{style_prefix} {prompt}" if style_prefix else prompt
        
        # Generate image
        image = pipe(
            final_prompt,
            negative_prompt=negative_prompt,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
            height=512,
            width=512
        ).images[0]
        
        # Convert image to base64
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        return jsonify({
            'success': True,
            'image': f'data:image/png;base64,{img_base64}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# -------------------------
# Run Flask app
# -------------------------
if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎨 AI Image Generator")
    print("="*50)
    print("Starting Flask server...")
    print("Open your browser and go to: http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(debug=True, port=5000)