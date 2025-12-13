# 本地 MongoDB Docker 设置指南

本指南将帮助你在本地使用 Docker 运行 MongoDB，避免网络问题。

## 快速开始

### 1. 启动 MongoDB Docker 容器

```bash
# 启动 MongoDB 服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f mongodb
```

### 2. 配置环境变量

编辑 `.env.local` 文件，使用本地 MongoDB 连接：

```bash
# 本地 Docker MongoDB
MONGODB_URI=mongodb://admin:password123@localhost:27017/ai-mapping?authSource=admin

# 可选：自定义数据库名称（默认：ai-mapping）
# MONGODB_DB_NAME=ai-mapping

# OpenRouter API 配置
OPENROUTER_API_KEY=your-openrouter-api-key
```

### 3. 初始化数据库

```bash
# 运行初始化脚本创建索引
npm run init-db
# 或者
npx ts-node scripts/init-db.ts
```

### 4. 启动开发服务器

```bash
npm run dev
```

## Docker 命令参考

### 启动和停止

```bash
# 启动 MongoDB（后台运行）
docker compose up -d

# 停止 MongoDB
docker compose down

# 停止并删除数据卷（⚠️ 会删除所有数据）
docker compose down -v
```

### 查看状态和日志

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs mongodb

# 实时查看日志
docker compose logs -f mongodb
```

### 进入 MongoDB Shell

```bash
# 进入 MongoDB 容器
docker exec -it ai-mapping-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# 在 MongoDB Shell 中
use ai-mapping
show collections
db.conversations.find().pretty()
```

## 数据持久化

数据存储在 Docker 卷中，即使容器停止也不会丢失：

```bash
# 查看数据卷
docker volume ls | grep mongodb

# 备份数据（导出）
docker exec ai-mapping-mongodb mongodump -u admin -p password123 --authenticationDatabase admin --out /data/backup

# 恢复数据（导入）
docker exec ai-mapping-mongodb mongorestore -u admin -p password123 --authenticationDatabase admin /data/backup
```

**注意**: 现代 Docker 使用 `docker compose`（空格）而不是 `docker-compose`（连字符）。如果你看到 `docker-compose: command not found`，请使用 `docker compose`。

## 切换到线上 MongoDB

如果需要切换回线上 MongoDB，只需修改 `.env.local`：

```bash
# 线上 MongoDB Atlas
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/ai-mapping
```

## 故障排除

### 端口已被占用

如果 27017 端口已被占用，可以修改 `docker-compose.yml`：

```yaml
ports:
  - "27018:27017"  # 使用 27018 端口
```

然后更新 `.env.local`：

```bash
MONGODB_URI=mongodb://admin:password123@localhost:27018/ai-mapping?authSource=admin
```

### 连接失败

1. 确保 MongoDB 容器正在运行：`docker compose ps`
2. 检查日志：`docker compose logs mongodb`
3. 验证连接字符串格式是否正确
4. 确保防火墙没有阻止端口

### 重置数据库

```bash
# 停止并删除容器和数据
docker compose down -v

# 重新启动
docker compose up -d

# 重新初始化
npm run init-db
```

## 默认配置

- **用户名**: `admin`
- **密码**: `password123`
- **数据库**: `ai-mapping`
- **端口**: `27017`
- **认证数据库**: `admin`

⚠️ **安全提示**: 这些是开发环境的默认配置，不要在生产环境使用！
