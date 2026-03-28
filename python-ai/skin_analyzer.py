# python-ai/skin_analyzer.py
# Main analysis pipeline — integrates all 4 fixes in sequence

import io
import json
import os
import base64
from PIL import Image
from dotenv import load_dotenv
from groq import Groq

# Fix 1: lighting normalization
from image_preprocessor import normalize_lighting
# Fix 2: skin segmentation
from skin_segmenter import get_skin_pixels, get_average_skin_color, create_skin_only_image
# Fix 3: CIEDE2000 color math (imported via color_engine when needed)
from color_engine import rgb_to_lab
# Fix 4: contrast detection
from contrast_analyzer import analyze_contrast

load_dotenv()

# Initialize Groq Client
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

INDIAN_SKIN_PROMPT = '''
You are an expert in South Asian / Indian skin tone analysis for fashion.

CONTEXT: This image shows ONLY the isolated skin pixels from a face.
- Background, clothing, hair, beard, eyes, and lips have been removed
- Lighting has been normalized to remove environmental color cast
- What you see is the TRUE skin color under neutral daylight conditions

Return ONLY a valid JSON object. No markdown, no explanation, just JSON:
{
  "depth": "very_fair|fair|wheatish_light|wheatish_medium|dusky|deep",
  "undertone": "warm|cool|olive",
  "confidence": <integer 0-100>,
  "seasonal_type": "spring|summer|autumn|winter|neutral",
  "notes": "<one sentence describing this specific skin tone>"
}

Depth guidelines:
- very_fair: Lightest Indian tone — Kashmir, Punjab
- fair: Light with warmth — North India
- wheatish_light: Light golden wheat — UP, Rajasthan
- wheatish_medium: Most common Indian tone — Pan-India
- dusky: Deeper tone — South India, Bengal
- deep: Richest tone — Tamil Nadu, Kerala

Undertone: warm=golden/yellow | cool=pink/red | olive=greenish/muted (common South India)
Rule: olive is very common in South Indians — never misclassify as cool
'''

async def analyze_skin_tone(image_bytes: bytes) -> dict:
    """
    Full 6-step analysis pipeline with all 4 fixes integrated.
    """
    try:
        # ── Step 1: Normalize lighting (Fix 1) ───────────────────────
        normalized_bytes, lighting_meta = normalize_lighting(image_bytes)
        print(f"[Fix 1] {lighting_meta['reason']}")

        # ── Step 2: Segment skin pixels (Fix 2) ──────────────────────
        skin_pixels, seg_meta = get_skin_pixels(normalized_bytes)

        if skin_pixels is None:
            return {
                'success': False,
                'error': seg_meta.get('error', 'Could not isolate skin pixels')
            }
        print(f"[Fix 2] Isolated {seg_meta['total_skin_pixels']} pure skin pixels")

        # ── Step 3: Get average skin color ────────────────────────────
        avg_color = get_average_skin_color(skin_pixels)
        print(f"[Step 3] Avg skin RGB: R={avg_color['r']} G={avg_color['g']} B={avg_color['b']}")

        # ── Step 4: Send skin-only image to Groq ────────────────────
        skin_image = create_skin_only_image(skin_pixels)
        
        # 1. Force the image to standard RGB to prevent transparency bugs
        skin_image = skin_image.convert("RGB") 
        
        buffered = io.BytesIO()
        # 2. Save it as a PNG instead of JPEG
        skin_image.save(buffered, format="PNG") 
        base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # 3. Update the data URI to match PNG
        img_url = f"data:image/png;base64,{base64_image}" 

        # Using Groq's official vision model
        chat_completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": INDIAN_SKIN_PROMPT},
                        {"type": "image_url", "image_url": {"url": img_url}}
                    ]
                }
            ],
            # Force JSON output to prevent parsing errors
            response_format={"type": "json_object"}
        )

        text = chat_completion.choices[0].message.content.strip()
        groq_data = json.loads(text)

        required = ['depth', 'undertone', 'confidence', 'seasonal_type', 'notes']
        for field in required:
            if field not in groq_data:
                raise ValueError(f'Groq response missing field: {field}')

        profile_key = f"{groq_data['depth']}_{groq_data['undertone']}"
        print(f"[Step 4] Profile: {profile_key} (confidence: {groq_data['confidence']}%)")

        # ── Step 5: Contrast analysis (Fix 4) ─────────────────────────
        skin_L, _, _ = rgb_to_lab(avg_color['r'], avg_color['g'], avg_color['b'])
        contrast_result = analyze_contrast(normalized_bytes, skin_L)
        if contrast_result['success']:
            print(f"[Fix 4] Contrast level: {contrast_result['level']}")
        else:
            print(f"[Fix 4] Contrast skipped: {contrast_result.get('error')}")

        # ── Step 6: Return complete result ────────────────────────────
        return {
            'success':         True,
            'profileKey':      profile_key,
            'depth':           groq_data['depth'],
            'undertone':       groq_data['undertone'],
            'confidence':      groq_data['confidence'] / 100, # Divided by 100 to fix frontend math
            'seasonalType':    groq_data['seasonal_type'],
            'geminiNotes':     groq_data['notes'], # Kept the key name same so your frontend doesn't break
            'avgSkinColor':    avg_color,
            'skinLightness':   round(skin_L, 1),
            'contrastProfile': contrast_result if contrast_result['success'] else None,
            'processingMeta': {
                'lightingAlgorithm': lighting_meta['algorithm'],
                'skinPixelsCount':   seg_meta['total_skin_pixels'],
                'originalBrightness': lighting_meta['originalBrightness']
            }
        }

    except json.JSONDecodeError as e:
        print(f"🚨 GROQ JSON ERROR: {str(e)}") 
        return {'success': False, 'error': f'Groq parse error: {str(e)}'}
    except Exception as e:
        print(f"🚨 PIPELINE ERROR: {str(e)}") 
        return {'success': False, 'error': f'Analysis failed: {str(e)}'}