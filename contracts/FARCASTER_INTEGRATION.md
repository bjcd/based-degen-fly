# Complete Farcaster Mini App Integration Guide

This is a comprehensive guide for integrating Farcaster Mini Apps, including SDK initialization, manifest creation, embeds, and sharing functionality. All code examples are from a production implementation.

---

## 1. Initializing Farcaster SDK and Auto-Connecting Users

### Overview
The Farcaster SDK must be initialized in your root provider component to:
- Dismiss the splash screen (CRITICAL: must call `sdk.actions.ready()`)
- Auto-connect users' wallets when in Farcaster environment
- Get user context (FID, username, etc.)

### Step 1: Install Dependencies

```bash
npm install @farcaster/miniapp-sdk @farcaster/miniapp-wagmi-connector wagmi viem @tanstack/react-query
```

### Step 2: Create Providers Component (Root Level)

**File: `app/providers.tsx`** (or `components/providers.tsx`)

```typescript
"use client";

import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { base } from "wagmi/chains"; // or your chain
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, metaMask } from "wagmi/connectors";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

// Use your RPC URLs
const primaryRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org";
const fallbackRpcUrl = process.env.NEXT_PUBLIC_RPC_URL_ALT || "https://base-rpc.publicnode.com";

const transport = fallback([
    http(primaryRpcUrl, {
        timeout: 10000,
        retryCount: 1,
    }),
    http(fallbackRpcUrl, {
        timeout: 10000,
        retryCount: 1,
    }),
]);

const config = createConfig({
    chains: [base],
    connectors: [
        miniAppConnector(), // Farcaster wallet connector - MUST be first for auto-connect
        injected(),
        metaMask(),
    ],
    transports: {
        [base.id]: transport,
    },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    // CRITICAL: Call sdk.actions.ready() in root provider to dismiss splash screen
    // Must wait for SDK to be available, poll if needed
    useEffect(() => {
        const initFarcaster = async () => {
            if (typeof window === "undefined") {
                setIsReady(true);
                return;
            }

            // Poll for SDK to be ready (check if we're in miniapp)
            // Try up to 20 times with 100ms delay (2 seconds total)
            let attempts = 0;
            const maxAttempts = 20;
            const pollInterval = 100;

            const checkAndInitSDK = async (): Promise<void> => {
                try {
                    const isInMiniApp = await sdk.isInMiniApp();

                    if (isInMiniApp) {
                        // We're in a miniapp! Call ready() immediately
                        try {
                            await sdk.actions.ready();
                            console.log('✅ Farcaster SDK ready() called - splash screen hidden');
                            setIsReady(true);
                            return;
                        } catch (sdkError) {
                            console.warn('⚠️ Farcaster SDK ready() failed:', sdkError);
                            setIsReady(true);
                            return;
                        }
                    } else {
                        attempts++;
                        if (attempts < maxAttempts) {
                            setTimeout(checkAndInitSDK, pollInterval);
                        } else {
                            console.log('📱 Farcaster SDK not detected - running in web mode');
                            setIsReady(true);
                        }
                    }
                } catch (error) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkAndInitSDK, pollInterval);
                    } else {
                        console.log('📱 Farcaster SDK not detected - running in web mode');
                        setIsReady(true);
                    }
                }
            };

            checkAndInitSDK();
        };

        initFarcaster();
    }, []);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster />
            </QueryClientProvider>
        </WagmiProvider>
    );
}
```

### Step 3: Wrap Your App with Providers

**File: `app/layout.tsx`**

```typescript
import { Providers } from "./providers";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
```

### Step 4: Create Farcaster Utility Functions

**File: `app/lib/farcaster.ts`**

