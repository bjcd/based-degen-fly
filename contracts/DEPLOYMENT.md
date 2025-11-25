# Deployment Guide

## Constructor Parameters

The contract constructor only requires **one parameter**:

```solidity
constructor(address _verifier)
```

- `_verifier`: The backend wallet address that will sign reward claims
  - This must be a valid Ethereum address (not zero address)
  - This address will be used to verify signatures in `claimRewards()`

## Deployment Steps

### 1. Deploy Contract

```solidity
// Deploy with verifier address
GameRewards gameRewards = new GameRewards(VERIFIER_ADDRESS);
```

**That's it for deployment!** The contract will:
- Set `owner = msg.sender` (deployer)
- Set `verifier = VERIFIER_ADDRESS`
- Set `maxClaimsPerDay = 0` (unlimited by default)
- Set `paused = false` (active by default)

### 2. Post-Deployment Setup (Required)

After deployment, you **must** configure the contract:

#### A. Add Reward Tokens

```solidity
// Add DEGEN token (18 decimals)
gameRewards.addToken(DEGEN_TOKEN_ADDRESS, 1e18); // 1 DEGEN per hat

// Add USDC token (6 decimals)
gameRewards.addToken(USDC_TOKEN_ADDRESS, 1e6); // 1 USDC per hat
```

#### B. Fund the Contract

```solidity
// For each token, approve and add to pot
IERC20 degen = IERC20(DEGEN_TOKEN_ADDRESS);
degen.approve(address(gameRewards), INITIAL_AMOUNT);
gameRewards.addToPot(DEGEN_TOKEN_ADDRESS, INITIAL_AMOUNT);
```

#### C. Optional: Set Daily Claim Limit

```solidity
// Set to 10 claims per day (or 0 for unlimited)
gameRewards.setMaxClaimsPerDay(10);
```

### 3. Verify Deployment

Check that everything is set up correctly:

```solidity
// Check owner
address owner = gameRewards.owner();

// Check verifier
address verifier = gameRewards.verifier();

// Check supported tokens
address[] memory tokens = gameRewards.getSupportedTokens();

// Check balances
uint256 degenBalance = gameRewards.getAvailableRewards(DEGEN_TOKEN_ADDRESS);
```

## Complete Deployment Script Example

```solidity
// 1. Deploy
GameRewards gameRewards = new GameRewards(VERIFIER_ADDRESS);

// 2. Add tokens
gameRewards.addToken(DEGEN_TOKEN_ADDRESS, 1e18);
gameRewards.addToken(USDC_TOKEN_ADDRESS, 1e6);

// 3. Fund contract
IERC20 degen = IERC20(DEGEN_TOKEN_ADDRESS);
degen.approve(address(gameRewards), 1000000e18);
gameRewards.addToPot(DEGEN_TOKEN_ADDRESS, 1000000e18);

// 4. Optional: Set daily limit
gameRewards.setMaxClaimsPerDay(10);

// 5. Verify
require(gameRewards.owner() == msg.sender, "Owner check failed");
require(gameRewards.getSupportedTokens().length == 2, "Token count check failed");
```

## Why Only Verifier in Constructor?

This is a **common and recommended pattern** because:

1. **Flexibility**: You can add/remove tokens without redeploying
2. **Gas Efficiency**: Constructor parameters cost gas, minimal constructor = lower deployment cost
3. **Separation of Concerns**: Deployment vs. configuration are separate steps
4. **Upgradeability**: Easier to change configuration post-deployment

## Security Notes

- ✅ The verifier address is immutable (set once at deployment)
- ✅ Only the owner can add tokens, set limits, and withdraw funds
- ✅ The contract starts unpaused and ready to accept claims (after tokens are added and funded)

## Post-Deployment Checklist

- [ ] Contract deployed with correct verifier address
- [ ] At least one reward token added via `addToken()`
- [ ] Contract funded with tokens via `addToPot()`
- [ ] Daily claim limit set (if desired) via `setMaxClaimsPerDay()`
- [ ] Owner address verified
- [ ] Verifier address verified
- [ ] Token balances verified
- [ ] Frontend updated with contract address


