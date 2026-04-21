---
name: "wechat-miniprogram"
description: "WeChat Mini Program development guide covering WXML, WXSS, JavaScript, project structure, and best practices. Invoke when developing WeChat Mini Programs, creating pages/components, or implementing mini program features."
---

# WeChat Mini Program Development

Comprehensive guide for developing WeChat Mini Programs (微信小程序) with best practices and standardized patterns.

## What It Does

Provides complete guidance for WeChat Mini Program development including:
- **Project Structure** - Standard directory organization
- **WXML Templates** - Data binding, conditionals, list rendering
- **WXSS Styling** - rpx units, style imports, responsive design
- **JavaScript Logic** - Page lifecycle, event handling, API calls
- **Component Development** - Reusable custom components
- **Best Practices** - Performance optimization, code organization

## When to Use

- Creating new WeChat Mini Program projects
- Developing pages and components
- Implementing mini program features
- Converting designs to WXML/WXSS
- Debugging mini program issues

## Project Structure

Standard WeChat Mini Program directory structure:

```
miniprogram/
├── app.js                 # Application entry and global logic
├── app.json               # Global configuration (pages, window, tabBar)
├── app.wxss               # Global styles
├── project.config.json    # Project configuration
├── sitemap.json           # Sitemap for search indexing
├── pages/                 # Page files
│   ├── index/
│   │   ├── index.js       # Page logic
│   │   ├── index.wxml     # Page structure
│   │   ├── index.wxss     # Page styles
│   │   └── index.json     # Page configuration
│   └── ...
├── components/            # Reusable components
│   └── my-component/
│       ├── my-component.js
│       ├── my-component.wxml
│       ├── my-component.wxss
│       └── my-component.json
├── utils/                 # Utility functions
├── images/                # Static images
└── ...
```

## WXML Template Syntax

### 1. Data Binding

```xml
<!-- Content binding -->
<view>{{ message }}</view>

<!-- Attribute binding -->
<image src="{{ imageUrl }}" mode="aspectFill"/>

<!-- Expression binding -->
<view>{{ count + 1 }}</view>
<view>{{ isShow ? 'Visible' : 'Hidden' }}</view>
```

### 2. Condition Rendering

```xml
<!-- wx:if series -->
<view wx:if="{{ score >= 90 }}">Excellent</view>
<view wx:elif="{{ score >= 60 }}">Pass</view>
<view wx:else>Fail</view>

<!-- hidden attribute -->
<view hidden="{{ !isVisible }}">Content</view>
```

**Note**: `wx:if` dynamically creates/removes elements (use for infrequent changes). `hidden` uses CSS display (use for frequent toggles).

### 3. List Rendering

```xml
<!-- Basic list rendering -->
<view 
  wx:for="{{ items }}" 
  wx:key="id"
  wx:for-item="item"
  wx:for-index="index"
>
  {{ index }}: {{ item.name }}
</view>

<!-- Nested loops with custom names -->
<view wx:for="{{ categories }}" wx:key="id" wx:for-item="category">
  <text>{{ category.name }}</text>
  <view wx:for="{{ category.products }}" wx:key="pid" wx:for-item="product">
    {{ product.name }}
  </view>
</view>
```

### 4. Template System

```xml
<!-- Define template -->
<template name="user-card">
  <view class="user-card">
    <image src="{{ avatar }}" class="avatar"/>
    <text class="name">{{ name }}</text>
  </view>
</template>

<!-- Use template -->
<template is="user-card" data="{{ ...userInfo }}"/>

<!-- Import templates from other files -->
<import src="/templates/common.wxml"/>
```

### 5. Event Binding

```xml
<!-- Basic event binding -->
<button bindtap="handleTap">Click Me</button>

<!-- Event with data attributes -->
<view 
  bindtap="onItemClick" 
  data-id="{{ item.id }}"
  data-name="{{ item.name }}"
>
  {{ item.name }}
</view>

<!-- Prevent event bubbling -->
<view catchtap="handleInner">Inner (stops propagation)</view>

<!-- Input binding -->
<input 
  value="{{ inputValue }}"
  bindinput="onInput"
  placeholder="Enter text"
/>
```

```javascript
// Event handling in JS
Page({
  data: {
    inputValue: ''
  },
  
  handleTap(e) {
    console.log('Tapped!', e);
  },
  
  onItemClick(e) {
    const { id, name } = e.currentTarget.dataset;
    console.log('Clicked item:', id, name);
  },
  
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  }
});
```

## WXSS Styling

### 1. rpx Responsive Unit

```css
/* rpx adapts to screen width (750rpx = full screen width) */
.container {
  width: 750rpx;        /* Full width */
  padding: 20rpx;       /* Responsive padding */
}

.card {
  width: 345rpx;        /* Half width minus margin */
  margin: 15rpx;
}
```

### 2. Style Imports

```css
/* Import common styles */
@import "/styles/common.wxss";

/* Page-specific styles */
.page-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}
```

