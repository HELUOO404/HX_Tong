# 红芯通小程序 MVP 开发计划

**文档版本**: v1.0  
**编制日期**: 2026-04-21  
**适用范围**: 最简化MVP版本，仅包含会议室预约核心功能

---

## 一、MVP 范围界定

### 1.1 核心目标

开发一个**最小可用**的会议室预约小程序，支持：
1. 用户微信登录并完善信息
2. 查看会议室并预约
3. 管理员审批和管理

### 1.2 功能边界

**包含功能**:
- ✅ 微信一键登录 + 信息完善
- ✅ 会议室列表展示
- ✅ 会议室预约（日历 + 时段选择）
- ✅ 自动审批（≤4小时）/ 人工审批（>4小时）
- ✅ 我的预约列表
- ✅ 取消预约
- ✅ 管理员审批面板
- ✅ 会议室管理（增删改）
- ✅ 基础信誉分机制（扣分逻辑）
- ✅ 签到功能

**不包含功能**（后续版本）:
- ❌ 课程表模块
- ❌ 论坛交流
- ❌ 成绩查询
- ❌ 失物招领
- ❌ 信誉分加分机制
- ❌ 延时申请
- ❌ 换肤功能
- ❌ 复杂的数据统计

---

## 二、系统规则汇总

### 2.1 预约规则

| 规则项 | 设置值 |
|-------|-------|
| 开放时段 | 08:00 - 22:00 |
| 最小预约时长 | 1小时 |
| 最大预约时长 | 8小时（但>4小时需审批） |
| 提前预约时间 | 至少提前2小时 |
| 自动审批时长 | ≤4小时 |
| 人工审批时长 | >4小时 |

### 2.2 信誉分规则

#### 2.2.1 预约权限规则

| 信誉分范围 | 预约权限 | 说明 |
|-----------|---------|------|
| < 80分 | ❌ 禁止预约 | 无法提交预约申请 |
| 80-100分 | ✅ 正常预约 | 正常预约权限 |
| ≥ 100分 | ✅ 正常预约 | 正常预约权限 |

#### 2.2.2 信誉分自动恢复规则

| 信誉分范围 | 每日恢复 | 说明 |
|-----------|---------|------|
| 80-90分 | +1分/天 | 自然日0点自动增加 |
| 90-100分 | +2分/天 | 自然日0点自动增加 |
| < 80分 | 0分/天 | 不自动恢复，需人工干预 |
| ≥ 100分 | 0分/天 | 已达上限，不再增加 |

**恢复上限**: 信誉分最高恢复到100分，不超过初始值。

#### 2.2.3 取消预约扣分规则

| 取消时间 | 信誉分扣减 | 说明 |
|---------|-----------|------|
| 提前 ≥6小时 | 0分 | 免费取消 |
| 3-6小时内 | -5分 | 扣5分 |
| 1-3小时内 | -10分 | 扣10分 |
| <1小时 | 不允许 | 系统禁止取消 |

### 2.3 签到规则

| 规则 | 说明 |
|-----|------|
| 签到时限 | 会议开始后15分钟内 |
| 未签到处理 | 会议室自动释放 + 扣10分信誉分 |
| 签到方式 | 小程序内点击签到按钮 |

### 2.4 冲突检测规则

| 场景 | 是否允许 | 说明 |
|-----|---------|------|
| 时间重叠 | ❌ 不允许 | 基本冲突检测 |
| 边界相接 | ✅ 允许 | 11:00结束和11:00开始不冲突 |
| 同一用户多会议室 | ✅ 允许 | 可同时预约不同会议室 |
| 无缝衔接 | ✅ 允许 | 可连续预约同一会议室 |

### 2.5 并发处理

- 同一时段多人预约：**按时间戳，先来先得**
- 后提交者提示"该时段已被预约"

---

## 三、数据库设计

### 3.1 集合清单

| 集合名 | 说明 | 数据量预估 |
|-------|------|-----------|
| users | 用户表 | < 2000条 |
| rooms | 会议室表 | < 20条 |
| bookings | 预约记录表 | < 10000条/年 |
| credit_scores | 信誉分表 | < 2000条 |
| credit_records | 信誉分变动记录 | < 50000条/年 |
| admins | 管理员表 | < 10条 |

### 3.2 核心数据结构

#### users 集合

```javascript
{
  _id: String,              // 系统自动生成
  openid: String,           // 微信openid，唯一索引
  nickName: String,         // 微信昵称
  avatarUrl: String,        // 微信头像
  realName: String,         // 真实姓名
  className: String,        // 班级（如"25集成本2班"）
  phone: String,            // 手机号（加密存储）
  role: String,             // 角色：user/admin/superAdmin
  status: Number,           // 0-正常 1-禁用
  createdAt: Date,
  updatedAt: Date
}
```

