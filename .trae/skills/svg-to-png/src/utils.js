/**
 * Utility functions for SVG to PNG converter
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Ensure directory exists, create if not
 * @param {string} dirPath - Directory path
 */
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Check if file exists
 * @param {string} filePath - File path
 * @returns {Promise<boolean>} True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
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
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  let width = 24;
  let height = 24;

  if (widthMatch) {
    const parsed = parseFloat(widthMatch[1]);
    if (!isNaN(parsed)) width = parsed;
  }
  if (heightMatch) {
    const parsed = parseFloat(heightMatch[1]);
    if (!isNaN(parsed)) height = parsed;
  }

  // If no width/height but has viewBox, calculate from viewBox
  if ((!widthMatch || !heightMatch) && viewBoxMatch) {
    const viewBox = viewBoxMatch[1].split(/\s+/).map(Number);
    if (viewBox.length === 4) {
      if (!widthMatch) width = viewBox[2];
      if (!heightMatch) height = viewBox[3];
    }
  }

  return { width, height };
}

/**
 * Apply style configuration to SVG content
 * @param {string} svgString - Original SVG content
 * @param {Object} styleConfig - Style configuration
 * @returns {string} Styled SVG content
 */
function applyStyleToSvg(svgString, styleConfig) {
  let styledSvg = svgString;
  
  // Apply color based on type
  if (styleConfig.color.type === 'gradient' && styleConfig.color.gradient) {
    const { angle, stops } = styleConfig.color.gradient;
    const gradientId = 'iconGradient';
    const gradientDef = `
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle - 45})">
          ${stops.map((stop, i) => `<stop offset="${i * 100 / (stops.length - 1)}%" stop-color="${stop}"/>`).join('')}
        </linearGradient>
      </defs>
    `;
    
    // Insert gradient def and apply to paths
    styledSvg = styledSvg.replace(/<svg([^>]*)>/, `<svg$1>${gradientDef}`);
    styledSvg = styledSvg.replace(/fill="[^"]*"/g, `fill="url(#${gradientId})"`);
    styledSvg = styledSvg.replace(/stroke="[^"]*"/g, `stroke="url(#${gradientId})"`);
  } else {
    // Solid color
    const color = styleConfig.color.value;
    styledSvg = styledSvg.replace(/fill="[^"]*"/g, `fill="${color}"`);
    styledSvg = styledSvg.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
  }

  // Apply stroke settings for outline style
  if (styleConfig.stroke.width > 0) {
    styledSvg = styledSvg.replace(/stroke-width="[^"]*"/g, `stroke-width="${styleConfig.stroke.width}"`);
    styledSvg = styledSvg.replace(/stroke-linecap="[^"]*"/g, `stroke-linecap="${styleConfig.stroke.linecap}"`);
    styledSvg = styledSvg.replace(/stroke-linejoin="[^"]*"/g, `stroke-linejoin="${styleConfig.stroke.linejoin}"`);
  }

  // Apply fill opacity
  if (styleConfig.fill.opacity < 1) {
    styledSvg = styledSvg.replace(/fill-opacity="[^"]*"/g, '');
    styledSvg = styledSvg.replace(/<path/g, `<path fill-opacity="${styleConfig.fill.opacity}"`);
  }

  return styledSvg;
}

module.exports = {
  ensureDir,
  fileExists,
  formatBytes,
  parseSvgDimensions,
  applyStyleToSvg
};
