// client/src/components/AI/SkinToneResult.jsx

import { useState } from 'react';
import axios from 'axios';

const PROFILE_DISPLAY = {
    'very_fair_warm': { name: 'Very Fair Warm', emoji: '🌸' },
    'very_fair_cool': { name: 'Very Fair Cool', emoji: '❄️' },
    'fair_warm': { name: 'Fair Warm', emoji: '🌻' },
    'fair_cool': { name: 'Fair Cool', emoji: '💙' },
    'wheatish_light_warm': { name: 'Wheatish Light Warm', emoji: '🌾' },
    'wheatish_light_olive': { name: 'Wheatish Light Olive', emoji: '🌿' },
    'wheatish_medium_warm': { name: 'Wheatish Medium Warm', emoji: '✨' },
    'wheatish_medium_olive': { name: 'Wheatish Medium Olive', emoji: '🍃' },
    'wheatish_medium_cool': { name: 'Wheatish Medium Cool', emoji: '💫' },
    'dusky_warm': { name: 'Dusky Warm', emoji: '🔥' },
    'dusky_olive': { name: 'Dusky Olive', emoji: '🦚' },
    'dusky_cool': { name: 'Dusky Cool', emoji: '🔮' },
    'deep_warm': { name: 'Deep Warm', emoji: '👑' },
    'deep_olive': { name: 'Deep Olive', emoji: '🌴' },
    'deep_cool': { name: 'Deep Cool', emoji: '💎' },
};

const OCCASIONS = [
    { key: 'daily_casual', label: 'Daily Casual' },
    { key: 'office', label: 'Office' },
    { key: 'wedding', label: 'Wedding' },
    { key: 'festive', label: 'Festive' },
    { key: 'party', label: 'Party' },
    { key: 'traditional', label: 'Traditional' },
];

const CONTRAST_COLORS = {
    high: { bg: '#FFF3CD', border: '#FFC107', label: '⚡ HIGH CONTRAST' },
    medium: { bg: '#D1ECF1', border: '#17A2B8', label: '〰️ MEDIUM CONTRAST' },
    low: { bg: '#D4EDDA', border: '#28A745', label: '🌊 LOW CONTRAST' },
};

const SkinToneResult = ({ analysis, recommendations, onShopNow }) => {
    const [occasion, setOccasion] = useState('daily_casual');
    const [outfitAdvice, setOutfitAdvice] = useState(null);
    const [loadingAdvice, setLoadingAdvice] = useState(false);

    const profile = PROFILE_DISPLAY[analysis.profileKey] || {
        name: analysis.profileKey, emoji: '✨'
    };

    const getOccasionAdvice = async (selectedOccasion) => {
        setOccasion(selectedOccasion);
        setLoadingAdvice(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                '/api/ai/outfit',
                { occasion: selectedOccasion },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOutfitAdvice(response.data.outfit);
        } catch (err) {
            console.error('Outfit advice error:', err);
        } finally {
            setLoadingAdvice(false);
        }
    };

    const contrastStyle = analysis.contrastProfile
        ? CONTRAST_COLORS[analysis.contrastProfile.level]
        : null;

    return (
        <div className="skin-result">

            {/* Profile header */}
            <div className="result-header">
                <span style={{ fontSize: '64px' }}>{profile.emoji}</span>
                <div>
                    <h2>Your Skin Profile</h2>
                    <h3>{profile.name}</h3>
                    <p>Confidence: {analysis.confidence}%</p>
                    {analysis.processingMeta && (
                        <small style={{ color: '#888' }}>
                            Processed: {analysis.processingMeta.skinPixelsCount} skin pixels analyzed
                        </small>
                    )}
                </div>
            </div>

            {/* Gemini's specific note */}
            {analysis.geminiNotes && (
                <div className="gemini-notes">
                    <p><strong>About your skin tone: </strong>{analysis.geminiNotes}</p>
                </div>
            )}

            {/* Best colors */}
            <div className="color-section">
                <h4>✅ Colors That Suit You Best</h4>
                <div className="color-list">
                    {recommendations.bestColors?.map((color, i) => (
                        <span key={i} className="color-tag best">{color}</span>
                    ))}
                </div>
            </div>

            {/* Colors to avoid */}
            <div className="color-section">
                <h4>❌ Colors to Avoid</h4>
                <div className="color-list">
                    {recommendations.avoidColors?.map((color, i) => (
                        <span key={i} className="color-tag avoid">{color}</span>
                    ))}
                </div>
            </div>

            {/* Accessories */}
            <div className="accessories-section">
                <p><strong>Best Jewellery Metals:</strong> {recommendations.metals?.join(' • ')}</p>
                <p><strong>Best Denim Shades:</strong> {recommendations.denimShades?.join(' • ')}</p>
                <p><strong>Best Leather Colors:</strong> {recommendations.leatherColors?.join(' • ')}</p>
            </div>

            {/* Fix 4: Value Contrast Section */}
            {analysis.contrastProfile && contrastStyle && (
                <div
                    className="contrast-section"
                    style={{
                        background: contrastStyle.bg,
                        border: `2px solid ${contrastStyle.border}`,
                        borderRadius: '8px',
                        padding: '16px',
                        marginTop: '20px'
                    }}
                >
                    <h4>
                        Your Value Contrast:{' '}
                        <span style={{ color: contrastStyle.border, fontWeight: 'bold' }}>
                            {contrastStyle.label}
                        </span>
                    </h4>
                    <p>{analysis.contrastProfile.description}</p>
                    <p style={{ marginTop: '8px' }}>{analysis.contrastProfile.outfitPrinciple}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                        <div>
                            <h5>✅ Best Outfit Combinations</h5>
                            <ul>
                                {analysis.contrastProfile.bestCombos?.map((combo, i) => (
                                    <li key={i}>{combo}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h5>❌ Avoid These Combinations</h5>
                            <ul>
                                {analysis.contrastProfile.avoidCombos?.map((combo, i) => (
                                    <li key={i}>{combo}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Occasion tabs */}
            <div className="occasion-section" style={{ marginTop: '24px' }}>
                <h4>Get Advice For:</h4>
                <div className="occasion-tabs">
                    {OCCASIONS.map(occ => (
                        <button
                            key={occ.key}
                            className={`occasion-tab ${occasion === occ.key ? 'active' : ''}`}
                            onClick={() => getOccasionAdvice(occ.key)}
                        >
                            {occ.label}
                        </button>
                    ))}
                </div>
                {loadingAdvice && <p>Getting outfit advice...</p>}
                {outfitAdvice && !loadingAdvice && (
                    <div className="advice-box">
                        <p>{outfitAdvice.personalTip}</p>
                        <p><strong>Best fabrics:</strong> {outfitAdvice.recommendedFabrics?.join(', ')}</p>
                    </div>
                )}
            </div>

            {/* Shop CTA */}
            <button className="shop-btn" onClick={onShopNow} style={{ marginTop: '24px' }}>
                Shop for {profile.name} Skin Tone →
            </button>

        </div>
    );
};

export default SkinToneResult;