#### rooms 集合

```javascript
{
  _id: String,
  name: String,             // 会议室名称（如"红棉阁"）
  location: String,         // 位置描述
  capacity: Object,         // 容纳人数 {min: 18, max: 36}
  facilities: Array,        // 设备清单 ["大显示屏"]
  images: Array,            // 图片URL数组
  openTime: String,         // 开放时间 "08:00"
  closeTime: String,        // 关闭时间 "22:00"
  minBookingHours: Number,  // 最小预约时长（小时）
  maxBookingHours: Number,  // 最大预约时长（小时）
  status: Number,           // 0-正常 1-维护中 2-停用
  createdAt: Date,
  updatedAt: Date
}
```

#### bookings 集合

```javascript
{
  _id: String,
  userId: String,           // 关联 users._id
  roomId: String,           // 关联 rooms._id
  date: String,             // 预约日期 "2026-04-21"
  startTime: String,        // 开始时间 "09:00"
  endTime: String,          // 结束时间 "11:00"
  duration: Number,         // 预约时长（小时）
  purpose: String,          // 用途描述
  attendees: Number,        // 参与人数
  contactPhone: String,     // 联系人电话
  status: String,           // pending/approved/rejected/cancelled/completed/noShow
  needApproval: Boolean,    // 是否需要审批
  approverId: String,       // 审批人ID
  approveTime: Date,        // 审批时间
  rejectReason: String,     // 拒绝原因
  signedIn: Boolean,        // 是否已签到
  signedInAt: Date,         // 签到时间
  createdAt: Date,
  updatedAt: Date
}
```

#### credit_scores 集合

```javascript
{
  _id: String,
  userId: String,           // 关联 users._id
  currentScore: Number,     // 当前分数（默认100）
  baseScore: Number,        // 基础分数（扣除/增加后的实际分数）
  totalPlus: Number,        // 总加分
  totalMinus: Number,       // 总扣分
  lastRestoreDate: Date,    // 上次恢复日期（用于计算每日恢复）
  updatedAt: Date,
  createdAt: Date
}
```

#### credit_records 集合

```javascript
{
  _id: String,
  userId: String,           // 关联 users._id
  type: String,             // plus/minus
  scoreChange: Number,      // 分数变动值
  reason: String,           // 变动原因
  relatedBookingId: String, // 关联预约ID
  operatorId: String,       // 操作人ID（系统自动则为system）
  createdAt: Date
}
```

### 3.3 索引设计

```javascript
// users 集合
openid: 唯一索引
role: 普通索引

// rooms 集合
status: 普通索引

// bookings 集合
userId: 普通索引
roomId: 普通索引
date: 普通索引
status: 普通索引
roomId + date + startTime: 复合唯一索引（防止同一时段重复预约）
createdAt: 普通索引（倒序查询）

// credit_scores 集合
userId: 唯一索引

// credit_records 集合
userId: 普通索引
createdAt: 普通索引（倒序查询）
```

---

## 四、页面清单

### 4.1 用户端页面

| 页面 | 路径 | 说明 |
|-----|------|------|
| 登录页 | /pages/login/login | 微信授权登录入口 |
| 信息完善页 | /pages/profile/complete | 首次登录填写信息 |
| 首页 | /pages/index/index | 快捷入口、今日预约 |
| 会议室列表 | /pages/room/list | 所有会议室卡片展示 |
| 会议室详情 | /pages/room/detail | 会议室信息 + 预约按钮 |
| 预约页面 | /pages/booking/create | 选择日期、时段、填写信息 |
| 预约成功页 | /pages/booking/success | 预约结果展示 |
| 我的预约 | /pages/booking/mylist | 预约记录列表 |
| 预约详情 | /pages/booking/detail | 预约详情 + 取消/签到按钮 |
| 个人中心 | /pages/profile/index | 个人信息、信誉分、功能入口 |
| 编辑资料 | /pages/profile/edit | 修改手机号等 |
| 信誉分 | /pages/credit/index | 信誉分展示、变动记录 |
| 设置 | /pages/settings/index | 设置主页 |
| 开发者选项 | /pages/settings/developer | 隐藏的管理后台入口 |

### 4.2 管理端页面

| 页面 | 路径 | 说明 |
|-----|------|------|
| 管理登录 | /pages/admin/login | 管理员账号密码登录 |
| 管理首页 | /pages/admin/index | 数据仪表盘 |
| 待审批列表 | /pages/admin/approvals | 待审批预约列表 |
| 审批详情 | /pages/admin/approval-detail | 审批操作页面 |
| 会议室管理 | /pages/admin/rooms | 会议室增删改查 |
| 会议室编辑 | /pages/admin/room-edit | 新增/编辑会议室 |
| 预约记录 | /pages/admin/bookings | 所有预约记录查询 |
| 用户管理 | /pages/admin/users | 用户列表、角色分配 |

