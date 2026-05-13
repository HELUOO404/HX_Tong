# 红芯通小程序

<p align="center">
  <img src="miniprogram/assets/images/logo.png" alt="红芯通 Logo" width="120">
</p>

<p align="center">
  <strong>深圳职业技术大学集成电路学院校园生活服务平台</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#技术架构">技术架构</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#api列表">API列表</a>
</p>

---

## 简介

**红芯通**是深圳职业技术大学集成电路学院开发的校园生活服务小程序，旨在为学院师生提供一站式的会议室预约、课表查询、信誉分管理等数字化服务。

- 🎯 **目标用户**：集成电路学院约 1000 名学生及管理人员
- 🔒 **数据安全**：采用微信云开发，数据不出校园
- 🎨 **现代UI**：采用最新设计语言，支持多套主题切换
- 📱 **零广告**：学院自主运营，专注服务体验

---

## 功能特性

### 已上线功能 (MVP)

| 功能模块 | 功能点 | 状态 |
|---------|--------|------|
| **用户系统** | 微信一键登录、强制信息完善 | ✅ |
| **会议室预约** | 会议室展示、时段选择、在线预约 | ✅ |
| **预约管理** | 预约列表、取消预约、签到功能 | ✅ |
| **审批系统** | 自动审批、人工审批、审批通知 | ✅ |
| **信誉分体系** | 信誉分计算、等级体系、奖惩机制 | ✅ |
| **管理后台** | 数据仪表盘、会议室管理、用户管理 | ✅ |
| **主题系统** | 多套预设主题、动态换肤 | ✅ |

### 规划功能

- 📅 课表查询
- 💬 论坛交流
- 📢 通知公告
- 🔍 失物招领
- 🏃 体测成绩
- 🔐 学校统一身份认证

---

## 技术架构

### 四层架构设计

```
┌─────────────────────────────────────────┐
│              皮肤层 (Skin)               │
│         主题系统、样式变量、动态换肤        │
├─────────────────────────────────────────┤
│             结构层 (Structure)           │
│         页面结构、组件规范、布局系统        │
├─────────────────────────────────────────┤
│              逻辑层 (Logic)              │
│         业务逻辑、API服务、数据处理        │
├─────────────────────────────────────────┤
│            数据互通层 (Data)             │
│         全局配置、状态管理、常量定义        │
├─────────────────────────────────────────┤
│           微信云开发 (Cloud Base)         │
│         云函数、云数据库、云存储           │
└─────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|-----|------|------|
| 前端框架 | 微信小程序原生 | WXML + WXSS + JavaScript |
| 后端服务 | 微信云开发 | 云函数 + 云数据库 + 云存储 |
| 数据库 | MongoDB | 文档型 NoSQL 数据库 |
| 运行环境 | Node.js | 云函数运行环境 |
| 开发工具 | 微信开发者工具 + Trae | AI 辅助开发 |

---

## 快速开始

### 环境准备

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- [Node.js](https://nodejs.org/) (建议 v16+)
- 微信小程序账号和 AppID

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <项目仓库地址>
   cd HX_Tong
   ```

2. **配置项目**
   ```bash
   # 复制项目配置模板
   cp project.config.example.json project.config.json
   # 编辑 project.config.json，将 "your-appid-here" 替换为你的 AppID
   
   # 复制环境配置模板
   cp miniprogram/config/env.example.js miniprogram/config/env.js
   # 编辑 env.js，将 "your-env-id-here" 替换为你的云开发环境ID
   ```

3. **导入项目**
   - 打开微信开发者工具
   - 选择「导入项目」
   - 选择项目根目录
   - 填入你的 AppID

4. **部署云函数**
   - 在微信开发者工具中，右键 `cloudfunctions/` 下的每个云函数目录
   - 选择「上传并部署：云端安装依赖」
   - 需要部署的云函数：`adminService`、`meetingroomService`、`systemService`、`userService`

