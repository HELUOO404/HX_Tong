/**
 * SVG to PNG Converter - Usage Examples
 */

const { convertSvgToPng, batchConvert } = require('./svg-to-png');

async function examples() {
  // Example 1: Basic conversion
  console.log('Example 1: Basic conversion');
  try {
    const result = await convertSvgToPng('input.svg', 'output.png');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 2: Convert with specific dimensions
  console.log('\nExample 2: Convert with specific dimensions');
  try {
    const result = await convertSvgToPng('logo.svg', 'logo-512.png', {
      width: 512,
      height: 512,
      background: '#ffffff'
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 3: High-DPI export (Retina display)
  console.log('\nExample 3: High-DPI export');
  try {
    const result = await convertSvgToPng('icon.svg', 'icon@2x.png', {
      width: 100,
      height: 100,
      scale: 2  // Outputs 200x200
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 4: Transparent background
  console.log('\nExample 4: Transparent background');
  try {
    const result = await convertSvgToPng('illustration.svg', 'illustration.png', {
      width: 1200,
      background: 'transparent'
    });
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Example 5: Batch conversion
  console.log('\nExample 5: Batch conversion');
  try {
    const results = await batchConvert('./svgs/', './pngs/', {
      width: 1024,
      height: 1024,
      background: '#ffffff'
    });
    console.log('Batch complete:', results.length, 'files processed');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  examples();
}

module.exports = { examples };
