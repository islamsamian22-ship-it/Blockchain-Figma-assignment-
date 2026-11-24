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
  standard: 'ERC-721' | 'ERC-721 (soulbound)'
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

export const ORDER_ID = 'ORDER-001'
export const PRODUCT = 'Basic Cotton T-Shirts'
export const BATCH_QTY = 500

export const NFTS: Record<NftId, NftDef> = {
  factory: {
    id: 'factory',
    tokenId: 1,
    name: 'Factory Credential',
    standard: 'ERC-721 (soulbound)',
    image: '/images/factory-credential.png',
    holder: 'Crypto Whales Factory',
    role: 'Manufacturer',
    summary: 'Proves the factory passed onboarding and compliance checks.',
    purpose:
      'Issued once to a verified facility. Non-transferable, so a credential cannot be sold or lent to an unverified factory.',
    attributes: [
      { label: 'Facility', value: 'Crypto Whales Factory' },
      { label: 'Status', value: 'Verified' },
      { label: 'Transferable', value: 'No' },
    ],
    accent: '#38e1d0',
  },
  order: {
    id: 'order',
    tokenId: 2,
    name: 'Production Order Passport',
    standard: 'ERC-721',
    image: '/images/production-order-passport.png',
    holder: 'Crypto Whales Group',
    role: 'Brand',
    summary: 'The digital passport for one production order.',
    purpose:
      'Parent token for the order. Every later credential, handoff and inspection NFT links back to it, so the full history of the order can be traced from one place.',
    attributes: [
      { label: 'Order', value: ORDER_ID },
      { label: 'Product', value: PRODUCT },
      { label: 'Quantity', value: `${BATCH_QTY} units` },
    ],
    linkedTo: 'factory',
    accent: '#5ab8ff',
  },
  subcontractor: {
    id: 'subcontractor',
    tokenId: 3,
    name: 'Subcontractor Approval',
    standard: 'ERC-721 (soulbound)',
    image: '/images/subcontractor-approval.jpg',
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
    standard: 'ERC-721',
    image: '/images/batch-handoff.jpg',
    holder: 'Ibrahim',
    role: 'Logistics',
    summary: 'Records a batch moving between facilities, signed by both sides.',
    purpose:
      'Minted only when the sender AND the receiver both confirm. If either sign-off is missing, payment for the order stays held.',
    attributes: [
      { label: 'Stage', value: 'Finishing' },
      { label: 'Quantity', value: `${BATCH_QTY} T-shirts` },
      { label: 'Sign-offs required', value: 'Sender + Receiver' },
    ],
    linkedTo: 'order',
    accent: '#e05ad8',
  },
  finishing: {
    id: 'finishing',
    tokenId: 5,
    name: 'Verified Finishing Completion',
    standard: 'ERC-721',
    image: '/images/finishing-completion.jpg',
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

export const NFT_ORDER: NftId[] = ['factory', 'order', 'subcontractor', 'handoff', 'finishing']

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
      attributes: [
        { trait_type: 'Holder', value: nft.holder },
        { trait_type: 'Role', value: nft.role },
        ...nft.attributes.map((a) => ({ trait_type: a.label, value: a.value })),
        ...(nft.linkedTo ? [{ trait_type: 'Linked to', value: NFTS[nft.linkedTo].name }] : []),
      ],
      minted_at: mintedAt,
    },
    null,
    2,
  )
}