```typescript
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    custodyAddress: string;
    verifications: string[];
}

/**
 * Check if we're in Farcaster environment
 */
export async function isInFarcasterEnvironment(): Promise<boolean> {
    if (typeof window === "undefined") {
        return false;
    }

    try {
        const isInMiniApp = await sdk.isInMiniApp();
        if (isInMiniApp) {
            console.log('📱 SDK confirmed: In Farcaster miniapp');
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Error checking isInMiniApp:', error);
    }

    // Fallback detection
    const fallbackDetection =
        window.location !== window.parent.location ||
        window.navigator.userAgent.includes('Farcaster') ||
        window.location.search.includes('farcaster') ||
        document.referrer.includes('farcaster') ||
        !!(window as any).farcaster;

    return fallbackDetection;
}

/**
 * Get Farcaster user context from SDK
 */
export async function getFarcasterContext(): Promise<FarcasterUser | null> {
    try {
        const isInMiniApp = await sdk.isInMiniApp();
        if (!isInMiniApp) {
            return null;
        }

        // Get auth token (optional)
        try {
            const { token } = await sdk.quickAuth.getToken();
            console.log('Farcaster token received');
        } catch (error) {
            console.log('Token not available, continuing without it');
        }

        // Access user context
        const context = await sdk.context;
        if (!context || !context.user) {
            console.warn('No user context available');
            return null;
        }

        const userProfile = context.user;

        if (!userProfile || !userProfile.fid || userProfile.fid === 0) {
            console.warn('Invalid user profile from SDK');
            return null;
        }

        return {
            fid: userProfile.fid,
            username: userProfile.username || 'Unknown',
            displayName: userProfile.displayName || 'Farcaster User',
            pfpUrl: userProfile.pfpUrl || 'https://via.placeholder.com/150',
            custodyAddress: '', // Not available in SDK context
            verifications: [], // Not available in SDK context
        };
    } catch (error) {
        console.error('Error getting Farcaster context:', error);
        return null;
    }
}

/**
 * Get Ethereum provider from Farcaster SDK
 */
export async function getFarcasterEthereumProvider(): Promise<any> {
    try {
        const isInMiniApp = await sdk.isInMiniApp();
        if (!isInMiniApp) {
            return null;
        }

        const capabilities = await sdk.getCapabilities();
        if (!capabilities.includes('wallet.getEthereumProvider')) {
            console.warn('⚠ Wallet capability not available');
            return null;
        }

        const provider = await sdk.wallet.getEthereumProvider();
        return provider;
    } catch (error) {
        console.error('Error getting Farcaster Ethereum provider:', error);
        return null;
    }
}

/**
 * Get FID from URL params (fallback for testing)
 */
export function getFidFromUrl(): number | null {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const fidParam = params.get("fid");
    return fidParam ? parseInt(fidParam, 10) : null;
}
```

### Step 5: Get FID in Your Page Component

**File: `app/page.tsx`** (example usage)

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { getFarcasterContext, isInFarcasterEnvironment, getFidFromUrl } from "./lib/farcaster";

export default function Home() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const [fid, setFid] = useState<number | null>(null);
    const [isInFarcasterEnv, setIsInFarcasterEnv] = useState(false);

    // Get FID from Farcaster SDK context
    useEffect(() => {
        const getFid = async () => {
            await new Promise(resolve => setTimeout(resolve, 200));

            const isInFarcaster = await isInFarcasterEnvironment();
            setIsInFarcasterEnv(isInFarcaster);

            if (isInFarcaster) {
                // Try to get FID from SDK context
                let attempts = 0;
                const maxAttempts = 5;

                while (attempts < maxAttempts) {
                    try {
                        const context = await getFarcasterContext();
                        if (context && context.fid && context.fid > 0) {
                            console.log("✅ Got FID from Farcaster SDK context:", context.fid);
                            setFid(context.fid);
                            return;
                        }
                    } catch (error) {
                        console.warn(`Attempt ${attempts + 1}: Failed to get Farcaster context:`, error);
                    }

                    attempts++;
                    if (attempts < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }
                }
            }

            // Fallback: Get FID from URL params (for testing)
            const urlFid = getFidFromUrl();
            if (urlFid) {
                console.log("📝 Using FID from URL params (dev mode):", urlFid);
                setFid(urlFid);
            }
        };

        getFid();
    }, []);

    // Auto-connect wallet when in Farcaster
    useEffect(() => {
        if (!isInFarcasterEnv || !fid || isConnected) return;

        const autoConnect = async () => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            if (!isConnected && connectors.length > 0) {
                try {
                    await connect({ connector: connectors[0] }); // First connector is Farcaster
                    console.log("✅ Auto-connected wallet");
                } catch (error) {
                    console.warn("Auto-connect failed:", error);
                }
            }
        };

        autoConnect();
    }, [isInFarcasterEnv, fid, isConnected, connect, connectors]);

    return (
        <div>
            {fid && <p>FID: {fid}</p>}
            {address && <p>Wallet: {address}</p>}
        </div>
    );
}
```

### Key Points:
- **`miniAppConnector()` must be FIRST** in the connectors array for auto-connect
- **`sdk.actions.ready()` must be called** to dismiss splash screen
- **Poll for SDK availability** - it may not be ready immediately
- **Auto-connect happens automatically** when wallet provider is available
- **FID comes from `sdk.context.user.fid`** in production

---

## 2. Creating the Manifest

### Overview
The manifest file (`/.well-known/farcaster.json`) is your app's identity document. It must be:
- Accessible at `https://yourdomain.com/.well-known/farcaster.json`
- Signed with a Farcaster account association
- Registered with Farcaster using their manifest tool

