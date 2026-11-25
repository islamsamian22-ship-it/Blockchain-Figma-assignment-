import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BATCH_QTY,
  CHAIN,
  NFTS,
  NFT_ORDER,
  ORDER_ID,
  PRODUCT,
  fakeTxHash,
  metadataJson,
  shortHash,
  type NftDef,
  type NftId,
} from './nfts'
import HowItWorks from './HowItWorks'

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

interface MintRecord {
  at: string
  tx: string
  block: number
}

interface LogEntry {
  id: number
  at: string
  text: string
  tone: 'info' | 'success' | 'warn'
}

interface ChainState {
  minted: Partial<Record<NftId, MintRecord>>
  senderConfirmed: boolean
  receiverConfirmed: boolean
  log: LogEntry[]
}

type View = 'simulation' | 'wallet' | 'passport' | 'how'
type ScopeFilter = 'All' | 'Group' | 'Individual'

const QTY = BATCH_QTY.toLocaleString('en-US')

const STORAGE_KEY = 'cw-supply-chain-v1'
const GENESIS_BLOCK = 19_402_118

const EMPTY_STATE: ChainState = {
  minted: {},
  senderConfirmed: false,
  receiverConfirmed: false,
  log: [],
}

function loadState(): ChainState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...EMPTY_STATE, ...(JSON.parse(raw) as ChainState) }
  } catch {
    /* storage unavailable – start fresh */
  }
  return EMPTY_STATE
}

