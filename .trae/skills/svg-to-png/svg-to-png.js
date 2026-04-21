#!/usr/bin/env node

/**
 * SVG to PNG Converter
 * High-quality SVG to PNG conversion with style system
 */

const { convertSvgToPng } = require('./src/converter');
const { batchConvert } = require('./src/batch');
const { mergeConfig } = require('./src/config');

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    batch: false,
    config: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--batch':
      case '-b':
        options.batch = true;
        break;
      case '--output':
      case '-o':
        options.config.output = { path: args[++i] };
        break;
      case '--size':
      case '-s':
        options.config.size = { baseSize: parseInt(args[++i]) };
        break;
      case '--scales':
        const scales = args[++i].split(',').map(s => parseInt(s.trim()));
        options.config.size = { ...options.config.size, generateScales: scales };
        break;
      case '--theme':
      case '-t':
        options.config.style = { theme: args[++i] };
        break;
      case '--color':
      case '-c':
        options.config.style = { 
          ...options.config.style,
          color: { type: 'solid', value: args[++i] }
        };
        break;
      case '--naming':
      case '-n':
        options.config.output = { 
          ...options.config.output,
          naming: args[++i]
        };
        break;
      case '--help':
      case '-h':
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
  svg-to-png <input> [options]
  svg-to-png --batch <input-dir> [options]

Options:
  -o, --output <path>      Output directory (default: ./output)
  -s, --size <number>      Base size in pixels (default: 24)
  --scales <1,2,3>         Generate multi-scale images (e.g., 1,2,3)
  -t, --theme <name>       Theme: apple-flat | apple-outline | apple-gradient
  -c, --color <hex>        Icon color (e.g., #007AFF)
  -n, --naming <pattern>   Output naming pattern: {name}, {scale}, {size}
  -b, --batch              Batch convert directory
  -h, --help               Show help

Examples:
  svg-to-png icon.svg
  svg-to-png icon.svg --scales 1,2,3
  svg-to-png icon.svg -t apple-outline -c #FF0000
  svg-to-png --batch ./icons/ -o ./pngs/ --scales 1,2
`);
}

// CLI entry point
if (require.main === module) {
  const args = parseArgs();

  if (args.batch) {
    // Batch mode
    if (!args.input) {
      console.error('Error: Input directory required for batch mode');
      showHelp();
      process.exit(1);
    }
    
    const outputDir = args.output || args.config.output?.path || './output';
    
    batchConvert(args.input, outputDir, args.config)
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error.message);
        process.exit(1);
      });

  } else {
    // Single file mode
    if (!args.input) {
      console.error('Error: Input file required');
      showHelp();
      process.exit(1);
    }

    convertSvgToPng(args.input, args.config)
      .then(results => {
        results.forEach(result => {
          if (result.success) {
            console.log(`✓ ${result.output} (${result.dimensions.width}x${result.dimensions.height})`);
          } else if (result.skipped) {
            console.log(`⊘ ${result.output} (skipped)`);
          } else {
            console.error(`✗ Error: ${result.error}`);
          }
        });
      })
      .catch(error => {
        console.error(`✗ Error: ${error.message}`);
        process.exit(1);
      });
  }
}

// Export for module use
module.exports = {
  convertSvgToPng,
  batchConvert,
  mergeConfig
};
