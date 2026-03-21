// server/models/SkinAnalysis.js
// Stores every skin analysis — user history + future ML training data

const mongoose = require('mongoose');

const skinAnalysisSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  photoUrl: { type: String, required: true },

  // Raw Gemini response — kept for debugging and future reprocessing
  geminiRaw: { type: Object },

  // Processed result
  result: {
    depthLevel:        { type: String },
    undertone:         { type: String },
    profileKey:        { type: String },
    confidence:        { type: Number },
    seasonalType:      { type: String },
    geminiNotes:       { type: String },
    recommendedColors: [String],
    avoidColors:       [String]
  },

  // Fix 4: contrast data saved per analysis
  contrastProfile: {
    level:             { type: String },
    skinLightness:     { type: Number },
    hairLightness:     { type: Number },
    lightnessGap:      { type: Number },
    hairColorCategory: { type: String }
  },

  // Fix metadata — for debugging and quality monitoring
  processingMeta: {
    lightingAlgorithm: { type: String },   // 'gray_world' or 'white_patch'
    skinPixelsCount:   { type: Number },   // How many skin pixels were sampled
    originalBrightness:{ type: Number }    // Image brightness before normalization
  },

  // User rates whether the analysis was accurate
  userFeedback: {
    helpful: { type: Boolean },
    comment: { type: String }
  },

  analyzedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkinAnalysis', skinAnalysisSchema);