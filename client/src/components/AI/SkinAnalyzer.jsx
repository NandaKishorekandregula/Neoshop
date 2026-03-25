// client/src/components/AI/SkinAnalyzer.jsx

import { useState, useRef } from 'react';
import axios from 'axios';

const SkinAnalyzer = ({ onAnalysisComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a JPG, PNG, or WebP image');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5MB');
            return;
        }
        setSelectedFile(file);
        setError('');
        setPreview(URL.createObjectURL(file));
    };

    const handleAnalyze = async () => {
        if (!selectedFile) { setError('Please select a photo first'); return; }

        setLoading(true);
        setError('');

        try {
            // Show users what is happening during analysis (takes ~10-20s now)
            setLoadingStep('Normalizing lighting...');
            await new Promise(r => setTimeout(r, 1500));
            setLoadingStep('Isolating skin pixels...');
            await new Promise(r => setTimeout(r, 1500));
            setLoadingStep('Analyzing with AI...');

            const formData = new FormData();
            formData.append('photo', selectedFile);

            const token = localStorage.getItem('token');
            const response = await axios.post('/api/ai/analyze', formData, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 50000  // 50s — pipeline now takes longer due to preprocessing
            });

            setLoadingStep('Complete!');
            if (onAnalysisComplete) onAnalysisComplete(response.data);

        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="skin-analyzer">
            <h2>Discover Your Color Profile</h2>
            <p>Upload a clear front-facing selfie for AI-powered Indian fashion recommendations</p>

            <input
                type="file" ref={fileInputRef} onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: 'none' }}
            />

            {!preview ? (
                <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                    <span style={{ fontSize: '48px' }}>📸</span>
                    <p>Click to upload your photo</p>
                    <small>JPG, PNG or WebP • Max 5MB • Front-facing works best</small>
                </div>
            ) : (
                <div className="preview-container">
                    <img src={preview} alt="Preview" className="preview-image" />
                    <button onClick={() => fileInputRef.current.click()}>Change Photo</button>
                </div>
            )}

            {error && <p className="error-msg" style={{ color: 'red' }}>{error}</p>}

            {/* Loading state shows each pipeline step */}
            {loading && (
                <div className="loading-steps">
                    <div className="spinner"></div>
                    <p>{loadingStep}</p>
                    <small>Our AI runs 4 processing steps for maximum accuracy</small>
                </div>
            )}

            <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                className="analyze-btn"
            >
                {loading ? 'Analyzing...' : 'Analyze My Skin Tone'}
            </button>

            {!loading && (
                <div className="tips-box">
                    <p><strong>Tips for best results:</strong></p>
                    <ul>
                        <li>Use a well-lit, clear front-facing photo</li>
                        <li>Natural daylight gives best results</li>
                        <li>Remove glasses if possible</li>
                        <li>Our AI normalizes lighting automatically — any environment works</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SkinAnalyzer;