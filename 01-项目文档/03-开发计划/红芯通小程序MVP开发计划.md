# 红芯通小程序 MVP 开发指导手册

**文档版本**: v5.10
**编制日期**: 2026-05-13
**适用范围**: 红芯通会议室管理系统 MVP 版本

---

## 一、项目概述

### 1.1 项目背景

红芯通小程序是一个面向校园的会议室预约管理系统，支持用户查看会议室、预约会议室、管理员审批等功能。MVP 版本聚焦于两个核心模块：**会议室管理系统**和**会议室预约系统**（在同一代码模块中），以及**用户管理系统**。

### 1.2 核心目标

开发一个**最小可用**的会议室预约小程序，支持：
1. 用户微信登录并完善信息
2. 查看会议室详情并预约
3. 管理员审批预约申请
4. 会议室基础管理（增删改、状态、设施）
5. 用户权限标签管理
6. 信誉分管理
7. **标签制权限管理**（系统管理员/超级管理员/书院管理人/审批管理人）
8. **公共资源管理与预约**
9. **复杂的审批规则配置**
10. **时段状态可视化**
11. **系统设置与关于页面**
12. **手动输入手机号**

---

## 二、系统架构

### 2.1 技术栈

- **前端**: 微信小程序 (WXML + WXSS + JS)
- **后端**: 微信云开发 (CloudBase)
- **数据库**: 微信云数据库 (MongoDB)
- **云函数**: 微信云函数

### 2.2 模块划分

```
cloudfunctions/
├── adminService/        # 管理端服务
│   ├── handlers/
│   │   ├── dashboard.js      # 仪表盘
│   │   ├── login.js          # 管理员登录
│   │   ├── users.js          # 用户管理
│   │   ├── permissionTag.js   # 权限标签管理
│   │   ├── autoLogin.js       # 免密登录
│   │   ├── logout.js          # 退出登录
│   │   ├── publicResource.js  # 公共资源管理
│   │   ├── approvalRule.js    # 审批规则管理
│   │   └── fixAdminOpenid.js # 修复管理员openid
│   └── utils/
├── meetingroomService/  # 会议室服务（预约+管理）
│   ├── handlers/
│   │   ├── booking/          # 预约相关
│   │   │   ├── create.js     # 创建预约
│   │   │   ├── cancel.js     # 取消预约
│   │   │   ├── list.js       # 预约列表
│   │   │   ├── detail.js     # 预约详情
│   │   │   └── approve.js    # 审批预约
│   │   ├── manage/           # 管理相关
│   │   │   ├── roomCreate.js # 创建会议室
│   │   │   ├── roomUpdate.js # 更新会议室
│   │   │   ├── roomDelete.js # 删除会议室
│   │   │   └── getBookings.js # 获取预约记录
│   │   └── room/             # 会议室查询
│   │       ├── getList.js    # 获取会议室列表
│   │       ├── getDetail.js  # 获取会议室详情
│   │       ├── getTimeSlots.js # 获取可用时段
│   │       └── getPublicResources.js # 公共资源查询
│   └── utils/
├── systemService/       # 系统服务
│   ├── handlers/
│   │   ├── initDatabase.js   # 初始化数据库
│   │   └── dbViewer.js       # 数据库查看
│   └── utils/
└── userService/        # 用户服务
    ├── handlers/
    │   ├── login.js           # 用户登录
    │   ├── getInfo.js         # 获取用户信息
    │   ├── updateInfo.js      # 更新用户信息
    │   ├── completeProfile.js # 完善信息
    │   ├── credit.js          # 信誉分
    │   ├── cancel.js          # 取消预约
    │   └── getPhone.js        # 获取手机号（已弃用）
    └── utils/
```

### 2.3 小程序前端架构
- **底部导航栏（tabBar）**：3个 Tab — 首页（/pages/index）、会议室（/pages/room/list）、我的（/pages/profile/index）
- **管理端状态管理**：`miniprogram/stores/adminStore.js` — 管理员登录状态、token 管理、权限检查中枢
- **大一统鉴权**：`miniprogram/utils/permission.js` — 提供 `checkPermission()` / `getEffectivePermissions()` / `filterMenuByPermission()` / `checkAdminAuth()` 等大一统鉴权函数，所有页面统一调用

---

## 三、数据库集合设计

### 3.1 users 集合（用户表）

```javascript
{
  _id: String,                // 系统自动生成
  _openid: String,            // 微信openid，唯一索引
  avatarUrl: String,          // 微信头像
  realName: String,            // 真实姓名（对外展示）
  studentId: String,          // 学号
  className: String,          // 班级（集成电路学院用户从列表选择，其他手动输入）
  academy: String,            // 学院
  phone: String,              // 手机号（通过微信getPhoneNumber获取）
  role: String,               // 角色：user（普通用户，已废弃旧值admin/superAdmin）
  status: Number,             // 0-正常 1-禁用
  permissionTags: Array,      // 权限标签 [{tagId, tagName, role, permissions: {canXxx: Boolean}}]
  creditScore: Number,        // 当前信誉分
  creditBase: Number,         // 信誉分基数
  profileCompleted: Boolean,   // 信息收集是否完成（首次登录必须完成）
  createTime: Date,
  updateTime: Date
}
```

### 3.2 rooms 集合（会议室表）

```javascript
{
  _id: String,
  name: String,               // 会议室名称
  location: String,           // 位置描述
  capacity: Object,           // 容纳人数 {min: 18, max: 36}
  description: String,        // 会议室简介
  images: Array,              // 图片URL数组 [{url, isDefault}]
  facilities: Array,          // 设施列表 [{id, name, type, icon}]
  publicResources: Array,     // 公共资源ID数组
  openTime: String,           // 开放时间 "08:00"
  closeTime: String,          // 关闭时间 "22:00"
  status: String,             // available/unavailable/hidden
  approvalRuleId: String,     // 审批规则ID
  createdBy: String,          // 创建者openid
  createdByName: String,      // 创建者名称
  createTime: Date,
  updateTime: Date
}
```

### 3.3 bookings 集合（预约记录表）

```javascript
{
  _id: String,
  userId: String,             // 用户openid
  userName: String,           // 用户姓名（realName）
  studentId: String,           // 学号
  roomId: String,             // 会议室ID
  roomName: String,           // 会议室名称
  roomLocation: String,       // 会议室位置
  date: String,               // 预约日期 "2026-04-24"
  startTime: String,          // 开始时间 "09:00"
  endTime: String,           // 结束时间 "10:00"
  duration: Number,           // 预约时长（分钟）
  purpose: String,           // 用途描述
  attendees: Number,          // 参与人数
  contactPhone: String,       // 联系人电话
  status: String,            // pending/approved/rejected/cancelled/completed
  needApproval: Boolean,      // 是否需要审批
  approvalRuleMatched: String,// 匹配的审批规则名称
  approverId: String,         // 审批人ID
  approverName: String,       // 审批人姓名
  approveTime: Date,          // 审批时间
  rejectReason: String,       // 拒绝原因
  usedPublicResources: Array, // 使用公共资源 [{resourceId, resourceName, location}]
  creditDeduct: Number,       // 取消时扣分
  createTime: Date,
  updateTime: Date
}
```

### 3.4 permission_tags 集合（权限标签表）

```javascript
{
  _id: String,
  name: String,               // 标签名称
  isSystem: Boolean,          // 是否系统标签
  role: String,               // 角色标识：systemAdmin/superAdmin/academyManager/approvalManager
  description: String,         // 描述
  permissions: Object,  // 权限配置
  {
    canManageRooms: Boolean,
    canDeleteRooms: Boolean,
    canManagePublicResources: Boolean,
    canApproveBookings: Boolean,
    canViewAllUsers: Boolean,
    canEditUsers: Boolean,
    canManageApprovalRules: Boolean,
    canManagePermissions: Boolean,
    canManageSystem: Boolean,
    canDatabaseManage: Boolean,
    canAssignPermissionTags: Boolean
  },
  createTime: Date,
  updateTime: Date
}
```

