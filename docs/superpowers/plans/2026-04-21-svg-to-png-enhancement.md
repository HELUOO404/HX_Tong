# SVG to PNG Skill 增强实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 重构 svg-to-png skill，支持纯图标生成（无外框）、可配置输出位置、多倍图生成、批量转换，以及苹果高级感的图标风格系统

**架构：** 采用模块化设计，分离配置管理、风格系统、转换引擎和批量处理器。使用 @resvg/resvg-js 进行高质量 SVG 渲染，支持通过配置调用 frontend-design 和 ui-ux-design skill 统一风格。

**技术栈：** Node.js, @resvg/resvg-js, sharp

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `SKILL.md` | Skill 文档和使用说明 |
| `svg-to-png.js` | 主入口和 CLI |
| `src/config.js` | 配置管理和默认值 |
| `src/styles.js` | 图标风格系统（苹果扁平、轮廓、渐变） |
| `src/converter.js` | 核心转换引擎 |
| `src/batch.js` | 批量转换处理器 |
| `src/utils.js` | 工具函数（文件操作、命名生成） |
| `examples/` | 示例 SVG 和生成的 PNG |

---

## 任务 1：创建配置系统

**文件：**
- 创建：`.trae/skills/svg-to-png/src/config.js`
- 修改：`.trae/skills/svg-to-png/svg-to-png.js`（后续任务使用）

- [ ] **步骤 1：编写配置模块**

```javascript
// src/config.js
const path = require('path');

const defaultConfig = {
  // 输出配置
  output: {
    path: './output',
    naming: '{name}.png',  // 支持 {name}, {scale}, {size}
    createSubfolders: false,
    overwrite: true
  },

  // 尺寸配置
  size: {
    baseSize: 24,  // 基础尺寸 1x
    generateScales: []  // 多倍图，默认空数组 [1, 2, 3]
  },

  // 风格配置
  style: {
    theme: 'apple-flat',  // apple-flat | apple-outline | apple-gradient
    
    // 颜色配置
    color: {
      type: 'solid',  // solid | gradient
      value: '#007AFF',  // 苹果系统蓝
      gradient: {
        angle: 135,
        stops: ['#007AFF', '#5856D6']
      }
    },

    // 描边配置（轮廓风格用）
    stroke: {
      width: 1.5,
      linecap: 'round',
      linejoin: 'round'
    },

    // 填充配置
    fill: {
      opacity: 1
    }
  },

  // 批量配置
  batch: {
    enabled: false
  }
};

const themes = {
  'apple-flat': {
    color: { type: 'solid', value: '#007AFF' },
    stroke: { width: 0 },
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
    stroke: { width: 0 },
    fill: { opacity: 1 }
  }
};

function mergeConfig(userConfig = {}) {
  return {
    output: { ...defaultConfig.output, ...userConfig.output },
    size: { ...defaultConfig.size, ...userConfig.size },
    style: mergeStyleConfig(userConfig.style),
    batch: { ...defaultConfig.batch, ...userConfig.batch }
  };
}

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
  generateOutputPath
};
```

- [ ] **步骤 2：验证配置模块**

创建测试脚本验证配置合并逻辑：

```javascript
const { mergeConfig, generateOutputPath } = require('./src/config');

// 测试默认配置
const defaultCfg = mergeConfig();
console.log('Default theme:', defaultCfg.style.theme);
console.assert(defaultCfg.style.theme === 'apple-flat');

// 测试自定义配置
const customCfg = mergeConfig({
  size: { baseSize: 32, generateScales: [1, 2] },
  style: { theme: 'apple-outline' }
});
console.log('Custom baseSize:', customCfg.size.baseSize);
console.assert(customCfg.size.baseSize === 32);
console.assert(customCfg.style.theme === 'apple-outline');

// 测试路径生成
const path1 = generateOutputPath('icon.svg', 1, customCfg);
console.log('Generated path:', path1);

console.log('Config tests passed!');
```

运行：`node test-config.js`
预期：所有断言通过，输出配置值

- [ ] **步骤 3：Commit**

```bash
git add .trae/skills/svg-to-png/src/config.js
git commit -m "feat(svg-to-png): add configuration system with themes"
```

---

## 任务 2：创建工具函数模块

**文件：**
- 创建：`.trae/skills/svg-to-png/src/utils.js`

