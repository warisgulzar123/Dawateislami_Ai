const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const Knowledge = require('../models/Knowledge');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper to invalidate AI chat knowledge cache
const notifyCacheInvalidation = () => {
  try {
    const chatRoutes = require('./chatRoutes');
    if (chatRoutes && typeof chatRoutes.invalidateCache === 'function') {
      chatRoutes.invalidateCache();
    }
  } catch (err) {
    // Ignore circular or missing reference
  }
};

// Helper to generate vector embedding using Gemini API
const generateEmbedding = async (chunk) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return undefined;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const textToEmbed = [
      chunk.title || '',
      chunk.contentUrdu || '',
      chunk.contentEnglish || '',
      Array.isArray(chunk.keywords) ? chunk.keywords.join(' ') : ''
    ]
      .filter(Boolean)
      .join('\n');

    const res = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: textToEmbed
    });

    return res.embeddings?.[0]?.values || undefined;
  } catch (err) {
    console.warn('[Knowledge Embedding Warning]:', err.message);
    return undefined;
  }
};

/**
 * @route   GET /api/knowledge
 * @desc    Get all knowledge chunks (Searchable, filterable, with stats)
 * @access  Private (Admin Only)
 */
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { search, departmentId } = req.query;
    const query = {};

    if (departmentId && departmentId !== 'all') {
      query.departmentId = departmentId;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { chunkId: searchRegex },
        { title: searchRegex },
        { departmentId: searchRegex },
        { subCategory: searchRegex },
        { contentUrdu: searchRegex },
        { contentEnglish: searchRegex },
        { keywords: searchRegex }
      ];
    }

    const chunks = await Knowledge.find(query).sort({ createdAt: -1 }).lean();
    const totalCount = await Knowledge.countDocuments();
    const verifiedCount = await Knowledge.countDocuments({ isVerified: true });

    // Distinct departments for filter dropdown
    const departments = await Knowledge.distinct('departmentId');

    return res.status(200).json({
      success: true,
      count: chunks.length,
      totalCount,
      verifiedCount,
      departments,
      data: chunks
    });
  } catch (error) {
    console.error('[Get Knowledge Error]:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve knowledge chunks.'
    });
  }
});

/**
 * @route   POST /api/knowledge
 * @desc    Create / Insert a new knowledge chunk
 * @access  Private (Admin Only)
 */
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      chunkId,
      departmentId,
      subCategory,
      title,
      contentUrdu,
      contentEnglish,
      keywords,
      sourceUrl,
      isVerified
    } = req.body;

    // Validation
    if (!chunkId || !departmentId || !title || !contentUrdu) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: chunkId, departmentId, title, and contentUrdu.'
      });
    }

    // Check unique chunkId
    const existing = await Knowledge.findOne({ chunkId: chunkId.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `A chunk with chunkId "${chunkId}" already exists. Please use a unique identifier.`
      });
    }

    // Parse keywords
    let parsedKeywords = [];
    if (Array.isArray(keywords)) {
      parsedKeywords = keywords.map((k) => k.trim()).filter(Boolean);
    } else if (typeof keywords === 'string') {
      parsedKeywords = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    }

    const chunkData = {
      chunkId: chunkId.trim(),
      departmentId: departmentId.trim(),
      subCategory: subCategory ? subCategory.trim() : '',
      title: title.trim(),
      contentUrdu: contentUrdu.trim(),
      contentEnglish: contentEnglish ? contentEnglish.trim() : '',
      keywords: parsedKeywords,
      sourceUrl: sourceUrl ? sourceUrl.trim() : 'https://www.dawateislami.net',
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true
    };

    // Generate vector embedding in background/inline so vector search works immediately
    const embedding = await generateEmbedding(chunkData);
    if (embedding) {
      chunkData.embedding = embedding;
    }

    const newChunk = await Knowledge.create(chunkData);
    notifyCacheInvalidation();

    return res.status(201).json({
      success: true,
      message: 'Knowledge chunk created successfully.',
      data: newChunk
    });
  } catch (error) {
    console.error('[Create Knowledge Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create knowledge chunk.'
    });
  }
});

/**
 * @route   PUT /api/knowledge/:id
 * @desc    Update an existing knowledge chunk
 * @access  Private (Admin Only)
 */
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      chunkId,
      departmentId,
      subCategory,
      title,
      contentUrdu,
      contentEnglish,
      keywords,
      sourceUrl,
      isVerified
    } = req.body;

    const chunk = await Knowledge.findById(id);
    if (!chunk) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge chunk not found.'
      });
    }

    // If chunkId is being updated, ensure uniqueness
    if (chunkId && chunkId.trim() !== chunk.chunkId) {
      const duplicate = await Knowledge.findOne({
        chunkId: chunkId.trim(),
        _id: { $ne: id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: `Another chunk with chunkId "${chunkId}" already exists.`
        });
      }
      chunk.chunkId = chunkId.trim();
    }

    if (departmentId !== undefined) chunk.departmentId = departmentId.trim();
    if (subCategory !== undefined) chunk.subCategory = subCategory.trim();
    if (title !== undefined) chunk.title = title.trim();
    if (contentUrdu !== undefined) chunk.contentUrdu = contentUrdu.trim();
    if (contentEnglish !== undefined) chunk.contentEnglish = contentEnglish.trim();
    if (sourceUrl !== undefined) chunk.sourceUrl = sourceUrl.trim();
    if (isVerified !== undefined) chunk.isVerified = Boolean(isVerified);

    if (keywords !== undefined) {
      if (Array.isArray(keywords)) {
        chunk.keywords = keywords.map((k) => k.trim()).filter(Boolean);
      } else if (typeof keywords === 'string') {
        chunk.keywords = keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
      }
    }

    // Refresh embedding if textual content changed
    const updatedEmbedding = await generateEmbedding(chunk);
    if (updatedEmbedding) {
      chunk.embedding = updatedEmbedding;
    }

    await chunk.save();
    notifyCacheInvalidation();

    return res.status(200).json({
      success: true,
      message: 'Knowledge chunk updated successfully.',
      data: chunk
    });
  } catch (error) {
    console.error('[Update Knowledge Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update knowledge chunk.'
    });
  }
});

/**
 * @route   DELETE /api/knowledge/:id
 * @desc    Delete a knowledge chunk
 * @access  Private (Admin Only)
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const chunk = await Knowledge.findById(id);
    if (!chunk) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge chunk not found.'
      });
    }

    await Knowledge.findByIdAndDelete(id);
    notifyCacheInvalidation();

    return res.status(200).json({
      success: true,
      message: `Knowledge chunk "${chunk.chunkId}" deleted successfully.`,
      deletedId: id
    });
  } catch (error) {
    console.error('[Delete Knowledge Error]:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete knowledge chunk.'
    });
  }
});

module.exports = router;
