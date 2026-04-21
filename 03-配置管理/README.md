# 配置管理文件夹

> 此文件夹用于集中存储环境ID、AppID等配置信息，确保配置集中管理。

## 文件说明

### 1. env.config.js - 环境配置

**用途**: 管理不同环境（开发/测试/生产）的配置信息

**包含内容**:
- 云开发环境ID (`envId`)
- 调试模式开关 (`debug`)
- Mock数据开关 (`mock`)
- 日志级别 (`logLevel`)

**使用方式**:
```javascript
const { config } = require('./env.config')
console.log('当前环境:', config.env)
console.log('云环境ID:', config.envId)
```

**注意事项**:
- 此文件可以提交到Git
- 环境ID虽然是敏感信息，但在小程序前端代码中无法避免暴露
- 真正的安全控制应在云函数中实现

---

### 2. app.config.js - 应用配置

**用途**: 小程序基础配置信息，包括AppID、功能开关、页面配置等

**包含内容**:
- 小程序基础信息（AppID、名称、版本）
- 功能开关配置（各模块的启用状态）
- 页面配置（路径、权限、TabBar等）
- 业务配置（预约规则、信誉分规则等）
- 系统配置（分页、缓存、超时等）

**使用方式**:
```javascript
const appConfig = require('./app.config')

// 检查功能是否启用
if (appConfig.features.enableCreditSystem) {
  // 显示信誉分相关功能
}

// 获取页面配置
const bookingPage = appConfig.pages.booking
```

---

### 3. secrets.config.example.js - 敏感配置示例

**用途**: 敏感配置文件的模板和示例

**包含内容**:
- 云开发环境ID（生产环境）
- 加密密钥
- 微信小程序 AppSecret
- 第三方服务密钥（学校认证、短信、推送等）
- 初始管理员账号
- 安全配置

**⚠️ 重要提示**:
1. 此文件仅作为示例，**不要填写真实值**
2. 实际使用时，复制此文件为 `secrets.config.local.js`
3. 在 `secrets.config.local.js` 中填写真实值
4. `secrets.config.local.js` 已添加到 `.gitignore`，不会被提交

**使用方式**:
```bash
# 1. 复制示例文件
cp secrets.config.example.js secrets.config.local.js

# 2. 编辑 secrets.config.local.js，填写真实值
# 3. 在代码中引用
```

```javascript
// 引用敏感配置
const secrets = require('./secrets.config.local.js')
const encryptionKey = secrets.encryptionKey
```

---

## 配置优先级

当配置项在多个文件中存在时，按以下优先级读取：

1. **运行时参数**（最高优先级）
2. **secrets.config.local.js**（敏感配置）
3. **env.config.js**（环境配置）
4. **app.config.js**（应用配置）
5. **默认值**（最低优先级）

---

## 环境切换说明

### 开发环境
```javascript
// env.config.js 中自动识别
// 在微信开发者工具中预览时，envVersion = 'develop'
// 使用 development 配置
```

### 体验版环境
```javascript
// 提交为体验版时，envVersion = 'trial'
// 使用 trial 配置
```

### 生产环境
```javascript
// 正式发布后，envVersion = 'release'
// 使用 production 配置
```

---

## 安全建议

1. **敏感信息保护**
   - 永远不要将 `secrets.config.local.js` 提交到Git
   - 定期更换加密密钥
   - 限制知道敏感信息的人员范围

2. **云环境安全**
   - 为不同环境创建独立的云环境
   - 配置数据库安全规则
   - 云函数中验证用户权限

3. **密钥管理**
   - 生产环境密钥应与开发环境不同
   - 考虑使用密钥管理服务（如腾讯云KMS）
   - 定期轮换密钥

---

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-04-21 | v1.0.0 | 初始版本，创建配置管理文件夹 |

---

**文档结束**
