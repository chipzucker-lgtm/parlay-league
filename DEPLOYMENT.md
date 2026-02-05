# Deployment Guide - Parlay League Manager

## Quick Deploy Options (Easiest to Hardest)

### 1. Deploy to Vercel (⭐ RECOMMENDED - Easiest)

**Time: 5 minutes**

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/parlay-league.git
   git push -u origin main
   ```

2. Go to https://vercel.com and sign in with GitHub

3. Click "New Project" → Import your repository

4. Vercel auto-detects React/Vite settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Click "Deploy"

6. **Done!** Share your URL: `your-app.vercel.app`

**Adding Environment Variables (for API keys):**
- In Vercel dashboard → Settings → Environment Variables
- Add: `VITE_ODDS_API_KEY` = your API key
- Redeploy

---

### 2. Deploy to Netlify

**Time: 5 minutes**

1. Push code to GitHub (same as above)

2. Go to https://netlify.com → "Add new site" → "Import from Git"

3. Select your repository

4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`

5. Click "Deploy site"

6. **Done!** URL: `your-app.netlify.app`

**Custom Domain:**
- Settings → Domain management → Add custom domain

---

### 3. Deploy to GitHub Pages (Free)

**Time: 10 minutes**

1. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Update `package.json`:
   ```json
   {
     "homepage": "https://YOUR_USERNAME.github.io/parlay-league",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Update `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: '/parlay-league/',
     plugins: [react()],
   });
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Enable GitHub Pages:
   - Repo → Settings → Pages
   - Source: gh-pages branch

6. **Done!** URL: `https://YOUR_USERNAME.github.io/parlay-league`

---

### 4. Deploy to AWS (With Backend)

**Time: 30-60 minutes**

For when you need:
- User authentication
- Database for picks
- Scheduled jobs for auto-checking
- Email notifications

**Architecture:**
- Frontend: AWS S3 + CloudFront (or Amplify)
- Backend: AWS Lambda + API Gateway
- Database: DynamoDB or RDS
- Auth: Cognito
- Scheduled Jobs: EventBridge

**Steps:**

1. **Deploy Frontend to S3:**
   ```bash
   npm run build
   aws s3 sync dist/ s3://your-bucket-name --acl public-read
   ```

2. **Setup CloudFront** for HTTPS and caching

3. **Create Lambda Functions:**
   - `savePicks` - Store user picks
   - `getPicks` - Retrieve picks for display
   - `checkResults` - Fetch scores and determine winners
   - `sendNotifications` - Email winners

4. **Setup API Gateway** to expose Lambda functions

5. **Create DynamoDB Tables:**
   - `picks` - Store all picks
   - `games` - Store game odds
   - `results` - Store weekly results

6. **Setup EventBridge** to auto-run `checkResults` Sunday night

**Estimated AWS Costs:**
- Free tier: $0
- With traffic: ~$5-20/month

---

### 5. Deploy to Your Own Server (VPS)

**Time: 1-2 hours**

**Requirements:**
- VPS (DigitalOcean, Linode, AWS EC2)
- Domain name
- Basic Linux knowledge

**Steps:**

1. **Get a VPS:**
   - DigitalOcean Droplet: $6/month
   - Ubuntu 22.04 LTS

2. **Setup Server:**
   ```bash
   # SSH into server
   ssh root@your-server-ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   
   # Install Nginx
   apt install -y nginx
   
   # Install PM2 (process manager)
   npm install -g pm2
   ```

3. **Clone and Build:**
   ```bash
   cd /var/www
   git clone https://github.com/YOUR_USERNAME/parlay-league.git
   cd parlay-league
   npm install
   npm run build
   ```

4. **Configure Nginx:**
   ```bash
   nano /etc/nginx/sites-available/parlay-league
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       root /var/www/parlay-league/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

5. **Enable Site:**
   ```bash
   ln -s /etc/nginx/sites-available/parlay-league /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

6. **Setup SSL with Let's Encrypt:**
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

7. **Auto-deploy on push** (optional):
   - Setup webhook
   - Create deploy script
   - Configure GitHub Actions

**Done!** Access at: `https://your-domain.com`

---

## Comparing Options

| Platform | Cost | Speed | Scale | Best For |
|----------|------|-------|-------|----------|
| Vercel | Free | ⚡⚡⚡ | ♾️ | Quick deploy, no backend |
| Netlify | Free | ⚡⚡⚡ | ♾️ | Quick deploy, forms |
| GitHub Pages | Free | ⚡⚡ | ♾️ | Open source projects |
| AWS | $5-50/mo | ⚡⚡ | ♾️ | Full control, backend |
| VPS | $6+/mo | ⚡ | ⚠️ | Learning, custom setup |

---

## Environment Variables

Create `.env` file in project root:

```env
VITE_ODDS_API_KEY=your_odds_api_key_here
VITE_ENABLE_FIREBASE=true
VITE_FIREBASE_API_KEY=your_firebase_key
```

**⚠️ IMPORTANT:** 
- Never commit `.env` to GitHub
- Add to `.gitignore`:
  ```
  .env
  .env.local
  ```

---

## Custom Domain Setup

### Vercel:
1. Vercel Dashboard → Settings → Domains
2. Add domain: `parlay.yourdomain.com`
3. Update DNS (Vercel provides instructions)
4. Wait 5-10 minutes for propagation

### Netlify:
1. Site settings → Domain management
2. Add custom domain
3. Update DNS with Netlify nameservers
4. Auto-SSL enabled

---

## Monitoring & Analytics

### Add Google Analytics:

In `index.html`:
```html
<head>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

### Error Tracking (Sentry):

```bash
npm install @sentry/react
```

In `main.jsx`:
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

---

## Backup & Recovery

### Regular Backups:

1. **Database Backups** (if using Firebase/AWS):
   - Enable automatic daily backups
   - Export weekly to cloud storage

2. **Code Backups**:
   - GitHub automatically backs up code
   - Use protected branches

3. **User Data**:
   - Export picks weekly to CSV
   - Store in Google Drive/Dropbox

---

## Support & Maintenance

### Weekly Checklist:
- [ ] Upload new odds CSV
- [ ] Check all users submitted picks
- [ ] Lock picks before games start  
- [ ] Run results check after games
- [ ] Announce winners to group
- [ ] Export results for records

### Monthly Checklist:
- [ ] Check API quota usage
- [ ] Review error logs
- [ ] Update dependencies: `npm update`
- [ ] Backup all data
- [ ] Check hosting costs

---

## Troubleshooting Deployment

**Build fails:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

**404 errors on refresh:**
- Configure SPA fallback routing
- Vercel/Netlify: Auto-configured
- Nginx: Add `try_files $uri /index.html`

**API calls fail:**
- Check CORS settings
- Verify API keys in environment variables
- Check network tab in browser DevTools

**Slow loading:**
- Enable CDN
- Optimize images
- Enable gzip compression
- Use code splitting

---

## Need Help?

1. Check browser console for errors
2. Review deployment logs in hosting platform
3. Test locally: `npm run dev`
4. Check API status pages
5. Review GitHub issues for similar problems

Good luck with your deployment! 🚀
