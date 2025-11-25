# Deployment Guide - Vercel

Vercel is the recommended deployment platform for this Next.js application. It provides excellent support for Next.js, static file serving (including the Farcaster manifest), and environment variables.

## ✅ Why Vercel?

- **Next.js Optimized**: Built specifically for Next.js applications
- **Static File Serving**: Automatically serves files from `public/` directory, including `/.well-known/farcaster.json`
- **Environment Variables**: Easy management through dashboard
- **Automatic Deployments**: Deploys on every push to main branch
- **HTTPS**: Automatic SSL certificates (required for Farcaster manifest)
- **Global CDN**: Fast access worldwide

## 🚀 Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Your Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub/GitLab repository
   - Vercel will auto-detect Next.js

2. **Configure Project Settings**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (root)
   - **Build Command**: `pnpm build` (or `npm run build`)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install` (or `npm install`)

3. **Set Environment Variables**
   In the Vercel dashboard, add these environment variables:
   
   ```bash
   # Site Configuration
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   
   # Web3 Configuration
   NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
   NEXT_PUBLIC_RPC_URL_ALT=https://base-sepolia-rpc.publicnode.com
   NEXT_PUBLIC_CHAIN_ID=84532
   
   # NFT Contract
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xE7c0f3beD50675521E0ecd24d2bb66f2480237a8
   
   # Game Rewards Contract
   NEXT_PUBLIC_GAME_REWARDS_ADDRESS=0x0152B904AEbA835F2A14B834056b2c76d11CBC56
   
   # DEGEN Token Address
   NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS=your_degen_token_address
   
   # Reward Configuration
   NEXT_PUBLIC_DEGEN_REWARD_PER_HAT=1000000000000000000
   
   # Backend/Server-side (Server-side only - not exposed to client)
   VERIFIER_PRIVATE_KEY=your_verifier_private_key
   NEYNAR_API_KEY=your_neynar_api_key
   ALCHEMY_API_KEY=your_alchemy_api_key (optional)
   ```

   **Important**: 
   - Mark `VERIFIER_PRIVATE_KEY` as "Server-side only" (not exposed to client)
   - `NEXT_PUBLIC_*` variables are exposed to the client
   - Other variables are server-side only

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

5. **Update Site URL**
   - After deployment, update `NEXT_PUBLIC_SITE_URL` with your actual Vercel domain
   - Or use a custom domain (see below)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Set environment variables when prompted

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SITE_URL
   vercel env add NEXT_PUBLIC_RPC_URL
   # ... add all other variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## 🔧 Post-Deployment Configuration

### 1. Update Farcaster Manifest

After deployment, update `public/.well-known/farcaster.json`:

1. Replace all `yourdomain.com` with your Vercel domain (or custom domain)
2. Update image URLs to use your Vercel domain
3. Generate `accountAssociation` at https://farcaster.xyz/~/developers/mini-apps/manifest
4. Commit and push changes
5. Vercel will auto-deploy

### 2. Verify Manifest Accessibility

After deployment, verify:
```bash
curl https://your-app.vercel.app/.well-known/farcaster.json
```

Should return valid JSON.

### 3. Register Manifest with Farcaster

1. Go to https://farcaster.xyz/~/developers/mini-apps/manifest
2. Enter your Vercel domain
3. Sign with your Farcaster account
4. Verify green checkmark appears

## 🌐 Custom Domain (Optional)

If you want a custom domain instead of `*.vercel.app`:

1. **In Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   - Update `NEXT_PUBLIC_SITE_URL` to your custom domain
   - Update manifest file with custom domain

3. **Update Manifest**:
   - Regenerate `accountAssociation` with custom domain
   - Update all URLs in `farcaster.json`

## 📋 Pre-Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] `NEXT_PUBLIC_SITE_URL` points to your deployment domain
- [ ] Manifest file (`public/.well-known/farcaster.json`) updated with correct domain
- [ ] All image URLs in manifest point to accessible images
- [ ] `accountAssociation` generated and added to manifest
- [ ] Test build locally: `pnpm build`
- [ ] Verify manifest is accessible after deployment
- [ ] Register manifest with Farcaster

## 🔍 Troubleshooting

### Manifest Not Accessible

**Issue**: `/.well-known/farcaster.json` returns 404

**Solution**:
- Ensure file is in `public/.well-known/farcaster.json`
- Vercel automatically serves files from `public/` directory
- Check file is committed and pushed to repository
- Verify file path is exactly `/.well-known/farcaster.json` (not `/.well-known/farcaster.json/`)

### Environment Variables Not Working

**Issue**: Variables not available in app

**Solution**:
- Ensure `NEXT_PUBLIC_*` prefix for client-side variables
- Redeploy after adding new environment variables
- Check Vercel dashboard → Settings → Environment Variables
- Verify variables are set for correct environment (Production, Preview, Development)

### Build Errors

**Issue**: Build fails on Vercel

**Solution**:
- Check build logs in Vercel dashboard
- Ensure `package.json` has correct build script
- Verify Node.js version (Vercel auto-detects, but can be set in settings)
- Check for TypeScript errors (currently ignored in `next.config.mjs`)

### Farcaster SDK Not Working

**Issue**: SDK not initializing in production

**Solution**:
- Verify HTTPS is enabled (Vercel provides this automatically)
- Check browser console for errors
- Ensure `sdk.actions.ready()` is being called
- Verify you're testing in actual Farcaster miniapp (not just web browser)

## 🚀 Continuous Deployment

Vercel automatically deploys on every push to your main branch:

1. Push to `main` branch
2. Vercel detects changes
3. Builds and deploys automatically
4. Preview deployments for pull requests

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

## ✅ Recommended Vercel Settings

In your Vercel project settings:

- **Node.js Version**: 18.x or 20.x (auto-detected)
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install` (or `npm install`)
- **Framework Preset**: Next.js

Your project is already configured for Vercel! Just connect your repository and deploy.

