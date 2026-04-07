/**
 * Tests for UserAgentGenerator
 */

import { UserAgentGenerator, generateUserAgent } from '../src/utils/userAgent.js';

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

console.log('Running UserAgentGenerator tests...\n');

const generator = new UserAgentGenerator();

test('Generate random user agent', () => {
  const ua = generator.generate();
  if (!ua || ua.length === 0) {
    throw new Error('Generated user agent is empty');
  }
});

test('Generate Chrome user agent', () => {
  const ua = generator.generate({ browser: 'chrome' });
  if (!ua.includes('Chrome')) {
    throw new Error('Expected Chrome user agent');
  }
});

test('Generate Firefox user agent', () => {
  const ua = generator.generate({ browser: 'firefox' });
  if (!ua.includes('Firefox')) {
    throw new Error('Expected Firefox user agent');
  }
});

test('Generate Safari user agent', () => {
  const ua = generator.generate({ browser: 'safari' });
  if (!ua.includes('Safari')) {
    throw new Error('Expected Safari user agent');
  }
});

test('Generate mobile user agent', () => {
  const ua = generator.generate({ browser: 'mobile' });
  if (!ua.includes('iPhone') && !ua.includes('Android')) {
    throw new Error('Expected mobile user agent');
  }
});

test('Filter by OS - Windows', () => {
  const ua = generator.generate({ browser: 'chrome', os: 'windows' });
  if (!ua.includes('Windows')) {
    throw new Error('Expected Windows user agent');
  }
});

test('Filter by OS - Mac', () => {
  const ua = generator.generate({ browser: 'chrome', os: 'mac' });
  if (!ua.includes('Mac')) {
    throw new Error('Expected Mac user agent');
  }
});

test('Filter by OS - Linux', () => {
  const ua = generator.generate({ browser: 'chrome', os: 'linux' });
  if (!ua.includes('Linux')) {
    throw new Error('Expected Linux user agent');
  }
});

test('Get stats', () => {
  const stats = generator.getStats();
  if (stats.total === 0) {
    throw new Error('Expected non-zero total');
  }
});

test('Generate user agent (convenience function)', () => {
  const ua = generateUserAgent();
  if (!ua || ua.length === 0) {
    throw new Error('Generated user agent is empty');
  }
});

test('Sequential generation', () => {
  const gen = new UserAgentGenerator({ random: false });
  const ua1 = gen.generate({ browser: 'chrome' });
  const ua2 = gen.generate({ browser: 'chrome' });
  // Sequential should give different results if multiple available
  const stats = gen.getStats();
  if (stats.chrome > 1 && ua1 === ua2) {
    throw new Error('Expected different user agents in sequential mode');
  }
});

console.log('\n✓ All tests completed');
