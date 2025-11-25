# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Your deployed domain URL

# Web3 Configuration
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_RPC_URL_ALT=https://base-sepolia-rpc.publicnode.com  # Optional fallback RPC
NEXT_PUBLIC_CHAIN_ID=84532

# NFT Contract (Based Degen)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xE7c0f3beD50675521E0ecd24d2bb66f2480237a8

# Game Rewards Contract
NEXT_PUBLIC_GAME_REWARDS_ADDRESS=0x0152B904AEbA835F2A14B834056b2c76d11CBC56

# DEGEN Token Address (for lifetime rewards display)
NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS=0x...  # Add your DEGEN token address here

# Reward Configuration (for frontend preview calculations)
NEXT_PUBLIC_DEGEN_REWARD_PER_HAT=1000000000000000000  # 1 DEGEN (18 decimals)

# Backend/Server-side Configuration
# ⚠️ NEVER commit this file with real private keys!
# This is for backend signing of reward claims
VERIFIER_PRIVATE_KEY=your_verifier_private_key_here

# Neynar API (for Farcaster integration)
NEYNAR_API_KEY=your_neynar_api_key_here

# Alchemy API (optional, for NFT fetching)
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

## Important Notes

1. **`.env.local` is gitignored** - Your private keys will not be committed
2. **VERIFIER_PRIVATE_KEY** - This is the private key of the wallet that signs reward claims
   - The corresponding public address should match the `verifier` address in the contract
   - Keep this secure! Never expose it in frontend code
   - Only use it in backend/server-side code for signing

## Verifier Private Key Usage

The verifier private key is used to sign messages for reward claims. Example:

```typescript
import { privateKeyToAccount } from 'viem/accounts'
import { signMessage } from 'viem'

const verifierAccount = privateKeyToAccount(process.env.VERIFIER_PRIVATE_KEY as `0x${string}`)

// Sign a claim message
const message = keccak256(abi.encodePacked(
  userAddress,
  hatsCollected,
  nonce,
  chainId
))

const signature = await signMessage({
  account: verifierAccount,
  message: message
})
```