### 3.5 approval_rules 集合（审批规则表）

```javascript
{
  _id: String,
  name: String,               // 规则名称
  type: String,               // global/meetingroom
  roomId: String,             // 会议室ID（仅 meetingroom 类型）
  priority: Number,            // 优先级，数字越大优先级越高
  conditions: Array,           // 条件列表
  [{
    type: String,             // tag/time/duration/advanceHours
    operator: String,         // in/notIn/before/after/between/gt/lt/gte/lte
    value: Mixed,             // 条件值
    timeSlot: String          // 工作日 morning/afternoon/evening, 周末, 节假日
  }],
  action: String,             // auto_approve/manual_approve
  minAdvanceHours: Number,     // 至少提前X小时预约
  enabled: Boolean,           // 是否启用
  createTime: Date,
  updateTime: Date
}
```

### 3.6 public_resources 集合（公共资源表）

```javascript
{
  _id: String,
  name: String,               // 资源名称
  type: String,               // 资源类型 projector/monitor/whiteboard/audio/laptop/camera/other
  totalQuantity: Number,       // 总数量（默认1）
  availableQuantity: Number,   // 当前可用数量（系统维护字段，由预约系统自动更新）
  description: String,         // 描述
  images: Array,              // 图片
  icon: String,              // 图标名称
  location: String,           // 当前位置（如"1号楼101"）
  sort: Number,               // 排序权重
  status: Number,             // 1-可用 0-停用（status: 1=available, 0=maintenance/lent）
  createTime: Date,
  updateTime: Date
}
```
> **注意**: 公共资源的时段互斥通过查询 `bookings` 表实时计算（`totalQuantity` - 时段内冲突预约数 = 时段可用数），`availableQuantity` 字段保留用于表示因维修等原因不可用的资源数量。

### 3.8 credit_scores 集合（信誉分表）

```javascript
{
  _id: String,
  userId: String,             // 用户ID
  currentScore: Number,       // 当前信誉分（默认100）
  baseScore: Number,          // 基础信誉分（默认100）
  totalPlus: Number,          // 总加分
  totalMinus: Number,         // 总扣分
  lastRestoreDate: Date,      // 最后恢复日期
  createTime: Date,
  updateTime: Date
}
```

### 3.9 admins 集合（管理员表）

```javascript
{
  _id: String,
  _openid: String,            // 微信openid（首次登录时绑定）
  username: String,           // 用户名
  passwordHash: String,       // bcrypt加密密码
  role: String,               // 角色：systemAdmin/superAdmin/academyManager/approvalManager
  name: String,               // 显示名称
  status: String,             // active/inactive
  permissionTags: Array,      // 权限标签 [{tagId, tagName, role, permissions: {canXxx: Boolean}}]
  lastLoginTime: Date,        // 最后登录时间
  createTime: Date,
  updatedAt: Date
}
```

### 3.10 admin_tokens 集合（管理员令牌表）

```javascript
{
  _id: String,
  adminId: String,            // 关联管理员ID
  token: String,              // 令牌字符串
  openid: String,             // 微信openid
  createdAt: Date,            // 创建时间
  expiresAt: Date,            // 过期时间（24小时）
  isValid: Boolean            // 是否有效（登出或过期时设为false）
}
```

---

### 3.7 credit_records 集合（信誉分变动记录表）

```javascript
{
  _id: String,
  userId: String,             // 用户openid
  type: String,               // plus/minus
  scoreChange: Number,         // 分数变动值
  reason: String,             // 变动原因
  relatedBookingId: String,   // 关联预约ID
  operatorId: String,         // 操作人ID（admin_xxx/system）
  createTime: Date
}
```

---

## 四、功能模块详细设计

### 4.1 用户登录与信息收集模块（v4.0新增）

#### 4.1.1 微信登录头像获取
- 登录时通过微信 `open-type="chooseAvatar"` 获取用户头像
- 头像获取后自动上传至微信云存储，获得永久 fileID 存入数据库
- 已弃用旧版 `wx.getUserProfile`（微信已回收该接口权限）
- 个人中心/编辑页支持重新同步微信头像
- 手机号通过用户手动输入获取

#### 4.1.2 首次登录强制信息收集
- 第一次登录后强制跳转至用户信息收集界面
- 必填字段：姓名、学号、班级、学院、手机号（手动输入）
- 不再使用昵称（nickName），统一使用真实姓名（realName）展示
- 如用户拒绝填写，则退出登录状态，需重新登录注册

#### 4.1.3 学院班级联动逻辑
- **集成电路学院**：从预设班级列表中选择
  - 23电子本、23通信本、24电子本、24通信本、24集成电路本
  - 25电子本1、25电子本2、25通信本1、25通信本2、25集成电路本1、25集成电路本2
- **其他学院**：手动输入班级名称

#### 4.1.4 学院列表
```
集成电路学院、未来技术学院、人工智能本科学院、本科教育学院、
电子与信息工程学院、人工智能学院、机电工程学院、经济学院、
管理学院、数字传媒学院、艺术设计学院、商务外语学院、
材料与环境工程学院、建筑工程学院、食品药品学院、
数字创意与动画学院、汽车与交通学院、医学技术与护理学院、
职业技术教育学院、马克思主义学院、创新创业学院、
创新创意设计学院、国际教育学院
```

#### 4.1.5 权限标签分配
- 权限标签由管理员在管理后台统一创建和管理
- 用户完善信息后不再自动生成学院标签和班级标签
- 管理员可通过用户编辑页为用户分配权限标签

---

### 4.2 管理员用户管理模块（v4.0增强）

#### 4.2.1 用户删除功能
- 删除按钮仅对有 canEditUsers 权限的管理员可见
- 执行删除需进行两次确认：
  - 第一次："确定要删除该用户吗？"
  - 第二次："此操作不可恢复，确认删除？"
- 被删除用户数据需彻底清除，必须重新注册才能再次使用

#### 4.2.2 用户信息编辑功能
- 管理员可修改字段：头像、姓名（realName）、学号、班级、学院、手机号、权限标签
- 管理员可赋予/移除用户权限标签
- 管理员不可修改微信openid
- 普通用户仅可修改头像和手机号，其余信息只读展示

#### 4.2.3 一键重置用户头像
- 管理员点击按钮后，用户头像恢复为系统默认头像

#### 4.2.4 用户管理分类筛选弹窗
- 用户管理页新增底部弹出式分类筛选弹窗（bottom-sheet）
- 筛选维度：学院、班级、信誉分范围（最低/最高）、信息完善状态
- 学院和班级选项从云函数聚合查询动态加载（去重），支持模糊搜索
- 筛选条件可组合使用，点击确认按钮后应用筛选
- 云函数支持 `academy`/`className`/`minCredit`/`maxCredit`/`profileCompleted` 多条件查询

---

### 4.3 管理界面功能模块（v4.0修复）

#### 4.3.1 公共资源管理
- 页面：/pages/admin/public-resources
- 功能：创建、编辑、删除公共资源
- 支持状态切换：available/lent/maintenance
- 资源位置配置（用于与会议室位置匹配）

