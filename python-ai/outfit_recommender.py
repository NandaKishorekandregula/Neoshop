# python-ai/outfit_recommender.py
# Occasion-based outfit advice for Indian fashion

from color_engine import get_recommendations

OCCASION_RULES = {
    'daily_casual': {
        'title': 'Daily Casual',
        'fabrics': ['cotton', 'linen', 'denim'],
        'avoidFabrics': ['silk', 'georgette'],
        'tips': 'Keep it comfortable and breathable. Cotton is your best friend for Indian weather.',
        'keyAdvice': 'Solid colors or subtle prints work best for everyday Indian casual wear.'
    },
    'office': {
        'title': 'Office / Work',
        'fabrics': ['linen', 'cotton', 'polyester'],
        'avoidFabrics': ['silk', 'chiffon', 'georgette'],
        'tips': 'Stick to muted, professional tones. Avoid very bright colors.',
        'keyAdvice': 'Your recommended neutrals (navy, charcoal, olive) are excellent for Indian office wear.'
    },
    'wedding': {
        'title': 'Wedding / Shaadi',
        'fabrics': ['silk', 'georgette', 'chiffon'],
        'avoidFabrics': ['denim', 'cotton'],
        'tips': 'Rich jewel tones and heavy fabrics are perfect. Go bold and festive.',
        'keyAdvice': 'Silk in your best colors looks stunning at Indian weddings. Gold jewelry always works.'
    },
    'festive': {
        'title': 'Festive / Puja',
        'fabrics': ['silk', 'cotton', 'georgette'],
        'avoidFabrics': ['denim'],
        'tips': 'Bright auspicious colors are perfect. Red, yellow, orange are traditionally lucky.',
        'keyAdvice': 'For Diwali: golds and warm tones. Navratri: color of the day. Holi: anything goes!'
    },
    'party': {
        'title': 'Party / Night Out',
        'fabrics': ['georgette', 'chiffon', 'polyester'],
        'avoidFabrics': ['cotton'],
        'tips': 'Bold, trendy, Western fusion. This is where you can experiment most.',
        'keyAdvice': 'Darker shades of your best colors look more glamorous for night events.'
    },
    'traditional': {
        'title': 'Traditional / Cultural',
        'fabrics': ['silk', 'cotton', 'handloom'],
        'avoidFabrics': ['polyester'],
        'tips': 'Embrace regional colors and weaves. Authentic looks are always the best.',
        'keyAdvice': 'Traditional Indian wear in your skin tone colors looks genuinely stunning.'
    }
}


def get_outfit_recommendation(profile_key: str, occasion: str) -> dict:
    """Combines skin tone profile with occasion for specific outfit advice."""
    color_recs = get_recommendations(profile_key)
    occasion_data = OCCASION_RULES.get(occasion, OCCASION_RULES['daily_casual'])
    top_colors = color_recs['bestColors'][:5]

    personal_tip = (
        f"For {occasion_data['title']}, as a {color_recs['displayName']} skin tone, "
        f"your best colors are {', '.join(top_colors[:3])}. "
        f"{occasion_data['keyAdvice']} "
        f"Best fabrics: {', '.join(occasion_data['fabrics'])}."
    )

    return {
        'profileKey':         profile_key,
        'displayName':        color_recs['displayName'],
        'occasion':           occasion,
        'occasionTitle':      occasion_data['title'],
        'topColors':          top_colors,
        'avoidColors':        color_recs['avoidColors'],
        'metals':             color_recs['metals'],
        'recommendedFabrics': occasion_data['fabrics'],
        'avoidFabrics':       occasion_data['avoidFabrics'],
        'personalTip':        personal_tip,
        'occasionTip':        occasion_data['tips'],
        'denimShades':        color_recs['denimShades'],
        'leatherColors':      color_recs['leatherColors'],
    }