import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// npm install framer-motion

// ─── Types ────────────────────────────────────────────────────────────────────

type NiftyData = {
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  previousClose: number;
  marketState?: string;
  exchange?: string;
  currency?: string;
  usingFallback?: boolean;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatNumber = (num: number | undefined | null): string => {
  if (num == null || isNaN(num)) return '--';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

const formatVolume = (num: number | undefined | null): string => {
  if (num == null || num === 0 || isNaN(num)) return 'N/A';
  if (num >= 10_000_000) return (num / 10_000_000).toFixed(2) + ' Cr';
  if (num >= 100_000)    return (num / 100_000).toFixed(2) + ' L';
  if (num >= 1_000)      return (num / 1_000).toFixed(2) + ' K';
  return num.toString();
};

const toISTString = (date: Date): string =>
  date.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

const toISTFullString = (date: Date): string =>
  date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });

// ─── Animated number (ticks up/down on change) ───────────────────────────────

function AnimatedNumber({ value, style }: { value: string; style?: React.CSSProperties }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      const prevNum = parseFloat(prev.current.replace(/,/g, ''));
      const newNum  = parseFloat(value.replace(/,/g, ''));
      setFlash(newNum >= prevNum ? 'up' : 'down');
      setDisplay(value);
      prev.current = value;
      const t = setTimeout(() => setFlash(null), 800);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      style={{
        ...style,
        transition: 'color 0.4s ease',
        color: flash === 'up' ? '#00d4aa' : flash === 'down' ? '#ff4757' : style?.color,
      }}
    >
      {display}
    </span>
  );
}

// ─── Ticker tape ──────────────────────────────────────────────────────────────

