#!/bin/bash

# Docker 代理修复脚本
# 使用国内镜像源，避免代理问题

set -e

echo "🔧 配置 Docker 使用国内镜像源..."

# 备份现有配置
if [ -f /etc/docker/daemon.json ]; then
    echo "📦 备份现有配置到 /etc/docker/daemon.json.bak"
    sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak
fi

# 创建新的配置（保留现有代理配置，添加镜像源）
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ],
  "proxies": {
    "http-proxy": "http://192.168.3.2:7890",
    "https-proxy": "http://192.168.3.2:7890",
    "no-proxy": "127.0.0.0/8,192.168.3.0/24"
  }
}
EOF

echo "✅ 配置已更新"
echo ""
echo "🔄 重启 Docker 服务..."

sudo systemctl daemon-reload
sudo systemctl restart docker

echo ""
echo "✅ Docker 已重启"
echo ""
echo "📋 验证配置："
docker info | grep -A 5 "Registry Mirrors" || echo "镜像源配置可能需要几秒钟生效"

echo ""
echo "✨ 现在可以尝试拉取镜像了："
echo "   docker compose up -d"
