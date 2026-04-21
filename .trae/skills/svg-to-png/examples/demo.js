/**
 * SVG to PNG Converter - Demo Script
 * 
 * This demo showcases the enhanced svg-to-png skill with:
 * - Pure icon generation (no background frames)
 * - Multi-scale support (@1x, @2x, @3x)
 * - Style system (apple-flat, apple-outline, apple-gradient)
 * - Batch conversion
 */

const { convertSvgToPng, batchConvert } = require('../svg-to-png');
const path = require('path');

async function runDemo() {
  console.log('========================================');
  console.log('  SVG to PNG Converter Demo');
  console.log('========================================\n');

  // Demo 1: Single file, default settings (apple-flat)
  console.log('Demo 1: Single file conversion (apple-flat theme)');
  console.log('------------------------------------------------');
  await convertSvgToPng('./home-icon.svg', {
    output: { path: './output/demo1' }
  });
  console.log('');

  // Demo 2: Multi-scale generation
  console.log('Demo 2: Multi-scale generation (@1x, @2x, @3x)');
  console.log('-----------------------------------------------');
  await convertSvgToPng('./heart-icon.svg', {
    output: { path: './output/demo2', naming: '{name}@{scale}x.png' },
    size: { baseSize: 24, generateScales: [1, 2, 3] }
  });
  console.log('');

  // Demo 3: Different themes
  console.log('Demo 3: Different themes comparison');
  console.log('-----------------------------------');

  // Apple flat (default)
  console.log('\n3a. Apple Flat Theme:');
  await convertSvgToPng('./user-icon.svg', {
    output: { path: './output/demo3/flat' },
    style: { theme: 'apple-flat', color: { value: '#007AFF' } }
  });

  // Apple outline
  console.log('\n3b. Apple Outline Theme:');
  await convertSvgToPng('./user-icon.svg', {
    output: { path: './output/demo3/outline' },
    style: { theme: 'apple-outline', color: { value: '#FF6B6B' } }
  });

  // Apple gradient
  console.log('\n3c. Apple Gradient Theme:');
  await convertSvgToPng('./user-icon.svg', {
    output: { path: './output/demo3/gradient' },
    style: { theme: 'apple-gradient' }
  });
  console.log('');

  // Demo 4: Custom naming pattern
  console.log('Demo 4: Custom naming pattern');
  console.log('------------------------------');
  await convertSvgToPng('./search-icon.svg', {
    output: { path: './output/demo4', naming: '{name}_{size}px.png' },
    size: { baseSize: 24, generateScales: [1, 2] }
  });
  console.log('');

  // Demo 5: Batch conversion
  console.log('Demo 5: Batch conversion with multi-scale');
  console.log('------------------------------------------');
  await batchConvert('./', './output/demo5/', {
    size: { generateScales: [1, 2] },
    style: { theme: 'apple-flat', color: { value: '#007AFF' } }
  });
  console.log('');

  console.log('========================================');
  console.log('  Demo Complete!');
  console.log('========================================');
  console.log('\nCheck ./output/ directory for results.\n');
}

// Run demo if executed directly
if (require.main === module) {
  runDemo().catch(err => {
    console.error('Demo error:', err.message);
    process.exit(1);
  });
}

module.exports = { runDemo };