#### 4.3.2 权限标签制管理
- 权限管理采用标签制，不再使用0-10级分级
- 系统管理员：从设置页面入口登录，不绑定微信账号，拥有所有权限包含数据库管理
- 超级管理员：拥有除数据库管理外的所有功能，可分配权限标签和创建权限标签
- 书院管理人：可增删改会议室和公共资源，可审批预约，可查看用户信息（不可编辑）
- 审批管理人：只能审批预约
- 普通用户无管理后台入口
- 管理后台入口在"我的"页面，有权限标签的用户免密进入
- 权限标签创建时支持详细配置管理功能权限（permissions对象）

#### 4.3.3 审批规则管理
- 页面：/pages/admin/approval-rules
- 支持创建、编辑、删除审批规则
- 支持规则启用/禁用
- 支持全局规则和会议室规则

#### 4.3.4 权限标签管理
- 页面：/pages/admin/permission-tags
- 创建、编辑、删除权限标签
- 设置标签名称、权限配置（详细配置每个管理功能的开关）

---

### 4.4 会议室编辑功能模块（v4.0修复增强）

#### 4.4.1 会议室照片管理
- 支持上传多张会议室图片
- 支持设置默认图片
- 支持删除图片
- 支持图片预览

#### 4.4.2 会议室内设施管理
- 支持设施的添加、编辑、删除
- 设施类型：投影仪、白板、电视、音响等
- 每个设施有唯一ID和图标

#### 4.4.3 会议室简介编辑
- 支持编辑会议室简介
- 前端条件显示：简介为空时不展示该区域

#### 4.4.4 审批规则编辑（重点）
- 支持分时段配置（工作日上午/下午/晚上、周末、节假日）
- 支持基于用户标签的自动审批设置
- 支持基于预约时长的审批流程（如：短时长自动通过，超过阈值需人工审批）
- 支持预约时间限制规则（如：至少提前1小时预约）

---

### 4.5 信誉分展示模块（v4.0修复）

#### 4.5.1 信誉分规则一致性
- 页面展示的信誉分规则与系统实际计算逻辑完全匹配
- 信誉分上限：150分（可达到"优秀"等级 ≥120分）
- 信誉分扣分规则：
  - 取消预约（≥6小时前）：0分
  - 取消预约（3-6小时前）：-3分
  - 取消预约（1-3小时前）：-5分
  - 取消预约（<1小时前）：-10分
- 信誉分预约权限：≥80分正常预约，<80分禁止预约

---

### 4.6 会议室列表界面模块（v4.0优化）

#### 4.6.1 状态标签显示优化
- 绿色标签使用浅绿色背景+深绿色文字（参考会议室详情页现有样式）
- 统一其他颜色标签的显示效果
- 确保所有状态标签文字清晰可见

---

### 4.7 会议室详情页面模块（v4.0完善）

#### 4.7.1 简介条件显示
- 简介内容为空时不展示该区域
- 有内容时正常展示

#### 4.7.2 预约规则实时更新
- 会议室详情页预约规则展示与管理员设置保持同步
- 管理员修改后用户端立即可见
- 展示预约提前天数限制（advanceDays）：最早可预约天数 / 最晚可预约天数
- 仅在管理员配置了 advanceDays 限制时显示，未配置时不展示该区域

---

### 4.8 会议室预约功能模块（v4.0优化）

#### 4.8.1 公共资源关联过滤与选择功能（v5.4 实现）
- 会议室通过 `publicResources` 数组关联公共资源ID
- 公共资源需要配置位置，只有位置与会议室相同的资源可以关联
- 用户在会议室详情页和预约创建页只能看到与当前会议室关联的公共资源
- 用户预约时可选择与预约会议室位置相同的公共资源
- 允许查看位置不同的公共资源但不允许预约（需状态显示）
- 公共资源列表由管理员在后台添加和管理
- **公共资源的跨会议室同时段互斥选择逻辑**（已实现）：
  - 每个公共资源有 `totalQuantity`（总库存数量），如投影仪共3台
  - 同一资源同一时段的总预约数量不能超过 `totalQuantity`
  - 例如：投影仪A共3台。用户甲预约9:00-10:00用了1台，用户乙同时段可用2台，用户丙同时段可用1台，用户丁不可用（已满）
  - 不同时段可复用：用户甲9:00-10:00预约了投影仪A，用户乙10:00-11:00可再次预约投影仪A
  - **实现方式**：
    - 云函数 `getPublicResources` 接受可选 date/startTime/endTime 参数
    - 计算逻辑：查询该时段内所有 pending/approved 状态的 booking，统计每个资源的已占用量
    - 时段可用数量 = totalQuantity - 时段已占用量
    - 前端在选择时段后自动刷新公共资源可用性，已满资源显示为不可选
    - 提交时 `checkResourceAvailability` 再次校验，防止并发冲突

#### 4.8.2 时段状态可视化
- 时间选择器分区显示：
  - 可用时段（绿色/白色）
  - 已预约待审批时段（橙色/黄色）
  - 已预约已通过时段（红色）
- 会议室详情页显示预约日历（未来7天）
- 用户选择时间时实时提示冲突

#### 4.8.3 预约时间限制
- 禁止预约昨天的任何时段
- 禁止预约当前时间之前的时段
- 例如：当前9:15可预约9:00开始的时段，但不可预约8:30开始的时段
- 支持管理员配置"至少提前X小时预约"

#### 4.8.4 候补规则
- 当一个时段已被用户A预约（审批未通过），用户B预约同一重叠时段时直接拒绝
- 不支持候补排队功能

---

## 五、业务规则汇总

### 5.1 预约规则

| 规则项 | 设置值 |
|--------|--------|
| 开放时段 | 08:00 - 22:00 |
| 最长预约时长 | 8小时 |
| 最短预约时长 | 30分钟 |
| 提前预约时间 | 至少提前30分钟（可配置） |
| 预约冲突检测 | 同一时段同一会议室只能有一个预约 |
| 候补规则 | 直接拒绝冲突预约 |

### 5.2 信誉分规则

#### 5.2.1 预约权限规则

| 信誉分范围 | 预约权限 |
|-----------|---------|
| < 80分 | 禁止预约 |
| ≥ 80分 | 正常预约 |

#### 5.2.2 信誉分扣分规则

| 场景 | 扣分值 | 说明 |
|------|--------|------|
| 取消预约（≥6小时前） | 0分 | 免费取消 |
| 取消预约（3-6小时前） | -3分 | 扣3分 |
| 取消预约（1-3小时前） | -5分 | 扣5分 |
| 取消预约（<1小时前） | -10分 | 扣10分 |

### 5.3 数据归档规则

| 规则 | 说明 |
|------|------|
| 归档时间 | 预约结束3个月后 |
| 归档操作 | 从 bookings 移动到 bookings_archive（归档集合按需创建，不在 initDatabase 中） |
| 查询历史 | 需单独查询归档表 |

---

## 六、页面清单

### 6.1 用户端页面

| 页面 | 路径 | 功能 | 状态 |
|------|------|------|------|
| 登录页 | /pages/login/login | 微信授权登录 | ✅ 修复头像获取 |
| 信息完善页 | /pages/profile/complete | 首次登录填写信息（微信获取手机号） | ✅ 重构 |
| 首页 | /pages/index/index | 快捷入口、今日预约 | ✅ 圆角卡片优化 |
| 会议室列表 | /pages/room/list | 会议室卡片展示 | ✅ 优化状态标签 |
| 会议室详情 | /pages/room/detail | 会议室信息+预约入口+预约日历 | ✅ 增强 |
| 预约创建 | /pages/booking/create | 选择日期、时段、公共资源、填写信息 | ✅ 双列+动画 |
| 预约成功 | /pages/booking/success | 预约结果展示 | ✅ |
| 我的预约 | /pages/booking/mylist | 预约记录列表 | ✅ |
| 预约详情 | /pages/booking/detail | 预约详情+取消 | ✅ |
| 个人中心 | /pages/profile/index | 个人信息、头像预览、管理后台入口 | ✅ 重构(移除头像更换) |
| 个人信息编辑 | /pages/profile/edit | 编辑头像(整合二选一)、手机号 | ✅ 重构(整合头像入口) |
| 信誉分详情 | /pages/credit/index | 信誉分+变动记录 | ✅ 修复规则一致性 |
| 系统设置 | /pages/settings/settings | 编辑信息、更换主题、退出登录、关于、开发者模式 | ✅ 新增 |
| 关于 | /pages/about/about | 小程序信息、备案信息 | ✅ 新增 |
| 主题设置 | /pages/theme-settings/theme-settings | 主题切换 | ✅ |