---

## 五、云函数清单

### 5.1 用户模块

| 云函数 | 功能 | 触发方式 |
|-------|------|---------|
| userLogin | 微信登录，获取openid，创建/查询用户 | HTTP |
| userGetInfo | 获取当前用户信息 | HTTP |
| userUpdateInfo | 更新用户信息 | HTTP |
| userGetCredit | 获取用户信誉分 | HTTP |
| userGetCreditRecords | 获取信誉分变动记录 | HTTP |

### 5.2 会议室模块

| 云函数 | 功能 | 触发方式 |
|-------|------|---------|
| roomGetList | 获取会议室列表 | HTTP |
| roomGetDetail | 获取会议室详情 | HTTP |
| roomGetTimeSlots | 获取某天可预约时段 | HTTP |

### 5.3 预约模块

| 云函数 | 功能 | 触发方式 |
|-------|------|---------|
| bookingCreate | 创建预约，冲突检测，自动审批 | HTTP |
| bookingGetList | 获取我的预约列表 | HTTP |
| bookingGetDetail | 获取预约详情 | HTTP |
| bookingCancel | 取消预约，计算扣分 | HTTP |
| bookingSignIn | 签到 | HTTP |
| bookingCheckNoShow | 检查未签到预约，扣分 | 定时触发（每15分钟） |

### 5.4 管理模块

| 云函数 | 功能 | 触发方式 |
|-------|------|---------|
| adminLogin | 管理员账号密码登录 | HTTP |
| adminGetStats | 获取统计数据 | HTTP |
| adminGetPendingList | 获取待审批列表 | HTTP |
| adminProcessApproval | 审批操作（通过/拒绝） | HTTP |
| adminRoomCreate | 创建会议室 | HTTP |
| adminRoomUpdate | 更新会议室 | HTTP |
| adminRoomDelete | 删除会议室 | HTTP |
| adminGetBookings | 获取所有预约记录 | HTTP |
| adminGetUsers | 获取用户列表 | HTTP |
| adminUpdateUserRole | 修改用户角色 | HTTP |

### 5.5 信誉分模块

| 云函数 | 功能 | 触发方式 |
|-------|------|---------|
| creditDeduct | 扣除信誉分 | HTTP（内部调用） |
| creditInit | 初始化用户信誉分 | HTTP（注册时调用） |
| creditDailyRestore | 每日信誉分自动恢复 | 定时触发（每日0:00） |
| creditCheckPermission | 检查用户预约权限 | HTTP（内部调用） |
| creditCalculateRealTime | 实时计算当前信誉分 | HTTP（内部调用） |

### 5.6 定时任务模块

| 云函数 | 功能 | 触发方式 |
|-------|------|---------|
| taskCheckNoShow | 检查未签到预约 | 定时触发（每15分钟） |
| taskCheckApprovalTimeout | 检查审批超时 | 定时触发（每30分钟） |
| taskArchiveData | 数据归档 | 定时触发（每月1日3:00） |

---

## 六、开发阶段划分

### 阶段一：基础搭建（第1周）

**目标**: 搭建开发环境，完成基础框架

**任务清单**:
- [ ] 创建小程序项目，配置云开发
- [ ] 创建数据库集合，建立索引
- [ ] 初始化数据（超级管理员、示例会议室）
- [ ] 搭建页面框架，配置tabBar
- [ ] 封装通用工具函数（日期处理、请求封装等）
- [ ] 设计通用组件（按钮、卡片、弹窗等）

**交付物**:
- 可运行的基础框架
- 数据库集合创建完成
- 初始化数据导入完成

### 阶段二：用户模块（第2周）

**目标**: 完成用户登录和信息管理

**任务清单**:
- [ ] 微信登录功能（userLogin云函数）
- [ ] 登录页面UI
- [ ] 信息完善页面
- [ ] 个人中心页面
- [ ] 编辑资料功能
- [ ] 用户数据本地缓存

**交付物**:
- 用户可正常登录注册
- 信息完善流程跑通

### 阶段三：会议室模块（第3周前半）

**目标**: 完成会议室展示和时段查询

**任务清单**:
- [ ] 会议室列表页面
- [ ] 会议室详情页面
- [ ] 日历组件（选择日期）
- [ ] 时段选择组件
- [ ] 可预约时段查询接口

**交付物**:
- 会议室列表正常展示
- 可查看会议室详情
- 可选择日期查看可预约时段

### 阶段四：预约模块（第3周后半-第4周前半）

**目标**: 完成预约核心功能

**任务清单**:
- [ ] 预约申请表单页面
- [ ] 预约提交接口（含冲突检测）
- [ ] 自动审批逻辑（≤4小时）
- [ ] 我的预约列表
- [ ] 预约详情页面
- [ ] 取消预约功能（含扣分逻辑）
- [ ] 签到功能

