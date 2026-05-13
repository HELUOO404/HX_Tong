# 红芯通小程序 Git 提交规范

> 文档版本：v2.0  
> 更新日期：2026-04-22  
> 适用范围：红芯通小程序全项目

---

## 一、提交信息格式

### 1.1 提交信息结构

采用**约定式提交（Conventional Commits）**规范：

```
<类型>(<范围>): <简要描述>
                                    ← 空行
<正文（可选）>
                                    ← 空行
<脚注（可选）>
```

### 1.2 格式说明

| 部分 | 说明 | 是否必填 |
|------|------|---------|
| 类型 | 提交类型（feat/fix/docs等） | 是 |
| 范围 | 影响范围（模块/功能） | 否 |
| 简要描述 | 简短描述变更内容 | 是 |
| 正文 | 详细说明变更原因和方案 | 否 |
| 脚注 | 关联 Issue、Breaking Change 等 | 否 |

---

## 二、提交类型

### 2.1 类型清单

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新增功能 | `feat(预约): 添加会议室预约功能` |
| `fix` | 修复 Bug | `fix(登录): 修复微信登录超时问题` |
| `docs` | 文档更新 | `docs: 更新 API 接口文档` |
| `style` | 代码格式（不影响逻辑） | `style: 统一代码缩进格式` |
| `refactor` | 代码重构 | `refactor(用户): 重构用户认证逻辑` |
| `perf` | 性能优化 | `perf(列表): 优化会议室列表加载速度` |
| `test` | 测试相关 | `test: 添加用户模块单元测试` |
| `chore` | 构建/工具/依赖变更 | `chore: 升级 webpack 到 v5` |
| `ci` | CI/CD 配置 | `ci: 配置自动化部署` |
| `revert` | 回滚提交 | `revert: 回滚 v2.1.0 的登录重构` |

### 2.2 类型使用场景

```bash
# 新功能
feat(预约): 添加会议室批量预约功能

# Bug 修复
fix(支付): 修复微信支付回调失败的问题

# 文档更新
docs: 更新部署文档和 API 文档

# 代码格式
style: 统一所有文件的缩进为 2 个空格

# 重构
refactor(用户): 将用户服务拆分为多个小服务

# 性能优化
perf(首页): 优化首页加载速度，减少 50% 请求时间

# 测试
test(预约): 添加预约冲突检测的单元测试

# 构建/工具
chore: 更新依赖包版本

# CI/CD
ci: 配置 GitHub Actions 自动部署

# 回滚
revert: 回滚 "feat: 添加实验性功能"
```

---

## 三、提交范围

### 3.1 范围清单

| 范围 | 说明 | 示例 |
|------|------|------|
| `用户` / `user` | 用户相关模块 | `feat(用户): 添加微信一键登录` |
| `预约` / `booking` | 预约相关模块 | `fix(预约): 修复预约时间冲突检测` |
| `会议室` / `room` | 会议室相关模块 | `feat(会议室): 添加会议室搜索功能` |
| `课表` / `schedule` | 课表相关模块 | `feat(课表): 添加课表导入功能` |
| `信誉分` / `credit` | 信誉分相关模块 | `fix(信誉分): 修复信誉分计算错误` |
| `主题` / `theme` | 主题换肤相关 | `feat(主题): 添加深色模式` |
| `UI` / `ui` | 界面样式相关 | `style(UI): 优化按钮样式` |
| `全局` / `global` | 全局配置或功能 | `chore(全局): 更新全局配置` |
| `文档` / `docs` | 文档相关 | `docs: 更新 README` |

### 3.2 范围使用示例

```bash
# 用户模块
git commit -m "feat(用户): 添加手机号一键登录功能"
git commit -m "fix(用户): 修复用户信息更新失败的问题"

# 预约模块
git commit -m "feat(预约): 添加预约取消功能"
git commit -m "fix(预约): 修复预约时间冲突检测逻辑"

# 会议室模块
git commit -m "feat(会议室): 添加会议室容量筛选"
git commit -m "perf(会议室): 优化会议室列表查询速度"

# 全局
git commit -m "chore(全局): 更新项目依赖"
git commit -m "style(全局): 统一代码格式"
```

