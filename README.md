# AI 对话思维导图

一个基于 Next.js 和 AI 的智能对话思维导图工具，将 AI 对话以可视化的树状结构呈现，支持多模型对比、分支探索和实时交互。

![AI Mapping](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)

## ✨ 核心功能

### 💬 智能对话
- **多 AI 模型支持**：集成 OpenRouter，支持 Google Gemini、Claude、DeepSeek 等主流 AI 模型
- **实时流式响应**：打字机效果展示 AI 回复，提供流畅的交互体验
- **上下文连续**：保持对话历史，支持深入的分支探索

### 🌳 可视化思维导图
- **交互式节点**：通过 ReactFlow 实现拖拽、缩放、编辑等丰富交互
- **多种布局**：支持树状、径向、力导向等多种布局方式
- **智能定位**：自动计算节点位置，避免视觉重叠
- **快捷键支持**：Tab 键快速添加子节点，提升操作效率

### 💾 数据持久化
- **自动保存**：对话内容 3 秒后自动保存，永不丢失
- **云端存储**：基于 MongoDB Atlas 的云端存储方案
- **对话管理**：支持保存、加载、删除对话历史
- **一键导入导出**：轻松管理和分享思维导图

### 🎨 现代化 UI
- **响应式设计**：完美适配桌面和移动设备
- **深色/浅色主题**：舒适的视觉体验
- **流畅动画**：基于 Framer Motion 的优雅过渡效果
- **实时反馈**：优雅的提示和加载状态

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- npm 或 yarn 包管理器

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/ai-mapping.git
   cd ai-mapping
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制示例文件
   cp .env.local.example .env.local

   # 编辑 .env.local，添加必要的 API 密钥
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/ai-mapping
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

   访问 [http://localhost:3000](http://localhost:3000) 开始使用。

### Docker 部署（可选）

```bash
# 构建镜像
docker build -t ai-mapping .

# 运行容器
docker run -p 3000:3000 -e OPENROUTER_API_KEY=your-key ai-mapping
```

## 📦 技术栈

### 前端框架
- **Next.js 16** - React 全栈框架，支持 App Router
- **React 19** - 最新的 React 版本
- **TypeScript** - 类型安全的 JavaScript

### 可视化与交互
- **ReactFlow** - 强大的流程图和思维导图库
- **Framer Motion** - 流畅的动画库
- **Radix UI** - 无样式的高质量 UI 组件

### 状态管理与数据
- **Zustand** - 轻量级状态管理
- **MongoDB Atlas** - 云端 NoSQL 数据库
- **UUID** - 生成唯一标识符

### AI 集成
- **OpenRouter API** - 统一的 AI 模型访问接口
- **AI SDK (Vercel)** - 优化的 AI 集成工具

### 样式与 UI
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Lucide React** - 精美的图标库
- **React Markdown** - Markdown 渲染支持

## 🎯 使用指南

### 创建第一个思维导图

1. **开始对话**
   - 在首页输入你的问题或想法
   - 选择 AI 模型（推荐使用默认的 Google Gemini）

2. **探索分支**
   - 点击任意节点旁的 **+** 按钮添加新问题
   - 使用 **Tab** 键快速创建子节点

3. **组织思维**
   - 拖拽节点调整位置
   - 使用右下角的控制面板缩放和居中
   - 切换不同的布局模式查看效果

4. **保存进度**
   - 对话会自动保存
   - 点击右上角的 **Save** 手动保存
   - 通过 **Options** 菜单管理所有对话

### 高级功能

- **编辑节点内容**：双击任意节点编辑其内容
- **查看详细回复**：点击助手节点右侧的箭头展开完整回复
- **缩放和导航**：使用鼠标滚轮或控制面板调整视图
- **小地图导航**：右下角的小地图帮助快速定位

## 🔧 配置说明

### MongoDB Atlas 配置

1. 创建免费的 [MongoDB Atlas](https://www.mongodb.com/atlas) 账户
2. 创建免费集群（选择离你最近的区域）
3. 在 **Database Access** 创建数据库用户
4. 在 **Network Access** 添加 IP 地址（开发环境可使用 0.0.0.0/0）
5. 获取连接字符串并添加到环境变量

### OpenRouter API 配置

1. 注册 [OpenRouter](https://openrouter.ai) 账户
2. 获取 API 密钥
3. 添加到 `OPENROUTER_API_KEY` 环境变量

### 支持的 AI 模型

- Google Gemini Pro (免费)
- Claude 3.5 Sonnet
- DeepSeek Chat
- GPT-4 Turbo
- 以及更多...

## 🚀 部署指南

### Vercel 部署（推荐）

1. **连接 GitHub**
   - 将代码推送到 GitHub
   - 在 Vercel 导入项目

2. **配置环境变量**
   - 在 Vercel 项目设置中添加环境变量
   - 使用 Vercel CLI：`vercel env pull`

3. **自动部署**
   - 推送代码后自动触发部署
   - 获得一个自动配置的 HTTPS 域名

### 其他平台部署

项目支持部署到任何支持 Node.js 的平台：

- Netlify
- Railway
- DigitalOcean
- AWS Amplify
- 自建服务器

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

## 📝 开发计划

- [ ] 📱 移动端优化
- [ ] 👥 多用户支持和账户系统
- [ ] 🔄 实时协作功能
- [ ] 📊 数据分析和导出功能
- [ ] 🎨 更多主题和自定义选项
- [ ] 🔍 搜索和过滤功能
- [ ] 📎 文件和图片支持
- [ ] 🌐 多语言支持

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [ReactFlow](https://reactflow.dev/) - 强大的流程图库
- [OpenRouter](https://openrouter.ai/) - AI 模型聚合服务
- [MongoDB Atlas](https://www.mongodb.com/atlas) - 云端数据库服务
- [Vercel](https://vercel.com) - 优秀的部署平台

---

**享受使用 AI 对话思维导图！** 🚀

如果觉得这个项目有用，请给它一个 ⭐️！
