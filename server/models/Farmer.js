/* ==========================================================================
   KRISHIMITRA AI - Farmer Profile Schema (MongoDB)
   Stores registered farmer profiles, land attributes, crops, and preferences.
   ========================================================================== */

const mongoose = require('mongoose');

const FarmerSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Kerala Farmer'
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    district: {
      type: String,
      trim: true,
      default: 'Thrissur'
    },
    location: {
      type: String,
      trim: true,
      default: 'Kerala Agro-Climatic Zone'
    },
    landArea: {
      type: String,
      default: '2.0'
    },
    farmSize: {
      type: String,
      default: '2.0 acres'
    },
    mainCrop: {
      type: String,
      default: 'Paddy'
    },
    mainCrops: {
      type: String,
      default: 'Paddy, Banana, Vegetables'
    },
    soilType: {
      type: String,
      default: 'Laterite Soil'
    },
    waterAvailability: {
      type: String,
      default: 'Moderate'
    },
    waterSource: {
      type: String,
      default: 'Open Well'
    },
    language: {
      type: String,
      default: 'ml'
    },
    autoVoice: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Farmer || mongoose.model('Farmer', FarmerSchema);

