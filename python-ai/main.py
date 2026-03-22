# python-ai/main.py
# FastAPI server — entry point of the Python AI service

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from skin_analyzer import analyze_skin_tone
from color_engine import get_recommendations
from outfit_recommender import get_outfit_recommendation
import uvicorn

app = FastAPI(
    title='NeoShop AI Service',
    description='Indian skin tone analysis and fashion recommendations',
    version='2.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


class OutfitRequest(BaseModel):
    profileKey: str
    occasion: str

class RecommendationsRequest(BaseModel):
    profileKey: str


@app.get('/health')
def health_check():
    return {'status': 'ok', 'service': 'NeoShop AI', 'version': '2.0.0'}


@app.post('/analyze')
async def analyze(file: UploadFile = File(...)):
    """
    Full pipeline: normalize lighting → segment skin → Gemini → contrast detection
    Returns complete Indian skin profile with all 4 fixes applied.
    """
    allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(400, detail='Invalid file type. Use JPG, PNG, or WebP.')

    image_bytes = await file.read()

    if len(image_bytes) < 1000:
        raise HTTPException(400, detail='File too small — may be corrupted')

    result = await analyze_skin_tone(image_bytes)

    if not result.get('success'):
        raise HTTPException(400, detail=result.get('error', 'Analysis failed'))

    return result


@app.post('/recommendations')
def get_recs(data: RecommendationsRequest):
    """Fast profile lookup — no Gemini call needed."""
    recs = get_recommendations(data.profileKey)
    return {'success': True, 'recommendations': recs}


@app.post('/outfit')
def get_outfit(data: OutfitRequest):
    """Occasion-aware outfit advice for Indian fashion."""
    outfit = get_outfit_recommendation(data.profileKey, data.occasion)
    return {'success': True, 'outfit': outfit}


if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)