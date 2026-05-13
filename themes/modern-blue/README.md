# 现代简约蓝主题 (Modern Blue)

**版本**: 1.0.0  
**作者**: 红芯通设计团队  
**许可证**: MIT

---

## 主题介绍

现代简约蓝是红芯通小程序的官方主题，采用清新专业的设计风格，以沉稳的蓝色为主色调，传递专业、可靠的品牌形象。

### 设计理念

- **简洁高效**: 去除多余装饰，让用户专注于核心功能
- **专业可信**: 蓝色系传递专业、可靠的视觉感受
- **清晰层级**: 通过色彩和间距建立清晰的信息层级
- **舒适体验**: 合理的对比度和间距，长时间使用不疲劳

### 适用场景

- 校园行政服务
- 会议室预约系统
- 教务管理系统
- 其他校园服务场景

---

## 色彩系统

### 主色调

| 色阶 | 色值 | 用途 |
|-----|------|------|
| 50 | #E6F7FF | 极浅背景 |
| 100 | #BAE7FF | 浅色背景 |
| 200 | #91D5FF | 悬浮状态 |
| 300 | #69C0FF | 边框高亮 |
| 400 | #40A9FF | 次要按钮 |
| 500 | #1890FF | **主色** |
| 600 | #096DD9 | 点击状态 |
| 700 | #0050B3 | 文字强调 |
| 800 | #003A8C | 深色文字 |
| 900 | #002766 | 最深色 |

### 功能色

| 功能 | 色值 | 用途 |
|-----|------|------|
| 成功 | #52C41A | 成功状态、通过 |
| 警告 | #FAAD14 | 警告状态、待审批 |
| 错误 | #FF4D4F | 错误状态、拒绝 |
| 信息 | #1890FF | 信息提示 |

---

## 资源清单

### 图片资源

| 文件名 | 尺寸 | 大小 | 用途 |
|-------|------|------|------|
| logo.png | 200×200 | ~15KB | 应用Logo |
| bg-home.png | 750×400 | ~89KB | 首页背景 |
| bg-profile.png | 750×300 | ~65KB | 个人中心背景 |
| empty-booking.png | 200×200 | ~28KB | 空预约状态 |
| empty-room.png | 200×200 | ~27KB | 空会议室状态 |
| empty-data.png | 200×200 | ~26KB | 通用空数据 |
| error-network.png | 200×200 | ~30KB | 网络错误 |
| error-generic.png | 200×200 | ~29KB | 通用错误 |
| success-booking.png | 200×200 | ~31KB | 预约成功 |

### 图标资源

| 文件名 | 尺寸 | 用途 |
|-------|------|------|
| tab-home.png | 48×48 | 首页Tab |
| tab-home-active.png | 48×48 | 首页Tab激活 |
| tab-room.png | 48×48 | 会议室Tab |
| tab-room-active.png | 48×48 | 会议室Tab激活 |
| tab-booking.png | 48×48 | 预约Tab |
| tab-booking-active.png | 48×48 | 预约Tab激活 |
| tab-profile.png | 48×48 | 我的Tab |
| tab-profile-active.png | 48×48 | 我的Tab激活 |
| icon-calendar.png | 48×48 | 日历图标 |
| icon-clock.png | 48×48 | 时钟图标 |
| icon-location.png | 48×48 | 位置图标 |
| icon-phone.png | 48×48 | 电话图标 |
| icon-success.png | 48×48 | 成功图标 |
| icon-warning.png | 48×48 | 警告图标 |
| icon-error.png | 48×48 | 错误图标 |
| icon-info.png | 48×48 | 信息图标 |
| icon-search.png | 48×48 | 搜索图标 |
| icon-filter.png | 48×48 | 筛选图标 |
| icon-more.png | 48×48 | 更多图标 |
| icon-arrow-*.png | 48×48 | 箭头图标组 |
| icon-check.png | 48×48 | 勾选图标 |
| icon-close.png | 48×48 | 关闭图标 |
| icon-edit.png | 48×48 | 编辑图标 |
| icon-delete.png | 48×48 | 删除图标 |
| icon-add.png | 48×48 | 添加图标 |
| icon-user.png | 48×48 | 用户图标 |

---

## 使用方式

### 1. 直接引用

在小程序中直接引用主题配置：

```javascript
const themeManager = require('./utils/theme/ThemeManager').default;

// 加载主题
await themeManager.loadTheme('modern-blue');
```

### 2. 作为默认主题

在 `app.js` 中设置默认主题：

```javascript
App({
  async onLaunch() {
    await themeManager.init({
      defaultTheme: 'modern-blue',
      cdnBase: 'https://your-cdn.com/themes/'
    });
  }
});
```

### 3. 样式变量使用

在 WXSS 中使用主题变量：

```css
.page {
  background: var(--bg-page);
}

.btn-primary {
  background: var(--primary-500);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
}
```

---

## 文件结构

```
modern-blue/
├── theme.config.json          # 主题配置文件
├── manifest.json              # 资源清单
├── README.md                  # 说明文档
├── preview/                   # 预览图
│   ├── thumbnail.jpg
│   ├── screenshot-home.jpg
│   ├── screenshot-room.jpg
│   └── screenshot-booking.jpg
├── assets/                    # 静态资源
│   ├── images/               # 图片资源
│   └── icons/                # 图标资源
└── styles/                    # 样式文件
    └── variables.wxss        # CSS变量
```

---

## 更新日志

### v1.0.0 (2026-04-21)

- 初始版本发布
- 完成色彩系统设计
- 完成基础组件样式
- 添加完整的图标资源
- 添加空状态和错误状态插图

---

## 开发计划

- [ ] 深色模式支持
- [ ] 更多空状态插图
- [ ] 动态主题变体（节日主题）
- [ ] 动画效果优化

---

## 反馈与支持

如有问题或建议，请联系：

- 邮箱: design@hxtong.edu.cn
- 项目主页: https://hxtong.edu.cn/themes/modern-blue

---

**红芯通设计团队 © 2026**
