#!/bin/bash

# 本地 MongoDB Docker 快速设置脚本

set -e

echo "🚀 启动本地 MongoDB Docker 容器..."

# 启动 MongoDB
docker compose up -d

echo "⏳ 等待 MongoDB 启动..."
sleep 5

# 检查容器状态
if docker compose ps | grep -q "Up"; then
    echo "✅ MongoDB 已成功启动！"
    echo ""
    echo "📝 请确保你的 .env.local 文件包含以下配置："
    echo ""
    echo "MONGODB_URI=mongodb://admin:password123@localhost:27017/ai-mapping?authSource=admin"
    echo ""
    echo "🔧 初始化数据库索引..."
    npm run init-db || echo "⚠️  如果 init-db 失败，请先运行: npm install"
    echo ""
    echo "✨ 设置完成！现在可以运行: npm run dev"
else
    echo "❌ MongoDB 启动失败，请检查日志: docker compose logs mongodb"
    exit 1
fi