### Step 1: Create Manifest File

**File: `public/.well-known/farcaster.json`**

```json
{
    "accountAssociation": {
        "header": "eyJmaWQiOjE3MDY0LCJ0eXBlIjoiYXV0aCIsImtleSI6IjB4ZkYwN0Q5REYzZjY4YUYwMDExYjg5NTVlNEQ1NTM1OTYyREE4NTQzMCJ9",
        "payload": "eyJkb21haW4iOiJ3d3cudGhlYmFzZWRkZWdlbnMueHl6In0",
        "signature": "jcOlPel7xPAAW7H/PJ00/Oo5Q4QC0MbKDYDCwkfoTxUskJnUwaPrWzBoOP3AHa6+S1/bjcle9Lix3xGNiolrPRs="
    },
    "miniapp": {
        "name": "The Based Degens",
        "version": "1",
        "iconUrl": "https://www.thebaseddegens.xyz/icon.png",
        "homeUrl": "https://www.thebaseddegens.xyz",
        "imageUrl": "https://www.thebaseddegens.xyz/miniapp-icon-large.png",
        "buttonTitle": "MINT NOW",
        "splashImageUrl": "https://www.thebaseddegens.xyz/icon.png",
        "splashBackgroundColor": "#130e1a",
        "subtitle": "Mint a Based Degen",
        "description": "Customize your Based Degen with rare traits based on your social graph, wallet holdings, and Farcaster badges.",
        "primaryCategory": "games",
        "screenshotUrls": [
            "https://www.thebaseddegens.xyz/screenshot.png"
        ],
        "heroImageUrl": "https://www.thebaseddegens.xyz/miniapp-icon-large.png",
        "tags": [
            "games",
            "degen",
            "entertainment"
        ],
        "tagline": "Mint a Based Degen",
        "ogImageUrl": "https://www.thebaseddegens.xyz/icon.png",
        "ogTitle": "The Based Degens",
        "requiredCapabilities": [
            "wallet.getEthereumProvider",
            "actions.addMiniApp",
            "actions.composeCast",
            "actions.openUrl"
        ]
    }
}
```

### Step 2: Required Fields

**Essential (for app store indexing):**
- `name`: App name
- `iconUrl`: App icon (must be accessible, return `image/*` header)
- `homeUrl`: Main app URL
- `description`: App description

**Required for functionality:**
- `version`: Manifest version (usually "1")
- `buttonTitle`: Button text shown in embeds
- `splashImageUrl`: Image shown during app launch
- `splashBackgroundColor`: Background color for splash screen

**Optional but recommended:**
- `imageUrl`: Large image for app store
- `subtitle`: Short subtitle
- `primaryCategory`: App category
- `screenshotUrls`: Array of screenshot URLs
- `heroImageUrl`: Hero image for app store
- `tags`: Array of tags
- `tagline`: Tagline
- `ogImageUrl`: Open Graph image
- `ogTitle`: Open Graph title
- `requiredCapabilities`: Array of required SDK capabilities

### Step 3: Account Association (Domain Verification)

The `accountAssociation` field proves you own the domain. To generate it:

1. **Use Farcaster's manifest tool**: https://farcaster.xyz/~/developers/mini-apps/manifest
2. **Enter your domain** and sign with your Farcaster account
3. **Copy the generated `accountAssociation`** JSON into your manifest

The `accountAssociation` is a JSON Farcaster Signature (JFS) with:
- `header`: Base64 encoded header (contains FID, type, key)
- `payload`: Base64 encoded payload (contains domain)
- `signature`: Base64 encoded signature

### Step 4: Register Your Manifest

1. Go to https://farcaster.xyz/~/developers/mini-apps/manifest
2. Enter your domain
3. The tool will verify your manifest is accessible
4. Sign with your Farcaster account to associate the domain
5. Confirm the green checkmark appears (manifest is registered)