---

## 四、提交信息示例

### 4.1 简单提交

```bash
# 简单提交（单行）
git commit -m "feat(预约): 添加会议室预约功能"

# 修复提交
git commit -m "fix(登录): 修复微信登录回调失败问题"

# 文档提交
git commit -m "docs: 更新 API 接口文档"
```

### 4.2 详细提交

```bash
# 详细提交（多行）
git commit -m "feat(预约): 添加会议室预约功能

- 实现会议室列表展示
- 实现时间段选择
- 实现预约冲突检测
- 添加预约成功提示

关联需求：TAPD-12345"

# 修复提交（带原因说明）
git commit -m "fix(支付): 修复微信支付在 iOS 16 上无法唤起的问题

原因：微信 SDK 8.0.33 版本在 iOS 16 上 Universal Links 校验逻辑变更，
导致 openURL 回调失败。

方案：升级 SDK 至 8.0.38，并更新 Associated Domains 配置。

Closes #567"

# 重构提交
git commit -m "refactor(用户): 重构用户认证逻辑

将原有的单体用户服务拆分为：
- 登录服务（loginService）
- 信息服务（userInfoService）
- 权限服务（permissionService）

提高代码可维护性和可测试性。

BREAKING CHANGE: 用户服务 API 调用方式变更，
需要更新所有调用方代码。"
```

### 4.3 不好的提交示例

```bash
# 太笼统
git commit -m "update code"
git commit -m "fix bug"
git commit -m "修改了一些东西"

# 没有上下文
git commit -m "fix: 修复问题"
git commit -m "feat: 新增功能"

# 中英混杂无规范
git commit -m "fix：修复了一个bug，因为user login的时候会crash"

# 过长的一行
git commit -m "feat(预约): 添加会议室预约功能，包括会议室列表展示、时间段选择、预约冲突检测、预约成功提示等多个功能"
```

---

## 五、提交信息规范细则

### 5.1 简要描述规范

- 使用**动宾短语**：「添加 xxx」「修复 xxx」「优化 xxx」
- 不超过 50 个字符
- 不加句号结尾
- 首字母小写（类型后的描述）

```bash
# 正确示例
git commit -m "feat(用户): 添加微信一键登录功能"
git commit -m "fix(预约): 修复时间冲突检测逻辑"
git commit -m "perf(列表): 优化会议室列表加载速度"

# 错误示例
git commit -m "feat(用户): 添加了微信一键登录功能。"
git commit -m "feat(用户): 功能"
git commit -m "feat(用户): update"
```

### 5.2 正文规范

- 说明**为什么**要做这个改动（背景/原因）
- 说明**怎么做**的（技术方案摘要）
- 说明**影响范围**（哪些模块、接口受影响）
- 每行不超过 72 个字符
- 正文与标题之间空一行

```bash
git commit -m "feat(预约): 添加会议室批量预约功能

背景：用户反馈需要一次性预约多个会议室用于大型活动。

方案：
- 新增批量预约 API
- 前端添加批量选择界面
- 添加批量预约确认流程

影响范围：
- 预约服务（bookingService）
- 预约页面（booking/create）
- 数据库 bookings 集合"
```

### 5.3 脚注规范

#### 关联 Issue

```bash
# 关闭 Issue
git commit -m "fix(登录): 修复登录超时问题

Closes #123"

# 关联多个 Issue
git commit -m "feat(预约): 添加预约提醒功能

Closes #123
Refs #456, #789"

# 关联外部需求
git commit -m "feat(用户): 添加微信一键登录

关联需求：TAPD-12345
Jira: PROJ-678"
```

#### Breaking Change

```bash
git commit -m "feat(接口): 重构用户信息返回结构

将用户接口返回的扁平结构改为嵌套结构，前端需同步调整字段取值路径。

BREAKING CHANGE: /api/user/info 返回结构变更
- avatar 字段移入 profile 对象
- 移除已废弃的 nickname 字段，统一使用 displayName

迁移指南：
1. 更新前端字段取值路径
2. 更新接口文档
3. 通知相关团队"
```

---

## 六、提交频率与粒度

### 6.1 提交原则