### 6.2 管理端页面

| 页面 | 路径 | 功能 | 状态 |
|------|------|------|------|
| 管理员登录 | /pages/admin/login | 系统管理员账号密码登录 | ✅ |
| 管理首页 | /pages/admin/index | 根据权限标签动态菜单 | ✅ 重构 |
| 审批列表 | /pages/admin/approvals | 待审批列表 | ✅ |
| 审批详情 | /pages/admin/approval-detail | 审批操作 | ✅ |
| 会议室管理 | /pages/admin/rooms | 会议室列表 | ✅ |
| 会议室编辑 | /pages/admin/room-edit | 会议室增删改+照片+设施+简介+审批规则 | ✅ 修复增强 |
| 预约记录 | /pages/admin/bookings | 所有预约查询 | ✅ |
| 用户管理 | /pages/admin/users | 用户列表、编辑、权限标签赋予 | ✅ 重构 |
| 用户编辑 | /pages/admin/user-edit | 编辑用户信息+权限标签 | ✅ 修复闪退 |
| 权限标签管理 | /pages/admin/permission-tags | 标签增删改+权限配置 | ✅ 重构 |
| 公共资源管理 | /pages/admin/public-resources | 公共资源CRUD+状态切换 | ✅ |
| 审批规则管理 | /pages/admin/approval-rules | 审批规则CRUD+启用禁用 | ✅ |
| 数据库管理 | /pages/admin/initdb | 数据库初始化（系统管理员专属） | ✅ |

---

## 七、云函数接口

### 7.1 meetingroomService

| action | 功能 | 参数 | 返回 | 状态 |
|--------|------|------|------|------|
| meetingroom_booking_create | 创建预约 | roomId, date, startTime, endTime, purpose, attendees, contactPhone, publicResources | {bookingId, status} | ✅ |
| meetingroom_booking_cancel | 取消预约 | bookingId | {success, creditDeduct} | ✅ |
| meetingroom_booking_getMyList | 我的预约列表 | page, pageSize, status | {list, total} | ✅ |
| meetingroom_booking_getDetail | 预约详情 | bookingId | {bookingInfo} | ✅ |
| meetingroom_booking_approve | 审批预约 | bookingId, action, reason | {success} | ✅ |
| meetingroom_getList | 会议室列表 | isAdmin | {list} | ✅ |
| meetingroom_getDetail | 会议室详情 | roomId, isAdmin | {roomInfo} | ✅ |
| meetingroom_getTimeSlots | 可用时段+状态 | roomId, date | {timeSlots, slotStatuses} | ✅ 增强 |
| meetingroom_manage_create | 创建会议室 | (见会议室字段) | {roomId} | ✅ |
| meetingroom_manage_update | 更新会议室 | roomId, (见会议室字段) | {success} | ✅ |
| meetingroom_manage_delete | 删除会议室 | roomId | {success} | ✅ |
| meetingroom_manage_getBookings | 预约记录查询 | page, pageSize, status, userId, roomId | {list, pagination} | ✅ |

### 7.2 adminService

| action | 功能 | 参数 | 返回 | 状态 |
|--------|------|------|------|------|
| admin_login | 管理员登录（系统管理员） | username, password | {token, adminInfo} | ✅ |
| admin_autoLogin | 免密登录（权限标签用户） | - | {token, adminInfo, permissionTags} | ✅ 新增 |
| admin_dashboard_getData | 仪表盘数据 | - | {stats} | ✅ |
| admin_users_getList | 用户列表 | page, pageSize, keyword | {list, total} | ✅ |
| admin_users_updateUser | 更新用户信息 | userId, {avatarUrl, realName, studentId, className, academy, phone} | {success} | ✅ |
| admin_users_delete | 删除用户 | userId | {success} | ✅ 需两次确认 |
| admin_users_resetAvatar | 重置用户头像 | userId | {success} | ✅ |
| admin_user_updatePermissionTags | 更新用户权限标签 | userId, permissionTags | {success} | ✅ 新增 |
| admin_users_updateCredit | 更新用户信誉分 | userId, scoreChange, reason | {success} | ✅ |
| admin_users_getBookings | 获取用户预约 | userId, page, pageSize | {list, pagination} | ✅ |
| admin_publicResource_getList | 公共资源列表 | - | {list} | ✅ |
| admin_publicResource_create | 创建公共资源 | {name, type, description, location} | {resourceId} | ✅ |
| admin_publicResource_update | 更新公共资源 | resourceId, (见公共资源字段) | {success} | ✅ |
| admin_publicResource_delete | 删除公共资源 | resourceId | {success} | ✅ |
| admin_publicResource_changeStatus | 切换资源状态 | resourceId, status | {success} | ✅ |
| admin_approvalRule_getList | 审批规则列表 | type, roomId | {list} | ✅ |
| admin_approvalRule_create | 创建审批规则 | {name, type, roomId, priority, conditions, action, minAdvanceHours, enabled} | {ruleId} | ✅ |
| admin_approvalRule_update | 更新审批规则 | ruleId, (见审批规则字段) | {success} | ✅ |
| admin_approvalRule_delete | 删除审批规则 | ruleId | {success} | ✅ |
| admin_approvalRule_toggle | 启用/禁用规则 | ruleId, enabled | {success} | ✅ |
| admin_permissionTag_getList | 权限标签列表 | - | {list} | ✅ |
| admin_permissionTag_create | 创建权限标签 | {name, role, permissions} | {tagId} | ✅ |
| admin_permissionTag_update | 更新权限标签 | tagId, {name, role, permissions} | {success} | ✅ |
| admin_permissionTag_delete | 删除权限标签 | tagId | {success} | ✅ |
| admin_permissionTag_initSystem | 初始化系统标签 | - | {success} | ✅ |
| admin_permissionTag_fixSystemTags | 修复系统标签 | - | {success} | ✅ |
| admin_permissionTag_removeOldTags | 清理旧标签 | - | {success} | ✅ |
| admin_logout | 退出登录 | - | {success} | ✅ |

### 7.3 userService

| action | 功能 | 参数 | 返回 | 状态 |
|--------|------|------|------|------|
| user_login | 用户登录 | code | {openid, userInfo} | ✅ |
| user_getInfo | 获取用户信息 | - | {userInfo} | ✅ |
| user_updateInfo | 更新用户信息 | {avatarUrl, phone} | {success} | ✅ |
| user_completeProfile | 完善信息（首次登录） | {realName, studentId, className, academy, phone, avatarUrl} | {success} | ✅ |
| user_cancelBooking | 取消预约 | {bookingId} | {success, creditDeduct} | ✅ |
| user_getPhone | 获取微信手机号（已弃用） | cloudID | {phoneNumber} | ⚠️ 已弃用，改为手动输入 |
| user_getCredit | 获取信誉分 | - | {currentScore, baseScore} | ✅ |
| user_getCreditRecords | 信誉分记录 | page, pageSize | {list, total} | ✅ |

### 7.4 systemService

