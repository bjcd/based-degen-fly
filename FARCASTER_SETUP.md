# Farcaster Mini App Integration - Setup Guide

This document outlines the Farcaster Mini App integration that has been implemented and what you need to configure.

## ✅ What's Been Implemented

### 1. SDK Initialization
- ✅ Installed `@farcaster/miniapp-sdk` and `@farcaster/miniapp-wagmi-connector`
- ✅ Updated `Web3Provider` to initialize Farcaster SDK and call `sdk.actions.ready()` to dismiss splash screen
- ✅ Updated `wagmi` config to include Farcaster miniapp connector as the first connector (for auto-connect)
- ✅ Added fallback RPC URLs for better reliability

### 2. Farcaster Utilities
- ✅ Created `lib/farcaster.ts` with utility functions:
  - `isInFarcasterEnvironment()` - Check if running in Farcaster
  - `getFarcasterContext()` - Get user context (FID, username, etc.)
  - `getFarcasterEthereumProvider()` - Get Ethereum provider
  - `getFidFromUrl()` - Get FID from URL params (for testing)
  - `composeCast()` - Share the app via Farcaster casts

### 3. Manifest File
- ✅ Created `public/.well-known/farcaster.json` template
- ⚠️ **ACTION REQUIRED**: You need to:
  1. Replace `yourdomain.com` with your actual domain
  2. Generate `accountAssociation` using Farcaster's manifest tool
  3. Update all image URLs to point to your actual domain

### 4. Embed Metadata
- ✅ Updated `app/layout.tsx` with `fc:miniapp` meta tag for Farcaster embeds
- ✅ Added Open Graph metadata for better sharing
- ⚠️ **ACTION REQUIRED**: Update `NEXT_PUBLIC_SITE_URL` in `.env.local` with your actual domain

### 5. Integration Updates
- ✅ Updated `lib/web3/neynar.ts` to use the new Farcaster utilities
- ✅ Updated `ENV_SETUP.md` with site URL configuration

## 🔧 Configuration Steps

### Step 1: Set Your Site URL

Add to your `.env.local`:
```bash
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Step 2: Generate Manifest Account Association

1. Go to https://farcaster.xyz/~/developers/mini-apps/manifest
2. Enter your domain
3. Sign with your Farcaster account
4. Copy the generated `accountAssociation` JSON
5. Paste it into `public/.well-known/farcaster.json`

The `accountAssociation` should look like:
```json
{
  "header": "eyJmaWQiOjE3MDY0LCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4ZkYwN0Q5REYzZjY4YUYwMDExYjg5NTVlNEQ1NTM1OTYyREE4NTQzMCJ9",
  "payload": "eyJkb21haW4iOiJ3d3cudGhlYmFzZWRkZWdlbnMueHl6In0",
  "signature": "jcOlPel7xPAAW7H/PJ00/Oo5Q4QC0MbKDYDCwkfoTxUskJnUwaPrWzBoOP3AHa6+S1/bjcle9Lix3xGNiolrPRs="
}
```

### Step 3: Update Manifest URLs

In `public/.well-known/farcaster.json`, replace all instances of:
- `https://yourdomain.com` → Your actual domain
- Update image URLs to point to your actual hosted images
- Ensure all images are accessible and return proper `image/*` headers

### Step 4: Register Your Manifest

1. Go to https://farcaster.xyz/~/developers/mini-apps/manifest
2. Enter your domain
3. The tool will verify your manifest is accessible
4. Sign with your Farcaster account to associate the domain
5. Confirm the green checkmark appears (manifest is registered)

### Step 5: Verify Manifest Accessibility

After deployment, verify:
```bash
curl https://yourdomain.com/.well-known/farcaster.json
```

Should return valid JSON with your manifest.

## 🧪 Testing

### Test in Farcaster Client
1. Open your app in Warpcast
2. Verify the splash screen dismisses automatically
3. Verify wallet auto-connects
4. Verify FID is retrieved correctly

### Test Manifest
1. Go to https://farcaster.xyz/~/developers/mini-apps/manifest
2. Enter your domain
3. Verify it shows as registered

### Test Embed
1. Go to https://farcaster.xyz/~/developers/mini-apps/embed
2. Enter a URL from your app
3. Verify it renders as a card

### Test Sharing
1. Use `composeCast()` function in your app
2. Share a URL
3. Verify it renders as a card in Farcaster

## 📝 Key Files Modified

- `lib/web3/config.ts` - Added Farcaster connector
- `components/providers/Web3Provider.tsx` - Added SDK initialization
- `lib/farcaster.ts` - New utility functions
- `app/layout.tsx` - Added embed metadata
- `public/.well-known/farcaster.json` - Manifest file
- `lib/web3/neynar.ts` - Updated to use new utilities
- `ENV_SETUP.md` - Added site URL config

## 🚀 How It Works

1. **Auto-Connect**: When users open the app in Farcaster, the wallet automatically connects via the Farcaster connector
2. **FID Retrieval**: The app gets the user's FID from `sdk.context.user.fid`
3. **Splash Screen**: `sdk.actions.ready()` is called to dismiss the splash screen
4. **Sharing**: Users can share their game scores using `composeCast()` which opens the Farcaster composer

## 🔍 Troubleshooting

**SDK not initializing:**
- Check browser console for errors
- Verify `sdk.isInMiniApp()` returns `true`
- Ensure `sdk.actions.ready()` is called before other SDK calls

**Manifest not found:**
- Verify file is at `public/.well-known/farcaster.json`
- Check file is deployed (not just in local `public/` folder)
- Verify JSON is valid (no trailing commas, proper quotes)

**Embed not rendering:**
- Check meta tag is in `<head>` section
- Verify embed JSON is valid (use JSON.stringify)
- Ensure `button.action` object is present
- Test with embed validator tool

**Sharing not working:**
- Verify `composeCast` capability is available
- Check you're in Farcaster miniapp (`sdk.isInMiniApp()`)
- Ensure share URL has `fc:miniapp` meta tag
- Test with simple message first (no embeds)

## 📚 Reference

See `contracts/FARCASTER_INTEGRATION.md` for the complete integration guide with detailed code examples.

