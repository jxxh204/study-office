# Railway Deployment Instructions

## Prerequisites
- Railway CLI installed: `npm install -g @railway/cli`
- Railway account: https://railway.app/

## Step 1: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

## Step 2: Initialize Railway Project

```bash
cd server
railway init
```

Follow the prompts:
- Create a new project or link to existing one
- Name it something like "study-office-server"

## Step 3: Deploy

```bash
railway up
```

This will build and deploy your server. Wait for the deployment to complete.

## Step 4: Get Your Server URL

```bash
railway domain
```

If no domain exists, create one:
```bash
railway domain --generate
```

Your URL will look like: `https://study-office-server-production.up.railway.app`

## Step 5: Set Environment Variables (Optional)

If you need to add specific CORS origins:

```bash
railway variables set ALLOWED_ORIGINS="https://your-client.vercel.app,https://another-domain.com"
```

## Step 6: Update Client Environment

After deployment, update your client's environment variable:

```bash
cd ../client

# For Vercel
vercel env add VITE_SERVER_URL production
# When prompted, enter your Railway URL: https://study-office-server-production.up.railway.app

# Then redeploy
vercel --prod
```

## Monitoring & Logs

View logs in real-time:
```bash
railway logs
```

Check deployment status:
```bash
railway status
```

## Troubleshooting

If deployment fails:
1. Check logs: `railway logs`
2. Verify package.json has "start" script: `npm start`
3. Ensure Node version is specified in package.json engines
4. Check Railway dashboard for detailed error messages

## Alternative: Deploy via Railway Web UI

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Select "server" as root directory
6. Railway will auto-detect and deploy
7. Add a domain from the settings

## Cost

Railway offers $5 free credit per month for hobby tier, which is usually enough for small projects.

## Next Steps

After successful deployment:
1. ✅ Server is running on Railway
2. ✅ Update client VITE_SERVER_URL
3. ✅ Test WebRTC connections
4. ✅ Monitor logs for any issues
