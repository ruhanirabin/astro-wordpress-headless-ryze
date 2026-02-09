# Astro Headless WordPress Deployment Guide

## Overview

This project builds a **static** Astro site (`output: "static"`) that consumes WordPress via the REST API at build time. Netlify is the primary target, but any static host works as long as it serves `dist/` and supports redirects and headers.

Key behaviors to keep intact:
- **Headless WordPress** via REST API
- **Build-time image caching** to `public/wp-images` (so the site still renders if WordPress is down)
- **/blog → /archive redirects** in both Astro middleware and Netlify

## Pre-Deployment Checklist

### Code and Content
- [ ] WordPress REST API reachable and returns expected content
- [ ] Build completes locally (`npm run build`)
- [ ] Preview works (`npm run preview`)
- [ ] Image caching writes to `public/wp-images`
- [ ] RSS and sitemap generation verified
- [ ] `/blog` redirects to `/archive` in dev and production

### Secrets and Environment
- [ ] `.env` is **not** committed
- [ ] No credentials are logged in build output
- [ ] Required environment variables set in the host

## Environment Variables (Authoritative)

Required:
- `WORDPRESS_API_URL` (example: `https://example.com/wp-json/wp/v2`)
- `SITE_URL`
- `SITE_TITLE`
- `SITE_DESCRIPTION`
- `SITE_AUTHOR`

Optional:
- `WORDPRESS_USERNAME`, `WORDPRESS_PASSWORD` (Basic Auth; use Application Passwords)
- `SITE_KEYWORDS`, `TWITTER_HANDLE`, `DEFAULT_OG_IMAGE`
- `GOOGLE_ANALYTICS_ID`, `GOOGLE_TAG_MANAGER_ID`
- `CACHE_TIMEOUT`

## Netlify Deployment (Primary)

### 1. Build Settings
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: `22`

Netlify typically runs `npm ci && npm run build`.

### 2. Environment Variables
Set these in **Site settings → Environment variables**. Use the authoritative list above. Example:

```bash
WORDPRESS_API_URL=https://your-wordpress-site.com/wp-json/wp/v2
WORDPRESS_USERNAME=your-username
WORDPRESS_PASSWORD=your-app-password
SITE_URL=https://your-domain.netlify.app
SITE_TITLE=Your Site
SITE_DESCRIPTION=Your site description
SITE_AUTHOR=Your Name
CACHE_TIMEOUT=900
```

### 3. Redirects and Headers
Netlify rules are in `netlify.toml`. Ensure these remain correct:
- `/blog/* → /archive/:splat` (301)
- Security headers and long-cache asset headers

### 4. Image Caching Output
Build-time image caching writes to `public/wp-images`. Verify that the build output includes `dist/wp-images`.

### 5. Optional: Netlify Build Hook from WordPress
If you trigger builds from WordPress on content changes, use a Netlify build hook. Do not hardcode credentials in code. Use a secret or settings page in WordPress.

## Vercel Deployment (Static)

Vercel can host the static `dist/` output. Configure:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Node version**: `22`

Make sure to implement redirects for:
- `/blog/* → /archive/:splat`
- `/feed/ → /rss.xml`
- `/wp-admin/*` and `/wp-content/*` if you want to forward legacy paths

## Cloudflare Pages Deployment (Static)

Cloudflare Pages can host the static `dist/` output. Configure:
- **Build command**: `npm run build`
- **Output directory**: `dist`

Add redirect and header rules equivalent to the Netlify configuration.

## Self-Hosted Deployment (Static)

Because the site is static, you can serve `dist/` with any static web server. Example (Nginx):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/astro-headless/dist;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /blog/ {
        return 301 /archive$request_uri;
    }

    location /feed/ {
        return 301 /rss.xml;
    }

    location / {
        try_files $uri $uri/ /404.html;
    }
}
```

## CI/CD (GitHub Actions)

Use Node **22**, run `npm ci`, then `npm run build`. Example:

```yaml
name: Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          WORDPRESS_API_URL: ${{ secrets.WORDPRESS_API_URL }}
          WORDPRESS_USERNAME: ${{ secrets.WORDPRESS_USERNAME }}
          WORDPRESS_PASSWORD: ${{ secrets.WORDPRESS_PASSWORD }}
          SITE_URL: ${{ secrets.SITE_URL }}
          SITE_TITLE: ${{ secrets.SITE_TITLE }}
          SITE_DESCRIPTION: ${{ secrets.SITE_DESCRIPTION }}
          SITE_AUTHOR: ${{ secrets.SITE_AUTHOR }}
```

## Domain Configuration

Example DNS records:

```
Type    Name    Value                         TTL
A       @       Your-Server-IP                300
CNAME   www     your-domain.com               300
```

If your provider supports ALIAS/ANAME at the root, use it instead of `A` for host-managed deployments.

## Troubleshooting

- **Build fails on WordPress fetch**: verify `WORDPRESS_API_URL` and network access. Check for 4xx/5xx.
- **Images missing**: confirm `dist/wp-images` exists and the cache path rewrite is working.
- **/blog not redirecting**: verify `src/middleware.ts` and `netlify.toml` are in sync.
- **SEO tags missing**: verify site metadata env vars are set.
