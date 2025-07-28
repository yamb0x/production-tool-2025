#!/usr/bin/env node
/**
 * Smoke Test Script
 * Quick validation that critical services are running
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:8000';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function checkEndpoint(url, description) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeoutMs = 10000; // 10 seconds
    
    console.log(`🔍 Testing ${description}: ${url}`);
    
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log(`✅ ${description}: OK (${res.statusCode})`);
        resolve(true);
      } else {
        console.log(`❌ ${description}: Failed (${res.statusCode})`);
        resolve(false);
      }
    });
    
    req.on('timeout', () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${description}: Error - ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(timeoutMs);
  });
}

async function runSmokeTests() {
  console.log('🚀 Running smoke tests...\n');
  
  const tests = [
    { url: `${API_URL}/health`, description: 'API Health Check' },
    { url: `${API_URL}/api/health`, description: 'API Health Endpoint' },
    { url: APP_URL, description: 'Frontend App' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await checkEndpoint(test.url, test.description);
    results.push(result);
  }
  
  console.log('\n📊 Smoke Test Results:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All smoke tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some smoke tests failed!');
    process.exit(1);
  }
}

// Add WebSocket test
async function testWebSocket() {
  // This would require socket.io-client, simplified for now
  console.log('🔌 WebSocket test skipped (requires socket.io-client)');
  return true;
}

runSmokeTests().catch(console.error);