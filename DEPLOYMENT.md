# Deployment Guide (Vercel + Neon + Cloudflare R2)

## 1. Neon PostgreSQL

1. Create a Neon project and database.
2. Copy connection string as `DATABASE_URL`.
3. Set SSL mode in connection string if required by Neon (default already includes SSL).

## 2. Cloudflare R2

1. Create bucket (public read).
2. Create API token with object read/write.
3. Configure:
   - `R2_ENDPOINT`
   - `R2_BUCKET`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_PUBLIC_BASE_URL`
   - `R2_REGION=auto`

## 3. Vercel Environment Variables

Add the following from `.env.example`:

- `NODE_ENV=production`
- `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
- `DATABASE_URL=...`
- `AUTH_SECRET=...`
- `AUTH_TRUST_HOST=true`
- `AUTH_URL=https://your-domain.com`
- `UPLOAD_MAX_FILE_SIZE_MB=5`
- `RATE_LIMIT_WINDOW_MS=60000`
- `RATE_LIMIT_MAX_LOGIN=10`
- `RATE_LIMIT_MAX_COMMENT=6`
- `R2_*`

## 4. Prisma Migration in Production

Vercel build command example:

```bash
pnpm db:generate && pnpm db:deploy && pnpm build
```

## 5. Domain and HTTPS

1. Add custom domain in Vercel.
2. Configure DNS records.
3. Verify HTTPS is active.

## 6. Post-launch Checklist

- Login works
- `/admin` protected
- Create/edit/publish post works
- `/blog` only shows published posts
- Upload image works
- Comments create/manage works
- `/feed.xml`, `/sitemap.xml`, `/robots.txt` available
- Dynamic OG endpoint `/og/post/[slug]` returns image
- Search returns relevant results
- Dark mode toggle works
