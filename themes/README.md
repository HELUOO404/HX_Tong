# 红芯通小程序主题资源包

**版本**: 1.0.0  
**最后更新**: 2026-04-21

---

## 📦 可用主题

### 现代简约蓝 (modern-blue)

**版本**: 1.0.0  
**状态**: ✅ 已完成  
**文件**: `dist/modern-blue-v1.0.0.zip`

清新专业的蓝色主题，适合校园行政服务场景。

#### 主题特点

- **主色调**: 沉稳蓝 (#1890FF)
- **风格定位**: 简约、专业、高效
- **适用场景**: 会议室预约、校园服务
- **色彩系统**: 完整的主色阶、中性色、功能色

#### 包含资源

- ✅ 完整的主题配置 (theme.config.json)
- ✅ 资源清单 (manifest.json)
- ✅ CSS 变量定义 (styles/variables.wxss)
- ✅ 主题说明文档 (README.md)
- ⏳ 图片资源（需要后续添加）
  - Logo
  - 首页背景
  - 空状态插图
  - 错误状态插图
- ⏳ 图标资源（需要后续添加）
  - Tab栏图标
  - 功能图标

---

## 🚀 快速开始

### 1. 部署主题包

将 `dist/modern-blue-v1.0.0.zip` 上传到你的 CDN 或服务器：

```
https://your-cdn.com/themes/modern-blue-v1.0.0.zip
```

### 2. 解压并配置

```bash
# 解压到主题目录
unzip modern-blue-v1.0.0.zip -d /path/to/themes/modern-blue
```

### 3. 小程序中使用

```javascript
// app.js
import themeManager from './utils/theme/ThemeManager';

App({
  async onLaunch() {
    await themeManager.init({
      defaultTheme: 'modern-blue',
      cdnBase: 'https://your-cdn.com/themes/'
    });
  }
});
```

---

## 📁 目录结构

```
themes/
├── modern-blue/              # 主题源码目录
│   ├── theme.config.json     # 主题配置
│   ├── manifest.json         # 资源清单
│   ├── README.md             # 主题说明
│   ├── assets/               # 静态资源
│   │   ├── images/          # 图片资源
│   │   └── icons/           # 图标资源
│   ├── styles/              # 样式文件
│   │   └── variables.wxss   # CSS变量
│   └── preview/             # 预览图
├── dist/                     # 打包输出目录
│   └── modern-blue-v1.0.0.zip
├── build-theme.js           # Node.js 打包脚本
├── package-theme.ps1        # PowerShell 打包脚本
└── README.md                # 本文件
```

---

## 🛠️ 开发指南

### 创建新主题

1. **复制模板**
   ```bash
   cp -r modern-blue my-new-theme
   cd my-new-theme
   ```

2. **修改配置**
   编辑 `theme.config.json`：
   ```json
   {
     "theme": {
       "id": "my-new-theme",
       "name": "我的新主题",
       "version": "1.0.0"
     }
   }
   ```

3. **自定义样式**
   修改 `styles/variables.wxss` 中的颜色、字体等变量

4. **添加资源**
   在 `assets/` 目录下添加图片和图标

5. **打包**
   ```powershell
   # PowerShell
   .\package-theme.ps1 my-new-theme
   
   # 或 Node.js
   node build-theme.js my-new-theme
   ```

### 修改现有主题

1. 修改主题目录下的文件
2. 更新 `theme.config.json` 中的版本号
3. 重新打包

---

## 📋 主题配置说明

### theme.config.json 结构

```json
{
  "theme": {
    "id": "主题唯一标识",
    "name": "主题显示名称",
    "version": "版本号 (x.y.z)",
    "author": "作者",
    "description": "主题描述"
  },
  "colors": {
    "primary": { "50": "#E6F7FF", ... },
    "neutral": { "50": "#FAFAFA", ... },
    "functional": { "success": "#52C41A", ... }
  },
  "typography": {
    "fontFamily": "字体",
    "fontSize": { "display": "32px", ... }
  },
  "spacing": { "unit": 4, "scale": [...] },
  "radius": { "sm": "4px", ... },
  "shadows": { "sm": "...", ... },
  "animations": { "duration": {...}, "easing": {...} },
  "assets": {
    "images": { "logo": "路径", ... },
    "icons": { "tabHome": "路径", ... }
  },
  "components": {
    "button": { "primaryBg": "#1890FF", ... },
    "card": { "borderRadius": "12px", ... }
  }
}
```

---

## 🎨 资源规范

### 图片资源

| 类型 | 尺寸 | 格式 | 大小限制 |
|-----|------|------|---------|
| Logo | 200×200 | PNG | < 50KB |
| 背景图 | 750×400 | PNG/JPG | < 200KB |
| 空状态图 | 200×200 | PNG | < 30KB |
| 错误图 | 200×200 | PNG | < 30KB |

### 图标资源

| 类型 | 尺寸 | 格式 | 大小限制 |
|-----|------|------|---------|
| Tab图标 | 48×48 | PNG | < 5KB |
| 功能图标 | 48×48 | PNG | < 5KB |

---

## 📦 打包说明

### 使用 PowerShell 脚本

```powershell
# 打包 modern-blue 主题
.\package-theme.ps1 modern-blue

# 打包其他主题
.\package-theme.ps1 my-theme
```

### 使用 Node.js 脚本

```bash
# 安装依赖
npm install jszip

# 打包
node build-theme.js modern-blue
```

### 手动打包

```bash
# 进入主题目录
cd modern-blue

# 创建 ZIP
zip -r ../dist/modern-blue-v1.0.0.zip .
```

---

## 🔧 工具脚本

### build-theme.js

Node.js 打包脚本，功能包括：
- 验证主题配置
- 检查资源文件
- 生成资源清单
- 创建 ZIP 包

### package-theme.ps1

PowerShell 打包脚本，功能包括：
- 快速打包主题
- 显示打包结果
- 列出包内文件

---

## 📚 相关文档

- [页面风格规范](../02-开发规范/页面风格规范.md)
- [换肤架构设计](../02-开发规范/换肤架构设计.md)
- [资源包创建与使用规范](../02-开发规范/资源包创建与使用规范.md)

---

## 📝 更新计划

### v1.1.0 (计划中)

- [ ] 添加深色模式支持
- [ ] 优化动画效果
- [ ] 添加更多空状态插图

### v1.2.0 (计划中)

- [ ] 节日主题变体
- [ ] 动态主题切换
- [ ] 用户自定义主题

---

## 🤝 贡献指南

欢迎提交新的主题或改进现有主题！

1. Fork 本仓库
2. 创建你的主题分支
3. 提交你的更改
4. 创建 Pull Request

---

## 📄 许可证

MIT License

---

**红芯通设计团队 © 2026**