| action | 功能 | 参数 | 返回 | 状态 |
|--------|------|------|------|------|
| system_initDatabase | 初始化数据库 | - | {success} | ✅ |
| system_dbViewer | 查看数据库 | - | {collections} | ✅ |

---

## 八、功能完成标准

### 8.1 用户端功能

| 功能 | 完成标准 |
|------|---------|
| 登录 | 微信授权登录成功，自动获取头像和真实姓名 |
| 信息完善 | 学院班级联动，表单验证，数据正确保存，自动分配标签 |
| 强制跳转 | 未完成信息收集的用户强制跳转至信息完善页 |
| 会议室列表 | 正确显示会议室卡片，状态标签清晰可见 |
| 会议室详情 | 简介条件显示，预约日历展示，预约规则实时更新 |
| 预约创建 | 时段状态分区显示，公共资源按位置匹配，冲突检测 |
| 预约列表 | 正确显示预约记录和状态 |
| 信誉分 | 规则展示与实际计算一致 |

### 8.2 管理端功能

| 功能 | 完成标准 |
|------|---------|
| 用户删除 | 仅系统管理员/超级管理员可见，两次确认，数据彻底清除 |
| 用户编辑 | 所有字段可编辑（除openid） |
| 重置头像 | 一键重置为默认头像 |
| 会议室编辑 | 照片上传，设施增删改，简介编辑，审批规则配置 |
| 公共资源 | CRUD正常，状态切换，位置配置 |
| 审批规则 | CRUD正常，分时段、基于标签、按时长等复杂配置 |
| 权限管理 | 标签制权限管理，创建标签时详细配置权限 |

### 8.3 业务逻辑

| 逻辑 | 完成标准 |
|------|---------|
| 时间选择 | 开始/结束时间选择器正常工作 |
| 冲突检测 | 同会议室同时段、同时段多会议室检测生效 |
| 时段状态显示 | 可用/待审批/已预约状态分区显示 |
| 自动审批 | 规则匹配正确，分时段/标签/时长判断准确 |
| 信誉分扣分 | 按取消时间距会议开始时长正确扣分 |
| 公共资源互斥 | 同一资源同时段跨会议室互斥，不同时段可复用 |

---

## 九、测试方法

### 9.1 单模块测试

#### 9.1.1 用户端测试

| 测试项 | 测试步骤 | 预期结果 |
|--------|---------|---------|
| 微信登录 | 点击登录按钮 | 授权成功，头像和昵称自动获取 |
| 信息完善 | 选择学院、班级，填写信息提交 | 学院班级联动，学院标签和班级标签自动分配 |
| 强制跳转 | 未完成信息收集尝试访问其他页面 | 强制跳转至信息完善页 |
| 拒绝填写 | 点击拒绝填写按钮 | 退出登录状态 |
| 时段状态 | 进入预约创建页选择时间 | 显示可用/待审批/已预约状态 |
| 公共资源 | 选择会议室后查看可预约资源 | 只显示位置匹配的资源 |
| 信誉分 | 查看信誉分页面规则 | 与实际计算规则一致 |

#### 9.1.2 管理端测试

| 测试项 | 测试步骤 | 预期结果 |
|--------|---------|---------|
| 用户删除-无权限 | 无 canEditUsers 权限的管理员尝试删除用户 | 看不到删除按钮 |
| 用户删除-有权限 | 有 canEditUsers 权限的管理员删除用户 | 两次确认后删除成功 |
| 用户编辑 | 修改用户信息保存 | 信息更新成功 |
| 重置头像 | 点击重置头像按钮 | 头像恢复为默认 |
| 审批规则-分时段 | 配置不同时段不同审批方式 | 按预约时段匹配规则 |
| 审批规则-标签 | 配置特定标签自动审批 | 匹配标签的预约自动通过 |
| 审批规则-时长 | 配置短时长自动长时长人工 | 按预约时长匹配规则 |

### 9.2 集成测试

| 测试项 | 测试步骤 | 预期结果 |
|--------|---------|---------|
| 完整预约流程 | 用户预约 → 显示时段状态 → 管理员审批 → 完成 | 全流程正常 |
| 自动审批流程 | 满足自动审批条件 | 自动通过审批 |
| 公共资源互斥 | 两个会议室同时预约同一资源 | 第二个预约失败 |
| 时段冲突 | 预约 09:00-10:00 和 09:30-10:30 | 冲突检测生效 |

---

## 十、v4.0新增功能清单

### 10.1 用户登录与信息收集（模块1）

- [ ] 修复微信登录头像获取（自动获取微信头像和真实姓名）
- [ ] 重构信息完善页面（/pages/profile/complete）
- [ ] 实现学院班级联动选择（集成电路学院从列表选，其他手动输入）
- [ ] 实现首次登录强制跳转逻辑
- [ ] 实现拒绝填写退出登录
- [ ] 权限标签由管理员统一管理，不再自动生成学院/班级标签

### 10.2 管理员用户管理（模块2）

- [ ] 用户删除功能（仅canEditUsers权限管理员可见，两次确认）
- [ ] 用户信息完整编辑功能（头像、真实姓名、学号、班级、学院、手机号）
- [ ] 一键重置用户头像功能

### 10.3 管理界面功能（模块3）

- [ ] 公共资源管理完整功能（CRUD+状态切换）
- [ ] 权限管理界面完整功能
- [ ] 审批规则管理完整功能
- [ ] 权限标签管理检查和修复

### 10.4 会议室编辑功能（模块4）

- [ ] 会议室照片上传与编辑
- [ ] 会议室内设施的添加、编辑、删除
- [ ] 会议室简介编辑
- [ ] 审批规则复杂配置（分时段、基于标签、基于时长、最少提前X小时）

### 10.5 信誉分展示（模块5）

- [ ] 信誉分界面展示规则与实际计算规则一致性修复

### 10.6 会议室列表界面（模块6）

- [ ] 修复绿色标签文字不可见问题
- [ ] 统一其他颜色标签显示效果

### 10.7 会议室详情页面（模块7）

- [ ] 简介条件显示（为空时不展示）
- [ ] 预约规则实时更新功能

### 10.8 会议室预约功能（模块8）

- [ ] 公共资源位置匹配逻辑
- [ ] 时间选择器时段状态分区显示
- [ ] 会议室详情页预约日历（未来7天）
- [ ] 禁止预约昨天及过去时段
- [ ] 候补规则（直接拒绝冲突预约）

---

## 十一、附录

### 11.1 数据库索引设计

```javascript
// users 集合
_openid: 唯一索引
role: 普通索引
"permissionTags.tagId": 普通索引
profileCompleted: 普通索引

// rooms 集合
status: 普通索引
"facilities.id": 普通索引
location: 普通索引

// bookings 集合
userId: 普通索引
roomId: 普通索引
date: 普通索引
status: 普通索引
"roomId_date_startTime": 复合唯一索引
createTime: 普通索引（倒序）
"usedPublicResources.resourceId": 普通索引

// permission_tags 集合
role: 普通索引
isSystem: 普通索引

// approval_rules 集合
type: 普通索引
roomId: 普通索引
priority: 普通索引
enabled: 普通索引

// public_resources 集合
status: 普通索引
location: 普通索引
```

### 11.2 定时任务（已精简）

| 任务 | 触发时间 | 功能 |
|------|---------|------|
| bookingArchiveData | 每月1日 03:00 | 归档3个月前数据 |

**已删除的定时任务**:
- ❌ creditDailyRestore - 信誉分每日恢复（已取消）
- ❌ bookingCheckNoShow - 检查未签到预约（已取消）
- ❌ bookingSignIn - 签到功能（已取消）

---

**文档结束**

*v5.1 更新记录 (2026-05-06)：*