### Step 5: Verify Manifest is Accessible

After deployment, verify:
```bash
curl https://yourdomain.com/.well-known/farcaster.json
```

Should return valid JSON with your manifest.

### Key Points:
- **Manifest must be at `/.well-known/farcaster.json`** (exact path)
- **Domain in `accountAssociation.payload` must match** your hosting domain exactly
- **All image URLs must be accessible** and return proper `image/*` headers
- **Manifest must be registered** with Farcaster for app store indexing
- **Use `miniapp` field** (not `frame` for new apps)

---

## 3. Creating the Right Embeds (No Errors)

### Overview
Embeds are page-level metadata that make individual URLs shareable as rich cards in Farcaster feeds. They use `fc:miniapp` meta tags in the HTML `<head>`.

### Step 1: Root Layout Embed (Default)

**File: `app/layout.tsx`**

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://www.thebaseddegens.xyz"),
    title: "The Based Degens",
    description: "Mint your Based Degen NFT...",
    openGraph: {
        title: "The Based Degens",
        description: "Mint your Based Degen NFT...",
        type: "website",
        images: [
            {
                url: "https://www.thebaseddegens.xyz/miniapp-icon-large.png",
                width: 1200,
                height: 630,
                alt: "The Based Degens",
            },
        ],
    },
    other: {
        // CRITICAL: Single JSON meta tag for Farcaster miniapp embed
        // Format must include button object with action for validation to pass
        "fc:miniapp": JSON.stringify({
            version: "1",
            imageUrl: "https://www.thebaseddegens.xyz/miniapp-icon-large.png",
            button: {
                title: "MINT NOW",
                action: {
                    type: "launch_frame", // Use "launch_frame" for backward compatibility
                    name: "The Based Degens",
                    url: "https://www.thebaseddegens.xyz",
                    splashImageUrl: "https://www.thebaseddegens.xyz/icon.png",
                    splashBackgroundColor: "#130e1a",
                },
            },
        }),
    },
};
```

### Step 2: Dynamic Page-Specific Embed

**File: `app/share/[fid]/[imageCid]/page.tsx`**

```typescript
import type { Metadata } from "next";

// Force no-cache headers for this route to ensure Farcaster gets fresh metadata
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ fid: string; imageCid: string }>;
}): Promise<Metadata> {
    const { fid, imageCid } = await params;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thebaseddegens.xyz";
    
    // Use the NFT image CID from the route
    const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageCid}`;

    // Build the fc:miniapp JSON with the NFT image
    const fcMiniappJson = {
        version: "1",
        imageUrl: imageUrl, // NFT image - this is what Farcaster will display
        button: {
            title: "MINT YOURS NOW",
            action: {
                type: "launch_frame",
                name: "The Based Degens",
                url: siteUrl,
                splashImageUrl: "https://www.thebaseddegens.xyz/icon.png",
                splashBackgroundColor: "#130e1a",
            },
        },
    };

    return {
        metadataBase: new URL(siteUrl),
        title: `Based Degen #${fid}`,
        description: "Mint your Based Degen NFT...",
        openGraph: {
            title: `Based Degen #${fid}`,
            description: "Mint your Based Degen NFT...",
            type: "website",
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: `Based Degen #${fid}`,
                },
            ],
            url: `${siteUrl}/share/${fid}/${imageCid}`,
        },
        twitter: {
            card: "summary_large_image",
            title: `Based Degen #${fid}`,
            description: "Mint your Based Degen NFT...",
            images: [imageUrl],
        },
        other: {
            // CRITICAL: Override root layout fc:miniapp with NFT-specific embed
            "fc:miniapp": JSON.stringify(fcMiniappJson),
            // Also set fc:frame for backward compatibility
            "fc:frame": JSON.stringify(fcMiniappJson),
        },
        robots: {
            index: false,
            follow: false,
        },
    };
}

export default async function SharePage({
    params,
}: {
    params: Promise<{ fid: string; imageCid: string }>;
}) {
    const { fid, imageCid } = await params;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thebaseddegens.xyz";
    const imageUrl = `https://gateway.lighthouse.storage/ipfs/${imageCid}`;

    // Render page so Farcaster scrapers can read the metadata
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#130e1a',
            color: '#fff'
        }}>
            <h1>Based Degen #{fid}</h1>
            <img
                src={imageUrl}
                alt={`Based Degen #${fid}`}
                style={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    maxHeight: '70vh',
                }}
            />
            <p>Redirecting to miniapp...</p>
        </div>
    );
}
```

### Step 3: Share Layout (Prevent Inheritance)

**File: `app/share/layout.tsx`**

```typescript
// This layout ensures the share route doesn't inherit the root layout's fc:miniapp metadata
// Child pages will set their own and override root layout

