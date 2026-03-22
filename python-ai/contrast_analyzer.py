# python-ai/contrast_analyzer.py
# Fix 4: Detect hair color and calculate value contrast level
# Used to give scientifically correct outfit combination advice

import cv2
import mediapipe as mp
import numpy as np
from color_engine import rgb_to_lab

mp_face_mesh = mp.solutions.face_mesh
face_mesh_contrast = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

# Topmost face landmarks — used to locate hairline
HAIRLINE_LANDMARKS = [10, 338, 297, 332, 284, 251, 389, 356, 454]


def get_hair_pixels(image_bgr: np.ndarray, face_landmarks) -> np.ndarray:
    """
    Sample pixels from just ABOVE the hairline.
    Strategy: find average Y of hairline landmarks, shift up 8% of image height.
    That region almost always contains actual hair pixels.
    """
    h, w = image_bgr.shape[:2]

    top_points = []
    for idx in HAIRLINE_LANDMARKS:
        lm = face_landmarks.landmark[idx]
        top_points.append((int(lm.x * w), int(lm.y * h)))

    if not top_points:
        return None

    avg_hairline_y = sum(p[1] for p in top_points) // len(top_points)
    hair_y = max(0, avg_hairline_y - int(h * 0.08))  # Shift up 8%

    # Sample horizontal strip at hair level (20%-80% of width avoids background)
    x_start = int(w * 0.2)
    x_end = int(w * 0.8)
    hair_strip = image_bgr[hair_y:hair_y + 10, x_start:x_end]

    if hair_strip.size == 0:
        return None

    pixels = hair_strip.reshape(-1, 3)
    # Filter: remove very dark (shadows) and very bright (background/sky)
    brightness = pixels.sum(axis=1)
    valid = (brightness > 30) & (brightness < 600)
    valid_pixels = pixels[valid]

    return valid_pixels if len(valid_pixels) > 10 else None


def classify_hair_color(hair_bgr: np.ndarray) -> str:
    """
    Classify hair color by L* (lightness) in CIELAB.
    L* thresholds are based on real hair color spectrophotometry data.
    """
    median_bgr = np.median(hair_bgr, axis=0)
    # Note: OpenCV uses BGR, convert to RGB for our rgb_to_lab function
    r, g, b = int(median_bgr[2]), int(median_bgr[1]), int(median_bgr[0])
    L, _, _ = rgb_to_lab(r, g, b)

    if L < 20:   return 'black'
    elif L < 35: return 'dark_brown'
    elif L < 50: return 'medium_brown'
    elif L < 65: return 'light_brown'
    elif L < 80: return 'gray'
    else:        return 'blonde'


def calculate_contrast_level(skin_L: float, hair_L: float) -> dict:
    """
    Calculate value contrast from CIELAB lightness difference.

    This is the core of professional colour styling theory.
    The lightness gap determines what outfit combinations look harmonious.

    Thresholds:
    - gap > 30: High contrast (stark difference)
    - gap 15-30: Medium contrast
    - gap < 15: Low contrast (tonal)
    """
    gap = abs(skin_L - hair_L)

    if gap > 30:
        return {
            'level': 'high',
            'description': 'High contrast face — stark difference between skin and hair',
            'outfitPrinciple': (
                'Your high contrast coloring is bold and striking. '
                'Mirror this with high contrast outfits — pair light and dark pieces. '
                'Example: Navy suit with a crisp white shirt works perfectly. '
                'Avoid tonal monochromatic outfits — they will look washed out on you.'
            ),
            'bestCombos': [
                'Dark navy / black bottom + white / cream top',
                'Dark suit + light shirt (high contrast pairing)',
                'White kurta + dark trousers',
                'Bold single color — your features carry it confidently'
            ],
            'avoidCombos': [
                'All-tonal outfits (same shade top and bottom)',
                'Medium-medium combinations',
                'Muted, dusty color palettes'
            ],
            'lightnessGap': round(gap, 1)
        }
    elif gap > 15:
        return {
            'level': 'medium',
            'description': 'Medium contrast face — balanced difference between skin and hair',
            'outfitPrinciple': (
                'Your medium contrast coloring is versatile. '
                'Both contrasting and tonal outfits work effectively. '
                'Moderate contrast pairings look best — avoid extremes. '
                'Example: Medium blue shirt with charcoal trousers.'
            ),
            'bestCombos': [
                'Medium tone top + slightly darker bottom',
                'Soft contrast pairings',
                'Rich jewel tones as single pieces',
                'Tonal outfits in your best colors'
            ],
            'avoidCombos': [
                'Extreme stark black + white (can look costume-like)',
                'Very muted, dusty palettes'
            ],
            'lightnessGap': round(gap, 1)
        }
    else:
        return {
            'level': 'low',
            'description': 'Low contrast face — skin and hair are close in lightness value',
            'outfitPrinciple': (
                'Your low contrast coloring is sophisticated and tonal. '
                'Monochromatic outfits look stunning on you. '
                'Avoid high contrast outfits — they overpower your natural features. '
                'Example: A dark blue shirt with a dark navy suit is perfect. '
                'A white shirt with a dark suit would look jarring and disproportionate.'
            ),
            'bestCombos': [
                'Tonal monochromatic outfits (same color family, varying shades)',
                'Deep, rich colors worn head to toe',
                'Dark suit + dark shirt in similar tones',
                'Bold single color worn fully — shirt + trouser same tone'
            ],
            'avoidCombos': [
                'White shirt with dark suit or dark trousers',
                'High contrast black + white combinations',
                'Very light colors that conflict with your deep features'
            ],
            'lightnessGap': round(gap, 1)
        }


def analyze_contrast(image_bytes: bytes, skin_lightness: float) -> dict:
    """
    Full contrast pipeline:
    1. Detect face
    2. Sample hair pixels from above hairline
    3. Classify hair color category
    4. Calculate contrast level vs skin lightness
    5. Return outfit combination advice
    """
    try:
        np_array = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

        if image_bgr is None:
            return {'success': False, 'error': 'Could not decode image'}

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        results = face_mesh_contrast.process(image_rgb)

        if not results.multi_face_landmarks:
            return {'success': False, 'error': 'No face detected for contrast analysis'}

        face_landmarks = results.multi_face_landmarks[0]
        hair_pixels = get_hair_pixels(image_bgr, face_landmarks)

        if hair_pixels is None:
            return {
                'success': False,
                'error': 'Could not detect hair — may be bald or very short hair'
            }

        hair_color_category = classify_hair_color(hair_pixels)

        # Get hair L* value
        median_bgr = np.median(hair_pixels, axis=0)
        hair_L, _, _ = rgb_to_lab(int(median_bgr[2]), int(median_bgr[1]), int(median_bgr[0]))

        contrast = calculate_contrast_level(skin_lightness, hair_L)

        return {
            'success':           True,
            'hairColorCategory': hair_color_category,
            'skinLightness':     round(skin_lightness, 1),
            'hairLightness':     round(hair_L, 1),
            'lightnessGap':      contrast['lightnessGap'],
            'level':             contrast['level'],
            'description':       contrast['description'],
            'outfitPrinciple':   contrast['outfitPrinciple'],
            'bestCombos':        contrast['bestCombos'],
            'avoidCombos':       contrast['avoidCombos']
        }

    except Exception as e:
        return {'success': False, 'error': f'Contrast analysis failed: {str(e)}'}