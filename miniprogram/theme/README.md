# 微信小程序主题系统使用说明

**版本**: 1.0.0  
**更新日期**: 2026-04-21

---

## 📋 目录

- [快速开始](#快速开始)
- [主题配置](#主题配置)
- [在页面中使用](#在页面中使用)
- [API 参考](#api-参考)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 引入主题系统

在 `app.js` 中初始化：

```javascript
const { initTheme } = require('./theme/theme-utils');

App({
  onLaunch() {
    // 初始化主题
    initTheme(this);
  }
});
```

### 2. 在页面中使用

```javascript
const { withTheme } = require('../../theme/theme-mixin');

Page(withTheme({
  // 你的页面配置
}));
```

```xml
<view style="background: {{theme.background}};">
  <text style="color: {{theme.primary}};">主题色文字</text>
</view>
```

---

## 🎨 主题配置

### 内置主题

系统内置了 4 套主题：

| 主题ID | 名称 | 主色调 | 适用场景 |
|-------|------|--------|---------|
| `modern-blue` | 现代简约蓝 | #1890FF | 默认主题，校园服务 |
| `dark` | 深色模式 | #177DDC | 夜间使用 |
| `warm-orange` | 温暖活力橙 | #FA8C16 | 学生活动 |
| `nature-green` | 自然清新绿 | #13C2C2 | 创意讨论 |

### 添加新主题

在 `theme-config.js` 中添加：

```javascript
'my-theme': {
  id: 'my-theme',
  name: '我的主题',
  description: '主题描述',
  colors: {
    primary: '#FF0000',
    background: '#FFFFFF',
    // ... 其他颜色
  }
}
```

### 主题颜色变量

每个主题包含以下颜色变量：

```javascript
// 主色调
primary, primaryLight, primaryDark, primary50, primary100

// 功能色
success, successLight, warning, warningLight, error, errorLight, info, infoLight

// 中性色
neutral50 - neutral900

// 背景色
background, card, elevated, sunken, hover, pressed

// 文字色
textPrimary, textSecondary, textTertiary, textDisabled, textInverse

// 边框色
borderLight, border, borderDark, borderFocus
```

---

## 📄 在页面中使用

### 基础用法

```javascript
const { withTheme } = require('../../theme/theme-mixin');

Page(withTheme({
  data: {
    // 你的数据
  },
  
  onLoad() {
    // 主题已自动应用
    console.log(this.data.theme); // 主题颜色对象
    console.log(this.data.currentThemeId); // 当前主题ID
  }
}));
```

### 使用主题颜色

```xml
<view style="background: {{theme.background}};">
  <!-- 主色按钮 -->
  <button style="background: {{theme.primary}}; color: #FFF;">
    按钮
  </button>
  
  <!-- 卡片 -->
  <view style="background: {{theme.card}}; border: 1px solid {{theme.border}};">
    <text style="color: {{theme.textPrimary}};">标题</text>
    <text style="color: {{theme.textSecondary}};">描述</text>
  </view>
  
  <!-- 状态标签 -->
  <view style="background: {{theme.successLight}};">
    <text style="color: {{theme.success}};">成功</text>
  </view>
</view>
```

### 监听主题变化

```javascript
Page(withTheme({
  // 主题变化回调
  onThemeChange(themeId) {
    console.log('主题已切换:', themeId);
    // 执行自定义逻辑
  }
}));
```

### 手动刷新主题

```javascript
// 在需要时手动刷新
this.refreshTheme();
```

---

## 🔧 API 参考

### theme-utils

#### `getTheme(themeId)`
获取主题配置

```javascript
const { getTheme } = require('./theme/theme-utils');
const theme = getTheme('modern-blue');
```

#### `switchTheme(themeId, pageInstance?)`
切换主题

```javascript
const { switchTheme } = require('./theme/theme-utils');
switchTheme('dark'); // 全局切换
switchTheme('dark', this); // 切换到指定页面
```

#### `applyTheme(pageInstance, themeId)`
应用主题到页面

```javascript
const { applyTheme } = require('./theme/theme-utils');
applyTheme(this, 'modern-blue');
```

#### `saveThemePreference(themeId)`
保存主题偏好

```javascript
const { saveThemePreference } = require('./theme/theme-utils');
saveThemePreference('dark');
```

#### `getSavedTheme()`
获取保存的主题

```javascript
const { getSavedTheme } = require('./theme/theme-utils');
const themeId = getSavedTheme(); // 返回 'modern-blue'
```

#### `getBookingStatusStyle(status, themeColors)`
获取预约状态样式

```javascript
const { getBookingStatusStyle } = require('./theme/theme-utils');
const style = getBookingStatusStyle('approved', this.data.theme);
// 返回: { color: '#52C41A', bgColor: '#F6FFED', text: '已通过' }
```

#### `getCreditScoreStyle(score, themeColors)`
获取信誉分样式

```javascript
const { getCreditScoreStyle } = require('./theme/theme-utils');
const style = getCreditScoreStyle(85, this.data.theme);
// 返回: { color: '#FAAD14', bgColor: '#FFF7E6', level: '良好' }
```

### theme-mixin

#### `withTheme(pageConfig)`
页面混入，自动处理主题

```javascript
const { withTheme } = require('../../theme/theme-mixin');

Page(withTheme({
  // 页面配置
}));
```

---

## 💡 最佳实践

### 1. 样式组织

建议将主题相关的样式写在 WXML 的 `style` 属性中：

```xml
<!-- 推荐 -->
<view style="background: {{theme.card}}; border-radius: 12px;">

<!-- 不推荐 -->
<view class="card theme-card">
```

### 2. 默认值处理

在使用主题颜色时，提供默认值：

```xml
<view style="background: {{theme.card || '#FFFFFF'}};">
```

### 3. 性能优化

避免在 `setData` 中传递整个主题对象，使用计算后的样式字符串：

```javascript
// 推荐
this.setData({
  cardStyle: `background: ${theme.card}; border-color: ${theme.border};`
});

// 不推荐
this.setData({
  theme: theme // 对象太大
});
```

### 4. 图片资源

主题相关的图片建议使用条件渲染：

```xml
<image wx:if="{{currentThemeId === 'dark'}}" src="/images/logo-dark.png" />
<image wx:else src="/images/logo.png" />
```

---

## ❓ 常见问题

### Q: 主题切换后页面没有变化？

A: 确保：
1. 页面引入了 `withTheme` 混入
2. 样式绑定使用了 `{{theme.xxx}}` 语法
3. 调用了 `switchTheme` 方法

### Q: 如何添加自定义主题？

A: 在 `theme-config.js` 中添加新的主题配置，参考现有主题格式。

### Q: 主题切换会保存吗？

A: 会，`switchTheme` 会自动保存到本地存储，下次启动时自动恢复。

### Q: 支持动态加载外部主题吗？

A: 不支持。微信小程序无法运行时加载外部样式文件。所有主题必须预置在代码中。

### Q: 可以在组件中使用吗？

A: 可以，通过 `Component` 的 `properties` 接收主题数据：

```javascript
Component({
  properties: {
    theme: {
      type: Object,
      value: {}
    }
  }
});
```

---

## 📦 文件结构

```
theme/
├── theme-config.js      # 主题配置
├── theme-utils.js       # 工具函数
├── theme-mixin.js       # 页面混入
└── README.md           # 使用说明
```

---

## 📝 更新日志

### v1.0.0 (2026-04-21)

- 初始版本发布
- 支持 4 套内置主题
- 实现主题切换和持久化
- 提供完整的 API 和混入

---

**红芯通开发团队 © 2026**
