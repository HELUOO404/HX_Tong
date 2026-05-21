#!/usr/bin/env node

/**
 * 主题资源包构建脚本
 * 用于打包主题为 ZIP 文件
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 检查是否安装了 JSZip
let JSZip;
try {
  JSZip = require('jszip');
} catch (error) {
  console.error('请先安装 JSZip: npm install jszip');
  process.exit(1);
}

class ThemeBuilder {
  constructor(sourceDir, outputDir) {
    this.sourceDir = sourceDir;
    this.outputDir = outputDir;
    this.themeConfig = null;
  }

  async build() {
    console.log('🚀 开始构建主题包...\n');

    try {
      // 1. 读取并验证配置
      await this.loadConfig();

      // 2. 验证资源文件
      await this.validateResources();

      // 3. 更新资源清单
      await this.updateManifest();

      // 4. 创建 ZIP 包
      await this.createPackage();

      console.log('\n✅ 主题包构建完成！');
      console.log(`📦 输出目录: ${path.resolve(this.outputDir)}`);

    } catch (error) {
      console.error('\n❌ 构建失败:', error.message);
      process.exit(1);
    }
  }

  async loadConfig() {
    console.log('📄 加载主题配置...');

    const configPath = path.join(this.sourceDir, 'theme.config.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('找不到 theme.config.json 文件');
    }

    this.themeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // 验证必填字段
    const required = ['theme.id', 'theme.name', 'theme.version'];
    for (const field of required) {
      const value = field.split('.').reduce((obj, key) => obj?.[key], this.themeConfig);
      if (!value) {
        throw new Error(`缺少必填字段: ${field}`);
      }
    }

    // 验证版本号格式
    if (!/^\d+\.\d+\.\d+/.test(this.themeConfig.theme.version)) {
      throw new Error('版本号格式不正确，应为 x.y.z');
    }

    console.log(`   主题ID: ${this.themeConfig.theme.id}`);
    console.log(`   主题名称: ${this.themeConfig.theme.name}`);
    console.log(`   版本: ${this.themeConfig.theme.version}\n`);
  }

  async validateResources() {
    console.log('🔍 验证资源文件...');

    const assetsDir = path.join(this.sourceDir, 'assets');
    const requiredImages = [
      'images/logo.jpg',
      'images/empty-booking.png',
      'images/empty-room.png',
      'images/empty-data.png',
      'images/error-network.png',
      'images/error-generic.png',
      'images/success-booking.png'
    ];

    const requiredIcons = [
      'icons/tab-home.png',
      'icons/tab-home-active.png',
      'icons/tab-room.png',
      'icons/tab-room-active.png',
      'icons/tab-booking.png',
      'icons/tab-booking-active.png',
      'icons/tab-profile.png',
      'icons/tab-profile-active.png'
    ];

    let missingFiles = [];

    // 检查必需图片
    for (const file of requiredImages) {
      const filePath = path.join(assetsDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    // 检查必需图标
    for (const file of requiredIcons) {
      const filePath = path.join(assetsDir, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.warn('   ⚠️  缺少以下资源文件:');
      missingFiles.forEach(file => console.warn(`      - ${file}`));
      console.warn('   将使用占位符或默认值\n');
    } else {
      console.log('   ✓ 所有必需资源文件已找到\n');
    }
  }

  async updateManifest() {
    console.log('📝 更新资源清单...');

    const manifest = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      themeId: this.themeConfig.theme.id,
      themeVersion: this.themeConfig.theme.version,
      resources: []
    };

    // 扫描资源目录
    const scanDir = (dir, basePath = '') => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath, relativePath);
        } else {
          const content = fs.readFileSync(fullPath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          
          manifest.resources.push({
            path: relativePath,
            type: this.getResourceType(item),
            size: content.length,
            hash: `sha256:${hash.slice(0, 16)}`,
            url: `assets/${relativePath}`.replace(/\\/g, '/')
          });
        }
      }
    };

    // 扫描 assets 目录
    const assetsDir = path.join(this.sourceDir, 'assets');
    scanDir(assetsDir);

    // 扫描 styles 目录
    const stylesDir = path.join(this.sourceDir, 'styles');
    scanDir(stylesDir);

    manifest.totalSize = manifest.resources.reduce((sum, r) => sum + r.size, 0);
    manifest.totalFiles = manifest.resources.length;

    // 保存清单
    fs.writeFileSync(
      path.join(this.sourceDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log(`   ✓ 发现 ${manifest.totalFiles} 个资源文件`);
    console.log(`   ✓ 总大小: ${this.formatSize(manifest.totalSize)}\n`);
  }

  getResourceType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
      '.png': 'image',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.gif': 'image',
      '.webp': 'image',
      '.svg': 'image',
      '.wxss': 'stylesheet',
      '.css': 'stylesheet',
      '.woff': 'font',
      '.woff2': 'font',
      '.ttf': 'font'
    };
    return types[ext] || 'unknown';
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async createPackage() {
    console.log('📦 创建 ZIP 包...');

    const zip = new JSZip();

    // 添加配置文件
    zip.file('theme.config.json', fs.readFileSync(path.join(this.sourceDir, 'theme.config.json')));
    zip.file('manifest.json', fs.readFileSync(path.join(this.sourceDir, 'manifest.json')));
    zip.file('README.md', fs.readFileSync(path.join(this.sourceDir, 'README.md')));

    // 添加资源文件
    const addFilesToZip = (dir, zipFolder, baseDir) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          const newFolder = zipFolder.folder(item);
          addFilesToZip(fullPath, newFolder, baseDir);
        } else {
          zipFolder.file(item, fs.readFileSync(fullPath));
        }
      }
    };

    // 添加 assets
    const assetsDir = path.join(this.sourceDir, 'assets');
    if (fs.existsSync(assetsDir)) {
      const assetsFolder = zip.folder('assets');
      addFilesToZip(assetsDir, assetsFolder, assetsDir);
    }

    // 添加 styles
    const stylesDir = path.join(this.sourceDir, 'styles');
    if (fs.existsSync(stylesDir)) {
      const stylesFolder = zip.folder('styles');
      addFilesToZip(stylesDir, stylesFolder, stylesDir);
    }

    // 添加 preview（如果存在）
    const previewDir = path.join(this.sourceDir, 'preview');
    if (fs.existsSync(previewDir)) {
      const previewFolder = zip.folder('preview');
      addFilesToZip(previewDir, previewFolder, previewDir);
    }

    // 生成 ZIP
    const content = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // 生成文件名
    const outputName = `${this.themeConfig.theme.id}-v${this.themeConfig.theme.version}.zip`;
    const outputPath = path.join(this.outputDir, outputName);

    fs.writeFileSync(outputPath, content);

    const stats = fs.statSync(outputPath);
    console.log(`   ✓ 已创建: ${outputName}`);
    console.log(`   ✓ 文件大小: ${this.formatSize(stats.size)}`);
  }
}

// 主函数
async function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);
  const themeName = args[0] || 'modern-blue';
  
  const sourceDir = path.join(__dirname, themeName);
  const outputDir = path.join(__dirname, 'dist');

  // 检查源目录
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ 找不到主题目录: ${sourceDir}`);
    console.log('\n使用方法: node build-theme.js [theme-name]');
    console.log('示例: node build-theme.js modern-blue');
    process.exit(1);
  }

  // 构建
  const builder = new ThemeBuilder(sourceDir, outputDir);
  await builder.build();
}

// 运行
main().catch(console.error);
