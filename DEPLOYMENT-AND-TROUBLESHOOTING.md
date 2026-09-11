# WGMA 2026 Deployment & Troubleshooting Guide

## Issue Summary
Ticket tier selector images embedded as base64 data URIs are not displaying on the live site, even though:
- Images are complete and valid JPEG data
- HTML structure is correct
- CSS styling includes all necessary properties (aspect-ratio, object-fit, display:block)

## ⚠️ Critical: Did you deploy to Render?

If you haven't already, follow these steps **exactly**:

### Step 1: Push Changes to GitHub

Open Terminal in your project folder and run:

```bash
# Add all changes
git add .

# Commit with a message
git commit -m "deploy ticket images with base64 embedding"

# Push to GitHub (this triggers Render to redeploy)
git push origin main
```

**Watch for these messages:**
- ✓ `master -> master` or `main -> main` — Success, changes pushed
- ✗ `fatal: not a git repository` — Not a git repo; check you're in right folder
- ✗ `nothing to commit, working tree clean` — No changes to push

### Step 2: Wait for Render to Redeploy

After pushing:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your `wgma-2026-tickets` service
3. Look at the "Events" section
4. You should see a new deployment starting (gray circle with "In progress")
5. **Wait 30-60 seconds** for it to turn green (✓ Deployed)

⚠️ **If it stays red (✗ Deploy failed):**
- Click the failed deploy to see error logs
- Most common issues:
  - Missing `node_modules` packages (run `npm install` locally, then push `package-lock.json`)
  - Syntax errors in files (check terminal output)
  - Missing environment variables (check Settings → Environment)

### Step 3: Hard Refresh Your Browser

Simple refresh isn't enough — your browser cached the old version.

**On Desktop:**
- Mac: Press `Cmd + Shift + R` (or `Cmd + Option + R`)
- Windows/Linux: Press `Ctrl + Shift + R` (or `Ctrl + F5`)

**On Mobile:**
- iOS Safari: Settings → Safari → Clear History and Website Data, then reload
- Android Chrome: Menu → Settings → Privacy → Clear browsing data (Images, Cookies), then reload

---

## Testing: Use the Test Page

I've created a minimal test page to verify base64 images work:

1. **Deploy the test file** along with your other changes (it's already in `public/test-base64-image.html`)
2. **Visit the test page:**
   ```
   https://wgma-2026-tickets.onrender.com/test-base64-image.html
   ```
3. **What you should see:**
   - Two colored squares in the "Test 1" and "Test 2" sections
   - Green status messages saying "Image loaded successfully!"
   - If you see these, base64 rendering works ✓

4. **What if images don't appear on the test page:**
   - This means base64 images don't render at all (unusual, suggests browser issue)
   - Try a different browser (Firefox, Safari, Edge)
   - Try in an incognito/private window (eliminates extensions)
   - If it works in incognito, a browser extension is blocking images

---

## Verification: Is the New Code Actually Deployed?

If images still don't show after hard refresh, verify the new code is on Render:

### Option A: Browser DevTools Network Tab (Easiest)

1. Go to https://wgma-2026-tickets.onrender.com
2. Open DevTools: Press `F12` (Windows) or `Cmd + Option + I` (Mac)
3. Click the **Network** tab
4. Refresh the page with `F5` or `Cmd + R`
5. Click on `index.html` in the request list
6. Look at the "Response" tab
7. **Search for `data:image/jpeg`:**
   - If you find it → Your changes ARE deployed ✓ (issue is CSS/rendering)
   - If you don't find it → Your changes NOT deployed ✗ (push to GitHub again)

### Option B: View Page Source (Browser)

1. Go to https://wgma-2026-tickets.onrender.com
2. Right-click → "View Page Source"
3. Press `Ctrl + F` (Windows) or `Cmd + F` (Mac)
4. Search for `data:image/jpeg`
5. **If found:** Changes are deployed
6. **If NOT found:** Changes not deployed — push to GitHub now

### Option C: Check Render Logs (Most Detailed)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click `wgma-2026-tickets`
3. Click **Logs** tab
4. Look for most recent deployment
5. Should say: `Deployed successfully` at the end

---

## Troubleshooting Checklist

### Problem: Images still not showing after deployment

**Checklist:**
- [ ] Ran `git push origin main` (check GitHub to verify files updated)
- [ ] Render deployment completed (Dashboard shows green ✓ status)
- [ ] Hard refresh performed (Cmd+Shift+R, not just F5)
- [ ] Test page `/test-base64-image.html` loads images (if yes, issue is CSS)
- [ ] Checked DevTools → Network → index.html contains `data:image/jpeg`

**If all above pass, try:**

1. **Check browser console for errors:**
   - Press `F12` → Console tab
   - Look for red errors (ignore yellow warnings)
   - If you see errors, screenshot them

2. **Check if CSS is loading:**
   - Press `F12` → Elements/Inspector tab
   - Right-click on a ticket image → Inspect
   - Look for `style` attributes showing `width:100%`, `height:100%`
   - If styles missing, CSS file isn't loading

3. **Try a completely different browser:**
   - Chrome → Firefox → Safari → Edge
   - Sometimes one browser caches harder than others

4. **If only mobile has issues:**
   - This suggests responsive CSS problem
   - Add to CSS: `img { min-width: 100%; min-height: 100%; }`
   - Or increase padding in `.image-container`

### Problem: Images show locally but not on Render

**This means deployment didn't happen.** Go back to Step 1 and verify:
- GitHub repository has your changes (visit github.com/your-repo)
- `public/index.html` file size is ~44KB (original was 8KB)
- `package.json` has `jimp` and `qrcode` dependencies

### Problem: Images appear broken/scrambled

- Base64 data got corrupted during embed
- Solution: Regenerate images by running:
  ```bash
  node generate-artwork.js
  ```
- Then re-embed by running the embedding script (if one exists)

---

## File Locations Reference

```
wgma-2026-deploy/
├── public/
│   ├── index.html              ← Ticket selector with embedded images
│   ├── test-base64-image.html  ← Testing page (visit after deployment)
│   └── img/
│       ├── ticket-ga.jpg       ← GA ticket artwork
│       └── ticket-vip.jpg      ← VIP ticket artwork
├── server.js                   ← Node.js Express server
├── ticket.js                   ← Ticket generation (has buildTicket function)
├── .env.example                ← Copy to .env and add your keys
├── package.json
└── FIXES-APPLIED.md           ← All fixes from previous session
```

---

## Quick Commands Reference

```bash
# Check git status
git status

# See changes ready to commit
git diff

# See commits
git log --oneline -5

# Undo last commit (if needed)
git reset --soft HEAD~1

# Push to Render
git push origin main

# Check what's on GitHub
# Visit: https://github.com/YOUR-USERNAME/YOUR-REPO
```

---

## Still Having Issues?

If images still don't show after all troubleshooting:

1. **Paste the complete error** from browser console
2. **Screenshot** what you see (or don't see)
3. **Check Render logs** for any errors
4. **Verify all environment variables** are set in Render Settings

The base64 embedding is solid — if it's not working, it's almost always one of:
- Code not pushed to GitHub
- Render didn't redeploy yet
- Browser cache still showing old version
- JavaScript console error blocking everything

---

**Status:** Images are ready to deploy. Follow the deployment steps above.
