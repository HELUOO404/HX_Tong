# SystemService API 文档

## 概述

SystemService 是红芯通小程序的系统服务云函数，提供数据库初始化、查看等系统级功能。

**云函数名称**: `systemService`

**响应格式**:
```json
{
  "code": 200,
  "message": "成功",
  "data": {}
}
```

---

## API 列表

### 1. system_initDatabase - 初始化数据库

初始化数据库集合和初始数据，支持幂等性执行（重复执行不会报错）。

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| action | string | 是 | 固定值: `system_initDatabase` |
| params | object | 否 | 无需参数 |

#### 响应数据

| 字段 | 类型 | 说明 |
|-----|------|------|
| collections | array | 集合创建结果列表 |
| adminCreated | boolean | 是否创建了新管理员 |
| sampleRoomsCreated | boolean | 是否创建了示例会议室 |
| sampleRoomsCount | number | 示例会议室数量 |
| indexesCreated | boolean | 是否创建了索引 |
| errors | array | 错误列表（如有） |

#### 示例

**请求**:
```json
{
  "action": "system_initDatabase",
  "params": {}
}
```

**响应**:
```json
{
  "code": 200,
  "message": "数据库初始化成功",
  "data": {
    "collections": [
      { "name": "users", "status": "created", "description": "用户表" },
      { "name": "rooms", "status": "existed", "description": "会议室表" },
      { "name": "bookings", "status": "created", "description": "预约表" },
      { "name": "credit_scores", "status": "created", "description": "信誉分表" },
      { "name": "credit_records", "status": "created", "description": "信誉分记录表" },
      { "name": "admins", "status": "created", "description": "管理员表" }
    ],
    "adminCreated": true,
    "sampleRoomsCreated": true,
    "sampleRoomsCount": 3,
    "indexesCreated": true,
    "errors": []
  }
}
```

#### 创建的集合说明

| 集合名称 | 说明 | 初始数据 |
|---------|------|---------|
| users | 用户表 | 无 |
| rooms | 会议室表 | 3个示例会议室 |
| bookings | 预约表 | 无 |
| credit_scores | 信誉分表 | 无 |
| credit_records | 信誉分记录表 | 无 |
| admins | 管理员表 | 1个默认管理员 |

#### 默认管理员账号

- **用户名**: `admin`
- **密码**: `admin123`
- **角色**: `superAdmin`

---

### 2. system_dbViewer - 数据库查看

查看数据库集合列表、文档数量和示例数据。

#### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| action | string | 是 | 固定值: `system_dbViewer` |
| params.collection | string | 否 | 指定查看的集合名称 |
| params.limit | number | 否 | 返回文档数量限制（默认10，最大100） |

#### 响应数据

**查看所有集合统计**（不指定 collection）:

| 字段 | 类型 | 说明 |
|-----|------|------|
| summary.totalCollections | number | 集合总数 |
| summary.availableCollections | number | 可用集合数 |
| summary.totalDocuments | number | 总文档数 |
| collections | array | 各集合统计信息 |

**查看指定集合**（指定 collection）:

| 字段 | 类型 | 说明 |
|-----|------|------|
| collection | string | 集合名称 |
| description | string | 集合描述 |
| total | number | 文档总数 |
| returned | number | 返回文档数 |
| records | array | 文档列表（敏感字段已脱敏） |

#### 示例

**查看所有集合统计**:
```json
{
  "action": "system_dbViewer",
  "params": {}
}
```

**响应**:
```json
{
  "code": 200,
  "message": "数据库统计信息",
  "data": {
    "summary": {
      "totalCollections": 6,
      "availableCollections": 6,
      "totalDocuments": 4
    },
    "collections": [
      { "name": "users", "description": "用户表", "count": 0, "status": "available" },
      { "name": "rooms", "description": "会议室表", "count": 3, "status": "available" },
      { "name": "bookings", "description": "预约表", "count": 0, "status": "available" },
      { "name": "credit_scores", "description": "信誉分表", "count": 0, "status": "available" },
      { "name": "credit_records", "description": "信誉分记录表", "count": 0, "status": "available" },
      { "name": "admins", "description": "管理员表", "count": 1, "status": "available" }
    ]
  }
}
```

**查看指定集合**:
```json
{
  "action": "system_dbViewer",
  "params": {
    "collection": "rooms",
    "limit": 5
  }
}
```

**响应**:
```json
{
  "code": 200,
  "message": "查询 rooms 集合成功",
  "data": {
    "collection": "rooms",
    "description": "会议室表",
    "total": 3,
    "returned": 3,
    "records": [
      {
        "_id": "xxx",
        "name": "红棉阁",
        "location": "学院楼3楼301室",
        "capacity": { "min": 10, "max": 30 },
        "facilities": ["投影仪", "白板", "音响系统", "空调"],
        "status": "available"
      }
    ]
  }
}
```

---

## 错误码

| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用场景

### 1. 首次部署时初始化数据库

```javascript
wx.cloud.callFunction({
  name: 'systemService',
  data: {
    action: 'system_initDatabase',
    params: {}
  }
})
```

### 2. 查看数据库状态

```javascript
wx.cloud.callFunction({
  name: 'systemService',
  data: {
    action: 'system_dbViewer',
    params: {}
  }
})
```

### 3. 查看特定集合数据

```javascript
wx.cloud.callFunction({
  name: 'systemService',
  data: {
    action: 'system_dbViewer',
    params: {
      collection: 'rooms',
      limit: 10
    }
  }
})
```

---

## 注意事项

1. **幂等性**: `system_initDatabase` 支持幂等性执行，重复调用不会导致错误
2. **敏感数据**: `system_dbViewer` 会自动对密码等敏感字段进行脱敏处理
3. **权限控制**: 建议在生产环境中对系统服务添加权限校验
4. **默认管理员**: 首次初始化后会创建默认管理员，请及时修改默认密码
