#!/usr/bin/env node

/**
 * SVG to PNG Converter
 * High-quality SVG to PNG conversion using @resvg/resvg-js and sharp
 */

const fs = require('fs').promises;
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const sharp = require('sharp');

/**
 * Convert SVG file to PNG
 * @param {string} inputPath - Path to input SVG file
 * @param {string} outputPath - Path to output PNG file
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} Conversion result
 */
async function convertSvgToPng(inputPath, outputPath, options = {}) {
  const defaultOptions = {
    width: null,
    height: null,
    scale: 1,
    background: 'transparent',
    quality: 6
  };

  const config = { ...defaultOptions, ...options };

  try {
    // Read SVG file
    const svgBuffer = await fs.readFile(inputPath);
    const svgString = svgBuffer.toString('utf-8');

    // Parse SVG to get original dimensions if not specified
    const originalDimensions = parseSvgDimensions(svgString);
    
    // Calculate output dimensions
    let targetWidth = config.width || originalDimensions.width;
    let targetHeight = config.height || originalDimensions.height;
    
    if (config.scale !== 1) {
      targetWidth = targetWidth ? targetWidth * config.scale : null;
      targetHeight = targetHeight ? targetHeight * config.scale : null;
    }

    // Configure resvg options
    const resvgOptions = {
      background: config.background === 'transparent' ? 'rgba(0, 0, 0, 0)' : config.background,
      font: {
        loadSystemFonts: true,
        defaultFontFamily: 'Arial'
      }
    };

    // Set fit mode
    if (targetWidth && !targetHeight) {
      resvgOptions.fitTo = { mode: 'width', value: targetWidth };
    } else if (!targetWidth && targetHeight) {
      resvgOptions.fitTo = { mode: 'height', value: targetHeight };
    } else if (targetWidth && targetHeight) {
      resvgOptions.fitTo = { mode: 'width', value: targetWidth };
    }

    // Render SVG to PNG using resvg
    const resvg = new Resvg(svgBuffer, resvgOptions);
    const pngData = resvg.render();
    let pngBuffer = pngData.asPng();

    // Use sharp for additional processing if needed
    let sharpInstance = sharp(pngBuffer);

    // Resize if both dimensions specified
    if (targetWidth && targetHeight) {
      sharpInstance = sharpInstance.resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: config.background === 'transparent' ? { r: 0, g: 0, b: 0, alpha: 0 } : config.background
      });
    }

    // Set PNG options
    sharpInstance = sharpInstance.png({
      compressionLevel: config.quality,
      adaptiveFiltering: true
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Save output
    await sharpInstance.toFile(outputPath);

    // Get output file stats
    const stats = await fs.stat(outputPath);

    return {
      success: true,
      input: inputPath,
      output: outputPath,
      inputSize: svgBuffer.length,
      outputSize: stats.size,
      dimensions: {
        width: targetWidth || originalDimensions.width,
        height: targetHeight || originalDimensions.height
      }
    };

  } catch (error) {
    throw new Error(`Failed to convert ${inputPath}: ${error.message}`);
  }
}

/**
 * Parse SVG dimensions from SVG string
 * @param {string} svgString - SVG content
 * @returns {Object} Width and height
 */
function parseSvgDimensions(svgString) {
  const widthMatch = svgString.match(/width=["']([^"']+)["']/);
  const heightMatch = svgString.match(/height=["']([^"']+)["']/);
  const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/);

  let width = 800;
  let height = 600;

  if (widthMatch) {
    width = parseFloat(widthMatch[1]) || width;
  }
  if (heightMatch) {
    height = parseFloat(heightMatch[1]) || height;
  }

  // If no width/height but has viewBox, calculate from viewBox
  if ((!widthMatch || !heightMatch) && viewBoxMatch) {
    const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
    if (viewBox.length === 4) {
      const vbWidth = viewBox[2];
      const vbHeight = viewBox[3];
      if (!widthMatch) width = vbWidth;
      if (!heightMatch) height = vbHeight;
    }
  }

  return { width, height };
}

/**
 * Batch convert SVG files in a directory
 * @param {string} inputDir - Input directory path
 * @param {string} outputDir - Output directory path
 * @param {Object} options - Conversion options
 * @returns {Promise<Array>} Array of conversion results
 */
