---
name: "svg-to-png"
description: "Converts SVG files to PNG format with high quality. Invoke when user needs to convert SVG images to PNG, batch process SVG files, or generate raster images from vector graphics."
---

# SVG to PNG Converter

A production-ready skill for converting SVG files to PNG format using Node.js with high-quality rendering.

## Features

- **High Quality Rendering**: Uses `@resvg/resvg-js` (Rust-based SVG renderer)
- **Flexible Input**: Support single file, multiple files, or entire directories
- **Customizable Output**: Configure size, DPI, background color, quality
- **Batch Processing**: Convert multiple SVGs efficiently
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites
- Node.js 16+ installed

### Install Dependencies

```bash
npm install @resvg/resvg-js sharp
```

Or use the provided package.json:

```bash
npm install
```

## Usage

### 1. Single File Conversion

```javascript
const { convertSvgToPng } = require('./svg-to-png');

// Basic usage
await convertSvgToPng('input.svg', 'output.png');

// With options
await convertSvgToPng('input.svg', 'output.png', {
  width: 800,
  height: 600,
  background: '#ffffff',
  quality: 90
});
```

### 2. Batch Conversion

```javascript
const { batchConvert } = require('./svg-to-png');

// Convert all SVGs in a directory
await batchConvert('./svgs/', './pngs/', {
  width: 1024,
  height: 1024,
  background: 'transparent'
});
```

### 3. Command Line Usage

```bash
# Single file
node svg-to-png.js input.svg output.png

# With options
node svg-to-png.js input.svg output.png --width 800 --height 600 --bg white

# Batch conversion
node svg-to-png.js --batch ./svgs/ ./pngs/
```

## API Reference

### `convertSvgToPng(input, output, options)`

Converts a single SVG file to PNG.

**Parameters:**
- `input` (string): Path to input SVG file
- `output` (string): Path to output PNG file
- `options` (object, optional):
  - `width` (number): Output width in pixels
  - `height` (number): Output height in pixels
  - `scale` (number): Scale factor (default: 1)
  - `background` (string): Background color (e.g., '#ffffff', 'transparent')
  - `quality` (number): PNG compression level 0-9 (default: 6)

**Returns:** Promise resolving to conversion result object

### `batchConvert(inputDir, outputDir, options)`

Converts all SVG files in a directory.

**Parameters:**
- `inputDir` (string): Directory containing SVG files
- `outputDir` (string): Directory for output PNG files
- `options` (object, optional): Same as `convertSvgToPng`

## Examples

### Example 1: Convert with specific dimensions
```javascript
await convertSvgToPng('logo.svg', 'logo.png', {
  width: 512,
  height: 512,
  background: '#ffffff'
});
```

### Example 2: High-DPI export for retina displays
```javascript
await convertSvgToPng('icon.svg', 'icon@2x.png', {
  width: 100,
  height: 100,
  scale: 2  // Outputs 200x200
});
```

### Example 3: Transparent background
```javascript
await convertSvgToPng('illustration.svg', 'illustration.png', {
  width: 1200,
  background: 'transparent'
});
```

## Troubleshooting

### Common Issues

1. **Fonts not rendering correctly**
   - Ensure system fonts are available
   - Use web-safe fonts or embed fonts in SVG

2. **Out of memory on large batch**
   - Process files in smaller batches
   - Increase Node.js memory: `node --max-old-space-size=4096 svg-to-png.js`

3. **Permission errors**
   - Check write permissions for output directory
   - Run with appropriate privileges

## Technical Details

- **Rendering Engine**: `@resvg/resvg-js` (Rust-based, supports SVG 1.1)
- **Image Processing**: `sharp` (libvips-based, high performance)
- **Supported SVG Features**: CSS, gradients, patterns, filters, text
