import { useState } from 'react'
import { BATCH_QTY, CHAIN, NFTS, NFT_ORDER, ORDER_ID, fakeTxHash, shortHash, type NftId } from './nfts'

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const PASSPORT_CONTRACT = NFTS.order.contract!

type PersonId = 'brand' | 'factory' | 'zayed' | 'ibrahim' | 'lucas' | 'shopper'

interface Person {
  id: PersonId
  name: string
  role: string
  holds: NftId[]
  does: string[]
  seesIn: string[]
  /** Shoppers and auditors read the record without a wallet */
  noWallet?: boolean
}

const PEOPLE: Person[] = [
  {
    id: 'brand',
    name: 'Crypto Whales Group',
    role: 'Brand · shared team wallet',
    holds: ['order'],
    does: [
      'Creates ORDER-001 and mints the Production Order Passport',
      'Issues the Factory Credential and Subcontractor Approval',
      'Funds the escrow payment for the order',
    ],
    seesIn: ['This app (full order view)', 'OpenSea collection pages', 'Polygonscan for every transaction'],
  },
  {
    id: 'factory',
    name: 'Samian Islam',
    role: 'Factory representative · Dhaka Cotton Works',
    holds: ['factory'],
    does: [
      'Holds the credential proving Dhaka Cotton Works (FACTORY-001) is approved',
      'Signs as the sender when a batch leaves the factory',
    ],
    seesIn: ['Wallet app or OpenSea profile', 'This app (orders assigned to Dhaka Cotton Works)'],
  },
  {
    id: 'zayed',
    name: 'Zayed',
    role: 'Subcontractor · SC-001',
    holds: ['subcontractor'],
    does: ['Holds the approval to carry out labelling', 'Signs as the receiver when a batch arrives for labelling'],
    seesIn: ['Wallet app or OpenSea profile', 'This app (only the work he is approved for)'],
  },
  {
    id: 'ibrahim',
    name: 'Ibrahim',
    role: 'Logistics',
    holds: ['handoff'],
    does: ['Records each batch transfer between facilities', 'Collects both sign-offs before the handoff is minted'],
    seesIn: ['Wallet app', 'This app (pending handoffs waiting for a signature)'],
  },
  {
    id: 'lucas',
    name: 'Lucas',
    role: 'Inspector',
    holds: ['finishing'],
    does: ['Inspects finishing work and records', 'Mints the completion NFT, which releases the payment'],
    seesIn: ['Wallet app', 'This app (orders ready for inspection)'],
  },
  {
    id: 'shopper',
    name: 'Shopper or auditor',
    role: 'Public, read-only',
    holds: [],
    does: ['Scans the QR code on the garment’s care label', 'Reads the order’s history: factory, handoffs, inspection'],
    seesIn: ['A public passport page in the phone browser, with no wallet or crypto needed'],
    noWallet: true,
  },
]

const FUTURE: { title: string; risk: string; next: string }[] = [
  {
    title: 'Credentials can be sold or given away',
    risk: 'NFTs listed on OpenSea are normally transferable, so a Factory Credential or Subcontractor Approval could end up with someone who was never approved.',
    next: 'Make credentials non-transferable (ERC-5192 “soulbound”) and let the brand revoke them.',
  },
  {
    title: 'Personal names on a permanent ledger',
    risk: 'Names like Samian Islam, Zayed, Ibrahim and Lucas in token metadata cannot be deleted later. That conflicts with data-protection rights such as GDPR’s right to erasure.',
    next: 'Put pseudonymous IDs (SC-001, INSP-001) on-chain and keep names in a private database that can be edited.',
  },
  {
    title: 'The chain only proves who signed, not what happened',
    risk: 'If someone signs a handoff for 2,000 shirts when only 1,800 arrived, the blockchain records the false number permanently. This is the “oracle problem”.',
    next: 'Back sign-offs with evidence: photos, weight scans, third-party audits, or IoT readings attached to the token.',
  },
  {
    title: 'Links between tokens live only in this app',
    risk: 'The Handoff and Finishing NFTs “link” to the Order Passport only in the app’s code. On-chain, they are separate tokens in separate collections.',
    next: 'Deploy one contract that stores the parent order ID inside each child token, so anyone can verify the chain of custody.',
  },
  {
    title: 'Escrow is simulated',
    risk: 'No money moves. A real version needs a smart contract holding funds (e.g. a stablecoin), a security audit, and a legal agreement that a court would recognise.',
    next: 'Add a dispute path for when a sign-off is missing for a legitimate reason, such as a lost phone or a damaged batch.',
  },
  {
    title: 'Lost or stolen keys',
    risk: 'If a factory manager loses their phone, the credential is lost. If a key is stolen, someone can sign handoffs in their name.',
    next: 'Use wallets with account recovery for individuals, and a multi-signature wallet (several people must approve) for group NFTs.',
  },
  {
    title: 'Supplier relationships become public',
    risk: 'Anyone can read Polygon. Competitors could see which factories and subcontractors the brand uses, and in what volumes.',
    next: 'Keep commercial details encrypted or off-chain and publish only proofs, or use a permissioned network for sensitive data.',
  },
  {
    title: 'Not everyone has a crypto wallet or good internet',
    risk: 'Factory and logistics staff may not have smartphones, crypto experience, or a stable connection.',
    next: 'Use email or phone-number login wallets, let the brand pay transaction fees, and allow signing offline with upload later.',
  },
  {
    title: 'Scale: one token per batch or per garment?',
    risk: `One NFT per order is cheap. One per shirt (${BATCH_QTY.toLocaleString('en-US')} for this order alone) gives item-level tracing but costs more and needs batch minting.`,
    next: 'Use ERC-1155, which can mint many identical items in one transaction, if item-level tracking is required.',
  },
  {
    title: 'Regulation is arriving',
    risk: 'The EU’s Ecodesign regulation (ESPR) will require Digital Product Passports for textiles. A custom format may not meet the required data fields.',
    next: 'Align the passport fields and QR codes with the EU format and GS1 Digital Link so the data can be reused for compliance.',
  },
]

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function exampleAddress(id: string): string {
  return '0x' + fakeTxHash('wallet:' + id).slice(2, 42)
}

