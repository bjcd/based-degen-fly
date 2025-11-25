# Game Rewards Smart Contract

## Overview
Programmable smart contract for managing multi-token rewards in the Based Degen Sky game. Players collect hats and earn rewards based on the number of hats collected.

## Core Features

### 1. **Multi-Token Support**
- ✅ `addToken(tokenAddress, rewardPerHat)` - Add any ERC20 token as a reward
- ✅ `updateTokenReward(tokenAddress, newRewardPerHat)` - Update reward per hat
- ✅ `removeToken(tokenAddress)` - Disable a token and remove from array
- ✅ Support multiple tokens simultaneously (DEGEN, USDC, etc.)
- ✅ Maximum 50 tokens (DoS protection)

### 2. **Fund Management**
- ✅ `addToPot(tokenAddress, amount)` - Anyone can add tokens to the reward pool
- ✅ `withdrawFunds(tokenAddress, amount, to)` - Owner can withdraw excess funds
- ✅ View available balance per token

### 3. **Pause Functionality**
- ✅ `pause()` - Owner can pause all claims
- ✅ `unpause()` - Owner can resume claims
- ✅ All claim functions check pause status

### 4. **Reward Claiming**
- ✅ `claimRewards(hatsCollected, signature, nonce)` - Players claim based on:
  - Number of hats collected (score is already calculated in-game with trait multipliers)
  - Backend signature verification (prevents cheating)
- ✅ **No minimum threshold** - Even 1 hat = rewards
- ✅ Replay attack prevention (nonce-based, prevents replay even with different hat counts)
- ✅ Reentrancy protection
- ✅ Automatically distributes all supported tokens
- ✅ Emits events for insufficient funds (if contract is underfunded)

### 5. **Analytics**
- ✅ `totalClaims[user]` - Total number of claims per user
- ✅ `lifetimeRewards[user][token]` - Lifetime rewards per user per token
- ✅ `totalRewardsDistributed[token]` - Total rewards distributed per token
- ✅ View functions to query analytics

### 6. **Admin Controls**
- ✅ `addToken()` - Add new reward tokens
- ✅ `updateTokenReward()` - Change reward per hat (can be done via contract or .env for frontend)
- ✅ `setVerifier()` - Update backend verifier address
- ✅ `transferOwnership()` - Transfer contract ownership

### 7. **Security Features**
- ✅ Signature verification (backend signs hat counts)
- ✅ Replay attack prevention (nonce-based, prevents replay with different hat counts)
- ✅ Reentrancy protection
- ✅ Pause functionality for emergencies
- ✅ Owner-only admin functions
- ✅ DoS protection (max 50 supported tokens)
- ✅ Signature malleability protection (s-value validation)
- ✅ Proper token array management (removes disabled tokens)
- ✅ Events for all state changes (including insufficient funds)

**📋 See [SECURITY_FIXES.md](./SECURITY_FIXES.md) for detailed security audit fixes.**

## Key Design Decisions

### Hat-Based Rewards
- Rewards are calculated as: `hatsCollected * rewardPerHat`
- Trait multipliers (e.g., Gold Teeth = 2x) are **already applied in-game**
- Contract only needs to know the final hat count

### No Minimum Score Threshold
- Players earn rewards even if they collect just 1 hat
- Encourages participation and engagement

### Multi-Token Support
- Admin can add multiple tokens (DEGEN, USDC, etc.)
- Each token has its own `rewardPerHat` rate
- Players receive all enabled tokens when claiming

### Reward Per Hat Configuration
- Can be set via contract function `updateTokenReward()`
- Can also be configured via `.env` for frontend display
- Admin has full control to adjust rates

## Deployment Checklist

1. Deploy GameRewards contract with:
   - Verifier address (backend wallet that signs claims)
2. Add reward tokens:
   ```solidity
   addToken(DEGEN_ADDRESS, 1e18); // 1 DEGEN per hat
   addToken(USDC_ADDRESS, 1e6);   // 1 USDC per hat
   ```
3. Fund contract with tokens:
   ```solidity
   // Approve first
   degenToken.approve(CONTRACT_ADDRESS, amount);
   // Then add to pot
   gameRewards.addToPot(DEGEN_ADDRESS, amount);
   ```
4. Update frontend with contract address and token configs

## Backend Integration

The backend needs to:
1. Verify game scores and hat counts (prevent cheating)
2. Sign messages with verifier wallet:
   ```javascript
   const message = keccak256(abi.encodePacked(
     userAddress,
     hatsCollected,  // Final count after trait multipliers
     nonce,
     chainId
   ));
   const signature = await signer.signMessage(message);
   ```
3. Provide signature to frontend for claim transaction

## Frontend Integration

### For NFT Holders:
1. Calculate hats collected (with trait multipliers applied in-game)
2. Get signature from backend
3. Call `claimRewards(hatsCollected, signature, nonce)`
4. Show transaction status and rewards received

### For Non-NFT Players:
1. Calculate hats collected (same as NFT holders)
2. Calculate **preview** of rewards they would earn
3. Display message: "Mint a Based Degen or buy on secondary to be eligible for $DEGEN rewards"
4. Show preview amount they would have earned
5. Provide links to mint/buy NFT

### Reward Preview Calculation:
```javascript
// For each supported token
const rewardAmount = hatsCollected * rewardPerHat;
// Display to user even if they can't claim
```

## Environment Variables

You can configure reward rates in `.env` for frontend display:

```env
NEXT_PUBLIC_DEGEN_REWARD_PER_HAT=1000000000000000000  # 1 DEGEN (18 decimals)
NEXT_PUBLIC_USDC_REWARD_PER_HAT=1000000              # 1 USDC (6 decimals)
```

These can be used for:
- Preview calculations for non-NFT players
- Displaying expected rewards before claiming
- UI/UX improvements

## Contract Functions Reference

### Token Management
- `addToken(address tokenAddress, uint256 rewardPerHat)` - Add new reward token
- `updateTokenReward(address tokenAddress, uint256 newRewardPerHat)` - Update rate
- `removeToken(address tokenAddress)` - Disable token
- `getSupportedTokens()` - Get list of all supported tokens

### Claiming
- `claimRewards(uint256 hatsCollected, bytes signature, uint256 nonce)` - Claim rewards

### Analytics
- `getTotalClaims(address user)` - Get user's total claim count
- `getLifetimeRewards(address user, address token)` - Get user's lifetime rewards for a token
- `getTotalDistributed(address token)` - Get total distributed for a token
- `getAvailableRewards(address token)` - Get contract balance for a token

### Admin
- `addToPot(address tokenAddress, uint256 amount)` - Add funds
- `withdrawFunds(address tokenAddress, uint256 amount, address to)` - Withdraw funds
- `pause()` / `unpause()` - Pause/resume claims
- `setVerifier(address newVerifier)` - Update verifier
- `transferOwnership(address newOwner)` - Transfer ownership