### 3. Selectors

```css
/* Class selector (recommended) */
.user-card { }

/* ID selector */
#header { }

/* Element selector (limited support) */
view { }

/* Descendant selector */
.container .item { }

/* Sibling selector */
.item + .item { }
```

## JavaScript Page Logic

### 1. Page Lifecycle

```javascript
Page({
  // Initial data
  data: {
    userInfo: null,
    list: [],
    loading: false
  },

  // Lifecycle callbacks
  onLoad(options) {
    // Page loading - receive navigation parameters
    console.log('Page params:', options);
    this.loadData();
  },

  onShow() {
    // Page displayed
  },

  onReady() {
    // Page rendering complete
  },

  onHide() {
    // Page hidden
  },

  onUnload() {
    // Page closed - cleanup
  },

  // Pull down refresh
  onPullDownRefresh() {
    this.loadData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // Reach bottom (for infinite scroll)
  onReachBottom() {
    this.loadMore();
  },

  // Page scroll
  onPageScroll(e) {
    console.log('Scroll position:', e.scrollTop);
  },

  // Custom methods
  async loadData() {
    this.setData({ loading: true });
    try {
      const data = await fetchData();
      this.setData({ list: data });
    } finally {
      this.setData({ loading: false });
    }
  },

  // Event handlers
  handleTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
```

### 2. Component Development

```javascript
// Component definition
Component({
  // Component properties (props)
  properties: {
    title: {
      type: String,
      value: 'Default Title'
    },
    items: {
      type: Array,
      value: []
    }
  },

  // Component data
  data: {
    isExpanded: false
  },

  // Lifecycle
  attached() {
    // Component attached to page
  },

  detached() {
    // Component removed from page
  },

  // Methods
  methods: {
    onToggle() {
      this.setData({ isExpanded: !this.data.isExpanded });
      // Trigger custom event
      this.triggerEvent('toggle', { expanded: this.data.isExpanded });
    }
  }
});
```

```json
// Component configuration (my-component.json)
{
  "component": true,
  "usingComponents": {}
}
```

## Configuration Files

### app.json

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/profile/profile"
  ],
  "window": {
    "navigationBarTitleText": "Mini Program",
    "navigationBarBackgroundColor": "#ffffff",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f5f5f5",
    "enablePullDownRefresh": true
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "Home", "iconPath": "...", "selectedIconPath": "..." },
      { "pagePath": "pages/profile/profile", "text": "Profile", "iconPath": "...", "selectedIconPath": "..." }
    ]
  },
  "usingComponents": {
    "custom-component": "/components/custom-component/custom-component"
  }
}
```

### page.json

```json
{
  "navigationBarTitleText": "Page Title",
  "usingComponents": {
    "my-component": "/components/my-component/my-component"
  },
  "enablePullDownRefresh": true,
  "backgroundColor": "#f5f5f5"
}
```

## Navigation

```javascript
// Navigate to new page
wx.navigateTo({
  url: '/pages/detail/detail?id=123'
});

// Redirect (replace current page)
wx.redirectTo({
  url: '/pages/login/login'
});

// Navigate back
wx.navigateBack({
  delta: 1
});

// Switch tab (for tabBar pages)
wx.switchTab({
  url: '/pages/index/index'
});

// Re-launch (close all pages)
wx.reLaunch({
  url: '/pages/index/index'
});
```

## Best Practices

### 1. Data Management
- Use `setData()` for all data changes (don't modify data directly)
- Batch multiple `setData()` calls when possible
- Avoid large/complex data structures in `setData()`

### 2. Performance Optimization
- Use `wx:key` in list rendering
- Lazy load images with `lazy-load` attribute
- Use `recycle-view` for very long lists
- Minimize initial bundle size

### 3. Code Organization
- Keep pages focused and single-responsibility
- Extract reusable logic to components
- Use utils for shared functions
- Follow consistent naming conventions

### 4. API Calls
```javascript
// Encapsulate API calls
const api = {
  async getUserInfo() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://api.example.com/user',
        method: 'GET',
        success: resolve,
        fail: reject
      });
    });
  }
};
```

## Common Patterns

### Loading State Pattern
```xml
<view class="container">
  <view wx:if="{{ loading }}" class="loading">Loading...</view>
  <view wx:elif="{{ error }}" class="error">{{ error }}</view>
  <view wx:else>
    <!-- Content -->
  </view>
</view>
```

### Empty State Pattern
```xml
<view wx:if="{{ list.length === 0 }}" class="empty-state">
  <image src="/images/empty.png"/>
  <text>No data available</text>
</view>
```

### Form Handling
```javascript
Page({
  data: {
    form: {
      name: '',
      phone: ''
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: e.detail.value
    });
  },

  onSubmit() {
    const { form } = this.data;
    // Validate and submit
  }
});
```

## Resources

- [WeChat Mini Program Official Docs](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [Mini Program Design Guidelines](https://developers.weixin.qq.com/miniprogram/design/)