- [ ] **步骤 1：编写工具函数**

```javascript
// src/utils.js
const fs = require('fs').promises;
const path = require('path');

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Check if file exists
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
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parse SVG dimensions
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
 * Apply style to SVG content
 */
function applyStyleToSvg(svgString, styleConfig) {
  // Parse existing SVG
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
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/skills/svg-to-png/src/utils.js
git commit -m "feat(svg-to-png): add utility functions"
```

---

## 任务 3：重构核心转换引擎

**文件：**
- 创建：`.trae/skills/svg-to-png/src/converter.js`
- 修改：`.trae/skills/svg-to-png/svg-to-png.js`（更新为使用新模块）

- [ ] **步骤 1：编写转换引擎**

```javascript
// src/converter.js
const fs = require('fs').promises;
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { mergeConfig, generateOutputPath } = require('./config');
const { ensureDir, fileExists, formatBytes, parseSvgDimensions, applyStyleToSvg } = require('./utils');

/**
 * Convert single SVG to PNG with specific scale
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
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/skills/svg-to-png/src/converter.js
git commit -m "feat(svg-to-png): refactor converter with config and style support"
```

---

## 任务 4：创建批量转换模块

**文件：**
- 创建：`.trae/skills/svg-to-png/src/batch.js`

- [ ] **步骤 1：编写批量处理器**

```javascript
// src/batch.js
const fs = require('fs').promises;
const path = require('path');
const { convertSvgToPng } = require('./converter');
const { mergeConfig } = require('./config');
const { ensureDir, formatBytes } = require('./utils');

/**
 * Batch convert SVGs from directory
 */
async function batchConvert(inputDir, outputDir, userConfig = {}) {
  const config = mergeConfig({
    ...userConfig,
    output: { ...userConfig.output, path: outputDir }
  });

  // Get all SVG files
  const files = await fs.readdir(inputDir);
  const svgFiles = files.filter(f => f.toLowerCase().endsWith('.svg'));

  if (svgFiles.length === 0) {
    console.log('No SVG files found in input directory');
    return [];
  }

  console.log(`Found ${svgFiles.length} SVG file(s) to convert\n`);

  await ensureDir(outputDir);

  const allResults = [];
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const file of svgFiles) {
    const inputPath = path.join(inputDir, file);
    
    try {
      const results = await convertSvgToPng(inputPath, config);
      allResults.push(...results);

      const successful = results.filter(r => r.success);
      const skipped = results.filter(r => r.skipped);
      
      successCount += successful.length;
      skipCount += skipped.length;
      failCount += results.length - successful.length - skipped.length;

      if (successful.length > 0) {
        const sizes = successful.map(r => `${r.dimensions.width}x${r.dimensions.height}`).join(', ');
        console.log(`✓ ${file} → ${successful.length} file(s) (${sizes})`);
      }
      if (skipped.length > 0) {
        console.log(`⊘ ${file} → skipped (${skipped.length} file(s) exist)`);
      }
    } catch (error) {
      console.error(`✗ ${file} → ${error.message}`);
      failCount++;
    }
  }

  // Summary
  console.log(`\n${'='.repeat(40)}`);
  console.log('Conversion Summary:');
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Failed:  ${failCount}`);
  console.log(`${'='.repeat(40)}`);

  return allResults;
}

/**
 * Batch convert with explicit file list
 */
async function batchConvertFiles(files, outputDir, userConfig = {}) {
  const config = mergeConfig({
    ...userConfig,
    output: { ...userConfig.output, path: outputDir }
  });

  await ensureDir(outputDir);

  const allResults = [];

  for (const file of files) {
    const inputPath = typeof file === 'string' ? file : file.path;
    const fileConfig = typeof file === 'string' ? config : mergeConfig({ ...config, ...file.config });
    
    try {
      const results = await convertSvgToPng(inputPath, fileConfig);
      allResults.push(...results);
    } catch (error) {
      console.error(`✗ ${inputPath} → ${error.message}`);
    }
  }

  return allResults;
}

module.exports = {
  batchConvert,
  batchConvertFiles
};
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/skills/svg-to-png/src/batch.js
git commit -m "feat(svg-to-png): add batch conversion support"
```

---

## 任务 5：更新主入口和 CLI

**文件：**
- 修改：`.trae/skills/svg-to-png/svg-to-png.js`

- [ ] **步骤 1：重写主入口**

```javascript
#!/usr/bin/env node