async function batchConvert(inputDir, outputDir, options = {}) {
  try {
    // Ensure directories exist
    await fs.mkdir(outputDir, { recursive: true });

    // Get all SVG files
    const files = await fs.readdir(inputDir);
    const svgFiles = files.filter(f => f.toLowerCase().endsWith('.svg'));

    if (svgFiles.length === 0) {
      console.log('No SVG files found in input directory');
      return [];
    }

    console.log(`Found ${svgFiles.length} SVG file(s) to convert`);

    const results = [];
    
    for (const file of svgFiles) {
      const inputPath = path.join(inputDir, file);
      const outputFileName = file.replace(/\.svg$/i, '.png');
      const outputPath = path.join(outputDir, outputFileName);

      try {
        const result = await convertSvgToPng(inputPath, outputPath, options);
        results.push(result);
        console.log(`✓ Converted: ${file} → ${outputFileName} (${formatBytes(result.outputSize)})`);
      } catch (error) {
        results.push({
          success: false,
          input: inputPath,
          error: error.message
        });
        console.error(`✗ Failed: ${file} - ${error.message}`);
      }
    }

    // Print summary
    const successful = results.filter(r => r.success).length;
    console.log(`\nConversion complete: ${successful}/${svgFiles.length} files converted successfully`);

    return results;

  } catch (error) {
    throw new Error(`Batch conversion failed: ${error.message}`);
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    batch: false,
    width: null,
    height: null,
    scale: 1,
    background: 'transparent',
    quality: 6
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--batch':
      case '-b':
        options.batch = true;
        break;
      case '--width':
      case '-w':
        options.width = parseInt(args[++i]);
        break;
      case '--height':
      case '-h':
        options.height = parseInt(args[++i]);
        break;
      case '--scale':
      case '-s':
        options.scale = parseFloat(args[++i]);
        break;
      case '--background':
      case '--bg':
        options.background = args[++i];
        break;
      case '--quality':
      case '-q':
        options.quality = parseInt(args[++i]);
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
      default:
        if (!options.input) {
          options.input = arg;
        } else if (!options.output) {
          options.output = arg;
        }
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
SVG to PNG Converter

Usage:
  node svg-to-png.js <input> <output> [options]
  node svg-to-png.js --batch <input-dir> <output-dir> [options]

Options:
  -w, --width <number>      Output width in pixels
  -h, --height <number>     Output height in pixels
  -s, --scale <number>      Scale factor (default: 1)
  --bg, --background <color> Background color (default: transparent)
  -q, --quality <0-9>       PNG compression level (default: 6)
  -b, --batch               Batch convert directory
  --help                    Show this help message

Examples:
  node svg-to-png.js logo.svg logo.png
  node svg-to-png.js icon.svg icon@2x.png --scale 2
  node svg-to-png.js --batch ./svgs/ ./pngs/ --width 800
`);
}

// CLI entry point
if (require.main === module) {
  const args = parseArgs();

  if (args.batch) {
    // Batch mode
    if (!args.input || !args.output) {
      console.error('Error: Input and output directories required for batch mode');
      showHelp();
      process.exit(1);
    }
    
    batchConvert(args.input, args.output, {
      width: args.width,
      height: args.height,
      scale: args.scale,
      background: args.background,
      quality: args.quality
    }).catch(error => {
      console.error(error.message);
      process.exit(1);
    });

  } else {
    // Single file mode
    if (!args.input || !args.output) {
      console.error('Error: Input and output files required');
      showHelp();
      process.exit(1);
    }

    convertSvgToPng(args.input, args.output, {
      width: args.width,
      height: args.height,
      scale: args.scale,
      background: args.background,
      quality: args.quality
    })
      .then(result => {
        console.log(`✓ Converted: ${result.input} → ${result.output}`);
        console.log(`  Size: ${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)}`);
        console.log(`  Dimensions: ${result.dimensions.width}x${result.dimensions.height}`);
      })
      .catch(error => {
        console.error(`✗ Error: ${error.message}`);
        process.exit(1);
      });
  }
}

// Export for use as module
module.exports = {
  convertSvgToPng,
  batchConvert
};
