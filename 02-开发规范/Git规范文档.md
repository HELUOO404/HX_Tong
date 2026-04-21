# 红芯通小程序 Git 规范文档

> 文档版本：v1.0  
> 编制日期：2026-04-21  
> 适用范围：红芯通小程序全项目

---

## 目录

1. [Git工作流选择](#一git工作流选择)
2. [分支管理策略](#二分支管理策略)
3. [提交信息格式](#三提交信息格式)
4. [代码审查流程](#四代码审查流程)
5. [版本控制标准](#五版本控制标准)
6. [国内Git平台适配](#六国内git平台适配)
7. [常用Git配置](#七常用git配置)
8. [CI/CD配置示例](#八cicd配置示例)

---

## 一、Git工作流选择

根据团队规模和项目特点，推荐以下三种工作流方案：

### 1.1 方案一：主干开发（Trunk-Based Development）

**适合：** 小团队（2-8人）、迭代速度快、有完善的自动化测试

```
main ──●──●──●──●──●──●──●──●──●──
        \   /  \   /       \   /
feat/x  ●─●   ●─●    fix/y ●─●
（短命分支，1-2天内合回）
```

**规则：**
- 主干（main）始终保持可发布状态
- 功能分支生命周期不超过2天
- 每天至少合并一次到主干
- 用Feature Flag控制未完成功能的可见性

### 1.2 方案二：Git Flow（经典分支模型）

**适合：** 中大团队、版本发布节奏固定、需要维护多个版本

```
main     ──●────────────────●────────────── 生产环境
            \              / \
release     ●──●──●──●──●    ●──●──●──●── 发布分支
            \              /
develop  ──●──●──●──●──●──●──●──●──●──●── 开发主线
             \   /  \       /
feat/x       ●─●    ●─────●               功能分支
                      \   /
                  fix/y ●─●                修复分支
```

**分支说明：**
| 分支 | 用途 | 创建来源 | 合并目标 |
|------|------|----------|----------|
| `main` | 生产环境代码 | - | - |
| `develop` | 开发主线 | main | main |
| `release/*` | 发布分支，只修bug不加功能 | develop | main + develop |
| `feat/*` | 功能分支 | develop | develop |
| `hotfix/*` | 紧急修复 | main | main + develop |

### 1.3 方案三：国内团队常用简化流程（推荐）

**适合：** 大多数国内中小团队的实际情况

```
main     ──●──────●──────●──── 生产环境（受保护）
            \    / \    /
dev      ──●──●─●──●──●─●──── 开发/测试环境
             \  /    \  /
feat/x       ●●      ●●       功能分支
```

**规则：**
- `main`分支受保护，只能通过PR/MR合并
- `dev`分支对应测试环境，自动部署
- 功能分支从`dev`拉出，合回`dev`
- `dev`测试通过后，合并到`main`进行发布

---

## 二、分支管理策略

### 2.1 分支命名规范

```bash
# 功能分支
feat/user-login              # 新功能
feat/TAPD-1234-order-refund  # 关联任务编号

# 修复分支
fix/payment-callback         # Bug修复
fix/JIRA-5678-null-pointer   # 关联Bug编号

# 发布分支
release/v2.1.0               # 版本发布
release/2024-03-sprint       # 按迭代命名

# 紧急修复
hotfix/v2.0.1                # 线上紧急修复
hotfix/fix-login-crash       # 描述性命名

# 个人分支（部分团队使用）
dev/zhangsan/feat-login      # 个人开发分支
```

**命名规则：**
1. 全部小写，用`-`连接单词（不用下划线或驼峰）
2. 前缀明确分支类型：`feat/`、`fix/`、`hotfix/`、`release/`
3. 关联任务管理平台的编号（如有）：`feat/TAPD-12345-description`
4. 长度适中，能看出分支目的即可

### 2.2 分支工作流程

```bash
# 1. 从main/dev拉分支
git checkout dev
git pull origin dev
git checkout -b feat/user-login

# 2. 开发完成后提交
git add .
git commit -m "feat(用户): 实现微信登录功能"

# 3. 推送到远程
git push origin feat/user-login

# 4. 发起Pull Request合并到dev

# 5. 合并后删除分支
git checkout dev
git branch -d feat/user-login
```

---

## 三、提交信息格式

### 3.1 提交信息结构（约定式提交）

```
<类型>(<范围>): <简要描述>
                                    ← 空行
<正文（可选）>
                                    ← 空行
<脚注（可选）>
```

### 3.2 类型说明

| 类型 | 说明 | emoji（可选） |
|------|------|--------------|
| `feat` | 新增功能 | ✨ |
| `fix` | 修复Bug | 🐛 |
| `docs` | 文档更新 | 📝 |
| `style` | 代码格式（不影响逻辑） | 💄 |
| `refactor` | 重构（不是新功能也不是修Bug） | ♻️ |
| `perf` | 性能优化 | ⚡ |
| `test` | 测试相关 | ✅ |
| `build` | 构建系统或外部依赖 | 📦 |
| `ci` | CI/CD配置 | 👷 |
| `chore` | 其他杂项 | 🔧 |
| `revert` | 回滚 | ⏪ |

### 3.3 范围说明

| 范围 | 说明 |
|------|------|
| `用户` / `user` | 用户相关模块 |
| `预约` / `booking` | 预约相关模块 |
| `会议室` / `room` | 会议室相关模块 |
| `课表` / `schedule` | 课表相关模块 |
| `信誉分` / `credit` | 信誉分相关模块 |
| `UI` / `ui` | 界面样式相关 |
| `全局` / `global` | 全局配置或功能 |

### 3.4 好的提交信息示例

```bash
# 简单提交
git commit -m "feat(预约): 添加会议室预约功能"

# 详细提交
git commit -m "feat(预约): 添加会议室预约功能

- 实现会议室列表展示
- 实现时间段选择
- 实现预约冲突检测
- 添加预约成功提示

关联需求：TAPD-12345"

# 修复提交
git commit -m "fix(支付): 修复微信支付在iOS 16上无法唤起的问题

原因：微信SDK 8.0.33版本在iOS 16上Universal Links校验逻辑变更，
导致openURL回调失败。

方案：升级SDK至8.0.38，并更新Associated Domains配置。

Closes #567"
```

### 3.5 不好的提交信息示例

```bash
# 太笼统
update code
fix bug
修改了一些东西

# 没有上下文
fix: 修复问题
feat: 新增功能

# 中英混杂无规范
fix：修复了一个bug，因为user login的时候会crash
```

---

## 四、代码审查流程

### 4.1 审查要求

| 项目 | 要求 |
|------|------|
| 审查人 | 至少1名其他团队成员 |
| 审查内容 | 代码规范、逻辑正确性、安全性、性能 |
| 审查方式 | Pull Request + 代码评论 |
| 合并条件 | 所有评论已解决 + 审查人批准 + CI通过 |

### 4.2 审查检查清单

```markdown
## 代码审查检查清单

### 规范性检查
- [ ] 代码符合命名规范
- [ ] 必要的注释已添加
- [ ] 无console.log等调试代码残留
- [ ] 无硬编码的敏感信息

### 功能性检查
- [ ] 功能实现符合需求
- [ ] 边界条件已处理
- [ ] 错误处理已完善

### 安全性检查
- [ ] 用户输入已验证
- [ ] 敏感数据已加密
- [ ] 权限控制已正确实现

### 性能检查
- [ ] 无明显的性能问题
- [ ] 大数据量已考虑分页
- [ ] 图片等资源已优化
```

### 4.3 PR/MR描述模板

**Gitee：** `.gitee/PULL_REQUEST_TEMPLATE.md`

**Coding / GitLab：** `.gitlab/merge_request_templates/default.md`

**GitHub：** `.github/pull_request_template.md`

```markdown
## 变更说明
<!-- 简要描述这次改动做了什么，解决了什么问题 -->

## 变更类型
- [ ] 新功能（feat）
- [ ] Bug修复（fix）
- [ ] 重构（refactor）
- [ ] 性能优化（perf）
- [ ] 文档更新（docs）
- [ ] 其他：

## 关联信息
- 需求/Bug链接：
- 设计文档：

## 改动范围
<!-- 列出主要改动的模块和文件 -->

## 测试情况
- [ ] 单元测试通过
- [ ] 手动测试通过
- [ ] 相关模块回归测试通过

## 部署注意事项
- [ ] 需要执行数据库迁移
- [ ] 需要更新配置文件
- [ ] 需要更新环境变量
- [ ] 无特殊注意事项
```

---

## 五、版本控制标准

### 5.1 版本号规范

采用语义化版本控制（Semantic Versioning）：

```
版本格式：主版本号.次版本号.修订号
示例：1.0.0

主版本号：重大功能更新，不兼容的API修改
次版本号：向下兼容的功能新增
修订号：向下兼容的问题修复
```

### 5.2 版本发布流程

```bash
# 1. 创建发布分支
git checkout develop
git checkout -b release/v1.0.0

# 2. 更新版本号（package.json、app.json等）
# 3. 修复测试中发现的问题

# 4. 合并到main
git checkout main
git merge release/v1.0.0
git tag -a v1.0.0 -m "发布v1.0.0"
git push origin main --tags

# 5. 合并回develop
git checkout develop
git merge release/v1.0.0

# 6. 删除发布分支
git branch -d release/v1.0.0
```

---

## 六、国内Git平台适配

### 6.1 平台对比

| 特性 | Gitee | Coding.net | 极狐GitLab | CNB | GitHub |
|------|-------|------------|------------|-----|--------|
| 国内访问 | 快 | 快 | 快 | 快 | 不稳定 |
| 免费私有仓库 | 有 | 有 | 有 | 有 | 有 |
| CI/CD | Gitee Go | Coding CI | 内置GitLab CI | 内置 | GitHub Actions |
| 代码审查 | PR | MR | MR | MR | PR |
| 适合场景 | 开源/小团队 | 中大型团队 | 企业私有化 | 云原生 | 国际项目 |

### 6.2 Gitee特有配置

```bash
# 设置Gitee远程仓库
git remote add origin https://gitee.com/<org>/<repo>.git

# Gitee的SSH配置
# ~/.ssh/config
Host gitee.com
    HostName gitee.com
    User git
    IdentityFile ~/.ssh/gitee_rsa
    PreferredAuthentications publickey

# 同时推送到Gitee和GitHub（镜像同步）
git remote set-url --add --push origin https://gitee.com/<org>/<repo>.git
git remote set-url --add --push origin https://github.com/<org>/<repo>.git
```

### 6.3 Coding.net特有配置

```bash
# Coding的仓库地址格式
git remote add origin https://e.coding.net/<team>/<project>/<repo>.git

# Coding支持的SSH地址
git remote add origin git@e.coding.net:<team>/<project>/<repo>.git
```

### 6.4 极狐GitLab特有配置

```bash
# 极狐GitLab私有化部署常见地址格式
git remote add origin https://jihulab.com/<group>/<repo>.git

# 或者企业内部部署
git remote add origin https://gitlab.yourcompany.com/<group>/<repo>.git
```

### 6.5 CNB（Cloud Native Build）特有配置

```bash
# CNB仓库地址（仅支持HTTPS）
git remote add origin https://cnb.cool/<org>/<repo>.git

# HTTPS认证：用户名固定为cnb，密码为个人访问令牌
git config credential.helper store
```

---

## 七、常用Git配置

### 7.1 国内环境优化

```bash
# 设置用户信息
git config --global user.name "张三"
git config --global user.email "zhangsan@company.com"

# commit message编辑器设置为VS Code
git config --global core.editor "code --wait"

# 解决中文文件名显示为转义字符的问题
git config --global core.quotepath false

# 设置默认分支名
git config --global init.defaultBranch main

# 代理设置（如果需要同时使用GitHub）
git config --global http.https://github.com.proxy socks5://127.0.0.1:7890

# NPM使用国内镜像
npm config set registry https://registry.npmmirror.com
```

### 7.2 推送前检查清单

- [ ] 分支命名符合团队规范
- [ ] commit message格式正确，类型和范围准确
- [ ] 关联了对应的需求/Bug编号
- [ ] PR/MR描述填写完整
- [ ] CI流水线通过
- [ ] 已请求相关同事Review

---

## 八、CI/CD配置示例

### 8.1 Gitee Go

```yaml
# .gitee/pipelines/pipeline.yml
name: 构建与测试
displayName: '构建与测试流水线'

triggers:
  push:
    branches:
      include:
        - main
        - dev

stages:
  - name: 测试
    jobs:
      - name: 单元测试
        steps:
          - step: npmbuild@1
            name: install_and_test
            displayName: '安装依赖并执行测试'
            inputs:
              nodeVersion: 20
              commands:
                - npm ci
                - npm test
```

### 8.2 Coding CI

```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('安装依赖') {
            steps {
                sh 'npm ci'
            }
        }

        stage('单元测试') {
            steps {
                sh 'npm test'
            }
        }

        stage('构建') {
            steps {
                sh 'npm run build'
            }
        }

        stage('部署到测试环境') {
            when {
                branch 'dev'
            }
            steps {
                sh './scripts/deploy-staging.sh'
            }
        }

        stage('部署到生产环境') {
            when {
                branch 'main'
            }
            steps {
                sh './scripts/deploy-production.sh'
            }
        }
    }
}
```

### 8.3 极狐GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_IMAGE: node:20-alpine
  NPM_REGISTRY: https://registry.npmmirror.com

单元测试:
  stage: test
  image: $NODE_IMAGE
  script:
    - npm config set registry $NPM_REGISTRY
    - npm ci
    - npm test

构建:
  stage: build
  image: $NODE_IMAGE
  script:
    - npm config set registry $NPM_REGISTRY
    - npm ci
    - npm run build

部署测试环境:
  stage: deploy
  script:
    - ./scripts/deploy-staging.sh
  only:
    - dev

部署生产环境:
  stage: deploy
  script:
    - ./scripts/deploy-production.sh
  only:
    - main
  when: manual
```

### 8.4 CNB（Cloud Native Build）

```yaml
# .cnb.yml
main:
  push:
    - docker:
        image: node:20
      stages:
        - npm ci
        - npm test
        - npm run build
  pull_request:
    - docker:
        image: node:20
      stages:
        - npm run lint
        - npm test
```

### 8.5 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
```

---

## 附录：Git常用命令速查

```bash
# 初始化仓库
git init

# 克隆仓库
git clone <仓库地址>

# 查看状态
git status

# 添加文件
git add <文件名>
git add .                    # 添加所有更改

# 提交更改
git commit -m "提交信息"
git commit -am "提交信息"    # 添加并提交

# 查看历史
git log --oneline -10        # 简洁显示最近10条
git log --graph --oneline    # 图形化显示

# 分支操作
git branch                   # 列出分支
git branch <分支名>          # 创建分支
git checkout <分支名>        # 切换分支
git checkout -b <分支名>     # 创建并切换
git branch -d <分支名>       # 删除分支

# 远程操作
git remote -v                # 查看远程仓库
git remote add origin <地址> # 添加远程仓库
git push origin <分支>       # 推送
git pull origin <分支>       # 拉取
git fetch origin             # 获取更新

# 合并操作
git merge <分支>             # 合并分支
git rebase <分支>            # 变基

# 标签操作
git tag                      # 列出标签
git tag -a v1.0.0 -m "版本1.0.0"
git push origin --tags       # 推送标签

# 撤销操作
git reset HEAD~1             # 撤销上次提交
git checkout -- <文件>       # 撤销文件更改
git revert <提交ID>          # 撤销指定提交

# 储藏操作
git stash                    # 储藏更改
git stash pop                # 恢复储藏
```

---

**文档结束**

*本文档由红芯通开发团队制定，所有项目成员必须严格遵守。*