1. **权限系统核心Bug修复**
   - 修复 verifyToken.js 不返回 permissionTags 导致入口层权限检查始终失败的问题
   - 修复 autoLogin.js 创建的 token 字段名与 verifyToken 不匹配（expiryTime→expiresAt, 缺少 isValid: true）
   - 修复 autoLogin 的 adminId 指向 users 集合但 verifyToken 在 admins 集合查找的问题（支持双集合查找）
   - 修复 meetingroomService 仅检查 role==='superAdmin' 的问题（改用权限标签体系）
   - 修复 systemService 仅允许 superAdmin 的问题（改用 canDatabaseManage 权限检查）
   - 修复 adminStore.hasPermission 对 superAdmin 直接返回 true 的 bug（superAdmin 不应有 canDatabaseManage 权限）

2. **UI样式统一**
   - 恢复个人中心头部卡片渐变方向为 180deg（从错误修改的 135deg 恢复）
   - 统一首页头部卡片样式与个人中心一致（全宽、仅底部圆角、去掉阴影）
   - 个人中心添加快捷功能入口（修改信息、更换主题、设置）

3. **手机号输入方式变更**
   - 取消微信授权获取手机号（getPhoneNumber），改为手动输入
   - 修改 complete.wxml/js 和 edit.wxml/js 中的手机号输入方式

4. **权限标签分配功能完善（重点）**
   - user-edit 页面新增权限标签分配 UI（标签选择器）
   - user-edit.js 新增权限标签加载、切换、保存逻辑
   - adminService.js 新增 updatePermissionTags 方法
   - 完整打通 user-edit → adminService → 云函数的权限标签分配链路

5. **图标补充**
   - 新增 theme.png、resource.png、rule.png、permission.png 图标文件

6. **管理后台菜单图标渲染修复**
   - admin/index.wxml 图标从 `<text>` 改为 `<image>` 标签渲染

7. **admin页面认证检查统一**
   - 将 checkAdminAuth 提取为共享函数纳入 `miniprogram/utils/permission.js`，所有 10 个 admin 页面统一导入调用
   - initdb.js 改用权限标签检查（canDatabaseManage）替代硬编码 role 检查

8. **审查修复**
   - 修复登录页缺失 showUserAgreement/showPrivacyPolicy 事件处理器
   - 修复 initdb.wxml 中 JSON.stringify 在 WXML 中不支持的问题
   - 统一版本号为 v2.1.0

**v5.2 更新记录 (2026-05-07)：**

1. **权限系统彻底重构** - 移除0-10级权限等级，改为基于permissions对象的标签制
2. **手机号输入方式变更** - 取消微信getPhoneNumber，改为手动输入
3. **权限标签详细配置** - 创建标签时可配置每个管理功能的开关
4. **系统管理员入口** - 从设置页面"系统管理"入口登录，不绑定微信账号
5. **用户管理标签筛选** - 用户管理页面支持按权限标签分类筛选
6. **普通用户编辑限制** - 普通用户只能修改头像和手机号，其余信息只读
7. **图标修复** - 修复SVG/PNG混用、语义混用问题，补充缺失图标

**v5.3 更新记录 (2026-05-07)：**

1. **系统管理员角色修复** - 系统管理员role明确为`systemAdmin`（非`superAdmin`），initDatabase创建管理员时使用systemAdmin角色并包含完整permissionTags
2. **登录权限标签补全** - login.js新增无permissionTags时的默认权限标签生成逻辑，根据adminRole生成对应权限
3. **管理后台菜单回退** - admin/index.js的filterMenuByPermission新增role回退逻辑，permissionTags为空时根据role显示对应菜单
4. **权限标签管理完善** - permission-tags前端支持role字段输入，云函数create/update支持role字段，checkSuperAdminAuth新增role回退权限检查
5. **公共资源互斥机制** - 移除全局availableQuantity计数器，改为仅依赖预约时间窗口查询实现互斥：同一资源同一时段互斥，不同时段可分别预约
6. **审批规则level类型移除** - 移除审批规则中已废弃的level（用户等级）条件类型，仅保留timeSlot/tag/duration/advanceHours
7. **旧备份文件清理** - 删除4个旧备份目录（2026-04-22-refactor-backup/2026-05-06-permission-refactor-backup/2026-05-06-fix-backup/2026-05-06-ui-fix）
8. **换肤图标更新** - 使用icon-master重新生成高质量theme.png图标

**v5.4 更新记录 (2026-05-07)：**

1. **致命Bug修复：`canEdit is not defined`** - `miniprogram/pages/admin/users.js:63` 中 `loadCurrentAdmin()` 使用了未声明的局部变量 `canEdit`，导致用户管理页面加载崩溃。修复：添加 `canEdit` 变量声明和权限检查逻辑。

2. **致命Bug修复：权限标签permissions对象无法填充** - 三个文件中查询 `permission_tags` 集合时错误使用了 `_id` 匹配 `tagId`：
   - `cloudfunctions/adminService/shared/verifyToken.js:83` - 修改为 `tagId: db.command.in(...)`
   - `cloudfunctions/adminService/handlers/login.js:132` - 同上
   - `cloudfunctions/meetingroomService/index.js` - 新增完整的权限标签填充逻辑
   
   **影响**：修复前所有管理员操作返回403"权限不足，无法执行此操作"，修复后权限标签的permissions对象正确填充，所有管理功能恢复正常。

3. **超时重试机制** - `miniprogram/services/adminService.js` 的 `call()`/`callMeetingroom()`/`callSystem()` 方法新增自动重试逻辑（最多重试2次，间隔800ms），超时或网络错误时自动重试，提升稳定性。

4. **公共资源时段互斥选择实现** - 完整实现MVP计划4.8.1需求：
   - `cloudfunctions/meetingroomService/handlers/room/getPublicResources.js`：支持 date/startTime/endTime 参数，计算时段内每个资源的可用数量
   - `miniprogram/pages/booking/create.js`：选择时段后自动刷新资源可用性，已满资源标记为不可选
   - `miniprogram/pages/booking/create.wxml`：资源列表更新显示"当前时段: X/N"数量信息
   - 互斥逻辑：通过查询bookings表中同资源同时段的pending/approved预约进行冲突检测

5. **UI/UX全面修复**：
   - **按钮触控面积**：`rooms.wxml`/`permission-tags.wxml`/`users.wxml` 中所有 `<text bindtap>` 操作按钮改为 `<view class="action-btn">`，配合WXSS `min-height: 88rpx` 满足微信44px无障碍标准
   - **文本溢出保护**：所有管理页面中展示可变内容的 `<text>` 元素添加 `overflow:hidden; text-overflow:ellipsis; white-space:nowrap` 样式
   - **approval-rules.wxml**: `wx:key="index"` 修复为 `wx:key="*this"` 避免条件增删时渲染异常
   - **approvals.wxml**: 空状态文案改为基于activeTab动态显示
   - **users.wxml**: 手机号输入框 `type="number"` 改为 `type="digit"`
   - **approvals.js**: 补充缺失的 ThemeMixin 导入（WXML中有theme引用但JS未定义）

6. **WXSS样式增强** - `rooms.wxss`/`users.wxss`/`permission-tags.wxss` 中 `.action-btn` 完善为完整flex布局按钮样式，确保触控体验.

7. **公共资源schema更新** - `public_resources` 集合文档更新，补充 `totalQuantity`、`availableQuantity`、`sort` 字段说明和时段互斥实现原理注释。