**交付物**:
- 完整预约流程可用
- 冲突检测正常工作
- 自动审批逻辑正确

### 阶段五：信誉分模块（第4周后半）

**目标**: 完成信誉分基础功能

**任务清单**:
- [ ] 信誉分数据结构初始化（默认100分）
- [ ] 预约前信誉分检查（<80分禁止预约）
- [ ] 扣分逻辑实现（取消、未签到）
- [ ] 信誉分自动恢复定时任务（每日0点）
- [ ] 信誉分展示页面
- [ ] 信誉分变动记录
- [ ] 定时检查未签到任务

**交付物**:
- 信誉分<80分无法预约
- 取消预约正常扣分
- 未签到自动扣分
- 每日自动恢复信誉分
- 信誉分页面正常显示

### 阶段六：管理后台（第5周）

**目标**: 完成管理员功能

**任务清单**:
- [ ] 管理员登录
- [ ] 数据仪表盘
- [ ] 待审批列表和审批操作
- [ ] 会议室管理（增删改）
- [ ] 预约记录查询
- [ ] 用户管理（角色分配）

**交付物**:
- 管理员可正常登录
- 审批流程完整
- 会议室管理可用

### 阶段七：测试优化（第6周）

**目标**: 测试修复，性能优化

**任务清单**:
- [ ] 功能测试（所有流程走通）
- [ ] 边界情况测试
- [ ] 并发测试
- [ ] 性能优化
- [ ] UI细节调整
- [ ] 准备上线材料

**交付物**:
- 测试报告
- 修复所有P0级bug
- 上线版本代码

---

## 七、初始化数据

### 7.1 超级管理员账号

```javascript
// admins 集合
{
  _id: "admin_super_001",
  username: "PigeonPub",
  password: "PigeonPub2025",  // 实际存储需加密
  role: "superAdmin",
  name: "超级管理员",
  createdAt: new Date()
}
```

### 7.2 示例会议室

```javascript
// rooms 集合
{
  _id: "room_001",
  name: "红棉阁",
  location: "学院楼3楼",
  capacity: { min: 18, max: 36 },
  facilities: ["大显示屏"],
  images: [],
  openTime: "08:00",
  closeTime: "22:00",
  minBookingHours: 1,
  maxBookingHours: 8,
  status: 0,
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### 7.3 预设数据

```javascript
// 班级预设（用户注册时可选）
const classList = [
  "25集成本2班"
];

// 部门预设（管理员可选）
const departmentList = [
  "饭圈"
];
```

---

## 八、管理员登录方案

### 8.0 登录流程设计

#### 8.0.1 两种登录方式

| 登录方式 | 适用场景 | 登录入口 |
|---------|---------|---------|
| **微信登录** | 普通用户、管理员（日常） | 小程序首页 |
| **账号密码登录** | 超级管理员（首次/特殊） | 管理后台入口 |

#### 8.0.2 管理员身份识别逻辑

```
用户微信登录
    ↓
查询users集合
    ├─ 存在且role = admin/superAdmin → 显示管理入口
    └─ 不存在或role = user → 不显示管理入口
```

#### 8.0.3 超级管理员首次登录流程

**场景**: 系统初始化后，超级管理员如何首次进入管理后台

**管理后台入口位置**: `我的` → `设置` → `开发者选项`（连续点击版本号5次显示）

```
方式一：账号密码登录（推荐）
    ↓
用户打开小程序
    ↓
微信登录（任意用户）
    ↓
进入"我的"页面
    ↓
点击"设置"
    ↓
连续点击"版本号"5次
    ↓
显示"开发者选项"入口
    ↓
点击"开发者选项"
    ↓
点击"管理后台"
    ↓
跳转管理登录页 /pages/admin/login
    ↓
输入账号：PigeonPub
    ↓
输入密码：PigeonPub2025
    ↓
调用adminLogin云函数验证
    ↓
验证成功 → 进入管理首页

方式二：先微信登录再授权
    ↓
用户微信登录小程序
    ↓
联系已有管理员
    ↓
管理员在用户管理页将其角色设为admin/superAdmin
    ↓
该用户重新进入小程序
    ↓
