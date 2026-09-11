# WGMA 2026 Tickets — Deployment Guide

## Quick Start

1. Extract this folder
2. Push to git:
   ```bash
   git add .
   git commit -m "Deploy WGMA 2026 with image fix"
   git push
   ```
3. Render auto-deploys (or restart manually)
4. Hard refresh your browser (Cmd+Shift+R)

## Verify Environment Variables in Render

Settings → Environment Variables:
- `SENDGRID_API_KEY`
- `ORGANISER_EMAIL=kingdomain.ministries@gmail.com`
- `LYNK_HANDLE`
- `DOMAIN=https://yourdomain.onrender.com`
- `HANDYPAY_API_KEY`
- `HANDYPAY_WEBHOOK_SECRET`
- `ADMIN_KEY`
- `DATA_FILE=/var/data/orders.json`

All set? Images should now display on the ticket selector.
