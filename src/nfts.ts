// NFT catalogue for the Crypto Whales supply-chain prototype.
// Self-contained so it can be dropped into any App.tsx.

export type NftId = 'factory' | 'order' | 'subcontractor' | 'handoff' | 'finishing'

export interface NftAttribute {
  label: string
  value: string
}

export interface NftDef {
  id: NftId
  tokenId: number
  name: string
  /** Group NFTs belong to the whole team; individual NFTs to one member */
  scope: 'Group' | 'Individual'
  /** Live listing on OpenSea (Polygon) */
  opensea: string
  /** Set when the link points at a single token rather than a collection */
  contract?: string
  image: string
  holder: string
  role: string
  /** One-line purpose shown on cards */
  summary: string
  /** Why this token exists in the process */
  purpose: string
  attributes: NftAttribute[]
  /** Token this one references (the Production Order is the parent of everything) */
  linkedTo?: NftId
  /** Accent colour pulled from the artwork */
  accent: string
}

/** Respects Vite's base path so images load on GitHub Pages */
const IMG = `${import.meta.env.BASE_URL}images/`

export const ORDER_ID = 'ORDER-001'
export const PRODUCT = 'Basic Cotton T-Shirts'
export const BATCH_QTY = 2000
export const CHAIN = 'Polygon'

export const NFTS: Record<NftId, NftDef> = {
  factory: {
    id: 'factory',
    tokenId: 2,
    name: 'Factory Credential',
    scope: 'Individual',
    opensea: 'https://opensea.io/collection/factory-credentials-32228465',
    image: IMG + 'factory-credential.jpg',
    holder: 'Samian Islam',
    role: 'Factory representative',
    summary: 'Approves Dhaka Cotton Works (FACTORY-001) as the main factory for ORDER-001.',
    purpose:
      'Issued once the order exists, to approve the facility that will make it, so anyone can check that the order is being made by an approved factory. The approval in this prototype is simulated and the facility is fictional.',
    attributes: [
      { label: 'Factory', value: 'Dhaka Cotton Works' },
      { label: 'Factory ID', value: 'FACTORY-001' },
      { label: 'Order ID', value: ORDER_ID },
      { label: 'Location', value: 'Dhaka, Bangladesh' },
      { label: 'Stage', value: 'Finishing' },
    ],
    linkedTo: 'order',
    accent: '#38e1d0',
  },
  order: {
    id: 'order',
    tokenId: 1,
    name: 'Production Order Passport',
    scope: 'Group',
    opensea: 'https://opensea.io/item/polygon/0xf843cd21c82608de63e21b9e809f4de757b6504f/1',
    contract: '0xf843cd21c82608de63e21b9e809f4de757b6504f',
    image: IMG + 'production-order-passport.jpg',
    holder: 'Crypto Whales Group',
    role: 'Brand',
    summary: 'The digital passport for one production order.',
    purpose:
      'Parent token for the order. Every later credential, handoff and inspection NFT links back to it, so the full history of the order can be traced from one place.',
    attributes: [
      { label: 'Order', value: ORDER_ID },
      { label: 'Product', value: PRODUCT },
      { label: 'Quantity', value: `${BATCH_QTY.toLocaleString('en-US')} units` },
    ],
    accent: '#5ab8ff',
  },
  subcontractor: {
    id: 'subcontractor',
    tokenId: 3,
    name: 'Subcontractor Approval',
    scope: 'Individual',
    opensea: 'https://opensea.io/collection/subcontractor-approval-sc-001',
    image: IMG + 'subcontractor-approval.jpg',
    holder: 'Zayed',
    role: 'Subcontractor · SC-001',
    summary: 'Authorises Zayed (SC-001) to carry out labelling.',
    purpose:
      'Shows that outsourced work is done by an approved party. A batch cannot be handed to a subcontractor who does not hold this token.',
    attributes: [
      { label: 'Subcontractor ID', value: 'SC-001' },
      { label: 'Authorised task', value: 'Labelling' },
      { label: 'Issued by', value: 'Crypto Whales Group' },
    ],
    linkedTo: 'order',
    accent: '#4fd2ff',
  },
  handoff: {
    id: 'handoff',
    tokenId: 4,
    name: 'Batch Handoff',
    scope: 'Individual',
    opensea: 'https://opensea.io/collection/batch-handoff',
    image: IMG + 'batch-handoff.jpg',
    holder: 'Ibrahim',
    role: 'Logistics',
    summary: 'Records a batch moving between facilities, signed by both sides.',
    purpose:
      'Minted only when the sender AND the receiver both confirm. If either sign-off is missing, payment for the order stays held.',
    attributes: [
      { label: 'Stage', value: 'Finishing' },
      { label: 'Quantity', value: `${BATCH_QTY.toLocaleString('en-US')} T-shirts` },
      { label: 'Sign-offs required', value: 'Sender + Receiver' },
    ],
    linkedTo: 'order',
    accent: '#e05ad8',
  },
  finishing: {
    id: 'finishing',
    tokenId: 5,
    name: 'Verified Finishing Completion',
    scope: 'Individual',
    opensea: 'https://opensea.io/collection/verified-finishing-completion',
    image: IMG + 'finishing-completion.jpg',
    holder: 'Lucas',
    role: 'Inspector',
    summary: 'Inspector sign-off that finishing work and records are verified.',
    purpose:
      'The final quality gate. Once minted, the order is complete and the payment held in escrow is released.',
    attributes: [
      { label: 'Order', value: ORDER_ID },
      { label: 'Inspector', value: 'Lucas' },
      { label: 'Result', value: 'Finishing work & records verified' },
    ],
    linkedTo: 'order',
    accent: '#3ff0e0',
  },
}

export const NFT_ORDER: NftId[] = ['order', 'factory', 'subcontractor', 'handoff', 'finishing']

/** Deterministic fake tx hash so the demo looks the same on every run. */
export function fakeTxHash(seed: string): string {
  let h = 2166136261
  let out = ''
  for (let round = 0; out.length < 64; round++) {
    for (const ch of seed + round) {
      h ^= ch.charCodeAt(0)
      h = Math.imul(h, 16777619)
    }
    out += (h >>> 0).toString(16).padStart(8, '0')
  }
  return '0x' + out.slice(0, 64)
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

export function metadataJson(nft: NftDef, mintedAt: string | null): string {
  return JSON.stringify(
    {
      name: `${nft.name} #${nft.tokenId}`,
      description: nft.purpose,
      image: nft.image,
      external_url: nft.opensea,
      attributes: [
        { trait_type: 'Type', value: `${nft.scope} NFT` },
        { trait_type: 'Holder', value: nft.holder },
        { trait_type: 'Role', value: nft.role },
        ...nft.attributes.map((a) => ({ trait_type: a.label, value: a.value })),
        ...(nft.linkedTo ? [{ trait_type: 'Linked to', value: NFTS[nft.linkedTo].name }] : []),
      ],
      chain: CHAIN,
      simulated_mint_at: mintedAt,
    },
    null,
    2,
  )
}
