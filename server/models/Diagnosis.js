/* ==========================================================================
   KRISHIMITRA AI - Crop Diagnosis History Schema (MongoDB)
   Stores AI leaf disease scans, severity ratings, remedies, and timestamps.
   ========================================================================== */

const mongoose = require('mongoose');

const DiagnosisSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true
    },
    crop: {
      type: String,
      default: 'Unknown Crop'
    },
    cropEn: {
      type: String,
      default: ''
    },
    condition: {
      type: String,
      default: 'Healthy'
    },
    diseaseEn: {
      type: String,
      default: ''
    },
    severity: {
      type: String,
      default: 'Moderate'
    },
    confidence: {
      type: Number,
      default: 0
    },
    symptoms: {
      type: [String],
      default: []
    },
    organicSolution: {
      type: [String],
      default: []
    },
    chemicalSolution: {
      type: [String],
      default: []
    },
    prevention: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Diagnosis || mongoose.model('Diagnosis', DiagnosisSchema);

