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

