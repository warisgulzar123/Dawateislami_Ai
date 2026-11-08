const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env in project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
const Chunk = require('../models/Chunk');
const knowledgeChunks = require('../data/knowledge');

/**
 * Generates vector embedding using Google Gen AI SDK (gemini-embedding-001)
 */
async function generateEmbedding(ai, text) {
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text
    });
    return response.embeddings?.[0]?.values || [];
  } catch (error) {
    console.warn(`[Embedding Warning]: ${error.message}`);
    return [];
  }
}

/**
 * Seeds all knowledge chunks from data/knowledge.js into MongoDB,
 * generating vector embeddings for every chunk.
 */
const seedKnowledge = async () => {
  const mongoUri = process.env.MONGODB_URI;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!mongoUri) {
    console.error('❌ Error: MONGODB_URI is not defined in .env.');
    process.exit(1);
  }

  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY is not defined in .env.');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`✅ Connected to database: ${mongoose.connection.name}`);

    console.log(`📦 Loaded ${knowledgeChunks.length} chunks from data/knowledge.js`);
    console.log('⚡ Generating vector embeddings and preparing upsert operations...');

    // Process in batches of 5 to avoid rate-limits while keeping speed high
    const BATCH_SIZE = 5;
    const enrichedChunks = [];

    for (let i = 0; i < knowledgeChunks.length; i += BATCH_SIZE) {
      const batch = knowledgeChunks.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (chunk) => {
          // Combine title, Urdu content, English content, and keywords for dense vector representation
          const textToEmbed = [
            chunk.title || '',
            chunk.contentUrdu || '',
            chunk.contentEnglish || '',
            (chunk.keywords || []).join(' ')
          ]
            .filter(Boolean)
            .join('\n');

          const embedding = await generateEmbedding(ai, textToEmbed);
          return {
            ...chunk,
            embedding
          };
        })
      );

      enrichedChunks.push(...batchResults);
      console.log(`  -> Processed & embedded [${Math.min(i + BATCH_SIZE, knowledgeChunks.length)} / ${knowledgeChunks.length}] chunks...`);
    }

    console.log('💾 Writing all documents to MongoDB collection...');

    const bulkOps = enrichedChunks.map((chunk) => ({
      updateOne: {
        filter: { chunkId: chunk.chunkId },
        update: { $set: chunk },
        upsert: true
      }
    }));

    const result = await Chunk.bulkWrite(bulkOps);

    console.log('🎉 ==============================================');
    console.log('✅ [Seed Success] All knowledge chunks successfully uploaded!');
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);
    console.log(`   - Upserted: ${result.upsertedCount}`);
    console.log(`   - Total in MongoDB: ${await Chunk.countDocuments()}`);
    console.log('   - Chunks with Embeddings: ' + (await Chunk.countDocuments({ embedding: { $exists: true, $ne: [] } })));
    console.log('🎉 ==============================================');

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed Error] Failed to seed knowledge chunks:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedKnowledge();