function TickerTape({ data }: { data: NiftyData | null }) {
  const items = data ? [
    { label: 'NIFTY 50',   val: formatNumber(data.regularMarketPrice), chg: data.regularMarketChange },
    { label: 'OPEN',       val: formatNumber(data.regularMarketOpen),  chg: 0 },
    { label: 'HIGH',       val: formatNumber(data.regularMarketDayHigh), chg: 1 },
    { label: 'LOW',        val: formatNumber(data.regularMarketDayLow),  chg: -1 },
    { label: 'PREV CLOSE', val: formatNumber(data.previousClose),      chg: 0 },
    { label: 'VOLUME',     val: formatVolume(data.regularMarketVolume), chg: 0 },
  ] : [];

  return (
    <div style={{
      background: '#0a0e1a',
      borderBottom: '1px solid #1e2d3d',
      overflow: 'hidden',
      height: 36,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex',
        animation: 'ticker 30s linear infinite',
        whiteSpace: 'nowrap',
        gap: 48,
        paddingLeft: '100%',
      }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem' }}>
            <span style={{ color: '#4a6fa5', fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>
              {item.label}
            </span>
            <span style={{ color: '#c8d6e5', fontFamily: 'monospace' }}>{item.val}</span>
            {item.label === 'NIFTY 50' && data && (
              <span style={{ color: data.regularMarketChange >= 0 ? '#00d4aa' : '#ff4757',
                fontFamily: 'monospace', fontSize: '0.68rem' }}>
                {data.regularMarketChange >= 0 ? '▲' : '▼'}
                {Math.abs(data.regularMarketChange).toFixed(2)}
              </span>
            )}
            <span style={{ color: '#1e2d3d', marginLeft: 16 }}>│</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '12px 16px',
      minWidth: 120,
      flex: 1,
    }}>
      <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#4a6fa5', marginBottom: 6, fontFamily: 'monospace' }}>
        {label}
      </p>
      <p style={{ fontSize: '1rem', fontWeight: 600, color: accent ?? '#c8d6e5',
        fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.5px' }}>
        {value}
      </p>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function RangeBar({ low, high, current, isPositive }: {
  low: number; high: number; current: number; isPositive: boolean;
}) {
  const pct = high > low ? Math.max(2, Math.min(98, ((current - low) / (high - low)) * 100)) : 50;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.7rem', color: '#4a6fa5', fontFamily: 'monospace' }}>
          L <span style={{ color: '#ff4757' }}>{formatNumber(low)}</span>
        </span>
        <span style={{ fontSize: '0.7rem', color: '#4a6fa5', fontFamily: 'monospace' }}>
          H <span style={{ color: '#00d4aa' }}>{formatNumber(high)}</span>
        </span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99,
        position: 'relative', overflow: 'visible' }}>
        {/* Track fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%', borderRadius: 99,
            background: isPositive
              ? 'linear-gradient(90deg, #004d40, #00d4aa)'
              : 'linear-gradient(90deg, #7f0000, #ff4757)',
          }}
        />
        {/* Cursor dot */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'absolute', top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 10, height: 10, borderRadius: '50%',
            background: isPositive ? '#00d4aa' : '#ff4757',
            boxShadow: `0 0 8px ${isPositive ? '#00d4aa' : '#ff4757'}`,
            zIndex: 2,
          }}
        />
      </div>
    </div>
  );
}

// ─── Market status badge ──────────────────────────────────────────────────────

function MarketBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 99,
      background: isOpen ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
      border: `1px solid ${isOpen ? 'rgba(0,212,170,0.3)' : 'rgba(255,71,87,0.3)'}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isOpen ? '#00d4aa' : '#ff4757',
        display: 'inline-block',
        boxShadow: isOpen ? '0 0 6px #00d4aa' : '0 0 6px #ff4757',
        animation: isOpen ? 'glow 2s ease-in-out infinite' : 'none',
      }} />
      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
        color: isOpen ? '#00d4aa' : '#ff4757', fontFamily: 'monospace' }}>
        {isOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [data, setData]               = useState<NiftyData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown]     = useState(30);
  const [isStale, setIsStale]         = useState(false);
  const [pulseKey, setPulseKey]       = useState(0); // triggers price flash
  const lastRealData = useRef<NiftyData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/nifty');
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json: NiftyData = await res.json();

      if (json.usingFallback) throw new Error('Fallback data — skipping.');

      lastRealData.current = json;
      setData(json);
      setLastUpdated(new Date());
      setIsStale(false);
      setCountdown(30);
      setPulseKey(k => k + 1);
    } catch (err: any) {
      if (lastRealData.current) {
        setData(lastRealData.current);
        setIsStale(true);
        setError(null);
      } else {
        setError(err.message || 'Could not load market data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);
  useEffect(() => { const t = setInterval(() => setCountdown(p => p > 0 ? p - 1 : 0), 1000); return () => clearInterval(t); }, []);

  const isPositive = (data?.regularMarketChange ?? 0) >= 0;
  const marketOpen = data?.marketState === 'REGULAR';
  const changeAbs  = Math.abs(data?.regularMarketChange ?? 0);
  const changePct  = data?.regularMarketChangePercent ?? 0;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#060910',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700;800&display=swap');`}</style>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, border: '2px solid #1e2d3d',
          borderTopColor: '#00d4aa', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
        <p style={{ color: '#4a6fa5', fontSize: '0.8rem', letterSpacing: '0.15em' }}>
          FETCHING LIVE DATA...
        </p>
      </motion.div>
    </div>
  );

  // ── Hard error ─────────────────────────────────────────────────────────────
  if (error && !data) return (
    <div style={{ minHeight: '100vh', background: '#060910',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700;800&display=swap');`}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠</div>
        <p style={{ color: '#ff4757', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: 8 }}>
          CONNECTION FAILED
        </p>
        <p style={{ color: '#4a6fa5', fontSize: '0.8rem', marginBottom: 28 }}>{error}</p>
        <button onClick={fetchData} style={{
          background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.4)',
          color: '#00d4aa', padding: '10px 28px', borderRadius: 8,
          cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: 1,
        }}>RETRY</button>
      </motion.div>
    </div>
  );

  if (!data) return null;

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&family=Sora:wght@300;400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060910; }

        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes glow  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* Scanline texture overlay */
        .scanlines::after {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 1;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
        }

        /* Grid lines bg */
        .grid-bg {
          background-image:
            linear-gradient(rgba(30,45,61,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,45,61,0.3) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060910; }
        ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 4px; }

        .stat-card {
          animation: fadeUp 0.5s ease both;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.10s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.20s; }
        .stat-card:nth-child(5) { animation-delay: 0.25s; }
        .stat-card:nth-child(6) { animation-delay: 0.30s; }
      `}</style>

      <div className="scanlines" style={{ minHeight: '100vh', background: '#060910',
        fontFamily: "'Sora', sans-serif", color: '#c8d6e5' }}>

        {/* ── Ticker tape ── */}
        <TickerTape data={data} />

        {/* ── Top nav bar ── */}
        <div style={{
          background: 'rgba(6,9,16,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1e2d3d',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo mark */}
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg, #00d4aa, #0080ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 800,
            }}>N</div>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600,
              fontSize: '0.82rem', letterSpacing: '0.05em', color: '#c8d6e5' }}>
              NIFTY<span style={{ color: '#4a6fa5' }}>/</span>50
            </span>
            <span style={{ width: 1, height: 16, background: '#1e2d3d' }} />
            <span style={{ fontSize: '0.72rem', color: '#4a6fa5', fontFamily: 'monospace' }}>
              NSE · {data.exchange ?? 'NSE'} · {data.currency ?? 'INR'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MarketBadge isOpen={marketOpen} />

            {/* Countdown ring */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d3d',
              borderRadius: 8, padding: '4px 10px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#4a6fa5" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#4a6fa5' }}>
                REFRESH IN{' '}
                <span style={{ color: '#00d4aa', fontWeight: 700 }}>{countdown}s</span>
              </span>
            </div>

            {/* Manual refresh */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              style={{
                background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
                borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#00d4aa',
                display: 'flex', alignItems: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </motion.button>
          </div>
        </div>

        {/* ── Stale banner ── */}
        <AnimatePresence>
          {isStale && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'rgba(255,168,0,0.07)', borderBottom: '1px solid rgba(255,168,0,0.2)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.75rem' }}>⚠</span>
                <span style={{ fontSize: '0.72rem', color: '#ffa800', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  DISPLAYING LAST RECORDED DATA
                  {lastUpdated && ` · AS OF ${toISTFullString(lastUpdated)} IST`}
                  {!marketOpen && ' · MARKET CLOSED'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main content ── */}
        <div className="grid-bg" style={{ minHeight: 'calc(100vh - 88px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

            {/* ── Hero section ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid #1e2d3d',
                borderRadius: 16,
                padding: '28px 32px',
                marginBottom: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow accent */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200, borderRadius: '50%',
                background: isPositive
                  ? 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(255,71,87,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>

                {/* Price block */}
                <div>
                  <p style={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#4a6fa5',
                    fontFamily: 'monospace', fontWeight: 700, marginBottom: 8 }}>
                    NIFTY 50 INDEX · ^NSEI
                  </p>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
                    <AnimatedNumber
                      key={pulseKey}
                      value={formatNumber(data.regularMarketPrice)}
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                        fontWeight: 700,
                        color: '#f0f4f8',
                        letterSpacing: '-2px',
                        lineHeight: 1,
                      }}
                    />

                    {/* Change badge */}
                    <motion.div
                      key={`badge-${pulseKey}`}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        background: isPositive ? 'rgba(0,212,170,0.12)' : 'rgba(255,71,87,0.12)',
                        border: `1px solid ${isPositive ? 'rgba(0,212,170,0.3)' : 'rgba(255,71,87,0.3)'}`,
                        borderRadius: 10,
                        padding: '6px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <span style={{
                        color: isPositive ? '#00d4aa' : '#ff4757',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.5px',
                      }}>
                        {isPositive ? '▲' : '▼'} {formatNumber(changeAbs)}
                      </span>
                      <span style={{
                        color: isPositive ? '#00d4aa' : '#ff4757',
                        fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.85,
                      }}>
                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                    </motion.div>
                  </div>

                  <p style={{ marginTop: 10, fontSize: '0.72rem', color: '#4a6fa5', fontFamily: 'monospace' }}>
                    PREV CLOSE:{' '}
                    <span style={{ color: '#8899aa' }}>{formatNumber(data.previousClose)}</span>
                    <span style={{ margin: '0 8px', color: '#1e2d3d' }}>|</span>
                    LAST UPDATE:{' '}
                    <span style={{ color: '#8899aa' }}>{lastUpdated ? toISTString(lastUpdated) : '--'} IST</span>
                  </p>
                </div>

                {/* Quick stats — right side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, minWidth: 240 }}>
                  {[
                    { label: 'OPEN',   val: formatNumber(data.regularMarketOpen),   color: '#c8d6e5' },
                    { label: 'VOLUME', val: formatVolume(data.regularMarketVolume),  color: '#c8d6e5' },
                    { label: 'HIGH',   val: formatNumber(data.regularMarketDayHigh), color: '#00d4aa' },
                    { label: 'LOW',    val: formatNumber(data.regularMarketDayLow),  color: '#ff4757' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2d3d',
                      borderRadius: 10, padding: '10px 14px',
                    }}>
                      <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#4a6fa5',
                        fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>{s.label}</p>
                      <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.95rem',
                        fontWeight: 600, color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Range bar */}
              <RangeBar
                low={data.regularMarketDayLow}
                high={data.regularMarketDayHigh}
                current={data.regularMarketPrice}
                isPositive={isPositive}
              />
            </motion.div>

            {/* ── 52W + market info strip ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {data.fiftyTwoWeekLow != null && (
                <StatPill label="52W LOW"  value={formatNumber(data.fiftyTwoWeekLow)}  accent="#ff4757" />
              )}
              {data.fiftyTwoWeekHigh != null && (
                <StatPill label="52W HIGH" value={formatNumber(data.fiftyTwoWeekHigh)} accent="#00d4aa" />
              )}
              <StatPill label="EXCHANGE" value={data.exchange ?? 'NSE'} />
              <StatPill label="CURRENCY" value={data.currency ?? 'INR'} />
              <StatPill label="MARKET HRS (IST)" value="09:15 – 15:30" />
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, padding: '12px 16px', flex: 1, minWidth: 120,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: '#4a6fa5', marginBottom: 6, fontFamily: 'monospace' }}>
                  AUTO-REFRESH
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Progress ring */}
                  <svg width="20" height="20" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#1e2d3d" strokeWidth="2" />
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#00d4aa" strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - countdown / 30)}`}
                      style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '1rem',
                    fontWeight: 600, color: '#00d4aa' }}>{countdown}s</span>
                </div>
              </div>
            </div>

            {/* ── Bottom footer ── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 8, paddingTop: 12,
              borderTop: '1px solid #1e2d3d',
            }}>
              <p style={{ fontSize: '0.65rem', color: '#2d3f52', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                DATA: YAHOO FINANCE · UPDATES EVERY 30S · ALL TIMES IST (ASIA/KOLKATA)
                {isStale && ' · ⚠ CACHED DATA'}
              </p>
              <a href="https://www.nseindia.com" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.65rem', color: '#4a6fa5', fontFamily: 'monospace',
                  textDecoration: 'none', letterSpacing: '0.05em',
                  display: 'flex', alignItems: 'center', gap: 4 }}>
                VIEW ON NSE ↗
              </a>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}