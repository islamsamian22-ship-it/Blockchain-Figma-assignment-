# Crypto Whales · Supply-Chain NFTs

Academic prototype showing how NFTs can trace a garment production order (2,000 × Basic Cotton T-Shirts, `ORDER-001`) from factory onboarding to payment release. 

**Live demo:** https://islamsamian22-ship-it.github.io/Blockchain-Figma-assignment-/ (deployed by GitHub Actions on every push to `main`)

## Views
- **Simulation**: step through the five mint events. The batch handoff needs both sender and receiver sign-off before it can be minted. Payment stays in escrow until finishing is inspected.
- **NFT Wallet**: all five NFTs, filterable by Group / Individual. Click one for its attributes, linked tokens, metadata JSON and OpenSea link.
- **Order Passport**: the parent order token, its release checklist and the tokens linked to it.
- **How it works**: what is on-chain vs simulated, how NFTs are distributed to each person, a "see it as" view per role, portability, and open issues for a real rollout.

## NFTs
The five NFTs are minted on Polygon and listed on OpenSea. The app links to each one. The supply-chain workflow, sign-offs and escrow payment in the app are simulated.

| # | NFT | Type | Holder | OpenSea |
|---|-----|------|--------|---------|
| 1 | Factory Credential | Individual | Samian Islam (for Dhaka Cotton Works, FACTORY-001) | [collection](https://opensea.io/collection/factory-credentials-32228465) |
| 2 | Production Order Passport | Group | Crypto Whales Group | [token](https://opensea.io/item/polygon/0xf843cd21c82608de63e21b9e809f4de757b6504f/1) |
| 3 | Subcontractor Approval | Individual | Zayed (SC-001) | [collection](https://opensea.io/collection/subcontractor-approval-sc-001) |
| 4 | Batch Handoff | Individual | Ibrahim | [collection](https://opensea.io/collection/batch-handoff) |
| 5 | Verified Finishing Completion | Individual | Lucas (Inspector) | [collection](https://opensea.io/collection/verified-finishing-completion) |

NFT data and links live in `src/nfts.ts`; artwork in `public/images/`.

## Run
```bash
pnpm install
pnpm dev
```
