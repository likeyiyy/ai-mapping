# Vercel CLI 使用指南

## 查看构建状态

### 1. 列出所有部署（最常用）

```bash
# 列出最近的部署
vercel ls

# 列出特定项目的部署
vercel ls [project-name]

# 显示更多信息（包括构建状态）
vercel ls --debug
```

**输出示例：**
```
Vercel CLI 32.x.x
Deployments for your-team/your-project [1 found]

  Production  https://your-project.vercel.app
  └─ Deployed in 1m 23s
  └─ Build: Ready
  └─ Status: Ready
```

### 2. 查看特定部署的详细信息

```bash
# 查看最新部署的详细信息
vercel inspect

# 查看特定 URL 的部署信息
vercel inspect https://your-project.vercel.app

# 查看特定部署 ID
vercel inspect [deployment-id]
```

**输出示例：**
```
Deployment Information
  URL: https://your-project.vercel.app
  State: READY
  Build: Ready
  Created: 2025-12-13T10:30:00.000Z
  Creator: your-email@example.com
```

### 3. 实时查看构建日志

```bash
# 查看最新部署的日志
vercel logs

# 查看特定部署的日志
vercel logs [deployment-url]

# 实时跟踪日志（类似 tail -f）
vercel logs --follow

# 查看特定时间的日志
vercel logs --since 1h
```

### 4. 部署并查看状态

```bash
# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod

# 部署并显示详细信息
vercel --debug
```

部署时会实时显示构建进度：
```
🔍  Inspect: https://vercel.com/your-team/your-project/[deployment-id]
✅  Production: https://your-project.vercel.app [1m 23s]
```

## 常用命令组合

### 快速检查构建状态

```bash
# 一行命令查看最新部署状态
vercel ls | head -20
```

### 查看构建是否完成

```bash
# 检查最新部署是否 Ready
vercel inspect | grep -E "State|Build"
```

### 监控构建进度

```bash
# 部署并实时查看日志
vercel --prod --follow
```

## 构建状态说明

- **BUILDING**: 正在构建中
- **READY**: 构建完成，已就绪
- **ERROR**: 构建失败
- **QUEUED**: 排队等待构建
- **CANCELED**: 构建已取消

## 实用技巧

### 1. 创建别名命令

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
# 查看 Vercel 部署状态
alias vls='vercel ls'
alias vinspect='vercel inspect'
alias vlogs='vercel logs --follow'
```

### 2. 检查特定项目的构建

```bash
# 如果项目已链接
cd /path/to/your/project
vercel ls

# 或者指定项目
vercel ls --scope your-team
```

### 3. 查看构建历史

```bash
# 列出所有部署（包括历史）
vercel ls --all
```

## 故障排查

### 如果构建失败

```bash
# 1. 查看详细日志
vercel logs [deployment-url]

# 2. 查看构建信息
vercel inspect [deployment-url]

# 3. 重新部署
vercel --prod
```

### 如果命令不工作

```bash
# 检查是否已登录
vercel whoami

# 如果未登录，先登录
vercel login

# 检查项目是否已链接
vercel link
```

## 示例工作流

```bash
# 1. 部署到预览环境
vercel

# 2. 查看部署状态
vercel ls

# 3. 如果预览正常，部署到生产
vercel --prod

# 4. 监控生产部署日志
vercel logs --follow --prod
```
