# WGMA 2026 Tickets — Deployment Guide

## Quick Start (Drag & Drop Ready)

### Step 1: Extract This Folder
- Extract this entire folder to your local machine
- You now have everything needed for production

### Step 2: Push to Git
```bash
cd wgma-deploy-ready
git add .
git commit -m "Deploy WGMA 2026 ticket system with fixes"
git push
```

Render will auto-deploy when you push. Or manually restart in Render dashboard.

### Step 3: Verify Environment Variables in Render Dashboard

Go to Settings → Environment Variables and confirm these exist:
- `SENDGRID_API_KEY` — Your SendGrid API key
- `ORGANISER_EMAIL=kingdomain.ministries@gmail.com`
- `LYNK_HANDLE` — Your Lynk mobile money handle
- `DOMAIN=https://yourdomain.onrender.com` (update with your actual domain)
- `HANDYPAY_API_KEY` — Your HandyPay API key
- `HANDYPAY_WEBHOOK_SECRET` — Your webhook secret from HandyPay
- `ADMIN_KEY` — Your admin dashboard password
- `DATA_FILE=/var/data/orders.json` (Render persistent disk)

### Step 4: Restart the App
- Go to Render dashboard
- Click your service
- Click "Manual Deploy" or "Restart"
- Wait for restart to complete (1-2 minutes)

### Step 5: Test
1. Visit your site: `https://yourdomain.onrender.com`
2. You should see two ticket tier images (GA and VIP)
3. Click on one → goes to payment
4. Complete a test order to verify emails send

## What's Fixed

✓ Ticket images now display as tier selector buttons
✓ Ticket generation creates proper JPEG with QR code
✓ Emails send via SendGrid with embedded images
✓ Both GA and VIP tiers work with card and mobile money payments

## Files Included

- `server.js` — Main application (fixed)
- `ticket.js` — Ticket image generator (completely rewritten)
- `package.json` — Node dependencies
- `public/` — All web files (HTML + artwork images)

## If Images Still Don't Show

1. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Check browser DevTools → Network tab → verify images load
3. Check Render logs for any 404 errors
4. Verify `public/img/ticket-ga.jpg` and `public/img/ticket-vip.jpg` are in your git repo

## Support

Issues? Check:
- Render deployment logs
- Browser console for errors
- Render environment variables all set
- All files pushed to git (verify in your GitHub/git provider)

---

Ready to go. Just extract and push to git.
