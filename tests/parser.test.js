/**
 * Tests for ResponseParser
 */

import { ResponseParser } from '../src/utils/parser.js';

const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <meta name="description" content="Test description">
</head>
<body>
  <h1>Main Title</h1>
  <p class="content">First paragraph</p>
  <p class="content">Second paragraph</p>
  <a href="/link1">Link 1</a>
  <a href="/link2">Link 2</a>
  <ul class="items">
    <li class="item">Item 1</li>
    <li class="item">Item 2</li>
    <li class="item">Item 3</li>
  </ul>
  <div class="products">
    <div class="product">
      <h2 class="name">Product 1</h2>
      <span class="price">$10</span>
    </div>
    <div class="product">
      <h2 class="name">Product 2</h2>
      <span class="price">$20</span>
    </div>
  </div>
</body>
</html>
`;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}: ${error.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('Running ResponseParser tests...\n');

const parser = new ResponseParser(testHTML);

// Test basic extraction
test('Extract single text', () => {
  const result = parser.extract({
    title: { selector: 'h1', attr: 'text' }
  });
  assertEqual(result.title, 'Main Title');
});

test('Extract multiple elements', () => {
  const result = parser.extract({
    paragraphs: { selector: 'p.content', attr: 'text', multiple: true }
  });
  assertEqual(result.paragraphs.length, 2);
  assertEqual(result.paragraphs[0], 'First paragraph');
});

test('Extract attributes', () => {
  const result = parser.extract({
    links: { selector: 'a', attr: 'href', multiple: true }
  });
  assertEqual(result.links.length, 2);
  assertEqual(result.links[0], '/link1');
});

test('Extract nested data', () => {
  const result = parser.extract({
    products: {
      selector: '.product',
      multiple: true,
      children: {
        name: { selector: '.name', attr: 'text' },
        price: { selector: '.price', attr: 'text' }
      }
    }
  });
  assertEqual(result.products.length, 2);
  assertEqual(result.products[0].name, 'Product 1');
  assertEqual(result.products[0].price, '$10');
});

test('Extract with transform', () => {
  const result = parser.extract({
    price: { 
      selector: '.price', 
      attr: 'text',
      transform: (text) => parseFloat(text.replace('$', ''))
    }
  });
  assertEqual(result.price, 10);
});

test('Get title', () => {
  assertEqual(parser.getTitle(), 'Test Page');
});

test('Get meta tags', () => {
  const meta = parser.getMetaTags();
  assertEqual(meta.description, 'Test description');
});

test('Get all links', () => {
  const links = parser.getAllLinks();
  assertEqual(links.length, 2);
});

test('Get all images', () => {
  const images = parser.getAllImages();
  assertEqual(images.length, 0);
});

test('Element exists', () => {
  assertEqual(parser.exists('h1'), true);
  assertEqual(parser.exists('nonexistent'), false);
});

test('Count elements', () => {
  assertEqual(parser.count('.item'), 3);
});

console.log('\n✓ All tests completed');