- **原子性**：一次提交只做一件事
- **完整性**：提交代码应该是完整的、可运行的
- **相关性**：相关改动放在一次提交中

### 6.2 提交时机

| 场景 | 建议操作 |
|------|---------|
| 完成一个功能点 | 提交 |
| 修复一个 Bug | 提交 |
| 重构一个模块 | 提交 |
| 代码审查前 | 提交 |
| 下班前 | 提交 |

### 6.3 提交粒度示例

```bash
# 好的提交粒度
# 提交 1：添加用户登录功能
git commit -m "feat(用户): 添加微信一键登录功能"

# 提交 2：添加用户信息获取功能
git commit -m "feat(用户): 添加获取用户信息功能"

# 提交 3：修复登录 Bug
git commit -m "fix(用户): 修复登录状态保持失败的问题"

# 不好的提交粒度（一次性提交太多）
git commit -m "feat: 添加用户模块"
# 这个提交包含了登录、注册、信息获取等多个功能
```

---

## 七、提交前检查清单

### 7.1 代码检查

- [ ] 代码可以正常运行
- [ ] 无 `console.log` 等调试代码残留
- [ ] 无硬编码的敏感信息
- [ ] 代码符合项目规范

### 7.2 提交信息检查

- [ ] 类型选择正确（feat/fix/docs 等）
- [ ] 范围准确描述了影响模块
- [ ] 简要描述为动宾短语且不超过 50 字符
- [ ] 简要描述末尾无句号
- [ ] 正文说明了变更原因和方案（如需要）
- [ ] 关联了相关 Issue（如需要）
- [ ] Breaking Change 已标注（如需要）

### 7.3 文件检查

- [ ] 只提交相关文件
- [ ] 不提交敏感配置文件
- [ ] 不提交中间文件
- [ ] `.gitignore` 配置正确

---

## 八、提交工具配置

### 8.1 commitlint 配置

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'revert'
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 100],
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [1, 'always', 200],
    'footer-max-line-length': [1, 'always', 200]
  },
  prompt: {
    messages: {
      type: '选择提交类型:',
      scope: '输入影响范围（可选）:',
      subject: '填写简短描述:',
      body: '填写详细描述（可选，使用 "|" 换行）:',
      breaking: '列出不兼容变更（可选）:',
      footer: '关联的 Issue（可选，例如 #123）:',
      confirmCommit: '确认提交以上信息？'
    }
  }
}
```

### 8.2 husky + lint-staged 配置

```bash
# 安装依赖
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional

# 初始化 husky
npx husky init
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit "$1"
```

```bash
# .husky/pre-commit
npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,ts}": [
      "eslint --fix"
    ],
    "*.{css,scss,less}": [
      "stylelint --fix"
    ]
  }
}
```

---

## 九、提交规范检查清单

### 9.1 提交前自查

- [ ] 类型是否正确选择（feat/fix/docs/...）
- [ ] 范围是否准确描述了影响模块
- [ ] 简要描述是否为动宾短语且不超过 50 字符
- [ ] 简要描述末尾是否去掉了句号
- [ ] 正文是否说明了变更原因和方案
- [ ] 不兼容变更是否标注了 BREAKING CHANGE
- [ ] 相关 Issue 是否已关联
- [ ] 一次提交是否只做了一件事（原子性）

### 9.2 团队落地步骤

1. **工具链配置**：按上述步骤配置 commitlint + husky，让规范可执行
2. **模板共享**：将 `.commitlintrc`、`.husky/` 等配置提交到仓库
3. **团队培训**：组织 15 分钟的规范说明会，演示工具使用
4. **Code Review**：Review 时关注 commit message 质量
5. **持续迭代**：每季度回顾规范执行情况，根据团队反馈调整

---

## 修订记录

| 版本 | 日期 | 修订内容 | 修订人 |
|------|------|----------|--------|
| v2.0 | 2026-04-22 | 全面重构，与项目现状保持一致 | 红芯通开发团队 |
| v1.0 | 2026-04-21 | 初始版本 | 红芯通开发团队 |

---

**文档结束**

*本文档由红芯通开发团队制定，所有项目成员必须严格遵守。*
