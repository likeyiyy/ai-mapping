# Docker 代理配置指南

## 问题诊断

如果遇到 `proxyconnect tcp: dial tcp 192.168.3.2:7890: connect: no route to host` 错误，说明 Docker 无法连接到代理服务器。

## 解决方案

### 方案一：使用国内镜像源（推荐，最简单）

使用国内 Docker 镜像源可以避免代理问题，速度更快。

#### 1. 配置 Docker 镜像加速器

创建或编辑 `/etc/docker/daemon.json`：

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
```

#### 2. 重启 Docker 服务

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

#### 3. 验证配置

```bash
docker info | grep -A 10 "Registry Mirrors"
```

### 方案二：修复代理配置

如果你的代理服务器正在运行，但 Docker 无法连接，请检查：

#### 1. 确认代理服务器地址

常见的代理地址：
- `http://127.0.0.1:7890` (本地代理)
- `http://localhost:7890` (本地代理)
- `http://192.168.x.x:7890` (局域网代理)

#### 2. 测试代理连接

```bash
# 测试代理是否可用
curl -x http://YOUR_PROXY_HOST:7890 -I https://www.google.com

# 如果失败，检查代理服务器是否运行
netstat -tlnp | grep 7890
```

#### 3. 更新 Docker 代理配置

**方法 A：更新 Docker daemon 配置**

编辑 `/etc/docker/daemon.json`：

```bash
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "proxies": {
    "http-proxy": "http://127.0.0.1:7890",
    "https-proxy": "http://127.0.0.1:7890",
    "no-proxy": "127.0.0.0/8,localhost,192.168.0.0/16"
  }
}
EOF
```

**方法 B：使用 systemd 服务配置**

创建 `/etc/systemd/system/docker.service.d/http-proxy.conf`：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<-'EOF'
[Service]
Environment="HTTP_PROXY=http://127.0.0.1:7890"
Environment="HTTPS_PROXY=http://127.0.0.1:7890"
Environment="NO_PROXY=127.0.0.0/8,localhost,192.168.0.0/16"
EOF
```

#### 4. 重启 Docker 服务

```bash
sudo systemctl daemon-reload
sudo systemctl restart docker
```

#### 5. 验证代理配置

```bash
# 检查 Docker 服务环境变量
sudo systemctl show --property=Environment docker

# 测试拉取镜像
docker pull hello-world
```

### 方案三：临时使用代理（仅当前会话）

如果不想修改系统配置，可以在当前终端设置环境变量：

```bash
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export NO_PROXY=127.0.0.0/8,localhost,192.168.0.0/16

# 然后运行 docker compose
docker compose up -d
```

## 推荐配置（国内用户）

对于国内用户，推荐同时配置镜像源和代理：

```bash
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ],
  "proxies": {
    "http-proxy": "http://127.0.0.1:7890",
    "https-proxy": "http://127.0.0.1:7890",
    "no-proxy": "127.0.0.0/8,localhost,192.168.0.0/16"
  }
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

这样 Docker 会优先使用镜像源，如果镜像源不可用，会回退到代理。

## 常见问题

### Q: 如何找到正确的代理地址？

A: 检查你的代理软件设置：
- Clash: 通常使用 `http://127.0.0.1:7890`
- V2Ray: 通常使用 `http://127.0.0.1:10809`
- Shadowsocks: 需要配合代理工具使用

### Q: 代理配置后仍然无法拉取镜像？

A: 
1. 确认代理服务器正在运行
2. 检查防火墙设置
3. 尝试使用国内镜像源
4. 检查 Docker 日志：`sudo journalctl -u docker.service`

### Q: 如何禁用代理？

A: 删除或注释掉 `/etc/docker/daemon.json` 中的 `proxies` 配置，然后重启 Docker。