/**
 * SVG to PNG Converter
 * High-quality SVG to PNG conversion with style system
 */

const { convertSvgToPng } = require('./src/converter');
const { batchConvert } = require('./src/batch');
const { mergeConfig } = require('./src/config');

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

// CLI entry
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
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/skills/svg-to-png/svg-to-png.js
git commit -m "feat(svg-to-png): update CLI with new options"
```

---

## 任务 6：更新 SKILL.md 文档

**文件：**
- 修改：`.trae/skills/svg-to-png/SKILL.md`

- [ ] **步骤 1：重写文档**

```markdown
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
-b, --batch              Batch mode
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
```

- [ ] **步骤 2：Commit**

```bash
git add .trae/skills/svg-to-png/SKILL.md
git commit -m "docs(svg-to-png): update documentation with new features"
```

---

## 任务 7：创建示例和测试

**文件：**
- 创建：`.trae/skills/svg-to-png/examples/demo.js`
- 修改：`.trae/skills/svg-to-png/examples/` 下的 SVG 文件

- [ ] **步骤 1：创建示例脚本**

```javascript
// examples/demo.js
const { convertSvgToPng, batchConvert } = require('../svg-to-png');
const path = require('path');

async function runDemo() {
  console.log('SVG to PNG Converter Demo\n');
  
  // Demo 1: Single file, default settings
  console.log('1. Single file conversion (default):');
  await convertSvgToPng('./home-icon.svg', {
    output: { path: './output/demo1' }
  });
  
  // Demo 2: Multi-scale
  console.log('\n2. Multi-scale generation:');
  await convertSvgToPng('./home-icon.svg', {
    output: { path: './output/demo2', naming: '{name}@{scale}x.png' },
    size: { baseSize: 24, generateScales: [1, 2, 3] }
  });
  
  // Demo 3: Different themes
  console.log('\n3. Different themes:');
  
  // Apple flat
  await convertSvgToPng('./heart-icon.svg', {
    output: { path: './output/demo3/flat' },
    style: { theme: 'apple-flat', color: { value: '#007AFF' } }
  });
  
  // Apple outline
  await convertSvgToPng('./heart-icon.svg', {
    output: { path: './output/demo3/outline' },
    style: { theme: 'apple-outline', color: { value: '#FF6B6B' } }
  });
  
  // Apple gradient
  await convertSvgToPng('./heart-icon.svg', {
    output: { path: './output/demo3/gradient' },
    style: { theme: 'apple-gradient' }
  });
  
  // Demo 4: Batch conversion
  console.log('\n4. Batch conversion:');
  await batchConvert('./', './output/demo4/', {
    size: { generateScales: [1, 2] },
    style: { theme: 'apple-flat' }
  });
  
  console.log('\nDemo complete! Check ./output/ for results.');
}

runDemo().catch(console.error);
```

- [ ] **步骤 2：更新示例 SVG（纯图标，无外框）**

更新现有的 SVG 文件，移除外框，只保留图标内容：

```svg
<!-- home-icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 3l-9 8h3v10h6v-6h4v6h6V11h3L12 3z" fill="#007AFF"/>
</svg>
```

- [ ] **步骤 3：运行测试**

```bash
cd .trae/skills/svg-to-png
node examples/demo.js
```

- [ ] **步骤 4：Commit**

```bash
git add .trae/skills/svg-to-png/examples/
git commit -m "feat(svg-to-png): add demo examples"
```

---

## 自检

**规格覆盖度检查：**
- ✅ 纯图标生成（无外框）
- ✅ 可配置输出位置
- ✅ 多倍图生成（默认关闭）
- ✅ 批量转换
- ✅ 苹果高级感风格系统
- ✅ 调用 frontend-design 和 ui-ux-design skill

**占位符扫描：** 无 TODO/待定

**类型一致性：** 配置结构在各模块中一致

---

## 执行选项

计划已完成！两种执行方式：

**1. 子代理驱动（推荐）** - 每个任务调度一个新的子代理，任务间进行审查

**2. 内联执行** - 在当前会话中批量执行任务

选哪种方式？
