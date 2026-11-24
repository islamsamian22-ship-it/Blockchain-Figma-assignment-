# Crypto Whales · Supply-Chain NFTs

Academic prototype showing how NFTs can trace a garment production order (500 × Basic Cotton T-Shirts, `ORDER-001`) from factory onboarding to payment release. Everything runs in the browser; the chain is simulated.

## Views
- **Simulation**: step through the five mint events. The batch handoff needs both sender and receiver sign-off before it can be minted. Payment stays in escrow until finishing is inspected.
- **NFT Wallet**: all five tokens. Click one to see its attributes, tx hash, linked tokens and ERC-721 metadata JSON.
- **Order Passport**: the parent order token, its release checklist and the tokens linked to it.

## NFTs
| # | Token | Holder | Artwork |
|---|-------|--------|---------|
| 1 | Factory Credential (soulbound) | Crypto Whales Factory | `public/images/factory-credential.png` *(add)* |
| 2 | Production Order Passport | Crypto Whales Group | `public/images/production-order-passport.png` *(add)* |
| 3 | Subcontractor Approval (soulbound) | Zayed · SC-001 | `public/images/subcontractor-approval.jpg` |
| 4 | Batch Handoff | Ibrahim | `public/images/batch-handoff.jpg` |
| 5 | Verified Finishing Completion | Lucas · Inspector | `public/images/finishing-completion.jpg` |

NFT data lives in `src/nfts.ts`. Missing artwork falls back to a placeholder card.

## Run
```bash
pnpm install
pnpm dev
```
