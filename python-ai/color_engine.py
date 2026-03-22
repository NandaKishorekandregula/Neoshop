# python-ai/color_engine.py
# Fix 3: CIEDE2000 perceptually accurate color matching
# Replaces the old Euclidean RGB distance which was perceptually wrong

import json
import os
from pyciede2000 import ciede2000

_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# Load profiles once at startup — not per request
with open(os.path.join(_DATA_DIR, 'indian_profiles.json')) as f:
    PROFILES = json.load(f)


def rgb_to_lab(r: int, g: int, b: int) -> tuple:
    """
    Convert RGB to CIELAB color space.

    CIELAB is perceptually uniform — equal distances look equal to human eyes.
    RGB is NOT perceptually uniform — equal math distances can look very different.

    Steps:
    1. Remove gamma (linearize sRGB)
    2. Convert to XYZ using D65 standard daylight matrix
    3. Convert XYZ to CIELAB

    Returns: (L*, a*, b*) where:
    - L*: lightness 0 (black) to 100 (white)
    - a*: green (-) to red (+)
    - b*: blue (-) to yellow (+)
    """
    # Step 1: Linearize (remove gamma encoding)
    def linearize(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r_lin = linearize(r)
    g_lin = linearize(g)
    b_lin = linearize(b)

    # Step 2: sRGB → XYZ (D65 illuminant matrix)
    X = r_lin * 0.4124564 + g_lin * 0.3575761 + b_lin * 0.1804375
    Y = r_lin * 0.2126729 + g_lin * 0.7151522 + b_lin * 0.0721750
    Z = r_lin * 0.0193339 + g_lin * 0.1191920 + b_lin * 0.9503041

    # Step 3: XYZ → CIELAB (normalize by D65 white point)
    X /= 0.95047
    Y /= 1.00000
    Z /= 1.08883

    def f(t):
        return t ** (1/3) if t > 0.008856 else (7.787 * t) + (16 / 116)

    fx, fy, fz = f(X), f(Y), f(Z)

    L = (116 * fy) - 16
    a = 500 * (fx - fy)
    b_lab = 200 * (fy - fz)

    return L, a, b_lab


def ciede2000_distance(rgb1: dict, rgb2: dict) -> float:
    """
    Calculate perceptual color difference using CIEDE2000 standard.

    This REPLACES the old sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²) formula.

    CIEDE2000 range: 0 (identical) to ~100 (maximally different)
    Fashion thresholds:
    - delta_E < 5:  Near-identical — excellent match
    - delta_E < 15: Clearly related — good match
    - delta_E < 30: Somewhat related — acceptable
    - delta_E > 40: Unrelated — poor match
    """
    L1, a1, b1 = rgb_to_lab(rgb1['r'], rgb1['g'], rgb1['b'])
    L2, a2, b2 = rgb_to_lab(rgb2['r'], rgb2['g'], rgb2['b'])

    result = ciede2000((L1, a1, b1), (L2, a2, b2))
    return result['delta_E_00']


# Reference RGB values for Indian fashion color names
# Used to calculate perceptual distance between product colors and recommended colors
COLOR_RGB_MAP = {
    'Mustard Yellow':  {'r': 212, 'g': 175, 'b': 55},
    'Mustard':         {'r': 212, 'g': 175, 'b': 55},
    'Terracotta':      {'r': 196, 'g': 98,  'b': 70},
    'Coral':           {'r': 255, 'g': 127, 'b': 80},
    'Rust':            {'r': 183, 'g': 65,  'b': 14},
    'Olive Green':     {'r': 107, 'g': 142, 'b': 35},
    'Olive':           {'r': 107, 'g': 142, 'b': 35},
    'Navy':            {'r': 0,   'g': 0,   'b': 128},
    'Navy Blue':       {'r': 0,   'g': 0,   'b': 128},
    'Emerald':         {'r': 0,   'g': 154, 'b': 94},
    'Emerald Green':   {'r': 0,   'g': 154, 'b': 94},
    'Gold':            {'r': 255, 'g': 215, 'b': 0},
    'Saffron':         {'r': 244, 'g': 196, 'b': 48},
    'Turmeric Yellow': {'r': 255, 'g': 195, 'b': 0},
    'Turmeric':        {'r': 255, 'g': 195, 'b': 0},
    'Peacock Blue':    {'r': 0,   'g': 160, 'b': 180},
    'Teal':            {'r': 0,   'g': 128, 'b': 128},
    'Deep Teal':       {'r': 0,   'g': 100, 'b': 100},
    'Warm Teal':       {'r': 0,   'g': 128, 'b': 120},
    'Burgundy':        {'r': 128, 'g': 0,   'b': 32},
    'Maroon':          {'r': 128, 'g': 0,   'b': 0},
    'Magenta':         {'r': 255, 'g': 0,   'b': 255},
    'Royal Blue':      {'r': 65,  'g': 105, 'b': 225},
    'Cobalt Blue':     {'r': 0,   'g': 71,  'b': 171},
    'Peach':           {'r': 255, 'g': 218, 'b': 185},
    'Camel':           {'r': 193, 'g': 154, 'b': 107},
    'Brown':           {'r': 139, 'g': 69,  'b': 19},
    'Forest Green':    {'r': 34,  'g': 139, 'b': 34},
    'Jade':            {'r': 0,   'g': 168, 'b': 107},
    'Burnt Orange':    {'r': 204, 'g': 85,  'b': 0},
    'Deep Orange':     {'r': 220, 'g': 90,  'b': 20},
    'Saffron Orange':  {'r': 244, 'g': 160, 'b': 48},
    'Black':           {'r': 0,   'g': 0,   'b': 0},
    'White':           {'r': 255, 'g': 255, 'b': 255},
}


def score_product_for_profile(product_color_rgb: dict, profile_key: str) -> float:
    """
    Score how well a product's color suits a skin profile.
    Returns 0 (bad) to 100 (perfect).

    Uses CIEDE2000 instead of Euclidean RGB distance (Fix 3).
    """
    profile = PROFILES.get(profile_key, PROFILES.get('wheatish_medium_warm'))
    best_colors = profile.get('bestColors', [])

    if not best_colors:
        return 50

    min_delta_e = float('inf')
    for color_name in best_colors:
        if color_name in COLOR_RGB_MAP:
            delta_e = ciede2000_distance(product_color_rgb, COLOR_RGB_MAP[color_name])
            min_delta_e = min(min_delta_e, delta_e)

    if min_delta_e == float('inf'):
        return 50

    # Convert CIEDE2000 delta_E to 0-100 score
    # delta_E = 0  → score = 100
    # delta_E = 20 → score = 60
    # delta_E = 50 → score = 0
    return round(max(0, 100 - (min_delta_e * 2)), 1)


def get_recommendations(profile_key: str) -> dict:
    """Return full color recommendation for a profile key."""
    profile = PROFILES.get(profile_key)
    if not profile:
        profile = PROFILES.get('wheatish_medium_warm', {})

    return {
        'profileKey':    profile_key,
        'displayName':   profile.get('displayName', 'Indian Skin Tone'),
        'description':   profile.get('description', ''),
        'commonIn':      profile.get('commonIn', []),
        'bestColors':    profile.get('bestColors', []),
        'avoidColors':   profile.get('avoidColors', []),
        'metals':        profile.get('metals', []),
        'denimShades':   profile.get('denimShades', []),
        'leatherColors': profile.get('leatherColors', []),
        'seasonalType':  profile.get('seasonalType', 'neutral')
    }