个人中心显示"管理后台"入口（在开发者选项中）
```

#### 8.0.4 管理员登录页面设计

**页面**: `/pages/admin/login`

```
┌─────────────────────┐
│      管理后台登录     │
├─────────────────────┤
│                     │
│   ┌─────────────┐   │
│   │  账号输入框  │   │  placeholder: 请输入管理员账号
│   └─────────────┘   │
│                     │
│   ┌─────────────┐   │
│   │  密码输入框  │   │  placeholder: 请输入密码，支持显示/隐藏
│   └─────────────┘   │
│                     │
│   ┌─────────────┐   │
│   │    登 录    │   │  按钮
│   └─────────────┘   │
│                     │
│   首次登录？联系超级管理员 │
│                     │
└─────────────────────┘
```

#### 8.0.5 登录安全机制

```javascript
// adminLogin云函数
{
  // 密码加密存储（使用bcrypt或MD5+salt）
  password: "加密后的密码",
  
  // 登录失败限制
  loginFailCount: 0,      // 连续失败次数
  lockUntil: Date,        // 锁定截止时间
  
  // Token机制
  token: String,          // JWT Token
  tokenExpire: Date,      // Token过期时间
}

// 安全策略
- 密码错误5次 → 锁定账号30分钟
- Token有效期 → 24小时
- 敏感操作 → 需重新验证密码
```

#### 8.0.6 登录状态保持

```javascript
// 登录成功后存储
wx.setStorageSync('adminToken', token);
wx.setStorageSync('adminInfo', {
  adminId: "admin_super_001",
  role: "superAdmin",
  name: "超级管理员"
});

// 每次进入管理页面前验证Token
const token = wx.getStorageSync('adminToken');
if (!token) {
  // 跳转登录页
}

// 调用管理接口时携带Token
wx.request({
  header: {
    'Authorization': 'Bearer ' + token
  }
});
```

#### 8.0.7 页面访问权限控制

```javascript
// 管理页面onLoad时检查
onLoad() {
  const adminInfo = wx.getStorageSync('adminInfo');
  
  // 检查是否登录
  if (!adminInfo) {
    wx.redirectTo({ url: '/pages/admin/login' });
    return;
  }
  
  // 检查页面权限
  const pageRole = this.data.requiredRole; // 页面所需角色
  if (adminInfo.role !== 'superAdmin' && adminInfo.role !== pageRole) {
    wx.showToast({ title: '无权限访问', icon: 'error' });
    wx.navigateBack();
    return;
  }
}
```

#### 8.0.8 退出登录

```javascript
// 退出登录功能
function logout() {
  // 清除本地存储
  wx.removeStorageSync('adminToken');
  wx.removeStorageSync('adminInfo');
  
  // 可选：调用云函数使Token失效
  wx.cloud.callFunction({
    name: 'adminLogout',
    data: { token }
  });
  
  // 跳转登录页
  wx.redirectTo({ url: '/pages/admin/login' });
}
```

---

## 九、关键业务逻辑

### 9.1 预约提交流程

```
用户提交预约
    ↓
校验用户登录状态
    ↓
校验用户信息完整性
    ↓
校验预约参数（时间、人数等）
    ↓
查询用户信誉分记录
    ↓
实时计算当前信誉分
    ├─ 计算从lastRestoreDate到今天应恢复的分数
    ├─ 公式：baseScore + 每日恢复分数（根据区间）
    ├─ 上限100分
    ↓
校验当前信誉分
    ├─ < 80分 → 返回错误"信誉分不足，无法预约"
    ↓
查询该时段是否已被预约（冲突检测）
    ├─ 有冲突 → 返回错误"该时段已被预约"
    ↓
创建预约记录，status = pending
    ↓
判断是否需要审批（duration > 4）
    ├─ ≤4小时 → status = approved，发送通过通知
    └─ >4小时 → status = pending，发送待审批通知
    ↓
返回预约结果
```

**实时信誉分计算逻辑**:
```javascript
function calculateCurrentScore(creditRecord) {
  const { baseScore, lastRestoreDate } = creditRecord;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastDate = new Date(lastRestoreDate);
  lastDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 0 || baseScore < 80) {
    return Math.min(baseScore, 100);
  }
  
  let restoreScore = 0;
  let currentTemp = baseScore;
  
  for (let i = 0; i < daysDiff; i++) {
    if (currentTemp >= 90 && currentTemp < 100) {
      restoreScore += 2;
      currentTemp += 2;
    } else if (currentTemp >= 80 && currentTemp < 90) {
      restoreScore += 1;
      currentTemp += 1;
    }
    
    if (currentTemp >= 100) {
      restoreScore -= (currentTemp - 100);
      currentTemp = 100;
      break;
    }
  }
  
  return {
    currentScore: Math.min(baseScore + restoreScore, 100),
    shouldUpdate: restoreScore > 0,
    newBaseScore: Math.min(baseScore + restoreScore, 100),
    newLastRestoreDate: today
  };
}
```

### 9.2 取消预约流程

```
用户点击取消
    ↓
查询预约记录
    ↓
校验是否可取消（status = approved/pending）
    ↓
计算距离开始时间
    ├─ <1小时 → 返回"已超过可取消时间"
    ↓
