/**
 * Tests for ProxyManager
 */

import { ProxyManager } from '../src/utils/proxy.js';

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

console.log('Running ProxyManager tests...\n');

// Test basic functionality
const proxyManager = new ProxyManager([
  'http://proxy1:8080',
  'http://proxy2:8080',
  'http://proxy3:8080'
]);

test('Get current proxy', () => {
  const proxy = proxyManager.getCurrentProxy();
  assertEqual(proxy, 'http://proxy1:8080');
});

test('Rotate proxy', () => {
  proxyManager.rotate();
  const proxy = proxyManager.getCurrentProxy();
  assertEqual(proxy, 'http://proxy2:8080');
});

test('Add proxy', () => {
  proxyManager.addProxy('http://proxy4:8080');
  assertEqual(proxyManager.getCount(), 4);
});

test('Mark proxy as failed', () => {
  proxyManager.markFailed('http://proxy2:8080');
  const working = proxyManager.getWorkingProxies();
  assertEqual(working.length, 3);
});

test('Get best proxy', () => {
  proxyManager.markSuccess('http://proxy1:8080');
  proxyManager.markSuccess('http://proxy1:8080');
  const best = proxyManager.getBestProxy();
  assertEqual(best, 'http://proxy1:8080');
});

test('Remove proxy', () => {
  proxyManager.removeProxy('http://proxy4:8080');
  assertEqual(proxyManager.getCount(), 3);
});

test('Validate proxy format', () => {
  const valid = ProxyManager.isValidProxy('http://proxy:8080');
  assertEqual(valid, true);
  
  const invalid = ProxyManager.isValidProxy('invalid-proxy');
  assertEqual(invalid, false);
});

test('Parse proxy', () => {
  const parsed = ProxyManager.parseProxy('http://user:pass@proxy:8080');
  assertEqual(parsed.hostname, 'proxy');
  assertEqual(parsed.port, '8080');
  assertEqual(parsed.username, 'user');
  assertEqual(parsed.password, 'pass');
});

console.log('\n✓ All tests completed');
