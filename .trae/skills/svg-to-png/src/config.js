/**
 * Configuration management for SVG to PNG converter
 */

const path = require('path');

/**
 * Default configuration
 */
const defaultConfig = {
  // Output configuration
  output: {
    path: './output',
    naming: '{name}.png',  // Supports {name}, {scale}, {size}
    createSubfolders: false,
    overwrite: true
  },

  // Size configuration
  size: {
    baseSize: 24,  // Base size 1x
    generateScales: []  // Multi-scale, default empty array [1, 2, 3]
  },

  // Style configuration
  style: {
    theme: 'apple-flat',  // apple-flat | apple-outline | apple-gradient
    
    // Color configuration
    color: {
      type: 'solid',  // solid | gradient
      value: '#007AFF',  // Apple system blue
      gradient: {
        angle: 135,
        stops: ['#007AFF', '#5856D6']
      }
    },

    // Stroke configuration (for outline style)
    stroke: {
      width: 0,
      linecap: 'round',
      linejoin: 'round'
    },

    // Fill configuration
    fill: {
      opacity: 1
    }
  },

  // Batch configuration
  batch: {
    enabled: false
  }
};

/**
 * Theme presets
 */
const themes = {
  'apple-flat': {
    color: { type: 'solid', value: '#007AFF' },
    stroke: { width: 0, linecap: 'round', linejoin: 'round' },
    fill: { opacity: 1 }
  },
  'apple-outline': {
    color: { type: 'solid', value: '#007AFF' },
    stroke: { width: 1.5, linecap: 'round', linejoin: 'round' },
    fill: { opacity: 0 }
  },
  'apple-gradient': {
    color: { 
      type: 'gradient', 
      gradient: { angle: 135, stops: ['#007AFF', '#5856D6'] }
    },
    stroke: { width: 0, linecap: 'round', linejoin: 'round' },
    fill: { opacity: 1 }
  }
};

/**
 * Merge user configuration with defaults
 * @param {Object} userConfig - User provided configuration
 * @returns {Object} Merged configuration
 */
function mergeConfig(userConfig = {}) {
  return {
    output: { ...defaultConfig.output, ...(userConfig.output || {}) },
    size: { ...defaultConfig.size, ...(userConfig.size || {}) },
    style: mergeStyleConfig(userConfig.style),
    batch: { ...defaultConfig.batch, ...(userConfig.batch || {}) }
  };
}

/**
 * Merge style configuration with theme defaults
 * @param {Object} styleConfig - User provided style configuration
 * @returns {Object} Merged style configuration
 */
function mergeStyleConfig(styleConfig = {}) {
  const theme = styleConfig.theme || defaultConfig.style.theme;
  const themeDefaults = themes[theme] || themes['apple-flat'];
  
  return {
    theme,
    color: { ...themeDefaults.color, ...(styleConfig.color || {}) },
    stroke: { ...themeDefaults.stroke, ...(styleConfig.stroke || {}) },
    fill: { ...themeDefaults.fill, ...(styleConfig.fill || {}) }
  };
}

/**
 * Generate output path based on naming template
 * @param {string} inputPath - Input SVG file path
 * @param {number} scale - Scale factor
 * @param {Object} config - Configuration object
 * @returns {string} Generated output path
 */
function generateOutputPath(inputPath, scale, config) {
  const basename = path.basename(inputPath, '.svg');
  const naming = config.output.naming;
  const size = config.size.baseSize * scale;
  
  const filename = naming
    .replace('{name}', basename)
    .replace('{scale}', scale)
    .replace('{size}', size);
    
  return path.join(config.output.path, filename);
}

module.exports = {
  defaultConfig,
  themes,
  mergeConfig,
  mergeStyleConfig,
  generateOutputPath
};