5. **初始化数据库**
   - 在开发者工具控制台中执行：
   ```javascript
   wx.cloud.callFunction({
     name: 'systemService',
     data: { action: 'system_db_init' }
   })
   ```

6. **运行项目**
   - 点击「编译」按钮或使用快捷键 `Ctrl+S`

---

## 项目结构

```
HX_Tong/
├── project.config.example.json   # 项目配置模板（复制为 project.config.json 使用）
├── cloudfunctions/               # 云函数（4个大合集）
│   ├── meetingroomService/       # 会议室服务（14个API）
│   ├── userService/              # 用户服务（7个API）
│   ├── adminService/             # 管理员服务（9个API）
│   └── systemService/            # 系统服务（2个API）
├── miniprogram/                  # 小程序前端（四层架构）
│   ├── config/
│   │   ├── constants.js          # 常量定义
│   │   └── env.example.js        # 环境配置模板（复制为 env.js 使用）
│   ├── services/                 # API 服务
│   ├── stores/                   # 状态管理
│   ├── theme/                    # 主题系统
│   ├── utils/                    # 工具函数
│   ├── assets/images/            # 图片资源
│   └── pages/                    # 页面
├── themes/                       # 主题包
└── README.md                     # 本文档
```

### 核心文件

| 文件路径 | 说明 |
|---------|------|
| `miniprogram/数据互通层/config/global.config.js` | 全局业务配置（信誉分规则、预约规则等） |
| `miniprogram/逻辑层/services/api.service.js` | 统一API调用服务 |
| `cloudfunctions/meetingroomService/index.js` | 会议室服务云函数入口 |
| `cloudfunctions/userService/index.js` | 用户服务云函数入口 |

---

## API列表

### meetingroomService（会议室服务）

```
meetingroom_booking_create      # 创建预约
meetingroom_booking_cancel      # 取消预约
meetingroom_booking_getMyList   # 获取我的预约列表
meetingroom_booking_getDetail   # 获取预约详情
meetingroom_booking_approve     # 审批预约
meetingroom_booking_signIn      # 预约签到
meetingroom_getList             # 获取会议室列表
meetingroom_getDetail           # 获取会议室详情
meetingroom_getTimeSlots        # 获取可预约时段
meetingroom_manage_create       # 创建会议室
meetingroom_manage_update       # 更新会议室
meetingroom_manage_delete       # 删除会议室
meetingroom_manage_getBookings  # 获取所有预约
```

### userService（用户服务）

```
user_login                      # 用户登录
user_getInfo                    # 获取用户信息
user_updateInfo                 # 更新用户信息
user_completeProfile            # 完善用户信息
user_credit_getScore            # 获取信誉分
user_credit_getRecords          # 获取信誉分记录
```

### adminService（管理员服务）

```
admin_login                     # 管理员登录
admin_dashboard_getStats        # 获取仪表盘数据
admin_user_getList              # 获取用户列表
admin_user_updateRole           # 更新用户角色
```

### systemService（系统服务）

```
system_db_init                  # 初始化数据库
system_db_view                  # 查看数据库
```

---

## 主题系统

支持多套预设主题，主题配置以JSON纯文本格式存储，支持导入导出。

**支持的主题**：
- `default`：默认主题
- `modern-blue`：科技蓝
- `dark-pro`：暗夜黑
- `warm-orange`：活力橙

**主题配置示例**：
```json
{
  "name": "默认主题",
  "colors": {
    "primary": "#1890FF",
    "background": "#F5F5F5",
    "text": "#262626"
  }
}
```

---

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

**提交规范**：
- `feat`: 新功能
- `fix`: 修复Bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 杂项

---

## 许可证

本项目仅供深圳职业技术大学集成电路学院内部使用。

---

## 联系我们

如有问题或建议，请联系项目团队：

- 📧 邮箱：<项目邮箱>
- 💬 微信：<项目微信>

---

<p align="center">
  Made with ❤️ by 深职大集成电路学院
</p>
