const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema(
  {
    chunkId: {
      type: String,
      required: [true, 'chunkId is required'],
      unique: true,
      trim: true,
      index: true
    },
    departmentId: {
      type: String,
      required: [true, 'departmentId is required'],
      trim: true,
      index: true
    },
    subCategory: {
      type: String,
      trim: true,
      default: ''
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true
    },
    contentUrdu: {
      type: String,
      required: [true, 'contentUrdu is required'],
      trim: true
    },
    contentEnglish: {
      type: String,
      trim: true,
      default: ''
    },
    keywords: {
      type: [String],
      default: []
    },
    sourceUrl: {
      type: String,
      default: 'https://www.dawateislami.net',
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    embedding: {
      type: [Number],
      default: undefined
    }
  },
  {
    timestamps: true,
    collection: 'chunks'
  }
);

// Text index to support full-text and keyword search
knowledgeSchema.index({ title: 'text', contentUrdu: 'text', contentEnglish: 'text', keywords: 'text' });

const Knowledge = mongoose.models.Knowledge || mongoose.model('Knowledge', knowledgeSchema, 'chunks');

module.exports = Knowledge;
