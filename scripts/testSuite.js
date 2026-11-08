/**
 * Complete End-to-End Test Suite for Dawat-e-Islami AI Assistant & Admin Panel
 * Tests:
 * 1. Health check
 * 2. Guest Chat access (strictly unauthenticated, no token required)
 * 3. Fixed Admin login ('admin@gmail.com' / 'admin123')
 * 4. Regular User registration & login
 * 5. Role-based Access Control (401 on missing token, 403 on user token for admin routes)
 * 6. Admin CRUD operations (List, Create, Update, Delete) on Knowledge collection
 */

require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const app = require('../server');

let server;
let adminToken = '';
let userToken = '';
let createdChunkDbId = '';
const TEST_PORT = 5099;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        ...options
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('\n========================================');
  console.log('🧪 STARTING FULL-STACK E2E TEST SUITE');
  console.log('========================================\n');

  // Wait for MongoDB to connect
  if (mongoose.connection.readyState !== 1) {
    console.log('Waiting for MongoDB connection...');
    await new Promise((res) => mongoose.connection.once('connected', res));
  }
  console.log('✅ MongoDB connected successfully.');

  // Start HTTP server on test port
  server = app.listen(TEST_PORT);
  console.log(`✅ Test server running on port ${TEST_PORT}\n`);

  try {
    // 1. Health Check
    console.log('👉 [1/8] Testing Health API...');
    const healthRes = await request({ path: '/api/health', method: 'GET' });
    if (healthRes.status === 200 && healthRes.body.status === 'ok') {
      console.log('   ✅ Health API passed:', healthRes.body);
    } else {
      throw new Error(`Health API failed with status ${healthRes.status}`);
    }

    // 2. Guest Chat Access (CRITICAL REQUIREMENT: No auth required for chat)
    console.log('\n👉 [2/8] Testing Guest Access for AI Chat (No Token)...');
    const guestChatRes = await request(
      {
        path: '/api/chat',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        message: 'اسلام علیکم، دعوتِ اسلامی کا تعارف بتائیں',
        sessionId: 'test-guest-session-001'
      }
    );
    if (guestChatRes.status === 200) {
      console.log('   ✅ Guest chat succeeded with HTTP 200 (Streaming SSE response established).');
    } else {
      throw new Error(`Guest chat failed with status ${guestChatRes.status}: ${JSON.stringify(guestChatRes.body)}`);
    }

    // 3. Fixed Admin Login ('admin@gmail.com' / 'admin123')
    console.log('\n👉 [3/8] Testing Fixed Admin Login (admin@gmail.com / admin123)...');
    const adminLoginRes = await request(
      {
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'admin@gmail.com',
        password: 'admin123'
      }
    );

    if (adminLoginRes.status === 200 && adminLoginRes.body.success && adminLoginRes.body.token) {
      adminToken = adminLoginRes.body.token;
      console.log('   ✅ Admin Login passed! User role:', adminLoginRes.body.user.role);
      console.log('   ✅ Admin Name:', adminLoginRes.body.user.name);
    } else {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
    }

    // 4. Regular User Registration & Login
    console.log('\n👉 [4/8] Testing Regular User Registration & Login...');
    const testEmail = `user_${Date.now()}@example.com`;
    const userRegRes = await request(
      {
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        name: 'Test Student',
        email: testEmail,
        password: 'password123'
      }
    );

    if (userRegRes.status === 201 && userRegRes.body.success && userRegRes.body.token) {
      userToken = userRegRes.body.token;
      console.log('   ✅ User Registration passed! Role:', userRegRes.body.user.role);
    } else {
      throw new Error(`User registration failed: ${JSON.stringify(userRegRes.body)}`);
    }

    // 5. RBAC & Security Check on Admin Endpoints
    console.log('\n👉 [5/8] Testing RBAC Security Protection on Knowledge Routes...');
    // 5a. Without Token -> Must return 401
    const noTokenRes = await request({ path: '/api/knowledge', method: 'GET' });
    if (noTokenRes.status === 401) {
      console.log('   ✅ Unauthenticated request correctly rejected with HTTP 401 Unauthorized.');
    } else {
      throw new Error(`Expected 401 without token, got ${noTokenRes.status}`);
    }

    // 5b. With Regular User Token -> Must return 403 Forbidden
    const userTokenRes = await request({
      path: '/api/knowledge',
      method: 'GET',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    if (userTokenRes.status === 403) {
      console.log('   ✅ Regular user correctly blocked from admin route with HTTP 403 Forbidden.');
    } else {
      throw new Error(`Expected 403 for user token, got ${userTokenRes.status}`);
    }

    // 6. Admin GET Knowledge (Read)
    console.log('\n👉 [6/8] Testing Admin Read Knowledge (GET /api/knowledge)...');
    const knowledgeListRes = await request({
      path: '/api/knowledge',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (knowledgeListRes.status === 200 && knowledgeListRes.body.success) {
      console.log(`   ✅ Read Knowledge passed! Total chunks: ${knowledgeListRes.body.totalCount}`);
      console.log(`   ✅ Verified chunks count: ${knowledgeListRes.body.verifiedCount}`);
      console.log(`   ✅ Unique departments: ${knowledgeListRes.body.departments.join(', ')}`);
    } else {
      throw new Error(`Admin knowledge list failed: ${JSON.stringify(knowledgeListRes.body)}`);
    }

    // 7. Admin POST Knowledge (Create)
    console.log('\n👉 [7/8] Testing Admin Create Knowledge (POST /api/knowledge)...');
    const testChunkId = `TEST_CHUNK_${Date.now()}`;
    const createRes = await request(
      {
        path: '/api/knowledge',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      {
        chunkId: testChunkId,
        departmentId: 'testing_dept',
        subCategory: 'Unit Test',
        title: 'ٹیسٹ نالج چنک برائے ایڈمن پینل',
        contentUrdu: 'یہ ایک عارضی نالج چنک ہے جو ایڈمن پینل کے فنکشنل ٹیسٹ کے دوران داخل کیا گیا ہے۔',
        contentEnglish: 'This is a temporary test chunk created during administrative automated tests.',
        keywords: ['test', 'admin', 'automated'],
        sourceUrl: 'https://www.dawateislami.net',
        isVerified: true
      }
    );

    if (createRes.status === 201 && createRes.body.success) {
      createdChunkDbId = createRes.body.data._id;
      console.log(`   ✅ Created chunk successfully! DB ID: ${createdChunkDbId}, Chunk ID: ${testChunkId}`);
    } else {
      throw new Error(`Admin create knowledge failed: ${JSON.stringify(createRes.body)}`);
    }

    // 8. Admin PUT & DELETE Knowledge (Update & Delete)
    console.log('\n👉 [8/8] Testing Admin Update & Delete Knowledge...');
    const updateRes = await request(
      {
        path: `/api/knowledge/${createdChunkDbId}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      {
        title: 'اپڈیٹ شدہ ٹیسٹ نالج چنک',
        isVerified: true
      }
    );

    if (updateRes.status === 200 && updateRes.body.success) {
      console.log(`   ✅ Chunk updated successfully! New title: ${updateRes.body.data.title}`);
    } else {
      throw new Error(`Admin update knowledge failed: ${JSON.stringify(updateRes.body)}`);
    }

    const deleteRes = await request({
      path: `/api/knowledge/${createdChunkDbId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (deleteRes.status === 200 && deleteRes.body.success) {
      console.log(`   ✅ Chunk deleted successfully! Deleted ID: ${deleteRes.body.deletedId}`);
    } else {
      throw new Error(`Admin delete knowledge failed: ${JSON.stringify(deleteRes.body)}`);
    }

    console.log('\n========================================');
    console.log('🎉 ALL 8 TESTS PASSED WITH 100% SUCCESS!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
}

runAllTests();