计算应扣分数
    ├─ ≥6小时 → 扣0分
    ├─ 3-6小时 → 扣5分
    └─ 1-3小时 → 扣10分
    ↓
更新预约状态为 cancelled
    ↓
如有扣分，创建信誉分变动记录
    ↓
释放预约时段
    ↓
发送取消成功通知
```

### 9.3 签到流程

```
用户在预约详情页点击签到
    ↓
校验预约状态（approved）
    ↓
校验当前时间（开始后15分钟内）
    ├─ >15分钟 → 提示"已超过签到时间"
    ↓
更新签到状态 signedIn = true
    ↓
记录签到时间 signedInAt
    ↓
发送签到成功通知
```

### 9.4 未签到检查（定时任务）

```
每15分钟执行一次
    ↓
查询所有 status = approved 且未签到 且已开始超过15分钟的预约
    ↓
遍历处理：
    更新 status = noShow
    扣除信誉分10分（但不低于0分）
    发送未签到通知
    【释放会议室时段】（允许其他人预约剩余时间）
```

**释放后预约逻辑**:
```
用户A预约 09:00-11:00，未签到
09:15 系统标记为noShow并释放时段
用户B可以预约：
    ├─ 09:00-10:00（虽然不完整，但允许预约）
    ├─ 10:00-11:00
    └─ 09:30-10:30（任意时段）

预约时冲突检测逻辑：
    ├─ 查询所有 status = approved 的预约（排除noShow）
    ├─ 查询所有 status = pending 的预约
    └─ 不查询 status = noShow 的预约（已释放）
```

### 9.5 信誉分每日恢复（定时任务）

```
每日0:00执行
    ↓
查询所有信誉分 < 100 且 ≥ 80 的用户
    ↓
遍历处理：
    判断分数区间：
    ├─ 80-90分 → baseScore + 1（不超过100）
    └─ 90-100分 → baseScore + 2（不超过100）
    ↓
创建信誉分变动记录（类型：plus，原因：每日自动恢复）
    ↓
更新用户信誉分（更新baseScore和lastRestoreDate）
```

### 9.6 审批超时处理（定时任务）

```
每30分钟执行一次
    ↓
查询所有 status = pending 且开始时间距离现在 < 2小时的预约
    ↓
遍历处理：
    更新 status = rejected
    拒绝原因："审批超时，系统自动拒绝"
    发送拒绝通知给用户
```

### 9.7 数据归档（定时任务）

```
每月1日 凌晨3:00执行
    ↓
查询3个月前的预约记录（createdAt < 3个月前）
    ↓
遍历处理：
    将记录插入 bookings_archive 集合
    从 bookings 集合删除原记录
    ↓
