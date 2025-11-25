# How to Approve and Add to Pot

## The Problem

`addToPot()` calls `token.transferFrom(msg.sender, address(this), amount)`, which requires:
1. ✅ You have enough tokens in your wallet
2. ✅ You've approved the contract to spend your tokens

## Solution: Two-Step Process

### Step 1: Approve the Contract

You need to call `approve()` on the **token contract** (not the GameRewards contract):

```solidity
// On the token contract (e.g., DEGEN token)
IERC20(tokenAddress).approve(gameRewardsContractAddress, amount);
```

**Parameters:**
- `spender`: The GameRewards contract address
- `amount`: How much you want to approve (can be more than you're adding)

### Step 2: Add to Pot

```solidity
// On the GameRewards contract
gameRewards.addToPot(tokenAddress, amount);
```

## Common Issues

### Error: `0xfb8f41b2` or "Transfer failed"

**Causes:**
1. ❌ **Not approved** - Most common! You need to approve first
2. ❌ **Insufficient allowance** - Approved amount < amount you're trying to add
3. ❌ **Insufficient balance** - You don't have enough tokens
4. ❌ **Token not enabled** - Token wasn't added via `addToken()` first

### Check Before Adding

```solidity
// 1. Check your balance
uint256 balance = IERC20(tokenAddress).balanceOf(yourAddress);

// 2. Check your allowance
uint256 allowance = IERC20(tokenAddress).allowance(yourAddress, gameRewardsAddress);

// 3. Check if token is enabled
bool enabled = gameRewards.tokenConfigs(tokenAddress).enabled;
```

## Example: Complete Flow

```solidity
address DEGEN = 0x...; // Your token address
address GAME_REWARDS = 0x...; // GameRewards contract address
uint256 amount = 1000e18; // 1000 tokens

// Step 1: Approve
IERC20(DEGEN).approve(GAME_REWARDS, amount);

// Step 2: Add to pot
gameRewards.addToPot(DEGEN, amount);
```

## Using Wagmi/viem (Frontend)

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi } from 'viem'

// Step 1: Approve
const { writeContract: approve, data: approveHash } = useWriteContract()

await approve({
  address: tokenAddress, // Token contract
  abi: erc20Abi,
  functionName: 'approve',
  args: [gameRewardsAddress, amount]
})

// Wait for approval
await waitForTransactionReceipt({ hash: approveHash })

// Step 2: Add to pot
const { writeContract: addToPot } = useWriteContract()

await addToPot({
  address: gameRewardsAddress, // GameRewards contract
  abi: gameRewardsAbi,
  functionName: 'addToPot',
  args: [tokenAddress, amount]
})
```

## Quick Fix Checklist

- [ ] Token was added via `addToken()` first
- [ ] You have enough tokens in your wallet
- [ ] You've approved the GameRewards contract
- [ ] Approved amount >= amount you're trying to add
- [ ] You're calling `approve()` on the **token contract**, not GameRewards


