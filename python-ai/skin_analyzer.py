# python-ai/skin_analyzer.py
# Main analysis pipeline — integrates all 4 fixes in sequence

import google.generativeai as genai
from PIL import Image
import io
import json
import os
from dotenv import load_dotenv

# Fix 1: lighting normalization
from image_preprocessor import normalize_lighting
# Fix 2: skin segmentation
from skin_segmenter import get_skin_pixels, get_average_skin_color, create_skin_only_image
# Fix 3: CIEDE2000 color math (imported via color_engine when needed)
from color_engine import rgb_to_lab
# Fix 4: contrast detection
from contrast_analyzer import analyze_contrast

load_dotenv()
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

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

    Step 1 (Fix 1): Normalize lighting — remove room light color cast
    Step 2 (Fix 2): Segment skin — isolate pure skin pixels only
    Step 3:         Get average skin color from segmented pixels
    Step 4:         Send skin-only image to Gemini for classification
    Step 5 (Fix 4): Analyze hair/contrast from original normalized image
    Step 6:         Return complete structured result
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

        # ── Step 4: Send skin-only image to Gemini ────────────────────
        # create_skin_only_image makes a 200x200 image of ONLY skin pixels
        # Gemini cannot be confused by beard/hair/background
        skin_image = create_skin_only_image(skin_pixels)
        response = model.generate_content([INDIAN_SKIN_PROMPT, skin_image])

        text = response.text.strip()
        text = text.replace('```json', '').replace('```', '').strip()
        gemini_data = json.loads(text)

        required = ['depth', 'undertone', 'confidence', 'seasonal_type', 'notes']
        for field in required:
            if field not in gemini_data:
                raise ValueError(f'Gemini response missing field: {field}')

        profile_key = f"{gemini_data['depth']}_{gemini_data['undertone']}"
        print(f"[Step 4] Profile: {profile_key} (confidence: {gemini_data['confidence']}%)")

        # ── Step 5: Contrast analysis (Fix 4) ─────────────────────────
        # Get skin L* (lightness) in CIELAB for contrast calculation
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
            'depth':           gemini_data['depth'],
            'undertone':       gemini_data['undertone'],
            'confidence':      gemini_data['confidence'],
            'seasonalType':    gemini_data['seasonal_type'],
            'geminiNotes':     gemini_data['notes'],
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
        return {'success': False, 'error': f'Gemini parse error: {str(e)}'}
    except Exception as e:
        return {'success': False, 'error': f'Analysis failed: {str(e)}'}