export default function HowItWorks() {
  const [personId, setPersonId] = useState<PersonId>('zayed')
  const person = PEOPLE.find((p) => p.id === personId)!

  return (
    <div className="how">
      <section className="panel how-intro">
        <p className="eyebrow">How it works</p>
        <h2>From a prototype to a system people use</h2>
        <p className="muted">
          This page explains what is actually on the blockchain, how each person would receive and use their NFT, how
          the records stay portable, and what still needs solving before this could run for real.
        </p>
        <div className="real-vs-sim">
          <div>
            <h3>Real today</h3>
            <ul>
              <li>Five NFTs minted on {CHAIN} and listed on OpenSea</li>
              <li>
                Production Order Passport contract{' '}
                <a
                  href={`https://polygonscan.com/address/${PASSPORT_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                >
                  {shortHash(PASSPORT_CONTRACT)}
                </a>
              </li>
              <li>Ownership and transfer history, publicly verifiable</li>
            </ul>
          </div>
          <div>
            <h3>Simulated in this app</h3>
            <ul>
              <li>The order of steps and the rules between them</li>
              <li>Sender and receiver sign-offs</li>
              <li>Escrow payment and its release</li>
              <li>Links between tokens and transaction hashes</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>1 · What lives on the blockchain</h3>
        <p className="muted small">
          A blockchain stores small, permanent facts. Images and descriptions are too large and live elsewhere, with
          the token pointing to them.
        </p>
        <div className="stack-diagram" role="img" aria-label="On-chain data points to off-chain metadata and images">
          <div className="stack-box onchain">
            <p className="eyebrow">On-chain · {CHAIN}</p>
            <ul>
              <li>Contract address</li>
              <li>Token ID</li>
              <li>Owner’s wallet address</li>
              <li>Every transfer, with time and sender</li>
              <li>A link (token URI) to the metadata</li>
            </ul>
          </div>
          <div className="stack-arrow" aria-hidden="true">
            points to
          </div>
          <div className="stack-box offchain">
            <p className="eyebrow">Off-chain metadata</p>
            <ul>
              <li>Name and description</li>
              <li>Attributes (order ID, role, quantity)</li>
              <li>Artwork image</li>
              <li>Hosted by OpenSea, IPFS or a server</li>
            </ul>
          </div>
        </div>
        <p className="small">
          <strong>Why {CHAIN}:</strong> it runs the same smart contracts as Ethereum (it is “EVM-compatible”), but
          transactions cost a fraction of a cent and confirm in seconds. That matters when every handoff is a
          transaction.
        </p>
        <p className="small muted">
          Not yet checked: whether the contracts are ERC-721 or ERC-1155, and where the metadata is stored. Both are
          visible on OpenSea under each item’s “Details”.
        </p>
      </section>

      <section className="panel">
        <h3>2 · Getting the NFTs to the right people</h3>
        <ol className="flow">
          <li>
            <strong>Create a wallet</strong>
            <span className="small muted">
              Each person gets a wallet address. People new to crypto can sign in with email and get a wallet created
              for them.
            </span>
          </li>
          <li>
            <strong>Brand mints the NFT</strong>
            <span className="small muted">
              Minted straight to the recipient’s address, or minted to the brand and then transferred.
            </span>
          </li>
          <li>
            <strong>Recipient claims it</strong>
            <span className="small muted">
              If they have no wallet yet, they get a claim link or QR code and collect the NFT when they sign up.
            </span>
          </li>
          <li>
            <strong>The group NFT goes to a shared wallet</strong>
            <span className="small muted">
              The Production Order Passport sits in a wallet that needs several team members to approve any action
              (multi-signature).
            </span>
          </li>
        </ol>
        <p className="small">
          <strong>In this project today:</strong> the NFTs were created on OpenSea. The one group NFT, the Production
          Order Passport, belongs to the whole team. The four individual NFTs belong to one member each: Samian Islam
          (Factory Credential), Zayed, Ibrahim and Lucas. Sending each one to its holder’s own
          wallet is the step that turns them from pictures into credentials.
        </p>
      </section>

      <section className="panel">
        <h3>3 · How each person sees it</h3>
        <div className="chips person-chips" role="group" aria-label="Choose a person">
          {PEOPLE.map((p) => (
            <button
              key={p.id}
              className={`chip ${personId === p.id ? 'is-active' : ''}`}
              aria-pressed={personId === p.id}
              onClick={() => setPersonId(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="person-view">
          <div className="person-wallet">
            <p className="eyebrow">{person.noWallet ? 'No wallet needed' : 'Wallet'}</p>
            <h4>{person.name}</h4>
            <p className="small muted">{person.role}</p>
            {!person.noWallet && (
              <p className="small mono muted" title="Example address for illustration">
                {shortHash(exampleAddress(person.id))} <span className="tag">example</span>
              </p>
            )}
            {person.holds.length > 0 ? (
              <div className="held">
                {person.holds.map((id) => (
                  <a key={id} className="held-nft" href={NFTS[id].opensea} target="_blank" rel="noopener noreferrer">
                    <img src={NFTS[id].image} alt="" />
                    <span>{NFTS[id].name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="qr-mock" aria-hidden="true">
                <div className="qr-grid">
                  {Array.from({ length: 49 }, (_, i) => (
                    <span key={i} className={(i * 7 + (i % 5)) % 3 === 0 ? 'on' : ''} />
                  ))}
                </div>
                <span className="small">Scan to view {ORDER_ID}</span>
              </div>
            )}
          </div>
          <div className="person-details">
            <h4>What they do</h4>
            <ul>
              {person.does.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <h4>Where they see it</h4>
            <ul>
              {person.seesIn.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>4 · Keeping it portable</h3>
        <p className="muted small">
          Portable means the records still work if this app, OpenSea, or the team disappears.
        </p>
        <ul className="portable">
          <li>
            <strong>Open standards.</strong> NFTs follow shared standards (ERC-721 / ERC-1155), so any wallet,
            marketplace or block explorer can read them. They are not locked to OpenSea or this app.
          </li>
          <li>
            <strong>Permanent file storage.</strong> Store metadata and images on IPFS or Arweave, where the address
            is a fingerprint of the file. If a server goes down, the link still works and the file cannot be swapped.
          </li>
          <li>
            <strong>Standard metadata.</strong> The JSON shown under “View token metadata” uses the common format
            marketplaces expect, so other systems can import it.
          </li>
          <li>
            <strong>Move between chains.</strong> Because {CHAIN} is EVM-compatible, the same contracts can be
            deployed on Ethereum or other compatible networks if needed.
          </li>
          <li>
            <strong>Readable without crypto.</strong> The QR code on the label opens a normal web page, so shoppers
            and auditors never need a wallet.
          </li>
        </ul>
      </section>

      <section className="panel">
        <h3>5 · Not yet taken into account</h3>
        <p className="muted small">Open issues to solve before a real rollout, and a suggested next step for each.</p>
        <div className="future-grid">
          {FUTURE.map((f) => (
            <article key={f.title} className="future-card">
              <h4>{f.title}</h4>
              <p className="small muted">{f.risk}</p>
              <p className="small">
                <strong>Next step:</strong> {f.next}
              </p>
            </article>
          ))}
        </div>
      </section>

      <p className="small muted center">
        {NFT_ORDER.length} NFTs · {CHAIN} ·{' '}
        <a href={NFTS.order.opensea} target="_blank" rel="noopener noreferrer">
          View the Order Passport on OpenSea
        </a>
      </p>
    </div>
  )
}
