# Server Deployment Guide

## Option 1: Railway (Recommended)

1. Install Railway CLI (if not already):
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   cd server
   railway login
   railway init
   railway up
   ```

3. Get your deployed URL:
   ```bash
   railway domain
   ```

## Option 2: Render

1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Name: `study-office-server`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
5. Click "Create Web Service"

## Option 3: Manual Railway (Web UI)

1. Go to https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repo and select `server` directory
5. Railway will auto-detect the Procfile and deploy

## After Deployment

1. Copy your deployed server URL (e.g., `https://study-office-server.up.railway.app`)

2. Update Vercel environment variable:
   ```bash
   cd ../client
   vercel env add VITE_SERVER_URL production
   # Paste your server URL when prompted
   ```

3. Redeploy the client:
   ```bash
   vercel --prod
   ```

## Update CORS

Don't forget to update the server's CORS origins in `src/index.ts` to include your deployed client URL!

```typescript
cors: {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://your-client-url.vercel.app'  // Add this
  ],
  methods: ['GET', 'POST'],
},
```
