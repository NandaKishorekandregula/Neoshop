// client/src/pages/AIAnalysis.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api'; // ✅ Use API utility instead of raw axios

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
    // Also handle the profileKeys returned by Gemini
    'light_warm': { name: 'Light Warm', emoji: '🌻' },
    'light_cool': { name: 'Light Cool', emoji: '💙' },
    'light_neutral': { name: 'Light Neutral', emoji: '🌿' },
    'medium_warm': { name: 'Medium Warm', emoji: '✨' },
    'medium_cool': { name: 'Medium Cool', emoji: '💫' },
    'medium_neutral': { name: 'Medium Neutral', emoji: '🍃' },
    'tan_warm': { name: 'Tan Warm', emoji: '🔥' },
    'tan_cool': { name: 'Tan Cool', emoji: '🔮' },
    'tan_neutral': { name: 'Tan Neutral', emoji: '🦚' },
    'deep_neutral': { name: 'Deep Neutral', emoji: '👑' },
    'fair_neutral': { name: 'Fair Neutral', emoji: '🌸' },
};

const OCCASIONS = [
    { key: 'daily_casual', label: 'Daily Casual' },
    { key: 'office', label: 'Office' },
    { key: 'wedding', label: 'Wedding' },
    { key: 'festive', label: 'Festive' },
    { key: 'party', label: 'Party' },
    { key: 'traditional', label: 'Traditional' },
];

const CATEGORY_LABELS = {
    tops: 'Tops & Shirts',
    bottoms: 'Pants & Bottoms',
    shoes: 'Shoes',
    accessories: 'Accessories',
    dresses: 'Dresses',
};