function now(): string {
  return new Date().toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/* Step copy for the simulation – one step per NFT */
const STEPS: Record<NftId, { title: string; actor: string; action: string; detail: string }> = {
  factory: {
    title: 'Approve the factory',
    actor: 'Crypto Whales Group → Dhaka Cotton Works',
    action: 'Issue Factory Credential',
    detail: 'Dhaka Cotton Works (FACTORY-001, Dhaka) is approved as the main production factory.',
  },
  order: {
    title: 'Create the production order',
    actor: 'Crypto Whales Group',
    action: 'Mint Order Passport',
    detail: `${ORDER_ID}: ${QTY} × ${PRODUCT}. Payment is locked in escrow until the order is verified.`,
  },
  subcontractor: {
    title: 'Approve the labelling subcontractor',
    actor: 'Crypto Whales Group → Zayed',
    action: 'Issue Subcontractor Approval',
    detail: 'Zayed (SC-001) is authorised to carry out labelling on this order.',
  },
  handoff: {
    title: 'Hand off the batch for finishing',
    actor: 'Ibrahim (logistics)',
    action: 'Mint Batch Handoff',
    detail: 'Sender and receiver must both sign. A missing sign-off keeps the payment held.',
  },
  finishing: {
    title: 'Inspect finishing work',
    actor: 'Lucas (inspector)',
    action: 'Mint Finishing Completion',
    detail: 'The inspector verifies finishing work and records. This releases the payment.',
  },
}

/* ------------------------------------------------------------------ */
/* Small components                                                    */
/* ------------------------------------------------------------------ */

function NftImage({ nft, className }: { nft: NftDef; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`nft-fallback ${className ?? ''}`} style={{ ['--accent' as string]: nft.accent }}>
        <span className="nft-fallback-token">#{nft.tokenId}</span>
        <span>{nft.name}</span>
        <small>Artwork missing: {nft.image}</small>
      </div>
    )
  }
  return (
    <img
      className={className}
      src={nft.image}
      alt={`${nft.name} NFT artwork`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function PaymentBadge({ state }: { state: ChainState }) {
  const status = state.minted.finishing
    ? { label: 'Payment released', tone: 'success' }
    : state.minted.order
      ? { label: 'Payment held in escrow', tone: 'warn' }
      : { label: 'No order yet', tone: 'muted' }
  return <span className={`badge badge-${status.tone}`}>{status.label}</span>
}

function NftModal({
  nft,
  record,
  onClose,
  onOpen,
}: {
  nft: NftDef
  record?: MintRecord
  onClose: () => void
  onOpen: (id: NftId) => void
}) {
  const [showJson, setShowJson] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => setShowJson(false), [nft.id])

  const children = NFT_ORDER.filter((id) => NFTS[id].linkedTo === nft.id)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ ['--accent' as string]: nft.accent }}
      >
        <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <NftImage nft={nft} className="modal-image" />
        <div className="modal-body">
          <p className="eyebrow">
            #{nft.tokenId} · {nft.scope} NFT · {CHAIN}
          </p>
          <h2 id="modal-title">{nft.name}</h2>
          <p className="muted">{nft.purpose}</p>

          <a className="btn btn-opensea" href={nft.opensea} target="_blank" rel="noopener noreferrer">
            View on OpenSea ↗
          </a>
          {nft.contract && (
            <p className="small muted mono contract" title={nft.contract}>
              Contract {shortHash(nft.contract)} · token 1
            </p>
          )}

          <dl className="attr-grid">
            <div>
              <dt>Holder</dt>
              <dd>{nft.holder}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{nft.role}</dd>
            </div>
            {nft.attributes.map((a) => (
              <div key={a.label}>
                <dt>{a.label}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>

          {record ? (
            <div className="tx-box">
              <div>
                <span className="muted">Simulated tx</span> <code title={record.tx}>{shortHash(record.tx)}</code>
              </div>
              <div>
                <span className="muted">Block</span> <code>{record.block.toLocaleString()}</code>
              </div>
              <div>
                <span className="muted">Reached in demo</span> {record.at}
              </div>
            </div>
          ) : (
            <p className="badge badge-muted">Not reached in the simulation yet</p>
          )}

          {(nft.linkedTo || children.length > 0) && (
            <div className="links">
              {nft.linkedTo && (
                <p>
                  Links to{' '}
                  <button className="link" onClick={() => onOpen(nft.linkedTo!)}>
                    {NFTS[nft.linkedTo].name} #{NFTS[nft.linkedTo].tokenId}
                  </button>
                </p>
              )}
              {children.length > 0 && (
                <p>
                  Referenced by{' '}
                  {children.map((id, i) => (
                    <span key={id}>
                      {i > 0 && ', '}
                      <button className="link" onClick={() => onOpen(id)}>
                        {NFTS[id].name}
                      </button>
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}

          <button className="btn btn-ghost" onClick={() => setShowJson((v) => !v)}>
            {showJson ? 'Hide' : 'View'} token metadata
          </button>
          {showJson && <pre className="json">{metadataJson(nft, record?.at ?? null)}</pre>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Views                                                               */
/* ------------------------------------------------------------------ */

function SimulationView({
  state,
  currentStep,
  onMint,
  onConfirm,
  onOpen,
}: {
  state: ChainState
  currentStep: NftId | null
  onMint: (id: NftId) => void
  onConfirm: (side: 'sender' | 'receiver') => void
  onOpen: (id: NftId) => void
}) {
  const handoffReady = state.senderConfirmed && state.receiverConfirmed

  return (
    <div className="sim-layout">
      <ol className="steps">
        {NFT_ORDER.map((id, i) => {
          const step = STEPS[id]
          const nft = NFTS[id]
          const done = Boolean(state.minted[id])
          const active = currentStep === id
          const status = done ? 'done' : active ? 'active' : 'locked'
          return (
            <li key={id} className={`step step-${status}`} style={{ ['--accent' as string]: nft.accent }}>
              <div className="step-marker" aria-hidden="true">
                {done ? '✓' : i + 1}
              </div>
              <div className="step-content">
                <div className="step-head">
                  <div>
                    <h3>{step.title}</h3>
                    <p className="muted small">{step.actor}</p>
                  </div>
                  {done && (
                    <button className="thumb-btn" onClick={() => onOpen(id)} aria-label={`Open ${nft.name}`}>
                      <NftImage nft={nft} className="thumb" />
                    </button>
                  )}
                </div>
                {(active || done) && <p className="small">{step.detail}</p>}

                {active && id === 'handoff' && (
                  <div className="signoff">
                    <button
                      className={`btn btn-sender ${state.senderConfirmed ? 'is-on' : ''}`}
                      onClick={() => onConfirm('sender')}
                      disabled={state.senderConfirmed}
                    >
                      {state.senderConfirmed ? '✓ Sender confirmed' : 'Sender confirms'}
                    </button>
                    <button
                      className={`btn btn-receiver ${state.receiverConfirmed ? 'is-on' : ''}`}
                      onClick={() => onConfirm('receiver')}
                      disabled={state.receiverConfirmed}
                    >
                      {state.receiverConfirmed ? '✓ Receiver confirmed' : 'Receiver confirms'}
                    </button>
                    {!handoffReady && (
                      <p className="alert" role="status">
                        ⚠ Missing sign-off = payment held
                      </p>
                    )}
                  </div>
                )}

                {active && (
                  <button
                    className="btn btn-primary"
                    onClick={() => onMint(id)}
                    disabled={id === 'handoff' && !handoffReady}
                  >
                    {step.action}
                  </button>
                )}

                {done && (
                  <p className="small mono muted">
                    Minted {nft.name} #{nft.tokenId} · {shortHash(state.minted[id]!.tx)}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      <aside className="panel log-panel">
        <div className="panel-head">
          <h3>Event log</h3>
          <PaymentBadge state={state} />
        </div>
        {state.log.length === 0 ? (
          <p className="muted small">No events yet. Start with step 1.</p>
        ) : (
          <ul className="log">
            {[...state.log].reverse().map((e) => (
              <li key={e.id} className={`log-${e.tone}`}>
                <span className="mono small muted">{e.at}</span>
                <span>{e.text}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function WalletView({ state, onOpen }: { state: ChainState; onOpen: (id: NftId) => void }) {
  const [filter, setFilter] = useState<ScopeFilter>('All')
  const count = NFT_ORDER.filter((id) => state.minted[id]).length
  const visible = NFT_ORDER.filter((id) => filter === 'All' || NFTS[id].scope === filter)
  return (
    <>
      <div className="wallet-head">
        <p className="muted">
          {count} of {NFT_ORDER.length} reached in the simulation. All five are live on OpenSea ({CHAIN}).
        </p>
        <div className="chips" role="group" aria-label="Filter NFTs">
          {(['All', 'Group', 'Individual'] as ScopeFilter[]).map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? 'is-active' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="chip-count">
                {f === 'All' ? NFT_ORDER.length : NFT_ORDER.filter((id) => NFTS[id].scope === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="nft-grid">
        {visible.map((id) => {
          const nft = NFTS[id]
          const record = state.minted[id]
          return (
            <button
              key={id}
              className={`nft-card ${record ? '' : 'is-locked'}`}
              style={{ ['--accent' as string]: nft.accent }}
              onClick={() => onOpen(id)}
            >
              <div className="nft-art">
                <NftImage nft={nft} />
                {!record && <span className="lock">🔒 Locked in demo</span>}
              </div>
              <div className="nft-meta">
                <div className="card-tags">
                  <span className="eyebrow">#{nft.tokenId}</span>
                  <span className={`scope scope-${nft.scope.toLowerCase()}`}>{nft.scope}</span>
                </div>
                <h3>{nft.name}</h3>
                <p className="small muted">{nft.summary}</p>
                <p className="small">
                  <strong>{nft.holder}</strong> · {nft.role}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

function PassportView({ state, onOpen }: { state: ChainState; onOpen: (id: NftId) => void }) {
  const order = NFTS.order
  const linked = NFT_ORDER.filter((id) => NFTS[id].linkedTo === 'order')
  const checks = [
    { label: 'Factory verified', ok: Boolean(state.minted.factory) },
    { label: 'Labelling subcontractor approved', ok: Boolean(state.minted.subcontractor) },
    { label: 'Sender signed handoff', ok: state.senderConfirmed || Boolean(state.minted.handoff) },
    { label: 'Receiver signed handoff', ok: state.receiverConfirmed || Boolean(state.minted.handoff) },
    { label: 'Finishing inspected', ok: Boolean(state.minted.finishing) },
  ]

  return (
    <div className="passport">
      <section className="panel passport-hero" style={{ ['--accent' as string]: order.accent }}>
        <button className="thumb-btn passport-art" onClick={() => onOpen('order')} aria-label="Open order passport NFT">
          <NftImage nft={order} />
        </button>
        <div>
          <p className="eyebrow">Production Order Passport</p>
          <h2>{ORDER_ID}</h2>
          <p className="muted">
            {QTY} × {PRODUCT} · made by Dhaka Cotton Works
          </p>
          <PaymentBadge state={state} />
          {!state.minted.order && <p className="small muted">The passport is minted at step 2 of the simulation.</p>}
        </div>
      </section>

      <section className="panel">
        <h3>Release conditions</h3>
        <ul className="checklist">
          {checks.map((c) => (
            <li key={c.label} className={c.ok ? 'ok' : ''}>
              <span aria-hidden="true">{c.ok ? '✓' : '○'}</span> {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>Linked tokens</h3>
        <ul className="timeline">
          {linked.map((id) => {
            const nft = NFTS[id]
            const rec = state.minted[id]
            return (
              <li key={id} className={rec ? 'done' : ''} style={{ ['--accent' as string]: nft.accent }}>
                <button className="link" onClick={() => onOpen(id)}>
                  {nft.name} #{nft.tokenId}
                </button>
                <span className="small muted">
                  {nft.holder} · {rec ? rec.at : 'pending'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

const VIEWS: { id: View; label: string }[] = [
  { id: 'simulation', label: 'Simulation' },
  { id: 'wallet', label: 'NFT Wallet' },
  { id: 'passport', label: 'Order Passport' },
  { id: 'how', label: 'How it works' },
]

export default function App() {
  const [state, setState] = useState<ChainState>(loadState)
  const [view, setView] = useState<View>('simulation')
  const [openId, setOpenId] = useState<NftId | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const closeModal = useCallback(() => setOpenId(null), [])

  const currentStep = useMemo(() => NFT_ORDER.find((id) => !state.minted[id]) ?? null, [state.minted])

  const addLog = (s: ChainState, text: string, tone: LogEntry['tone'] = 'info'): LogEntry[] => [
    ...s.log,
    { id: s.log.length + 1, at: now(), text, tone },
  ]

  const mint = (id: NftId) => {
    setState((s) => {
      if (s.minted[id] || currentStep !== id) return s
      if (id === 'handoff' && !(s.senderConfirmed && s.receiverConfirmed)) return s
      const nft = NFTS[id]
      const mintedCount = Object.keys(s.minted).length
      const record: MintRecord = {
        at: now(),
        tx: fakeTxHash(`${ORDER_ID}:${id}`),
        block: GENESIS_BLOCK + mintedCount * 7 + 3,
      }
      let log = addLog(s, `Minted ${nft.name} #${nft.tokenId} to ${nft.holder}`, 'success')
      if (id === 'order') log = addLog({ ...s, log }, 'Payment locked in escrow', 'warn')
      if (id === 'finishing') log = addLog({ ...s, log }, `${ORDER_ID} complete. Escrow payment released`, 'success')
      return { ...s, minted: { ...s.minted, [id]: record }, log }
    })
    setOpenId(id)
  }

  const confirm = (side: 'sender' | 'receiver') => {
    setState((s) => {
      const key = side === 'sender' ? 'senderConfirmed' : 'receiverConfirmed'
      if (s[key]) return s
      return { ...s, [key]: true, log: addLog(s, `${side === 'sender' ? 'Sender' : 'Receiver'} signed the batch handoff`) }
    })
  }

  const reset = () => {
    setState(EMPTY_STATE)
    setOpenId(null)
  }

  const progress = Math.round((Object.keys(state.minted).length / NFT_ORDER.length) * 100)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <div>
            <h1>Crypto Whales</h1>
            <p className="small muted">Supply-chain traceability with NFTs</p>
          </div>
        </div>
        <div className="topbar-right">
          <div className="progress" aria-label={`Order progress ${progress}%`}>
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <button className="btn btn-ghost" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={view === v.id}
            className={`tab ${view === v.id ? 'is-active' : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <main>
        {view === 'simulation' && (
          <SimulationView state={state} currentStep={currentStep} onMint={mint} onConfirm={confirm} onOpen={setOpenId} />
        )}
        {view === 'wallet' && <WalletView state={state} onOpen={setOpenId} />}
        {view === 'passport' && <PassportView state={state} onOpen={setOpenId} />}
        {view === 'how' && <HowItWorks />}
      </main>

      <footer className="footer small muted">
        Academic prototype · NFTs live on {CHAIN} via OpenSea · Workflow, sign-offs and escrow are simulated
      </footer>

      {openId && (
        <NftModal nft={NFTS[openId]} record={state.minted[openId]} onClose={closeModal} onOpen={setOpenId} />
      )}
    </div>
  )
}
