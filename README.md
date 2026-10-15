# THE FEEDERS — Base Sepolia NFT prototype

This project adapts the uploaded CSS/JavaScript 3D card and gold coin into a Base Sepolia **testnet** minting demo. It is not deployed and contains no real credentials.

## Quick start

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
npm run compile
npm test
npm run dev
```

On Windows PowerShell use `Copy-Item .env.example .env`; if `npm.ps1` is blocked use `npm.cmd`.

The app opens locally via Vite. With no contract address, it remains a **preview only**. It does not mint or take payments without a real deployed contract.

## Content requirements before production

`src/characters.json` intentionally contains **only four known sample characters**. Artwork for other characters was not provided. The generic sample image is a **placeholder**, not verified artwork for Clickbait Casey, Doomscroll Dolly, or Privacy Patty. Add all 52 authentic names, descriptions, and final artwork files. Preserve IDs 1–52, and generate **distinct rarity artwork** if rarity finishes are promised. `scripts/generate-metadata.cjs` deliberately rejects fewer than 52 characters to avoid accidentally publishing incomplete production metadata. The default image currently repeats across tiers; replace this before marketing different visual rarity treatments.

The original HTML included mismatched Iron Briers / Subscription Stu text and a 1/1 label; this demo standardizes the preview to the selected character and shared ERC-1155 editions. `public/Card.js` preserves the supplied 3D shell, rotation, momentum and coins; its public API is renamed to `window.FeedersCard3D`.

## Metadata preparation

1. Populate all 52 entries in `src/characters.json`, with local `/assets/filename.ext` paths.
2. Pin final artwork to IPFS (or another durable media location). Ensure the remote filenames match the local artwork basenames.
3. Run `ASSET_BASE_URI=ipfs://YOUR_ASSET_CID/ npm run metadata` (on PowerShell: `$env:ASSET_BASE_URI='ipfs://YOUR_ASSET_CID/'; npm run metadata`).
4. Review all 208 generated JSON files. If interactive HTML has been durably hosted, optionally set `ANIMATION_BASE_URI` before generation. Marketplaces may not run external HTML or JavaScript.
5. Pin the `metadata/` folder and put its resulting `ipfs://.../` URI in `.env` as `METADATA_BASE_URI`. **Do not use local file paths in on-chain metadata.**

## Testnet deployment

1. Obtain test ETH on Base Sepolia (chain ID **84532**). Never use mainnet ETH for testing.
2. Set `DEPLOYER_PRIVATE_KEY` in local `.env` (use a dedicated low-value test wallet, never commit the file), and set `METADATA_BASE_URI` to your pinned JSON directory URI ending with `/`.
3. Run `npm run compile && npm test`.
4. Run `npm run deploy:sepolia` and record the deployed address.
5. Set `VITE_CONTRACT_ADDRESS` in `.env` and restart `npm run dev`.
6. The contract starts with **minting paused** and **all 208 token IDs disabled**. The owner must explicitly enable selected IDs with `setEditionEnabled(id,true)` and then call `setMintPaused(false)` through a trusted contract administration interface (e.g. verified contract on explorer or a secure owner script). For the pilot, enable only the selected characters.
7. Connect a browser wallet to Base Sepolia, test minting, balance changes, caps, failures, and metadata in a marketplace.

**Important:** The Solidity contract includes owner-controlled `setBaseMetadataURI`, so metadata is **not immutable**. For a production freeze, remove this setter or implement a one-way freeze, then redeploy and independently review. Prices are small **test ETH** amounts, not the proposed USD pricing. Production pricing, royalty policy, admin security, supply disclosure, accessibility, and legal terms need separate review. This is a prototype, not an audited production contract.

## Supply model

For each of 52 characters, token IDs are `(characterId - 1) * 4 + tierIndex + 1`.

| Tier index | Tier | Copies per character | Full maximum supply |
|---|---|---:|---:|
| 0 | Common | 30 | 1560 |
| 1 | Uncommon | 12 | 624 |
| 2 | Rare | 6 | 312 |
| 3 | Legendary | 2 | 104 |

Total maximum: **2,600 NFTs** across **208 ERC-1155 token IDs**. All copies of a token ID share identical metadata. The LWVADER mark is a creator attribution, not a unique per-copy blockchain serial.
