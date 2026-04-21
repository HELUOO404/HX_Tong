/**
 * Core conversion engine for SVG to PNG
 */

const fs = require('fs').promises;
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { mergeConfig, generateOutputPath } = require('./config');
const { ensureDir, fileExists, formatBytes, parseSvgDimensions, applyStyleToSvg } = require('./utils');

/**
 * Convert single SVG to PNG at specific scale
 * @param {string} inputPath - Input SVG file path
 * @param {number} scale - Scale factor
 * @param {Object} userConfig - User configuration
 * @returns {Promise<Object>} Conversion result
 */
async function convertSvgToPngAtScale(inputPath, scale, userConfig = {}) {
  const config = mergeConfig(userConfig);
  const outputPath = generateOutputPath(inputPath, scale, config);

  // Check overwrite
  if (!config.output.overwrite && await fileExists(outputPath)) {
    return { skipped: true, outputPath, reason: 'File exists' };
  }

  // Read and style SVG
  const svgBuffer = await fs.readFile(inputPath);
  let svgString = svgBuffer.toString('utf-8');
  
  // Apply style
  svgString = applyStyleToSvg(svgString, config.style);
  const styledBuffer = Buffer.from(svgString, 'utf-8');

  // Calculate output size
  const originalDims = parseSvgDimensions(svgString);
  const targetWidth = Math.round(originalDims.width * scale);
  const targetHeight = Math.round(originalDims.height * scale);

  // Configure resvg
  const resvgOptions = {
    background: 'rgba(0, 0, 0, 0)',  // Transparent
    fitTo: {
      mode: 'width',
      value: targetWidth
    },
    font: {
      loadSystemFonts: true
    }
  };

  // Render
  const resvg = new Resvg(styledBuffer, resvgOptions);
  const pngData = resvg.render();
  
  // Ensure output directory
  await ensureDir(path.dirname(outputPath));
  
  // Write output
  await fs.writeFile(outputPath, pngData.asPng());

  // Get stats
  const stats = await fs.stat(outputPath);

  return {
    success: true,
    input: inputPath,
    output: outputPath,
    scale,
    dimensions: {
      width: pngData.width,
      height: pngData.height
    },
    size: stats.size
  };
}

/**
 * Convert SVG to PNG with all configured scales
 * @param {string} inputPath - Input SVG file path
 * @param {Object} userConfig - User configuration
 * @returns {Promise<Array>} Array of conversion results
 */
async function convertSvgToPng(inputPath, userConfig = {}) {
  const config = mergeConfig(userConfig);
  const scales = config.size.generateScales.length > 0 
    ? config.size.generateScales 
    : [1];

  const results = [];

  for (const scale of scales) {
    try {
      const result = await convertSvgToPngAtScale(inputPath, scale, config);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        input: inputPath,
        scale,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  convertSvgToPng,
  convertSvgToPngAtScale
};