export default function AIAnalysis() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState('idle'); // idle | analyzing | done | error
    const [analysis, setAnalysis] = useState(null);
    const [recs, setRecs] = useState(null);
    const [outfit, setOutfit] = useState(null);
    const [occasion, setOccasion] = useState('daily_casual');
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');

    const delay = ms => new Promise(r => setTimeout(r, ms));

    // If user already has a saved skin profile, skip straight to results
    useEffect(() => {
        const saved = user?.styleProfile?.skinTone;
        if (saved?.profileKey) {
            setAnalysis({
                profileKey: saved.profileKey,
                depth: saved.depthLevel,
                undertone: saved.undertone,
                confidence: saved.confidence,
                geminiNotes: saved.geminiNotes,
                photoUrl: saved.photoUrl,
                contrastProfile: user.styleProfile?.contrastProfile || null,
            });
            setRecs({
                bestColors: user.styleProfile?.recommendedColors || [],
                avoidColors: user.styleProfile?.avoidColors || [],
            });
            setStep('done');
            fetchOutfitProducts();
        }
    }, [user]);

    const fetchOutfitProducts = async () => {
        try {
            // ✅ API utility handles base URL + auth token automatically
            const res = await API.get('/ai/outfit-products');
            setOutfit(res.data);
        } catch (e) {
            console.error('Could not load outfit products:', e.message);
        }
    };

    const handleAnalyze = async () => {
        if (!user?.profilePhoto) {
            setError('Please upload a profile photo first. Go to your Profile page.');
            return;
        }
        setStep('analyzing');
        setError('');

        try {
            setLoadingStep('Reading your profile photo...');
            await delay(800);

            setLoadingStep('Normalizing lighting...');
            await delay(1000);

            setLoadingStep('Isolating skin pixels...');
            await delay(1000);

            setLoadingStep('Analysing with Gemini AI...');

            // ✅ API utility — no need to manually pass headers or base URL
            const res = await API.post('/ai/analyze-profile', {});

            setAnalysis(res.data.analysis);
            setRecs(res.data.recommendations);
            setStep('done');

            setLoadingStep('Finding your outfit matches...');
            await fetchOutfitProducts();

        } catch (err) {
            console.error('Analysis error:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Analysis failed. Please try again.');
            setStep('error');
        }
    };

    const handleOccasionChange = async (occ) => {
        setOccasion(occ);
        try {
            // ✅ API utility
            await API.post('/ai/outfit', { occasion: occ });
        } catch (e) {
            // non-critical
        }
    };

    const handleReanalyze = () => {
        setStep('idle');
        setAnalysis(null);
        setRecs(null);
        setOutfit(null);
        setError('');
    };

    // ── IDLE / ERROR screen ───────────────────────────────────────────
    if (step === 'idle' || step === 'error') {
        return (
            <div style={{ maxWidth: 600, margin: '60px auto', padding: '0 24px' }}>
                <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
                    AI Fashion Advisor
                </h1>
                <p style={{ color: '#666', marginBottom: 32, fontSize: 15, lineHeight: 1.6 }}>
                    We analyse your profile photo to find your Indian skin tone profile
                    and recommend real outfits from our store — shirts, pants, shoes and more.
                </p>

                {/* Profile photo card */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 20,
                    background: '#f7f7f9', borderRadius: 16, padding: 20, marginBottom: 24,
                    border: '1px solid #eee'
                }}>
                    {user?.profilePhoto ? (
                        <img
                            src={user.profilePhoto}
                            alt="Your profile"
                            style={{
                                width: 80, height: 80, borderRadius: '50%',
                                objectFit: 'cover', border: '3px solid #6c47ff'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: '#ddd', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontSize: 36
                        }}>
                            👤
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>
                            {user?.profilePhoto ? '✅ Profile photo ready' : '⚠️ No profile photo yet'}
                        </p>
                        <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                            {user?.profilePhoto
                                ? 'We will use this photo for your skin analysis'
                                : 'Please upload a profile photo first'}
                        </p>
                        {!user?.profilePhoto && (
                            <button
                                onClick={() => navigate('/profile')}
                                style={{
                                    padding: '7px 16px', fontSize: 13,
                                    background: '#6c47ff', color: '#fff',
                                    border: 'none', borderRadius: 8, cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Go to Profile →
                            </button>
                        )}
                    </div>
                </div>

                {/* How it works */}
                <div style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 10 }}>
                        HOW IT WORKS
                    </p>
                    {[
                        { icon: '💡', text: 'We normalize the lighting in your photo' },
                        { icon: '🎯', text: 'We isolate your exact skin pixels using AI' },
                        { icon: '🤖', text: 'Google Gemini classifies your Indian skin profile' },
                        { icon: '👔', text: 'We recommend real products from our store that suit you' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            marginBottom: 10, fontSize: 14, color: '#444'
                        }}>
                            <span style={{ fontSize: 18 }}>{item.icon}</span>
                            {item.text}
                        </div>
                    ))}
                </div>

                {error && (
                    <div style={{
                        background: '#fff0f0', border: '1px solid #ffcccc',
                        borderRadius: 10, padding: 14, marginBottom: 20,
                        color: '#cc0000', fontSize: 14
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleAnalyze}
                    disabled={!user?.profilePhoto}
                    style={{
                        width: '100%', padding: '15px 0', fontSize: 16, fontWeight: 600,
                        background: user?.profilePhoto
                            ? 'linear-gradient(135deg, #6c47ff, #a855f7)'
                            : '#ccc',
                        color: '#fff', border: 'none', borderRadius: 14,
                        cursor: user?.profilePhoto ? 'pointer' : 'not-allowed',
                        letterSpacing: '0.3px'
                    }}
                >
                    Analyse My Skin Tone & Find Outfits
                </button>
            </div>
        );
    }

    // ── ANALYZING screen ──────────────────────────────────────────────
    if (step === 'analyzing') {
        return (
            <div style={{
                maxWidth: 480, margin: '100px auto',
                textAlign: 'center', padding: '0 24px'
            }}>
                <div style={{ fontSize: 56, marginBottom: 24 }}>🔍</div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>
                    Analysing your skin tone
                </h2>
                <p style={{ color: '#666', marginBottom: 32, fontSize: 15 }}>
                    {loadingStep}
                </p>
                <div style={{
                    height: 6, background: '#eee', borderRadius: 3,
                    overflow: 'hidden', marginBottom: 16
                }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(90deg, #6c47ff, #a855f7)',
                        borderRadius: 3,
                        animation: 'progress 2s ease-in-out infinite alternate'
                    }} />
                </div>
                <p style={{ fontSize: 13, color: '#aaa' }}>
                    This takes about 15–20 seconds
                </p>
                <style>{`
                    @keyframes progress {
                        from { width: 15%; margin-left: 0%; }
                        to   { width: 70%; margin-left: 15%; }
                    }
                `}</style>
            </div>
        );
    }

    // ── RESULTS screen ────────────────────────────────────────────────
    const profile = PROFILE_DISPLAY[analysis?.profileKey] ||
        { name: analysis?.profileKey || 'Your Profile', emoji: '✨' };

    const contrastColors = {
        high: { bg: '#fff8e1', border: '#f59e0b' },
        medium: { bg: '#e0f2fe', border: '#0ea5e9' },
        low: { bg: '#dcfce7', border: '#22c55e' },
    };
    const contrastStyle = analysis?.contrastProfile?.level
        ? contrastColors[analysis.contrastProfile.level]
        : null;

    return (
        <div style={{ maxWidth: 960, margin: '40px auto', padding: '0 24px 60px' }}>

            {/* Profile header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 20,
                marginBottom: 36, flexWrap: 'wrap',
                background: '#f7f7f9', borderRadius: 16,
                padding: 24, border: '1px solid #eee'
            }}>
                <img
                    src={analysis?.photoUrl || user?.profilePhoto}
                    alt="Profile"
                    style={{
                        width: 88, height: 88, borderRadius: '50%',
                        objectFit: 'cover', border: '3px solid #6c47ff'
                    }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 4, fontWeight: 600, letterSpacing: '0.5px' }}>
                        YOUR SKIN PROFILE
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
                        {profile.emoji} {profile.name}
                    </h1>
                    {analysis?.confidence && (
                        <div style={{ fontSize: 13, color: '#666' }}>
                            {Math.round(analysis.confidence * 100)}% confidence
                            {analysis.geminiNotes && ` · ${analysis.geminiNotes}`}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleReanalyze}
                    style={{
                        padding: '9px 18px', fontSize: 13,
                        background: 'transparent', border: '1px solid #ddd',
                        borderRadius: 10, cursor: 'pointer', color: '#555',
                        fontWeight: 500
                    }}
                >
                    Re-analyse
                </button>
            </div>

            {/* Best colours */}
            {recs?.bestColors?.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                        ✅ Your best colours
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {recs.bestColors.slice(0, 10).map((color, i) => (
                            <span key={i} style={{
                                padding: '7px 16px', borderRadius: 20, fontSize: 13,
                                background: '#f0ebff', color: '#5533cc', fontWeight: 500,
                                border: '1px solid #d4c5ff'
                            }}>
                                {color}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Avoid colours */}
            {recs?.avoidColors?.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
                        ❌ Colours to avoid
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {recs.avoidColors.slice(0, 6).map((color, i) => (
                            <span key={i} style={{
                                padding: '7px 16px', borderRadius: 20, fontSize: 13,
                                background: '#fff0f0', color: '#cc3333', fontWeight: 500,
                                border: '1px solid #ffd0d0'
                            }}>
                                {color}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Value contrast */}
            {analysis?.contrastProfile && contrastStyle && (
                <div style={{
                    background: contrastStyle.bg,
                    border: `1px solid ${contrastStyle.border}`,
                    borderRadius: 14, padding: 22, marginBottom: 28
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                            Your value contrast
                        </h2>
                        <span style={{
                            padding: '3px 12px', borderRadius: 20, fontSize: 12,
                            background: contrastStyle.border, color: '#fff', fontWeight: 700
                        }}>
                            {analysis.contrastProfile.level?.toUpperCase()}
                        </span>
                    </div>
                    <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>
                        {analysis.contrastProfile.outfitPrinciple}
                    </p>
                </div>
            )}

            {/* Occasion selector */}
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
                    Show outfits for
                </h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {OCCASIONS.map(occ => (
                        <button
                            key={occ.key}
                            onClick={() => handleOccasionChange(occ.key)}
                            style={{
                                padding: '9px 18px', borderRadius: 20, fontSize: 13,
                                border: '1.5px solid',
                                borderColor: occasion === occ.key ? '#6c47ff' : '#e0e0e0',
                                background: occasion === occ.key ? '#6c47ff' : '#fff',
                                color: occasion === occ.key ? '#fff' : '#444',
                                cursor: 'pointer',
                                fontWeight: occasion === occ.key ? 600 : 400,
                                transition: 'all 0.15s'
                            }}
                        >
                            {occ.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product recommendations */}
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
                Recommended outfits for you
            </h2>

            {outfit ? (
                Object.entries(outfit.outfit || {}).map(([category, products]) =>
                    products?.length > 0 && (
                        <div key={category} style={{ marginBottom: 40 }}>
                            <h3 style={{
                                fontSize: 15, fontWeight: 700, marginBottom: 16,
                                color: '#333', display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                <span style={{
                                    width: 4, height: 18, background: '#6c47ff',
                                    borderRadius: 2, display: 'inline-block'
                                }} />
                                {CATEGORY_LABELS[category] || category}
                            </h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: 18
                            }}>
                                {products.map(product => (
                                    <div
                                        key={product._id}
                                        onClick={() => navigate(`/products/${product._id}`)}
                                        style={{
                                            border: '1px solid #eee', borderRadius: 14,
                                            overflow: 'hidden', cursor: 'pointer',
                                            background: '#fff', transition: 'all 0.2s',
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.boxShadow = '0 8px 28px rgba(108,71,255,0.15)';
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        <div style={{ width: '100%', height: 210, background: '#f5f5f5', overflow: 'hidden' }}>
                                            <img
                                                src={product.images?.[0] || 'https://via.placeholder.com/300x300?text=No+Image'}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ padding: '14px 14px 16px' }}>
                                            <div style={{
                                                fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#111',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {product.name}
                                            </div>
                                            {product.colorData?.name && (
                                                <div style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                                                    {product.colorData.name}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 16, fontWeight: 700, color: '#6c47ff' }}>
                                                    ₹{product.price}
                                                </span>
                                                <button
                                                    onClick={e => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
                                                    style={{
                                                        padding: '6px 14px', fontSize: 12,
                                                        background: '#6c47ff', color: '#fff',
                                                        border: 'none', borderRadius: 8,
                                                        cursor: 'pointer', fontWeight: 600
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa', fontSize: 15 }}>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>👔</div>
                    Loading outfit recommendations...
                </div>
            )}

            {/* Empty state */}
            {outfit && Object.values(outfit.outfit || {}).every(arr => arr?.length === 0) && (
                <div style={{
                    textAlign: 'center', padding: '60px 24px',
                    border: '2px dashed #eee', borderRadius: 16, color: '#888'
                }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🛍️</div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No products found yet</h3>
                    <p style={{ fontSize: 14, marginBottom: 20 }}>
                        Add some products and they will appear here matched to your skin tone.
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        style={{
                            padding: '10px 24px', background: '#6c47ff',
                            color: '#fff', border: 'none', borderRadius: 10,
                            cursor: 'pointer', fontSize: 14, fontWeight: 600
                        }}
                    >
                        Browse All Products
                    </button>
                </div>
            )}
        </div>
    );
}