生成归档统计报告
```

**归档集合结构**:
```javascript
// bookings_archive 集合（结构与bookings相同，仅用于存储历史数据）
{
  // 同 bookings 结构
  archivedAt: Date,  // 归档时间
}
```

---

## 十、UI/UX 设计要点

### 10.1 页面布局规范

```
页面结构：
┌─────────────────────┐
│  导航栏（标题）       │  高度：44px
├─────────────────────┤
│                     │
│      内容区域        │  可滚动
│                     │
├─────────────────────┤
│  TabBar（底部导航）  │  高度：50px（用户端）
└─────────────────────┘
```

### 10.2 功能色规范

**仅定义功能色，视觉色（主色调、中性色）在开发时根据设计确定**

```css
/* 功能色 - 用于状态标识 */
--success: #52C41A;        /* 成功、已通过、正常状态 */
--warning: #FAAD14;        /* 警告、待审批、注意 */
--error: #FF4D4F;          /* 错误、已拒绝、未签到、扣分 */
--info: #1890FF;           /* 信息、已完成、提示 */
--disabled: #999999;       /* 已取消、禁用、不可用 */
```

**功能色使用规范**:

| 场景 | 使用颜色 | 示例 |
|-----|---------|------|
| 预约状态-已通过 | --success | 绿色标签 |
| 预约状态-待审批 | --warning | 橙色标签 |
| 预约状态-已拒绝 | --error | 红色标签 |
| 预约状态-已取消 | --disabled | 灰色标签 |
| 预约状态-已完成 | --info | 蓝色标签 |
| 预约状态-未签到 | --error | 深红色标签 |
| 信誉分增加 | --success | 绿色+号 |
| 信誉分减少 | --error | 红色-号 |
| 操作成功提示 | --success | 成功toast |
| 操作失败提示 | --error | 错误toast |
| 信息提示 | --info | 提示消息 |

### 10.3 状态标签样式

| 状态 | 颜色 | 文字 |
|-----|------|------|
| pending | 橙色 | 待审批 |
| approved | 绿色 | 已通过 |
| rejected | 红色 | 已拒绝 |
| cancelled | 灰色 | 已取消 |
| completed | 蓝色 | 已完成 |
| noShow | 深红 | 未签到 |

### 10.4 手机号脱敏显示

```
默认显示：138****8888
点击👁️图标后显示：13812348888
```

### 10.5 个人中心界面设计

**页面**: `/pages/profile/index`

```
┌─────────────────────┐
│      个人中心        │
├─────────────────────┤
│                     │
│   ┌─────────────┐   │
│   │             │   │
│   │   头像占位   │   │  圆形，80x80px，点击可更换（预留）
│   │   （预留）   │   │
│   │             │   │
│   └─────────────┘   │
│                     │
│      用户昵称        │  微信昵称
│      25集成本2班     │  班级信息
│                     │
├─────────────────────┤
│                     │
│  ┌───────────────┐  │
│  │  💯 信誉分     │  │  显示当前分数，如"95分"
│  │     点击查看详情 →│  点击进入信誉分页面
│  └───────────────┘  │
│                     │
├─────────────────────┤
│                     │
│  ┌─────────────────┐│
│  │ 📅 我的预约      ││  点击进入我的预约列表
│  │ 📋 个人信息      ││  点击进入编辑资料
│  │ ⚙️ 设置          ││  点击进入设置页面
│  └─────────────────┘│
│                     │
├─────────────────────┤
│      版本号 v1.0.0   │  底部显示
└─────────────────────┘
```

**功能说明**:
- 头像区域：点击可更换头像（MVP版本预留功能，可点击但提示"功能开发中"）
- 信誉分卡片：显示当前信誉分，点击跳转信誉分详情页
- 功能列表：我的预约、个人信息、设置
- 版本号：底部显示，用于触发开发者选项

### 10.6 设置界面设计

**页面**: `/pages/settings/index`

```
┌─────────────────────┐
│        设置          │
├─────────────────────┤
│                     │
│  ┌─────────────────┐│
│  │ 🔔 消息通知      ││  开关：预约提醒、系统通知
│  │                  ││
│  │ 🌐 清除缓存      ││  点击清除本地缓存
│  │                  ││
│  │ 📖 使用帮助      ││  点击进入帮助文档
│  │                  ││
│  │ 📋 隐私协议      ││  点击查看隐私协议
│  │                  ││
│  │ 📋 用户协议      ││  点击查看用户协议
│  │                  ││
│  │ 💬 意见反馈      ││  点击进入反馈页面
│  │                  ││
│  │ 👤 关于我们      ││  点击查看关于信息
│  └─────────────────┘│
│                     │
├─────────────────────┤
│   版本号 v1.0.0      │  连续点击5次显示开发者选项
│   （点击5次）        │
└─────────────────────┘
```

**功能说明**:
- 消息通知：控制各类通知的开关
- 清除缓存：清理本地存储的缓存数据
- 使用帮助：常见问题和操作指南
- 隐私协议/用户协议：法律文档展示
- 意见反馈：用户反馈入口（可跳转微信客服或表单）
- 关于我们：小程序信息、联系方式
- 版本号：连续点击5次显示"开发者选项"

### 10.7 开发者选项界面设计

**页面**: `/pages/settings/developer`

**触发方式**: 在设置页连续点击版本号5次后显示入口

```
┌─────────────────────┐
│      开发者选项      │
├─────────────────────┤
│                     │
│  ⚠️ 警告：以下功能   │
│  仅限管理员使用      │
│                     │
├─────────────────────┤
│                     │
│  ┌─────────────────┐│
│  │ 🛠️ 管理后台      ││  点击进入管理员登录
│  │                  ││
│  │ 📊 系统日志      ││  预留：查看系统日志
│  │                  ││
│  │ 🔧 调试工具      ││  预留：调试功能
│  └─────────────────┘│
│                     │
└─────────────────────┘
```

**功能说明**:
- 管理后台：跳转管理员账号密码登录页
- 系统日志：预留功能，后续版本实现
- 调试工具：预留功能，后续版本实现
- 页面顶部显示警告信息，提醒普通用户谨慎操作

**安全机制**:
```javascript
// 进入开发者选项页面时检查
onLoad() {
  // 检查是否通过正常途径进入（从设置页点击版本号进入）
  const fromSettings = wx.getStorageSync('developerModeEnabled');
  if (!fromSettings) {
    wx.showToast({ title: '无权访问', icon: 'error' });
    wx.navigateBack();
    return;
  }
  
  // 清除标志，下次需要重新点击版本号
  wx.removeStorageSync('developerModeEnabled');
}

// 设置页版本号点击逻辑
let clickCount = 0;
let lastClickTime = 0;