export default function ShareLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
```

### Embed JSON Schema

The `fc:miniapp` meta tag must contain a JSON string with this structure:

```typescript
{
    version: "1", // Always "1"
    imageUrl: string, // Image URL (3:2 ratio recommended, 1200x630px)
    button: {
        title: string, // Button text (max ~20 chars)
        action: {
            type: "launch_frame" | "launch_miniapp", // Use "launch_frame" for compatibility
            name: string, // App name
            url: string, // URL to launch
            splashImageUrl: string, // Splash screen image
            splashBackgroundColor: string, // Hex color for splash background
        },
    },
}
```

### Common Errors and Fixes

**Error: "Invalid embed format"**
- **Fix**: Ensure `button.action` object is present and complete
- **Fix**: Use `JSON.stringify()` on the embed object
- **Fix**: Use `type: "launch_frame"` for backward compatibility

**Error: "Image not accessible"**
- **Fix**: Ensure `imageUrl` returns `image/*` content-type header
- **Fix**: Use absolute URLs (not relative)
- **Fix**: Check image is publicly accessible (no auth required)

**Error: "Embed not found"**
- **Fix**: Ensure meta tag is in `<head>` section
- **Fix**: Use `other` field in Next.js `Metadata` object
- **Fix**: Verify with: `curl -s https://yourdomain.com/page | grep fc:miniapp`

**Error: "Button action invalid"**
- **Fix**: Ensure `action.type` is `"launch_frame"` or `"launch_miniapp"`
- **Fix**: Ensure `action.url` matches your domain
- **Fix**: Ensure `action.splashImageUrl` and `splashBackgroundColor` are set

### Key Points:
- **Use `fc:miniapp` meta tag** (not `fc:frame` for new apps, but include both for compatibility)
- **Embed must be valid JSON string** in the meta tag
- **`button.action` object is REQUIRED** for validation
- **Image URLs must be accessible** and return proper headers
- **Use `force-dynamic` and `revalidate: 0`** for dynamic embeds
- **Child pages override parent layout** embeds automatically

---

## 4. Sharing the Mini App as an Embed with Custom Message

### Overview
Use `sdk.actions.composeCast()` to open the Farcaster composer with a pre-filled message and embed URL.

### Step 1: Create Compose Cast Function

**File: `app/lib/farcaster.ts`** (add to existing file)

```typescript
/**
 * Compose a cast to share the miniapp
 * @param message - The text message for the cast
 * @param embeds - Array of embed URLs (max 2)
 * @returns true if successful, false otherwise
 */
export async function composeCast(message: string, embeds?: Array<{ url: string }>) {
    try {
        const isInMiniApp = await sdk.isInMiniApp();
        if (!isInMiniApp) {
            console.warn("Not in miniapp, cannot compose cast");
            return false;
        }

        // Check capabilities
        const capabilities = await sdk.getCapabilities();
        if (!capabilities.includes('actions.composeCast')) {
            console.warn('Compose cast capability not available');
            return false;
        }

        // Convert embeds from {url: string}[] to string[] (max 2 embeds)
        const embedUrls: [] | [string] | [string, string] = embeds 
            ? (embeds.slice(0, 2).map(e => e.url) as [string] | [string, string])
            : [];

        await sdk.actions.composeCast({
            text: message,
            embeds: embedUrls,
        });
        return true;
    } catch (error) {
        console.error('Error composing cast:', error);
        return false;
    }
}
```

### Step 2: Use in Your Component

**File: `app/page.tsx`** (example usage)

```typescript
"use client";

import { composeCast } from "./lib/farcaster";
import { useState } from "react";