8. **⚠️ 云函数部署安全网 (v5.4-补丁)** - 修复后管理面板全部返回403的根因：本地代码已修复但云函数未重新部署，云端仍运行旧代码。解决方案：
   - `cloudfunctions/adminService/index.js` 和 `cloudfunctions/meetingroomService/index.js` 的 `main` 函数中新增**权限水合安全网**：在 token 验证通过后、权限检查前，如果检测到 permissionTags 中有空的 permissions 对象，直接从 `permission_tags` 集合以 `tagId` 查询并填充。
   - **必须执行的部署操作**：在微信开发者工具中右键 `adminService` 和 `meetingroomService` 文件夹 →「上传并部署：云端安装依赖（不上传 node_modules）」
   - 部署后清除缓存并重新登录即可恢复正常。

**v5.5 更新记录 (2026-05-07)：**

1. **致命缺陷修复：权限为空时的角色兜底机制** - v5.4的安全网存在致命盲区：当 `admin.permissionTags` 为空数组 `[]` 时，`needsHydration` 也为空，安全网整个跳过，权限检查依然失败。根因分析：
   - **数据结构混乱**：`permission_tags` 集合存在两种格式——`initSystem` 创建的有 `tagId` 字段，`initDatabase`/`permissionTag.create` 创建的仅有 `name` 字段无 `tagId`，导致水合查询永远找不到记录。
   - **autoLogin.js 从未被修复**：仍保留着 `_id:` 查询bug（行34）和 `tagMap[t._id]`（行38）。
   - **meetingroomService 权限检查引用错误**：安全网水合到 `params._admin.permissionTags`，但权限检查读的是 `tokenResult.admin.permissionTags`（未水合的旧对象），兜底白做。
   - **三处安全网都存在同一盲区**：只处理"有tag需要水合"场景，不处理"权限为空"场景。

2. **共享角色默认权限模块** - 创建 `cloudfunctions/adminService/utils/roleDefaults.js` 和 `cloudfunctions/meetingroomService/utils/roleDefaults.js`，统一管理4种角色的默认权限定义，提供 `getDefaultTagByRole(role)` 和 `getEffectivePermissions(tags)` 工具函数。

3. **verifyToken.js (adminService) 增加角色兜底** - 水合后若 `getEffectivePermissions()` 返回 false，以 `admin.role` 构建默认权限标签，并输出警告日志。

4. **adminService/index.js 安全网增加兜底** - 水合后同样调用 `getEffectivePermissions()` 检查，为空则兜底。

5. **meetingroomService 双处修复**：
   - `verifyAdminToken()` 增加角色兜底
   - main() 安全网增加角色兜底
   - **修复关键bug**：权限检查从 `tokenResult.admin.permissionTags` 改为 `params._admin.permissionTags`（确保读到水合/兜底后的新数据）

6. **autoLogin.js 全面修复** - `_id:` → `tagId:` + `tagMap[t._id]` → `tagMap[t.tagId]` + 增加角色兜底。

7. **login.js 重构** - 内联的4角色权限Map替换为 `getDefaultTagByRole()` 调用，消除重复代码。

8. **initDatabase.js 数据修复** - `createPermissionTags()` 种子数据的3个permission_tag记录新增 `tagId` 字段（`'super'`/`'academy'`/`'approval'`），与 `initSystem` 保持一致的数据结构。

9. **部署前待执行操作** - ⚠️ 云函数代码已全面修复，但CRITICAL：**必须重新部署 `adminService` 和 `meetingroomService`（以及 `systemService`）到微信云开发**。在微信开发者工具中依次右键每个云函数文件夹 →「上传并部署：云端安装依赖」。部署后清除缓存重新登录。

**v5.6 更新记录 (2026-05-10)：**

1. **权限修复：meetingroomService添加权限fallback兜底** - `meetingroomService/index.js` 和 `meetingroomService` 的 `verifyAdminToken()` 在权限标签为空或权限对象无效时，增加基于角色的默认权限兜底逻辑，确保管理员在极端情况下仍能正常操作。

2. **统一鉴权：miniprogram/utils/permission.js大一统鉴权函数** - 新增统一权限检查模块 `miniprogram/utils/permission.js`，提供 `checkPermission(action)` / `getEffectivePermissions(tags, role)` / `hasAnyPermission(tags, role)` / `checkAdminAuth()` 等大一统鉴权函数，消除各页面分散的权限检查逻辑，统一管理所有权限判断。

3. **权限标签管理：新增permission-tags标签CRUD+权限矩阵页面** - 管理后台新增完整的权限标签管理页面（`/pages/admin/permission-tags`），支持标签的创建、编辑、删除，以及可视化权限矩阵配置（每个标签可独立开关11项管理功能权限）。

4. **用户管理增强：动态分类筛选+管理员标签关联编辑** - 用户管理页面新增按权限标签/学院/班级的动态分类筛选功能；用户编辑页面支持管理员直接关联/取消关联权限标签，实现标签与用户的双向绑定。

5. **会议室预约动画修复：弹跳效果终点恢复scale(1)** - 修复会议室预约创建页面的弹跳动画 bug，动画结束时元素从 `scale(0.9)` 恢复至 `scale(1)`，确保最终渲染位置精确，消除动画残留的偏移/模糊问题。

**v5.7 更新记录 (2026-05-10)：** — 文档同步修复

1. **数据库集合补全** - 新增 `credit_scores`（§3.8）、`admins`（§3.9）、`admin_tokens`（§3.10）三个集合的 schema 定义，与 initDatabase 实际创建的 10 个集合一致。
2. **permission_tags schema 修正** - 字段 `type: String` → `isSystem: Boolean`，role 字段移除不存在的 `custom` 值，与代码实际使用保持一致。
3. **adminService handler 补全** - 目录树新增 `autoLogin.js` `logout.js`，修正 `permission.js` → `permissionTag.js`；API 表新增 7 个 permissionTag 操作和 logout。
4. **meetingroomService handler 补全** - room 目录新增 `getPublicResources.js`（v5.4 公共资源互斥核心）。
5. **userService handler 补全** - 目录树新增 `cancel.js` `getPhone.js`；API 表新增 `user_cancelBooking`。
6. **用户端页面补全** - 新增 `pages/profile/edit` 个人信息编辑页面。
7. **权限概念统一** - 全文移除「0级权限」「1-4级管理员」「权限等级」等旧概念，统一为标签制权限描述（canEditUsers 等）。
8. **审批规则文档修正** - 移除已废弃的「基于用户权限等级的自动审批条件」（v5.3 已移除 level 条件），统一为标签/时长/时段/提前小时条件。
9. **昵称→真实姓名** - 全文将「昵称」统一为「真实姓名（realName）」（v4.1 起已废弃 nickName）。
10. **索引设计修正** - permission_tags 集合索引从 `level` `type` → `role` `isSystem`。
11. **数据归档说明补全** - bookings_archive 注明为按需创建，不在 initDatabase 中。
12. **前端架构新增** - 新增 §2.3 小节，说明 tabBar（3-tab）、adminStore（管理端状态中枢）、permission.js（大一统鉴权）。
13. **测试用例修正** - 管理端测试用例中「0级/非0级/1-4级」改为 tag-based 权限描述。
14. **代码清理建议** - `pages/admin/` 下存在 permission-tags 文件与子目录重复的残留文件，建议清理父目录残留。

**v5.8 更新记录 (2026-05-13)：** — 14项系统问题修复

