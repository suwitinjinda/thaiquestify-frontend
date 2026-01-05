// test-api.js - Run this to test your connection
import api, { testBackendConnection } from './services/api';

async function runTests() {
  console.log('🧪 Running API connection tests...');

  // Test 1: Backend connection
  const connectionTest = await testBackendConnection();
  console.log('Test 1 - Backend Connection:', connectionTest.success ? '✅ PASS' : '❌ FAIL');

  // Test 2: Make a sample request
  try {
    const response = await api.get('/test-connection');
    console.log('Test 2 - Sample Request:', response.status === 200 ? '✅ PASS' : '❌ FAIL');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Test 2 - Sample Request: ❌ FAIL');
    console.error('Error:', error.message);
  }
}

runTests();