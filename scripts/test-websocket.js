#!/usr/bin/env node
/**
 * WebSocket Connection Test
 * Tests WebSocket connectivity for deployment validation
 */

const { io } = require('socket.io-client');

const API_URL = process.argv[2] || 'http://localhost:8000';

async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    console.log(`🔌 Testing WebSocket connection to: ${API_URL}`);
    
    const socket = io(API_URL, {
      timeout: 10000,
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      console.log(`❌ WebSocket connection failed: ${error.message}`);
      socket.disconnect();
      reject(error);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!socket.connected) {
        console.log('⏰ WebSocket connection timeout');
        socket.disconnect();
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

testWebSocketConnection()
  .then(() => {
    console.log('🎉 WebSocket test passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ WebSocket test failed:', error.message);
    process.exit(1);
  });