export default function Home() {
    const [fid, setFid] = useState<number | null>(null);
    const [mintedImageCid, setMintedImageCid] = useState<string | null>(null);

    const handleShare = async () => {
        if (!fid || !mintedImageCid) {
            console.error("Missing FID or image CID");
            return;
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thebaseddegens.xyz";
        const shareUrl = `${siteUrl}/share/${fid}/${mintedImageCid}`;
        
        const message = `I just minted my Based Degen #${fid}! 🎉`;
        const embeds = [{ url: shareUrl }];

        const success = await composeCast(message, embeds);
        
        if (success) {
            console.log("✅ Cast composer opened");
        } else {
            console.error("❌ Failed to open cast composer");
        }
    };

    return (
        <div>
            <button onClick={handleShare}>
                Share Your NFT
            </button>
        </div>
    );
}
```

### Step 3: Complete Share Example (After Minting)

```typescript
const handleShareAfterMint = async () => {
    if (!fid || !mintedImageCid) return;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thebaseddegens.xyz";
    const openseaCollectionUrl = process.env.NEXT_PUBLIC_OPENSEA_COLLECTION_URL;
    const shareUrl = `${siteUrl}/share/${fid}/${mintedImageCid}`;

    // Option 1: Share with embed URL (shows NFT image in cast)
    const message = `I just minted my Based Degen #${fid}! 🎉`;
    const embeds = [{ url: shareUrl }];

    // Option 2: Share with OpenSea link + embed
    // const message = `I just minted my Based Degen #${fid}! 🎉\n\n${openseaCollectionUrl}/${fid}`;
    // const embeds = [{ url: shareUrl }];

    const success = await composeCast(message, embeds);
    
    if (!success) {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${message}\n\n${shareUrl}`);
        alert("Link copied to clipboard!");
    }
};
```

### Step 4: Ensure Share URL Has Embed Metadata

The share URL (`/share/${fid}/${imageCid}`) must have the `fc:miniapp` meta tag set (see Section 3, Step 2).

### Key Points:
- **`composeCast()` only works in Farcaster miniapp** - check with `sdk.isInMiniApp()`
- **Capability check required** - verify `actions.composeCast` is available
- **Max 2 embeds** - Farcaster limits embeds to 2 per cast
- **Embed URL must have `fc:miniapp` meta tag** - otherwise it won't render as a card
- **Message can include text + embeds** - embeds are separate from message text
- **Always provide fallback** - copy to clipboard if `composeCast()` fails

---

## Summary Checklist

### SDK Initialization ✅
- [ ] Install `@farcaster/miniapp-sdk` and `@farcaster/miniapp-wagmi-connector`
- [ ] Create `Providers` component with `miniAppConnector()` as first connector
- [ ] Call `sdk.actions.ready()` in provider to dismiss splash screen
- [ ] Poll for SDK availability (may not be ready immediately)
- [ ] Get FID from `sdk.context.user.fid`

### Manifest ✅
- [ ] Create `public/.well-known/farcaster.json`
- [ ] Include all required fields (`name`, `iconUrl`, `homeUrl`, `description`)
- [ ] Generate `accountAssociation` using Farcaster manifest tool
- [ ] Register manifest at https://farcaster.xyz/~/developers/mini-apps/manifest
- [ ] Verify manifest is accessible: `curl https://yourdomain.com/.well-known/farcaster.json`

### Embeds ✅
- [ ] Add `fc:miniapp` meta tag to root layout (default embed)
- [ ] Create dynamic embeds for shareable pages
- [ ] Use `JSON.stringify()` on embed object
- [ ] Include `button.action` object (required for validation)
- [ ] Set `force-dynamic` and `revalidate: 0` for dynamic embeds
- [ ] Verify embed with: `curl -s https://yourdomain.com/page | grep fc:miniapp`

### Sharing ✅
- [ ] Implement `composeCast()` function
- [ ] Check `sdk.isInMiniApp()` and capabilities
- [ ] Ensure share URLs have `fc:miniapp` meta tags
- [ ] Provide fallback (copy to clipboard) if `composeCast()` fails
- [ ] Test sharing with custom message and embed URL

---

## Testing

1. **Test in Farcaster client**: Open your app in Warpcast
2. **Test manifest**: Verify at https://farcaster.xyz/~/developers/mini-apps/manifest
3. **Test embed**: Use https://farcaster.xyz/~/developers/mini-apps/embed
4. **Test sharing**: Share a URL and verify it renders as a card
5. **Test SDK**: Verify FID is retrieved and wallet auto-connects

---

## Troubleshooting

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

---

This guide provides all the code and patterns needed for a complete Farcaster Mini App integration. All code examples are from a production implementation that has been tested and deployed.

