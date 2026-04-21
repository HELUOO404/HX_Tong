---
name: "svg-to-png"
description: "Converts SVG icons to PNG with configurable styles, multi-scale support, and batch processing. Invoke when user needs to convert SVG icons to PNG, generate multi-resolution images, or batch process icon sets with Apple-style design."
---

# SVG to PNG Converter

High-quality SVG to PNG conversion for icon generation with Apple-style design aesthetics.

## Features

- **Pure Icons**: Generates icon content only, no background frames
- **Multi-Scale**: Generate @1x, @2x, @3x versions for different screen densities
- **Style System**: Apple flat, outline, and gradient themes
- **Batch Processing**: Convert entire directories
- **Configurable Output**: Custom naming patterns and locations

## Installation

```bash
cd .trae/skills/svg-to-png
npm install
```

## Quick Start

### Single File

```bash
# Basic conversion
node svg-to-png.js icon.svg

# With multi-scale (generates icon.png, icon@2x.png, icon@3x.png)
node svg-to-png.js icon.svg --scales 1,2,3

# Apple outline style with custom color
node svg-to-png.js icon.svg -t apple-outline -c #FF6B6B
```

### Batch Conversion

```bash
# Convert all SVGs in directory
node svg-to-png.js --batch ./icons/ -o ./output/

# With multi-scale
node svg-to-png.js --batch ./icons/ -o ./output/ --scales 1,2
```

## Configuration

### Themes

| Theme | Description | Best For |
|-------|-------------|----------|
| `apple-flat` (default) | Solid fill, no stroke | Modern iOS apps |
| `apple-outline` | Stroke only, no fill | Toolbars, navigation |
| `apple-gradient` | Gradient fill | Featured icons, highlights |

### CLI Options

```
-o, --output <path>      Output directory (default: ./output)
-s, --size <number>      Base size in pixels (default: 24)
--scales <1,2,3>         Generate multi-scale images
-t, --theme <name>       Theme name
-c, --color <hex>        Icon color
-n, --naming <pattern>   Naming: {name}, {scale}, {size}
-b, --batch              Batch convert directory
```

### Programmatic Usage

```javascript
const { convertSvgToPng, batchConvert, mergeConfig } = require('./svg-to-png');

// Single file with config
await convertSvgToPng('icon.svg', {
  output: { path: './output', naming: '{name}@{scale}x.png' },
  size: { baseSize: 24, generateScales: [1, 2, 3] },
  style: { theme: 'apple-flat', color: { value: '#007AFF' } }
});

// Batch conversion
await batchConvert('./icons/', './output/', {
  size: { generateScales: [1, 2] },
  style: { theme: 'apple-outline' }
});
```

## Output Examples

### Multi-Scale Generation

Input: `home.svg` (24x24 viewBox)
```bash
node svg-to-png.js home.svg --scales 1,2,3
```

Output:
- `home.png` (24x24)
- `home@2x.png` (48x48)
- `home@3x.png` (72x72)

### Custom Naming

```bash
node svg-to-png.js icon.svg -n '{name}_{size}px.png' --scales 1,2
```

Output:
- `icon_24px.png`
- `icon_48px.png`

## Design Integration

This skill works seamlessly with:
- **frontend-design**: For consistent visual style
- **ui-ux-design**: For icon usability and accessibility

When generating icons, consider:
- **Size**: 24px base for standard icons, 20px for dense UIs
- **Stroke width**: 1.5px for outline style (Apple standard)
- **Color**: Use system colors or brand palette
- **Accessibility**: Ensure sufficient contrast
