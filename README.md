# Wanfeng Blog Web

Next.js(App Router) + React + TypeScript + Tailwind CSS 全栈个人博客模板，包含：

- 公开站点（首页/博客列表/文章详情/关于/项目）
- 管理后台（文章/标签/资源/设置）
- 登录鉴权（Auth.js Credentials + 角色控制）
- PostgreSQL + Prisma 数据层
- SEO / RSS / Sitemap / 动态 OG
- 评论系统、上传系统、搜索、测试与部署基建

## 1. 初始化与开发

```bash
pnpm create next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
pnpm install
pnpm dev
```

访问：

- `/`
- `/blog`
- `/blog/[slug]`（示例：`/blog/nextjs-app-router-quan-zhan-bo-ke-shi-jian`）
- `/about`
- `/projects`
- `/login`
- `/admin`（需 ADMIN）
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`

## 2. 数据库（Postgres + Prisma）

### A. Docker（推荐）

```bash
docker compose up -d
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:search-index
```

### B. 本机安装

本地安装 PostgreSQL 16+ 后，将 `.env` 中 `DATABASE_URL` 改为本机连接串，再执行同样 Prisma 命令。

## 3. 账号与权限

- 种子管理员：`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- 默认策略：仅管理员创建新用户（`/admin/settings`）
- 权限拦截：
  - 未登录访问 `/admin` -> `/login`
  - 非 ADMIN -> `/forbidden`
- 所有写操作都在服务端校验权限（Route Handlers）

## 4. 上传与图片

- 开发环境：保存到 `public/uploads`
- 生产环境：Cloudflare R2（S3 兼容）
- 上传接口：`POST /api/upload`（ADMIN + MIME + 大小校验）

## 5. 搜索

- API：`GET /api/search?q=关键词&page=1&pageSize=10`
- 后端：Postgres `to_tsvector + websearch_to_tsquery`
- 索引 SQL：`prisma/sql/search-index.sql`

## 6. 质量保障

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

### 覆盖范围

- 单测：Blog server 查询函数 + UI Button
- E2E：登录 -> 后台发布 -> 前台可见

### 性能建议

- 优先 Server Components，交互才使用 `use client`
- 列表页 `revalidate=60`，详情页 `revalidate=300`
- 上传图片统一经 `next/image` 渲染
- 避免在客户端加载整篇文章正文数据

### CI

已提供 `.github/workflows/ci.yml`，包含：

- PostgreSQL service
- Prisma migrate + seed
- lint + typecheck + unit test

## 7. 生产部署（Vercel + Neon + R2）

1. 在 Neon 创建 Postgres，获取连接串写入 Vercel `DATABASE_URL`
2. 在 Cloudflare R2 创建 bucket，填入 R2 相关环境变量
3. 在 Vercel 配置：
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_SITE_URL`
   - `DATABASE_URL`
   - `R2_*`
4. 构建前确保执行：
   - `pnpm db:generate`
   - `pnpm db:deploy`
5. 部署后验证：
   - 登录/后台/发布链路
   - RSS/Sitemap/OG
   - 搜索与暗黑模式

## 8. 关键目录

```text
src/
  app/                         # App Router 路由、SEO 路由、API 路由
  components/                  # 通用组件与 Provider
  features/
    blog/                      # 博客查询、详情渲染、评论区
    auth/                      # 登录 UI
    admin/                     # 后台组件与服务端逻辑
    search/                    # 即时搜索组件
    theme/                     # 主题切换
  lib/
    db.ts                      # Prisma 单例
    auth/guards.ts             # 权限守卫
    markdown/render.tsx        # Markdown 渲染与高亮
    utils/*                    # slug、toc、限流、API 响应
prisma/
  schema.prisma
  seed.ts
  sql/search-index.sql
```

## 9. 提交规范

- `pre-commit`: `lint-staged`
- `commit-msg`: `commitlint`
- Conventional Commits: `feat:`, `fix:`, `chore:`...
