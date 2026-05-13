# userService API 文档

用户服务云函数，提供用户登录、信息管理、信誉分查询等功能。

## 统一响应格式

```json
{
  "code": 200,
  "message": "成功",
  "data": {}
}
```

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录） |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## API 列表

### 1. 用户登录

**Action**: `user_login`

**描述**: 处理微信登录，获取openid，创建新用户或更新登录时间

**请求参数**: 无（通过微信上下文自动获取）

**响应数据**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "userInfo": {
      "_id": "用户ID",
      "openid": "微信openid",
      "nickName": "昵称",
      "avatarUrl": "头像URL",
      "realName": "真实姓名",
      "className": "班级",
      "studentId": "学号",
      "phone": "手机号",
      "role": "user",
      "status": 0,
      "profileCompleted": false,
      "isNewUser": true
    },
    "token": "openid"
  }
}
```

**错误码**:
- 4002: 获取微信用户信息失败
- 500: 登录失败

---

### 2. 获取用户信息

**Action**: `user_getInfo`

**描述**: 获取当前登录用户的完整信息，包含信誉分

**请求参数**: 无

**响应数据**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "_id": "用户ID",
    "openid": "微信openid",
    "nickName": "昵称",
    "avatarUrl": "头像URL",
    "realName": "真实姓名",
    "className": "班级",
    "studentId": "学号",
    "phone": "手机号",
    "role": "user",
    "status": 0,
    "profileCompleted": true,
    "creditScore": 100,
    "creditInfo": {
      "currentScore": 100,
      "baseScore": 100,
      "totalPlus": 0,
      "totalMinus": 0
    },
    "createdAt": "创建时间",
    "updatedAt": "更新时间",
    "lastLoginAt": "最后登录时间"
  }
}
```

**错误码**:
- 401: 未授权
- 404: 用户不存在
- 500: 获取失败

---

### 3. 更新用户信息

**Action**: `user_updateInfo`

**描述**: 更新当前登录用户的信息，支持更新：nickName, avatarUrl, phone

**注意**: 不能更新 openid, role, status, creditScore, createdAt, _id 等敏感字段

**请求参数**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickName | string | 否 | 昵称 |
| avatarUrl | string | 否 | 头像URL |
| phone | string | 否 | 手机号（需符合11位手机号格式） |

**响应数据**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "_id": "用户ID",
    "nickName": "新昵称",
    "avatarUrl": "新头像URL",
    "phone": "新手机号",
    "updatedAt": "更新时间"
  }
}
```

**错误码**:
- 400: 没有需要更新的字段 / 手机号格式不正确
- 401: 未授权
- 403: 禁止更新字段
- 404: 用户不存在
- 500: 更新失败

---

### 4. 完善用户信息

**Action**: `user_completeProfile`

**描述**: 首次登录时完善用户信息，包含字段验证

**请求参数**:

| 字段名 | 类型 | 必填 | 验证规则 |
|--------|------|------|----------|
| realName | string | 是 | 2-20个汉字 |
| className | string | 是 | 2-50个字符 |
| studentId | string | 是 | 6-20位数字或字母 |
| phone | string | 是 | 11位手机号 |

**响应数据**:
```json
{
  "code": 200,
  "message": "完善信息成功",
  "data": {
    "_id": "用户ID",
    "realName": "真实姓名",
    "className": "班级",
    "studentId": "学号",
    "phone": "手机号",
    "profileCompleted": true,
    "updatedAt": "更新时间"
  }
}
```

**错误码**:
- 400: 缺少必填参数 / 字段验证失败
- 401: 未授权
- 404: 用户不存在
- 500: 完善信息失败

---

### 5. 获取信誉分

**Action**: `user_credit_getScore`

**描述**: 获取当前登录用户的信誉分信息

**请求参数**: 无

**响应数据**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "currentScore": 100,
    "baseScore": 100,
    "totalPlus": 0,
    "totalMinus": 0,
    "lastRestoreDate": "最后恢复日期",
    "userId": "用户ID"
  }
}
```

**错误码**:
- 401: 未授权
- 404: 用户不存在
- 500: 获取失败

---

### 6. 获取信誉分记录

**Action**: `user_credit_getRecords`

**描述**: 获取当前登录用户的信誉分变动记录，支持分页

**请求参数**:

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | number | 否 | 1 | 页码，必须大于0 |
| pageSize | number | 否 | 20 | 每页数量，1-100之间 |

**响应数据**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "_id": "记录ID",
        "type": "minus",
        "scoreChange": -10,
        "currentScore": 90,
        "reason": "取消预约",
        "relatedBookingId": "预约ID",
        "createdAt": "创建时间"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

**错误码**:
- 400: 页码或每页数量参数错误
- 401: 未授权
- 404: 用户不存在
- 500: 获取失败

---

## 数据集合说明

### users 集合

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 用户唯一ID |
| openid | string | 微信openid |
| nickName | string | 昵称 |
| avatarUrl | string | 头像URL |
| realName | string | 真实姓名 |
| className | string | 班级 |
| studentId | string | 学号 |
| phone | string | 手机号 |
| role | string | 角色（user/admin） |
| status | number | 状态（0正常） |
| profileCompleted | boolean | 资料是否完善 |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |
| lastLoginAt | Date | 最后登录时间 |

### credit_scores 集合

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 记录ID |
| userId | string | 关联用户ID |
| currentScore | number | 当前信誉分 |
| baseScore | number | 基础信誉分 |
| totalPlus | number | 总加分 |
| totalMinus | number | 总扣分 |
| lastRestoreDate | Date | 最后恢复日期 |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |

### credit_records 集合

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | string | 记录ID |
| userId | string | 关联用户ID |
| type | string | 变动类型（plus/minus） |
| scoreChange | number | 变动分数 |
| currentScore | number | 变动后分数 |
| reason | string | 变动原因 |
| relatedBookingId | string | 关联预约ID |
| createdAt | Date | 创建时间 |