1. **权限标签去重修复** — `permissionTag.js` 新增 `update` 时标签名唯一性校验；`initSystem` 修复 `tagId`/`name` 双键去重逻辑；`initDatabase` 改为 per-tag upsert 避免重复。
2. **微信头像获取重构** — 弃用已失效的 `wx.getUserProfile`，全面改用 `open-type="chooseAvatar"` + 云存储上传获取永久 fileID；登录页、信息完善页、个人中心、编辑页同步更新。
3. **管理后台入口权限修复** — `userStore.hasPermissionTag()` 新增自定义权限标签检测（`_hasAnyPermissionActive()`），修复仅匹配4种预定义角色导致自定义标签管理员看不到后台入口的问题。
4. **自动标签生成移除** — `completeProfile.js` 注释掉自动创建学院/班级标签逻辑；标签由管理员统一创建和管理。
5. **公共资源关联过滤** — 会议室通过 `publicResources` 数组关联公共资源；前端仅展示关联资源。
6. **移动端日期选择器修复** — `create.wxml` picker 添加 `start/end/fields` 属性限制日期范围，解决部分 Android 设备单列显示问题。
7. **预约天数限制** — 会议室详情页新增 advanceDays 规则展示；`booking/create.js` 云函数增加 min/max advanceDays 校验。
8. **已过期预约状态补充** — `mylist.js` tabs 新增 `rejected`/`cancelled`/`expired` 状态；云函数 status 白名单新增 `expired`。
9. **今日预约查询优化** — 首页今日预约改为服务端按日期查询（`pageSize=20`），避免客户端过滤受分页影响遗漏数据。
10. **公共资源描述展示** — `create.wxml` 资源列表项新增 `resource-desc` 描述文字显示。
11. **管理面板弹窗居中修复** — `users.wxml` 删除/重置头像弹窗从 `modal-content` 改为 `dialog-content`，配合 `.dialog-content` 居中样式。
12. **文本溢出修复** — `create.wxml` textarea 添加 `maxlength="200" auto-height`；`.textarea-input` 添加 overflow-y/word-break/max-height；多处管理页面文本添加省略号样式。
13. **信誉分Bug修复** — `credit/index.wxml` 时间字段 `createdAt` → `createTime`；`constants.js` MAX_SCORE 100 → 150，使"优秀"等级（≥120分）可达。
14. **用户管理筛选增强** — `users.js` 云函数新增 `getFilterOptions` 聚合查询（学院/班级去重）；`getList` 支持 `academy`/`className`/`minCredit`/`maxCredit`/`profileCompleted` 参数；前端新增底部弹出式筛选弹窗。

**v5.9 更新记录 (2026-05-13)：** — 4项功能优化

1. **管理后台自定义权限支持** — `adminService/utils/permission.js` `getRoleFromTags()` 新增自定义权限标签识别（返回 `'custom'`）；`ADMIN_ROLES` 新增 `'custom'` 角色；`autoLogin` 不再拒绝自定义标签用户登录后台。
2. **数据看板全角色开放** — `adminService/index.js` 移除 `admin_dashboard_getData` 对 `canViewAllUsers` 的硬依赖，所有有效权限标签用户均可访问数据看板；`roleDefaults.js` `approvalManager` 角色 `canViewAllUsers` 设为 `true`。
3. **我的页面头像交互简化** — `profile/index.wxml` 头像从 `<button chooseAvatar>` 改为纯 `<image bindtap="onPreviewAvatar">`，点击仅触发 `wx.previewImage` 大图预览，移除直接更换头像功能。
4. **编辑页头像整合** — `profile/edit.wxml` 删除独立"同步微信头像"按钮；点击头像弹出 `wx.showActionSheet`（上传微信头像 / 选择相册图片），单一入口完成头像更新；`booking/create.js` 日期选择器新增 `datePickerReady` 条件渲染，避免加载时短暂显示无效日期。

**v5.10 更新记录 (2026-05-13)：** — 7项修复与优化

1. **默认头像统一为小程序Logo** — 云函数 `DEFAULT_AVATAR` 常量统一指向小程序Logo；7处前端WXML文件中 `avatar-default.png` 全部替换为 `logo.png`，确保全平台默认头像一致。
2. **完善时间选择器边界条件**：
   - 预约页 `loadRoomDetail` 调用顺序修正（`updateDateRange` 提前至 `loadRoomDetail` 中执行，确保日期范围在页面初始化时可用）
   - 会议室编辑中 `maxAdvanceDays` / `minAdvanceDays` 添加 `min="0"` 约束，防止输入负数
   - 预约云函数 `attendees=0` 校验漏洞修复（新增 ≥1 人校验）
   - 会议室云函数 `capacity` 解析逻辑优化（兼容 `{min, max}` 对象与纯数字两种格式）
   - `validator` 判空函数改用严格判空（`!value` → `value === undefined || value === null || value === ''`）
3. **用户管理优化**：
   - 删除用户权限映射修正（`canManagePermissions` → `canEditUsers`），确保删除按钮仅对有 `canEditUsers` 权限的管理员可见
   - 新增信誉分修改功能（前端弹窗UI + 调用 `adminService.updateCredit`），支持管理员手动调整用户信誉分
4. **选择微信头像功能修复** — `sourceType` 扩展为 `['album', 'camera']`，支持从相册和相机两种方式获取头像
5. **公共资源编辑弹窗** — textarea 添加 `auto-height` 属性，解决长文本输入时内容被截断的问题
6. **资源选择框布局调整** — 名称+数量显示在同一行，描述文字独占第二行，提升信息密度和可读性
7. **红棉阁地点更新** — `initDatabase` 种子数据中"红棉阁"的 `location` 字段由"红棉书院"更正为"红芯书院"

**v5.11 更新记录 (2026-05-13)：** — 8项修复与优化

1. **头像 403 错误修复** — 在 5 个云函数中新增 `cloud.getTempFileURL()` 调用，将 `cloud://` fileID 转为临时 HTTPS URL 后返回给前端，解决云存储签名 URL 返回 403 的问题。涉及文件：userService/getInfo.js、login.js、completeProfile.js；adminService/users.js getList()；meetingroomService/getBookings.js。
2. **日历日期选择器重构** — 将预约创建页面的原生 `picker mode="date"` 替换为自定义日历网格组件。功能包括：底部弹出面板、月份切换（左右箭头按钮+滑动手势）、可选日期蓝色边框高亮（基于 advanceDays 范围）、不可选日期灰色置灰、今天蓝色圆点标记、选中日期蓝色边框高亮。涉及文件：booking/create.wxml、create.wxss、create.js。
3. **UI Bug 修复** — 修复日历箭头 XML 实体显示问题（`&#60;`/`&#62;` → 中文单角引号 `‹`/`›`）；公共资源改为一行两个的 grid 布局并允许简介换行；今日无可预约时段时显示红色提示 "今日无可预约时间"。涉及文件：booking/create.wxml、create.wxss、create.js；credit/index.wxml（信誉分规则中的 `&lt;` 改为中文描述）。
4. **权限标签管理弹窗修复** — 修复弹窗布局：移除 `max-width: 600rpx`，改为 flex 列布局（header + scroll + footer），底部按钮始终可见，添加底部安全区适配。涉及文件：admin/permission-tags.wxss。
5. **审批按钮样式优化** — 将预约审批的通过/拒绝按钮从接近正方形改为长方形（增加水平 padding、降低高度）。涉及文件：admin/approvals.wxss。
6. **用户管理功能修复** — 修复删除用户和重置头像功能：云函数中查询字段从 `openid` 统一改为 `_openid`（微信小程序云开发标准字段）。涉及文件：cloudfunctions/adminService/handlers/users.js。
7. **权限标签改为单选** — 用户管理页面的权限标签选择从多选改为单选模式（选择新标签时自动取消之前的选择）。涉及文件：admin/users.js、admin/user-edit.js。
8. **学号输入验证** — 在用户编辑页和信息完善页添加学号格式验证，要求必须为 9 位数字（正则 `/^\d{9}$/`）。涉及文件：admin/user-edit.js、profile/complete.js。

---
**文档结束**
