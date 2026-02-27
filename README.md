<div align="center">
  <!-- 替换此处的 img src 为你项目实际的精美封面图 -->
  <img src="https://via.placeholder.com/1440x810/f3f4f6/3b82f6?text=Wanfeng+Blog+CMS" width="100%" alt="项目封面"/>
</div>

<h1 align="center">🐟 现代化个人博客与 CMS</h1>

<p align="center">
  <strong>基于最新 Web 技术栈构建的现代化、响应式个人博客与内容管理系统 | 极光、高效、沉浸式</strong>
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" /></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="https://playwright.dev/"><img src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" /></a>
</p>

这是一个**基于最新 Web 技术栈构建**的现代化、响应式个人博客与内容管理系统（CMS）。

不仅为你提供了支持 Markdown 渲染的极佳阅读体验，还集成了完整的用户互动生态与强大的可视化数据后台，致力于帮助内容创作者轻松构建属于自己的网络空间并享受极客般的体验。

## 🌐 Translations

[English](./README-en.md) | [简体中文](./README.md)

---

## 🛠️ 核心技术栈

- **框架**: [Next.js (App Router)](https://nextjs.org/), React, TypeScript
- **数据库与 ORM**: PostgreSQL + [Prisma](https://www.prisma.io/)
- **样式与 UI**: [Tailwind CSS](https://tailwindcss.com/)
- **身份验证与安全**: NextAuth.js
- **部署与 DevOps**: Docker, Docker Compose, GitHub Actions (CI/CD)
- **测试**: Playwright (E2E 端到端测试)

## ✨ 核心功能亮点

### 🎨 前台展示 (Frontend)
- **📝 文章阅读**: 支持灵活的 Markdown 渲染，提供沉浸式的博客文章阅读体验。
- **💼 项目展示**: 专属的个人项目（Projects）展示页面，轻松打造个人作品集。
- **🤝 友情链接**: 支持友情链接（Friend Links）的申请与展示。
- **🎵 全局沉浸**: 网站内置全局背景音乐播放器（BGM），带给用户持续的听觉享受。
- **🌓 个性化设定**: 支持暗黑/明亮（Dark/Light）双主题无缝平滑切换。
- **🌍 国际化**: 原生支持多语言切换（i18n），面向全球读者。
- **🔍 快捷搜索**: 高效的站内全文搜索功能。

### 👥 用户互动系统 (User Interaction)
- **🔐 账号体系**: 提供完整的用户注册、登录、密码重置安全流程。
- **📊 独立看板**: 注册用户拥有独立的用户仪表盘（Dashboard）管理个人数据。
- **❤️ 内容互动**: 用户可以对文章进行点赞（Like）、收藏（Favorite）、评论（Comment），并记录真实浏览量。

### 👑 后台管理 (Admin)
- **📈 数据监控**: 强大且直观的可视化数据看板，实时了解网站动态。
- **✍️ 内容管理**: 管理员可以全面管理文章（内置 Markdown 编辑器及突破性的图片上传功能）、分类目录、标签与项目列表。
- **⚙️ 系统设置**: 支持网站注册用户管理、背景音乐库管理及网站全局动态配置。
- **🛡️ 安全审计**: 附带安全警报日志监控，确保系统稳定安全运行。

### 🔧 工程化规范 (Engineering)
- **统一规范**: 配置了完善的 `ESLint` 和 `Prettier` 代码检查与格式化。
- **提交流程**: 结合 `Husky` (Git hooks) 和 `Commitlint` 保证代码提交质量与风格一致性。

---

## 🚀 快速开始

### 1. 初始化项目

```bash
pnpm install
```

### 2. 数据库配置 (优先推荐使用 Docker)

```bash
# 启动 PostgreSQL 容器
docker compose up -d

# 复制或配置环境变量
cp .env.example .env

# 执行 Prisma 数据迁移与初始化
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:search-index
```

### 3. 启动开发服务器

```bash
pnpm dev
```
访问 `http://localhost:3000` 即可预览前台网站。访问管理员后台 `/admin` 时请使用初始化期间 `SEED_ADMIN_EMAIL` 相关的邮箱账户进行安全登录验证。

---

## 🧪 测试与质量保障

项目工程化配置了完善的自动化测试基建：

```bash
pnpm lint         # 运行 ESLint 代码规范检查
pnpm typecheck    # 运行 TypeScript 类型静态检查
pnpm test         # 运行单元测试
pnpm test:e2e     # 运行 Playwright E2E 完整链路自动化测试
```

---

<div align="center">
  <p>Made with ❤️</p>
</div>