onVersionClick() {
  const now = Date.now();
  
  // 重置计数（超过3秒重置）
  if (now - lastClickTime > 3000) {
    clickCount = 0;
  }
  
  clickCount++;
  lastClickTime = now;
  
  if (clickCount === 5) {
    wx.setStorageSync('developerModeEnabled', true);
    wx.navigateTo({ url: '/pages/settings/developer' });
    clickCount = 0;
  }
}
```

---

## 十一、测试要点

### 11.1 功能测试

| 测试项 | 测试内容 | 预期结果 |
|-------|---------|---------|
| 微信登录 | 新用户首次登录 | 跳转信息完善页 |
| 信息完善 | 填写完整信息提交 | 注册成功，进入首页 |
| 会议室列表 | 查看会议室列表 | 正确显示会议室信息 |
| 预约提交 | 选择时段提交预约 | 预约成功，状态正确 |
| 冲突检测 | 预约已占用时段 | 提示冲突，预约失败 |
| 自动审批 | 预约2小时 | 自动通过 |
| 人工审批 | 预约5小时 | 进入待审批 |
| 取消预约 | 提前8小时取消 | 取消成功，不扣分 |
| 取消预约 | 提前2小时取消 | 取消成功，扣10分 |
| 签到 | 开始后10分钟签到 | 签到成功 |
| 未签到 | 开始后20分钟未签到 | 自动扣分，释放会议室 |
| 开发者选项 | 连续点击版本号5次 | 显示开发者选项入口 |
| 管理后台入口 | 从开发者选项进入 | 跳转管理员登录页 |

### 11.2 个人中心测试

| 测试项 | 测试内容 | 预期结果 |
|-------|---------|---------|
| 页面展示 | 进入个人中心 | 正确显示头像、昵称、班级、信誉分 |
| 信誉分卡片 | 点击信誉分卡片 | 跳转信誉分详情页 |
| 我的预约 | 点击我的预约 | 跳转预约列表页 |
| 个人信息 | 点击个人信息 | 跳转编辑资料页 |
| 设置 | 点击设置 | 跳转设置页 |
| 头像点击 | 点击头像区域 | 提示"功能开发中"（预留） |

### 11.3 设置页面测试

| 测试项 | 测试内容 | 预期结果 |
|-------|---------|---------|
| 页面展示 | 进入设置页 | 正确显示所有设置项 |
| 消息通知 | 切换通知开关 | 开关状态正确保存 |
| 清除缓存 | 点击清除缓存 | 提示清除成功，缓存清理 |
| 使用帮助 | 点击使用帮助 | 跳转帮助文档页 |
| 隐私协议 | 点击隐私协议 | 显示隐私协议内容 |
| 用户协议 | 点击用户协议 | 显示用户协议内容 |
| 意见反馈 | 点击意见反馈 | 跳转反馈页面 |
| 关于我们 | 点击关于我们 | 显示关于信息 |
| 版本号点击 | 连续点击5次 | 显示开发者选项入口 |
| 版本号点击 | 点击3次后间隔5秒再点 | 计数重置，需重新点击5次 |

### 11.4 开发者选项测试

| 测试项 | 测试内容 | 预期结果 |
|-------|---------|---------|
| 正常进入 | 从设置页点击版本号5次进入 | 正常显示开发者选项页面 |
| 非法进入 | 直接通过URL进入 | 提示无权访问，返回上一页 |
| 管理后台 | 点击管理后台 | 跳转管理员登录页 |
| 页面警告 | 查看页面顶部 | 显示管理员警告信息 |

### 11.5 边界测试

| 测试项 | 测试内容 |
|-------|---------|
| 时间边界 | 11:00结束和11:00开始是否冲突 |
| 并发预约 | 两人同时预约最后1个时段 |
| 信誉分扣减 | 分数扣到0以下如何处理 |
| 跨天预约 | 是否允许（当前不允许） |
| 超长预约 | 预约8小时是否正常 |

---

## 十二、上线 checklist

### 12.1 上线前准备

- [ ] 小程序审核材料准备（截图、说明文档）
- [ ] 生产环境数据库创建
- [ ] 初始化数据导入（管理员、会议室）
- [ ] 订阅消息模板申请
- [ ] 隐私协议、用户协议准备
- [ ] 小程序提交审核

### 12.2 上线后监控

- [ ] 用户反馈收集渠道
- [ ] 错误日志监控
- [ ] 预约成功率监控
- [ ] 数据库容量监控

---

## 十三、风险与应对

| 风险 | 可能性 | 应对措施 |
|-----|-------|---------|
| 开发进度延误 | 中 | 每周检查进度，预留缓冲时间 |
| 小程序审核不通过 | 低 | 提前了解审核规范，准备备用方案 |
| 并发预约冲突 | 中 | 数据库层面加锁，时间戳排序 |
| 用户接受度低 | 低 | 小范围试运行，收集反馈优化 |

---

**文档结束**

*本文档用于指导MVP版本开发，确保6周内完成核心功能上线。*
