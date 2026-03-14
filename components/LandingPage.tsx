import React, { useState } from 'react';

const PRICE_IDS = {
  usd_monthly:  'price_1TAG2vAHxmIA77jAagUXCyht',
  usd_annual:   'price_1TAG2vAHxmIA77jAgSiw0ShO',
  cad_monthly:  'price_1TAG2wAHxmIA77jA2JwHA0aC',
  cad_annual:   'price_1TAG2wAHxmIA77jAtgJtCc6E',
};

const SM_PENDING_CHECKOUT_KEY = 'sm_pending_checkout';

const CARD_IMAGES = ['card-noir.jpg', 'card-cinematic.jpg', 'card-archive.jpg', 'card-neon.jpg'];

const PLACEHOLDER_CARDS = [
  { title: 'The Last Signal', tagline: 'A lone astronaut picks up a transmission that was never meant to be heard.', genre: 'Sci-Fi', img: CARD_IMAGES[3] },
  { title: 'Hollow Crown', tagline: 'The king is dead. Everyone in the castle has a reason to be glad.', genre: 'Drama', img: CARD_IMAGES[0] },
  { title: 'Neon Pastoral', tagline: 'A documentary about the last farm standing inside a megacity.', genre: 'Documentary', img: CARD_IMAGES[2] },
  { title: 'Split Second', tagline: 'Two detectives. One crime scene. Completely different memories of what happened.', genre: 'Thriller', img: CARD_IMAGES[0] },
  { title: 'Echo Chamber', tagline: 'A podcast host discovers her most loyal listener has been shaping her opinions for years.', genre: 'Mystery', img: CARD_IMAGES[1] },
  { title: 'Saltwater Gods', tagline: 'Three fishing villages. One ancient curse. One summer to break it.', genre: 'Fantasy', img: CARD_IMAGES[2] },
  { title: 'The Pitch', tagline: 'A startup founder realizes mid-presentation that the investors already own her idea.', genre: 'Comedy', img: CARD_IMAGES[3] },
];

interface Props {
  onSignIn: () => void;
}

export const LandingPage: React.FC<Props> = ({ onSignIn }) => {
  const [billingCad, setBillingCad] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(true); // default annual — shows lower monthly equiv

  const handleGetPro = () => {
    const priceId = billingAnnual
      ? (billingCad ? PRICE_IDS.cad_annual   : PRICE_IDS.usd_annual)
      : (billingCad ? PRICE_IDS.cad_monthly  : PRICE_IDS.usd_monthly);
    sessionStorage.setItem(SM_PENDING_CHECKOUT_KEY, priceId);
    onSignIn();
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#e8ecf0', background: '#0b0c10', position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0b0c10; }
        ::-webkit-scrollbar-thumb { background: #1e2136; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #2d314d; }

        @keyframes lp-float-a {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-20px, -30px) scale(1.1); opacity: 0.7; }
        }
        @keyframes lp-float-b {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(25px, -20px) scale(1.08); opacity: 0.5; }
        }
        @keyframes lp-float-c {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          33% { transform: translate(-15px, 20px) scale(1.05); opacity: 0.38; }
          66% { transform: translate(20px, -10px) scale(0.95); opacity: 0.28; }
        }
        @keyframes lp-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes lp-fadeup {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(255,173,102,0.5), 0 8px 32px rgba(255,120,50,0.4); }
          70% { box-shadow: 0 0 0 18px rgba(255,173,102,0), 0 8px 32px rgba(255,120,50,0.4); }
          100% { box-shadow: 0 0 0 0 rgba(255,173,102,0), 0 8px 32px rgba(255,120,50,0.4); }
        }
        @keyframes lp-glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes lp-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .lp-a0 { animation: lp-fadeup 0.7s ease both; }
        .lp-a1 { animation: lp-fadeup 0.7s ease 0.12s both; }
        .lp-a2 { animation: lp-fadeup 0.7s ease 0.26s both; }
        .lp-a3 { animation: lp-fadeup 0.7s ease 0.44s both; }

        .lp-cta-primary {
          background: linear-gradient(135deg, #ffad66 0%, #ff7c3a 100%);
          border: none; border-radius: 50px; cursor: pointer;
          color: #fff; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          transition: transform 0.2s ease;
          animation: lp-pulse-ring 3s ease-out infinite;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-primary:hover { transform: translateY(-2px); }

        .lp-cta-ghost {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 50px; cursor: pointer;
          color: rgba(232,236,240,0.75); font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-ghost:hover { transform: translateY(-2px); border-color: rgba(255,173,102,0.3); background: rgba(255,173,102,0.06); }

        .lp-cta-outline {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.09); border-radius: 50px; cursor: pointer;
          color: rgba(232,236,240,0.55); font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
          transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .lp-cta-outline:hover { transform: translateY(-2px); border-color: rgba(255,173,102,0.22); color: rgba(232,236,240,0.8); }

        .lp-glass {
          background: rgba(8, 14, 32, 0.48);
          backdrop-filter: blur(22px) saturate(1.4);
          -webkit-backdrop-filter: blur(22px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-top-color: rgba(255, 255, 255, 0.12);
        }

        .lp-glass-warm {
          background: linear-gradient(145deg, rgba(255,173,102,0.06) 0%, rgba(8,14,32,0.52) 60%);
          backdrop-filter: blur(22px) saturate(1.4);
          -webkit-backdrop-filter: blur(22px) saturate(1.4);
          border: 1px solid rgba(255,173,102,0.18);
          border-top-color: rgba(255,173,102,0.28);
        }

        .lp-hardware-card {
          background: linear-gradient(145deg, #242427 0%, #1a1a1c 100%);
          box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 2px 1px rgba(255,255,255,0.06), inset 0 -2px 5px rgba(0,0,0,0.4);
          border: 1px solid #0a0a0a;
        }

        .lp-lcd-panel {
          background: #050505;
          box-shadow: inset 3px 5px 15px rgba(0,0,0,1), inset -1px -1px 2px rgba(255,255,255,0.05), 0 1px 0 rgba(255,255,255,0.1);
          border: 1px solid #111;
          position: relative;
          overflow: hidden;
        }
        .lp-lcd-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.1) 50%);
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 1;
        }
        .lp-lcd-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,173,102,0.03);
          mix-blend-mode: overlay;
          z-index: 0;
        }

        .lp-module-active {
          background: linear-gradient(to bottom, #2a2a2a, #1a1a1a);
          box-shadow: 2px 2px 5px rgba(0,0,0,0.5), -1px -1px 1px rgba(255,255,255,0.05), inset 1px 1px 1px rgba(255,255,255,0.1);
        }
        .lp-module-inactive {
          background: #181818;
          box-shadow: inset 1px 1px 3px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.02);
        }

        .lp-gauge {
          background: linear-gradient(135deg, #2a2a2a, #151515);
          box-shadow: 4px 4px 10px rgba(0,0,0,0.6), -1px -1px 2px rgba(255,255,255,0.05), inset 1px 1px 1px rgba(255,255,255,0.05);
          border: 1px solid #333;
        }

        .lp-screw {
          width: 12px; height: 12px; border-radius: 50%;
          background: #111;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 0 rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          position: absolute;
        }

        .lp-feature-card {
          border-radius: 20px;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .lp-feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.5), 0 0 40px rgba(255,173,102,0.08);
        }

        .lp-pricing-card {
          border-radius: 24px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .lp-pricing-card:hover { transform: translateY(-5px); }

        .lp-ticker { animation: lp-scroll 24s linear infinite; white-space: nowrap; }

        .lp-nav-link {
          color: rgba(232,236,240,0.5); text-decoration: none;
          font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
          transition: color 0.2s ease;
        }
        .lp-nav-link:hover { color: #ffad66; }

        .lp-toggle-track {
          width: 44px; height: 24px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px; cursor: pointer; position: relative;
          transition: background 0.2s;
        }
        .lp-toggle-thumb {
          position: absolute; top: 2px;
          width: 20px; height: 20px;
          background: #ffad66; border-radius: 50%;
          transition: left 0.18s ease;
        }

        .lp-glow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          animation: lp-glow-pulse 2s ease-in-out infinite;
        }
        .lp-orange-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ffad66;
          box-shadow: 0 0 6px #ffad66;
        }

        .lp-phone-btn-primary {
          border-radius: 50%;
          background: linear-gradient(to bottom, #444, #1a1a1a);
          box-shadow: 0 5px 10px rgba(0,0,0,0.8), inset 0 2px 1px rgba(255,255,255,0.2), inset 0 -2px 2px rgba(0,0,0,0.6);
          border: 1px solid #222;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s;
        }
        .lp-phone-btn-primary:active { transform: translateY(1px); }

        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── FIXED STATIC BACKGROUND ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: '#0b0c10',
        overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '5%', left: '5%',
          width: '600px', height: '600px', borderRadius: '50%', filter: 'blur(90px)',
          background: 'radial-gradient(circle, rgba(255,173,102,0.14) 0%, transparent 65%)',
          animation: 'lp-float-a 10s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', top: '35%', right: '-5%',
          width: '700px', height: '700px', borderRadius: '50%', filter: 'blur(100px)',
          background: 'radial-gradient(circle, rgba(255,90,30,0.08) 0%, transparent 65%)',
          animation: 'lp-float-b 13s ease-in-out infinite 1.5s',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', left: '30%',
          width: '800px', height: '600px', borderRadius: '50%', filter: 'blur(110px)',
          background: 'radial-gradient(circle, rgba(255,173,102,0.07) 0%, transparent 65%)',
          animation: 'lp-float-c 16s ease-in-out infinite 3s',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── NAV ── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '72px',
          background: 'rgba(11,12,16,0.85)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #ffad66 0%, #ff5c1a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '20px', letterSpacing: '3px', color: '#ffad66' }}>
              STORY MAKR
            </span>
          </div>
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#pricing" className="lp-nav-link">Pricing</a>
            <a href="mailto:hello@storymakr.com" className="lp-nav-link">Enterprise</a>
            <button onClick={onSignIn} className="lp-cta-ghost" style={{ padding: '8px 22px', fontSize: '11px' }}>
              Sign In
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{
          minHeight: '100vh', paddingTop: '120px', paddingBottom: '80px',
          display: 'flex', alignItems: 'center',
          padding: '120px 60px 80px',
          maxWidth: '1280px', margin: '0 auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '80px',
            width: '100%', flexWrap: 'wrap',
          }}>
            {/* Left: Copy */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div className="lp-glass lp-a0" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                borderRadius: '50px', padding: '5px 16px', marginBottom: '36px',
              }}>
                <span className="lp-orange-dot" />
                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '2px', color: '#ffad66', textTransform: 'uppercase' }}>
                  Grand Opening — Pro from $29 USD
                </span>
              </div>

              <h1 className="lp-a1" style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 'clamp(64px, 9vw, 118px)',
                lineHeight: '0.88', letterSpacing: '4px',
                color: '#fff', marginBottom: '30px', marginTop: 0,
              }}>
                SCRIPT.<br />
                <span style={{ color: '#ffad66' }}>VOICE.</span><br />
                VISUALS.
              </h1>

              <p className="lp-a2" style={{
                fontSize: '17px', color: 'rgba(232,236,240,0.52)',
                maxWidth: '440px', lineHeight: '1.7', marginBottom: '48px', fontWeight: 300,
              }}>
                The AI-powered production studio for video creators.
                From story idea to export-ready assets — in minutes, not days.
              </p>

              <div className="lp-a3" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <button onClick={onSignIn} className="lp-cta-primary" style={{ padding: '16px 44px', fontSize: '13px' }}>
                  Start Free with Google
                </button>
                <a href="#pricing" style={{ textDecoration: 'none' }}>
                  <button className="lp-cta-ghost" style={{ padding: '16px 38px', fontSize: '13px' }}>
                    See Plans
                  </button>
                </a>
              </div>

              <div className="lp-a3" style={{
                marginTop: '48px', display: 'flex', gap: '32px', flexWrap: 'wrap',
              }}>
                {[
                  { val: '6', label: 'AI Tools' },
                  { val: '1-Click', label: 'Export' },
                  { val: 'WAV + ZIP', label: 'Output' },
                ].map((s, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '30px', letterSpacing: '2px', color: '#ffad66', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(232,236,240,0.3)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div style={{
              flex: '0 0 auto', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '380px', height: '620px',
            }}>
              {/* Glow behind phone */}
              <div style={{
                position: 'absolute', bottom: '40px', right: '40px',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,173,102,0.3) 0%, rgba(255,90,30,0.15) 50%, transparent 70%)',
                filter: 'blur(30px)',
                animation: 'lp-float-a 8s ease-in-out infinite',
              }} />

              {/* Main phone */}
              <div style={{
                width: '280px', height: '570px',
                border: '10px solid #1a1a1a',
                borderRadius: '44px',
                background: '#0b0c10',
                boxShadow: '0 40px 80px rgba(0,0,0,0.9), 0 0 60px rgba(255,173,102,0.06)',
                overflow: 'hidden',
                position: 'relative', zIndex: 2,
                transform: 'rotate(-4deg)',
                transition: 'transform 0.5s ease',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'rotate(0deg)')}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.transform = 'rotate(-4deg)')}
              >
                <div style={{
                  width: '100%', height: '100%',
                  background: '#1c1c1c',
                  borderRadius: '34px',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  boxShadow: 'inset 2px 2px 3px rgba(255,255,255,0.08), inset -3px -3px 5px rgba(0,0,0,0.5)',
                }}>
                  {/* Hardware screws */}
                  <div style={{ position: 'absolute', top: 16, left: 16, width: 6, height: 6, borderRadius: '50%', background: '#111', boxShadow: 'inset 1px 1px 1px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'absolute', top: 16, right: 16, width: 6, height: 6, borderRadius: '50%', background: '#111', boxShadow: 'inset 1px 1px 1px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1)' }} />

                  {/* Status bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 8px', fontSize: '11px', fontWeight: 500, color: 'rgba(255,173,102,0.8)' }}>
                    <span>09:41</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div className="lp-glow-dot" />
                      <span style={{ fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,173,102,0.6)' }}>REC</span>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 80px', scrollbarWidth: 'none' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
                      <div>
                        <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', letterSpacing: '2px', color: '#e5e5e5' }}>NEW EPISODE</div>
                        <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginTop: '2px' }}>Drafting Phase</div>
                      </div>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3a3a3a, #1a1a1a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '3px 3px 7px rgba(0,0,0,0.7), inset 1px 1px 1px rgba(255,255,255,0.1)',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                    </div>

                    {/* LCD Revenue Panel */}
                    <div className="lp-lcd-panel" style={{ borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
                      <div style={{ position: 'relative', zIndex: 2, color: '#ffad66' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <div style={{ fontSize: '46px', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1, letterSpacing: '-1px' }}>$1.2k</div>
                            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,173,102,0.6)', marginTop: '6px' }}>Revenue Generated</div>
                          </div>
                          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,173,102,0.7)" strokeWidth="1.2" strokeLinecap="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,173,102,0.15)', paddingTop: '12px' }}>
                          <div style={{ display: 'flex', gap: '20px' }}>
                            {[{ label: 'Views', val: '10.5k' }, { label: 'Likes', val: '1.2k' }].map((s, i) => (
                              <div key={i}>
                                <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,173,102,0.4)', marginBottom: '3px' }}>{s.label}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600 }}>{s.val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="lp-glow-dot" />
                            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,173,102,0.7)' }}>ACTIVE</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline track */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#444' }}>Episode Timeline</span>
                        <div className="lp-orange-dot" style={{ width: '6px', height: '6px' }} />
                      </div>
                      <div style={{ background: '#111', borderRadius: '10px', padding: '8px', boxShadow: 'inset 2px 2px 8px rgba(0,0,0,0.9), inset -1px -1px 2px rgba(255,255,255,0.03)', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                        {[
                          { label: 'SCRIPT', active: true },
                          { label: 'VOICE', active: false },
                          { label: 'VISUALS', active: false },
                          { label: 'EXPORT', active: false },
                        ].map((step, i) => (
                          <div key={i} style={{
                            flexShrink: 0, width: '60px', borderRadius: '8px',
                            padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            ...(step.active ? {
                              background: 'linear-gradient(to bottom, #2a2a2a, #1a1a1a)',
                              boxShadow: '2px 2px 5px rgba(0,0,0,0.5), inset 1px 1px 1px rgba(255,255,255,0.1)',
                            } : {
                              background: '#181818',
                              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5)',
                            })
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: step.active ? '#ffad66' : '#333', boxShadow: step.active ? '0 0 6px #ffad66' : 'none' }} />
                            <span style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: step.active ? '#ffad66' : '#444' }}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gauges */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {[
                        { label: 'Listeners', val: '14', unit: 'k', status: 'Growing', statusColor: '#ef4444' },
                        { label: 'Retention', val: '78', unit: '%', status: 'High', statusColor: '#444' },
                      ].map((g, i) => (
                        <div key={i} className="lp-gauge" style={{ borderRadius: '14px', padding: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#888' }}>{g.label}</span>
                          </div>
                          <div style={{ background: '#050505', borderRadius: '8px', padding: '10px', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.05)', border: '1px solid #111' }}>
                            <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: '#ffad66', lineHeight: 1 }}>
                              {g.val}<span style={{ fontSize: '11px', color: 'rgba(255,173,102,0.5)' }}>{g.unit}</span>
                            </div>
                            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: g.statusColor, marginTop: '4px' }}>{g.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div style={{
                    position: 'absolute', bottom: 0, width: '100%',
                    background: 'linear-gradient(to bottom, #1a1a1a, #111)',
                    borderTop: '1px solid #333',
                    height: '72px', borderRadius: '0 0 34px 34px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0 28px 12px',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #333, #111)',
                      boxShadow: '2px 2px 5px rgba(0,0,0,0.8), inset 1px 1px 1px rgba(255,255,255,0.1)',
                      border: '1px solid #222',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,173,102,0.8)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    {/* Center big button */}
                    <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '-30px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 3px 3px 8px rgba(0,0,0,0.9)' }}>
                        <button
                          className="lp-phone-btn-primary"
                          style={{ width: '48px', height: '48px' }}
                          aria-label="Open recording controls"
                          title="Open recording controls"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(232,236,240,0.8)" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                        </button>
                      </div>
                    </div>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: '#151515',
                      boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.8)',
                      border: '1px solid #111',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary phone behind */}
              <div style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%) rotate(8deg)',
                width: '230px', height: '460px',
                border: '8px solid #1a1a1a',
                borderRadius: '36px',
                background: '#0b0c10',
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                overflow: 'hidden', zIndex: 1, opacity: 0.55, filter: 'blur(1px)',
              }}>
                <div style={{ background: '#12141d', width: '100%', height: '100%', padding: '40px 14px 14px' }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '18px', letterSpacing: '2px', color: '#fff', marginBottom: '4px' }}>Recent Uploads</div>
                  <div style={{ fontSize: '11px', color: '#ffad66', marginBottom: '20px' }}>Monetization active</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { title: 'Ep 1: The Beginning', stat: '1.2k Views · $45', gradient: 'linear-gradient(135deg, #ff7c3a, #3b82f6)' },
                      { title: 'Ep 2: Scaling Up', stat: '850 Views · $32', gradient: 'linear-gradient(135deg, #a855f7, #ec4899)' },
                    ].map((ep, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '10px 12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: ep.gradient, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{ep.title}</div>
                          <div style={{ fontSize: '9px', color: 'rgba(232,236,240,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginTop: '2px' }}>{ep.stat}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div style={{ padding: '40px 0 60px', overflow: 'hidden', position: 'relative' }}>
          <p style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'rgba(255,173,102,0.45)', textTransform: 'uppercase', marginBottom: '28px' }}>
            Made with Story Makr
          </p>
          {/* Perspective root — sets the 3D viewing angle */}
          <div style={{ perspective: '1100px', perspectiveOrigin: '50% 55%' }}>
            {/* 3D rotation wrapper — rotateY brings right side forward (bigger), rotateZ tilts strip so right is higher */}
            <div style={{
              transform: 'rotateY(-11deg) rotateZ(-2.5deg)',
              transformStyle: 'preserve-3d',
              paddingTop: '18px', paddingBottom: '28px',
            }}>
              <div className="lp-ticker" style={{ display: 'inline-flex', gap: '18px' }}>
                {[...PLACEHOLDER_CARDS, ...PLACEHOLDER_CARDS].map((card, i) => (
                  <div key={i} style={{
                    width: '210px', flexShrink: 0, borderRadius: '14px', overflow: 'hidden', cursor: 'default',
                    background: 'rgba(20,20,24,0.7)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderTopColor: 'rgba(255,255,255,0.11)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}>
                    {/* Monochromatic thumbnail */}
                    <div style={{ height: '110px', position: 'relative', overflow: 'hidden' }}>
                      <img
                        src={`/${card.img}`}
                        alt={card.title}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center',
                          filter: 'grayscale(1) brightness(0.5) contrast(1.15)',
                          display: 'block',
                        }}
                      />
                      {/* Subtle dark gradient over image bottom */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
                      {/* Orange genre badge */}
                      <span style={{
                        position: 'absolute', bottom: '10px', left: '10px',
                        fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
                        color: '#ffad66', borderRadius: '20px', padding: '3px 10px',
                        border: '1px solid rgba(255,173,102,0.25)',
                      }}>
                        {card.genre}
                      </span>
                    </div>
                    <div style={{ padding: '12px 14px 14px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: 'rgba(232,236,240,0.75)', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(232,236,240,0.28)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{card.tagline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── FEATURES — dark hardware console ── */}
        <section id="features" style={{ padding: '100px 40px', background: 'transparent' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

            <div style={{ marginBottom: '64px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  background: '#1a1a1c', border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: '#555' }}>Full Production Pipeline</span>
              </div>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(44px, 7vw, 80px)', letterSpacing: '3px', color: '#fff', marginBottom: '8px', marginTop: 0 }}>
                Pro-Level Editing
                <span style={{ color: '#ffad66' }}> &amp; Creation Console</span>
              </h2>
              <div style={{ width: '80px', height: '1px', background: 'linear-gradient(to right, rgba(255,173,102,0.5), transparent)' }} />
            </div>

            {/* Hardware console card */}
            <div className="lp-hardware-card" style={{ borderRadius: '40px', overflow: 'hidden', position: 'relative', padding: '60px' }}>
              {/* Corner screws */}
              <div className="lp-screw" style={{ top: '24px', left: '24px' }}><div style={{ width: '6px', height: '1px', background: '#000', transform: 'rotate(45deg)' }} /></div>
              <div className="lp-screw" style={{ top: '24px', right: '24px' }}><div style={{ width: '6px', height: '1px', background: '#000', transform: 'rotate(-12deg)' }} /></div>
              <div className="lp-screw" style={{ bottom: '24px', left: '24px' }}><div style={{ width: '6px', height: '1px', background: '#000', transform: 'rotate(90deg)' }} /></div>
              <div className="lp-screw" style={{ bottom: '24px', right: '24px' }}><div style={{ width: '6px', height: '1px', background: '#000', transform: 'rotate(60deg)' }} /></div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {[
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
                    title: 'Story Idea Generator',
                    desc: 'Keywords + genre + tone → AI episode concepts with cast, setting, and full story arc. Multiple variants instantly.',
                    tag: 'Free + Pro',
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
                    title: 'Script Writer',
                    desc: 'Full screenplay — dialogue, scene directions, voiceover. Single-voice, multi-character, documentary formats.',
                    tag: 'Free + Pro',
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
                    title: 'Voice Synthesis',
                    desc: 'GCP AI voices per character. WAV audio per scene, chapter, or full episode. 7 voice presets, custom assignments.',
                    tag: 'Pro',
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
                    title: 'Scene Image Generator',
                    desc: 'AI visuals for every beat in your script. Custom style prompts, cinematic lighting, scene-by-scene generation.',
                    tag: 'Pro',
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
                    title: 'Thumbnail Maker',
                    desc: 'YouTube-ready cover art. Multiple AI variants optimized for click-through with bold composition and title overlay.',
                    tag: 'Pro',
                  },
                  {
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                    title: 'Episode Series + Export',
                    desc: 'Multi-episode series with linked characters. ZIP export: scripts, WAV audio, scene images, thumbnails. Drop-ready.',
                    tag: 'Pro',
                  },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(145deg, #242427, #1c1c1e)',
                    border: '1px solid #2a2a2a',
                    borderRadius: '20px', padding: '28px 24px',
                    boxShadow: '4px 4px 10px rgba(0,0,0,0.5), inset 1px 1px 1px rgba(255,255,255,0.04)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(255,173,102,0.2)';
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#2a2a2a';
                  }}
                  >
                    <div style={{
                      width: '44px', height: '44px',
                      background: 'rgba(255,173,102,0.06)', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                      border: '1px solid rgba(255,173,102,0.1)',
                    }}>
                      {f.icon}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#e5e5e5', letterSpacing: '0.3px', margin: 0 }}>{f.title}</h3>
                      <span style={{
                        fontSize: '8px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                        color: f.tag === 'Pro' ? '#ffad66' : 'rgba(232,236,240,0.28)',
                        background: f.tag === 'Pro' ? 'rgba(255,173,102,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${f.tag === 'Pro' ? 'rgba(255,173,102,0.18)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '20px', padding: '2px 7px', flexShrink: 0,
                      }}>
                        {f.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'rgba(232,236,240,0.38)', lineHeight: '1.7', margin: 0 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ padding: '100px 40px', background: 'transparent' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: '72px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: '#ffad66', textTransform: 'uppercase', marginBottom: '12px' }}>The Pipeline</p>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px, 6vw, 72px)', letterSpacing: '3px', color: '#fff', margin: 0 }}>
                FROM IDEA TO <span style={{ color: '#ffad66' }}>INCOME</span>
              </h2>
            </div>

            {/* Step cards — horizontal flow */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', position: 'relative' }}>

              {/* Connecting gradient line behind the cards */}
              <div style={{
                position: 'absolute', top: '54px', left: '12.5%', right: '12.5%', height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(255,173,102,0.15) 20%, rgba(255,173,102,0.3) 50%, rgba(255,173,102,0.15) 80%, transparent)',
                pointerEvents: 'none', zIndex: 0,
              }} />

              {[
                {
                  num: '01',
                  label: 'Ideate',
                  title: 'The Spark',
                  desc: 'Drop a keyword. Pick genre, tone, cast. Story Makr returns fully-formed episode concepts — characters, setting, arc — ready to run with.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6l-1 1H9l-1-1C6.5 13.5 5 11.5 5 9a7 7 0 0 1 7-7z"/>
                    </svg>
                  ),
                  accent: 'rgba(255,173,102,0.12)',
                },
                {
                  num: '02',
                  label: 'Write',
                  title: 'The Script',
                  desc: 'The AI writes your full production script inside the app — dialogue, scene directions, voiceover. Edit, refine, lock.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  ),
                  accent: 'rgba(255,173,102,0.08)',
                },
                {
                  num: '03',
                  label: 'Produce',
                  title: 'Voice + Visuals',
                  desc: 'Assign AI voices per character. Synthesize WAV audio. Generate scene images and a click-worthy thumbnail. Everything built right here.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  ),
                  accent: 'rgba(255,173,102,0.08)',
                },
                {
                  num: '04',
                  label: 'Publish',
                  title: 'Ship It',
                  desc: 'Download your ZIP to your favourite editor, or upload direct from Story Makr straight to YouTube. Your audience is waiting.',
                  icon: (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffad66" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="15"/><polyline points="17 6 12 1 7 6"/>
                      <path d="M20 21H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2z"/>
                      <circle cx="8" cy="18" r="1" fill="#ffad66" stroke="none"/>
                      <circle cx="12" cy="18" r="1" fill="#ffad66" stroke="none"/>
                      <circle cx="16" cy="18" r="1" fill="#ffad66" stroke="none"/>
                    </svg>
                  ),
                  accent: 'rgba(255,173,102,0.14)',
                },
              ].map((step, i) => (
                <div key={i} style={{ position: 'relative', zIndex: 1, padding: '0 8px' }}>
                  {/* Ghost number — huge background watermark */}
                  <div style={{
                    fontFamily: "'Bebas Neue', cursive",
                    fontSize: '130px', lineHeight: '1',
                    color: i === 0 || i === 3 ? 'rgba(255,173,102,0.055)' : 'rgba(255,255,255,0.028)',
                    letterSpacing: '-2px',
                    position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                    userSelect: 'none', pointerEvents: 'none', whiteSpace: 'nowrap',
                  }}>
                    {step.num}
                  </div>

                  <div style={{
                    position: 'relative', zIndex: 2,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    paddingTop: '8px',
                  }}>
                    {/* Icon ring */}
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%',
                      background: step.accent,
                      border: `1px solid ${i === 0 || i === 3 ? 'rgba(255,173,102,0.25)' : 'rgba(255,173,102,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '20px',
                      boxShadow: i === 0 || i === 3 ? '0 0 24px rgba(255,173,102,0.1)' : 'none',
                    }}>
                      {step.icon}
                    </div>

                    {/* Step label pill */}
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase',
                      color: 'rgba(255,173,102,0.5)', marginBottom: '8px',
                    }}>
                      {step.label}
                    </span>

                    <h3 style={{
                      fontFamily: "'Bebas Neue', cursive",
                      fontSize: '26px', letterSpacing: '2px', color: i === 0 || i === 3 ? '#ffad66' : '#e5e5e5',
                      margin: '0 0 12px', lineHeight: 1,
                    }}>
                      {step.title}
                    </h3>

                    <p style={{
                      fontSize: '12px', color: 'rgba(232,236,240,0.38)', lineHeight: '1.75',
                      margin: 0, maxWidth: '200px',
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Early access disclaimer */}
            <div style={{
              marginTop: '64px', padding: '18px 24px',
              background: 'rgba(255,173,102,0.03)',
              border: '1px solid rgba(255,173,102,0.08)',
              borderRadius: '14px',
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              maxWidth: '720px', margin: '64px auto 0',
            }}>
              <span style={{ color: '#ffad66', fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>⚡</span>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(232,236,240,0.35)', lineHeight: '1.7' }}>
                <span style={{ color: 'rgba(255,173,102,0.65)', fontWeight: 600 }}>Early Access — </span>
                Some features are still rolling out. What's live is fully functional, and the full platform is in active development. Early adopters at Grand Opening pricing stay at that rate as everything comes online.
              </p>
            </div>

          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ padding: '100px 40px', background: 'transparent' }}>
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: '#ffad66', textTransform: 'uppercase', marginBottom: '12px' }}>Pricing</p>
              <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(36px, 6vw, 68px)', letterSpacing: '3px', color: '#fff', marginBottom: '36px', marginTop: 0 }}>
                START FREE. SCALE WHEN READY.
              </h2>
                <div className="lp-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', borderRadius: '50px', padding: '8px 20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: billingAnnual ? '#ffad66' : 'rgba(232,236,240,0.3)', transition: 'color 0.2s' }}>Annual</span>
                  <button
                    className="lp-toggle-track"
                    onClick={() => setBillingAnnual((b: boolean) => !b)}
                    aria-pressed={billingAnnual}
                    aria-label={billingAnnual ? 'Billing: Annual' : 'Billing: Monthly'}
                    title="Toggle billing period"
                  >
                <div className="lp-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', borderRadius: '50px', padding: '8px 20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: !billingCad ? '#ffad66' : 'rgba(232,236,240,0.3)', transition: 'color 0.2s' }}>USD</span>
                  <button
                    className="lp-toggle-track"
                    onClick={() => setBillingCad((b: boolean) => !b)}
                    aria-pressed={billingCad}
                    aria-label={billingCad ? 'Currency: CAD' : 'Currency: USD'}
                    title="Toggle currency"
                  >
                    <div className="lp-toggle-thumb" style={{ left: billingCad ? '22px' : '2px' }} />
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: billingCad ? '#ffad66' : 'rgba(232,236,240,0.3)', transition: 'color 0.2s' }}>CAD</span>
                </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: !billingAnnual ? '#ffad66' : 'rgba(232,236,240,0.3)', transition: 'color 0.2s' }}>Monthly</span>
                </div>

                {/* USD / CAD toggle */}
                <div className="lp-glass" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', borderRadius: '50px', padding: '8px 20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: !billingCad ? '#ffad66' : 'rgba(232,236,240,0.3)', transition: 'color 0.2s' }}>USD</span>
                  <button className="lp-toggle-track" onClick={() => setBillingCad((b: boolean) => !b)}>
                    <div className="lp-toggle-thumb" style={{ left: billingCad ? '22px' : '2px' }} />
                  </button>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: billingCad ? '#ffad66' : 'rgba(232,236,240,0.3)', transition: 'color 0.2s' }}>CAD</span>
                </div>

              </div>

              {billingAnnual && (
                <p style={{ marginTop: '14px', marginBottom: 0, fontSize: '11px', color: 'rgba(255,173,102,0.5)' }}>
                  Annual plan billed as one payment — {billingCad ? 'CA$468 / year' : 'US$348 / year'}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>

              {/* FREE */}
              <div className="lp-pricing-card lp-hardware-card" style={{ padding: '36px 28px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'rgba(232,236,240,0.3)', textTransform: 'uppercase', marginBottom: '18px', marginTop: 0 }}>Free</p>
                <div style={{ marginBottom: '28px' }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '50px', color: '#fff', letterSpacing: '2px' }}>$0</span>
                  <span style={{ fontSize: '12px', color: 'rgba(232,236,240,0.28)', marginLeft: '6px' }}>forever</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'Story idea generation',
                    'Script generation',
                    'Script analysis',
                    '1 saved project',
                    'TXT export',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(232,236,240,0.45)' }}>
                      <span style={{ color: '#ffad66', flexShrink: 0, fontSize: '14px' }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <button onClick={onSignIn} className="lp-cta-outline" style={{ width: '100%', padding: '14px', fontSize: '11px' }}>Get Started Free</button>
              </div>

              {/* PRO */}
              <div className="lp-pricing-card" style={{
                padding: '36px 28px', position: 'relative',
                background: 'linear-gradient(145deg, rgba(255,173,102,0.07) 0%, #1a1a1c 100%)',
                border: '1px solid rgba(255,173,102,0.18)',
                borderTopColor: 'rgba(255,173,102,0.28)',
                borderRadius: '24px',
                boxShadow: '0 0 80px rgba(255,173,102,0.06), 0 24px 48px rgba(0,0,0,0.5)',
              }}>
                <div style={{
                  position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ffad66, #ff7c3a)',
                  borderRadius: '50px', padding: '4px 18px',
                  fontSize: '9px', fontWeight: 800, letterSpacing: '2px', color: '#fff',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                  boxShadow: '0 4px 16px rgba(255,120,50,0.4)',
                }}>
                  Grand Opening Special
                </div>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: '#ffad66', textTransform: 'uppercase', marginBottom: '18px', marginTop: 0 }}>Pro</p>

                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '50px', color: '#fff', letterSpacing: '2px' }}>
                    {billingAnnual
                      ? (billingCad ? '$39' : '$29')
                      : (billingCad ? '$49' : '$39')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'rgba(232,236,240,0.32)', marginLeft: '6px' }}>
                    {billingCad ? 'CAD' : 'USD'} / mo
                  </span>
                </div>

                {!billingAnnual && (
                  <p style={{ fontSize: '11px', color: 'rgba(232,236,240,0.3)', marginBottom: '6px', marginTop: 0 }}>
                    Save with annual —{' '}
                    <button onClick={() => setBillingAnnual(true)} style={{ background: 'none', border: 'none', padding: 0, color: '#ffad66', fontSize: '11px', cursor: 'pointer' }}>
                      {billingCad ? '$39/mo' : '$29/mo'} billed annually
                    </button>
                  </p>
                )}

                <p style={{ fontSize: '11px', color: 'rgba(255,173,102,0.45)', marginBottom: '28px', marginTop: '4px' }}>
                  {billingAnnual ? 'Grand Opening rate' : 'Flexible month-to-month'}
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    'Story idea generation',
                    'Script writing & analysis',
                    'Text-to-speech voice synthesis',
                    'AI scene image generation',
                    'Thumbnail maker',
                    'Episode series support',
                    'ZIP export — all assets in one package',
                    'Video upload → content generation',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(232,236,240,0.7)' }}>
                      <span style={{ color: '#ffad66', flexShrink: 0, fontSize: '14px' }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <button onClick={handleGetPro} className="lp-cta-primary" style={{ width: '100%', padding: '14px', fontSize: '11px' }}>
                  {billingAnnual ? 'Get Pro — Annual' : 'Get Pro — Monthly'}
                </button>
              </div>

              {/* ENTERPRISE */}
              <div className="lp-pricing-card lp-hardware-card" style={{ padding: '36px 28px' }}>
                <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '3px', color: 'rgba(232,236,240,0.3)', textTransform: 'uppercase', marginBottom: '18px', marginTop: 0 }}>Enterprise</p>
                <div style={{ marginBottom: '28px' }}>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '34px', color: '#fff', letterSpacing: '2px', lineHeight: '1.2', display: 'block' }}>CONTACT US</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Custom volume quotas', 'White-label branding', 'API access', 'Team accounts', 'Priority support', 'Custom integrations'].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(232,236,240,0.45)' }}>
                      <span style={{ color: '#ffad66', flexShrink: 0, fontSize: '14px' }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <a href="mailto:hello@storymakr.com" style={{ textDecoration: 'none', display: 'block' }}>
                  <button className="lp-cta-outline" style={{ width: '100%', padding: '14px', fontSize: '11px' }}>Get in Touch</button>
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: '120px 40px', textAlign: 'center', background: 'transparent' }}>
          <div className="lp-hardware-card" style={{
            maxWidth: '640px', margin: '0 auto',
            borderRadius: '32px', padding: '72px 48px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Corner screws */}
            <div className="lp-screw" style={{ top: '20px', left: '20px' }} />
            <div className="lp-screw" style={{ top: '20px', right: '20px' }} />
            <div className="lp-screw" style={{ bottom: '20px', left: '20px' }} />
            <div className="lp-screw" style={{ bottom: '20px', right: '20px' }} />
            {/* Orange glow center */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', borderRadius: '50%', filter: 'blur(80px)', background: 'radial-gradient(circle, rgba(255,173,102,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <h2 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 'clamp(40px, 7vw, 78px)', letterSpacing: '4px', color: '#fff', marginBottom: '20px', marginTop: 0, position: 'relative', zIndex: 1 }}>
              YOUR STORY IS<br />
              <span style={{ color: '#ffad66' }}>WAITING.</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(232,236,240,0.38)', maxWidth: '340px', margin: '0 auto 44px', lineHeight: '1.65', position: 'relative', zIndex: 1 }}>
              Free to start. No credit card. Just ideas, scripts, voices, and visuals.
            </p>
            <button onClick={onSignIn} className="lp-cta-primary" style={{ padding: '20px 64px', fontSize: '14px', position: 'relative', zIndex: 1 }}>
              Start Creating Free
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding: '24px 40px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
          background: 'rgba(11,12,16,0.8)', backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '15px', letterSpacing: '3px', color: 'rgba(255,173,102,0.5)' }}>
            STORY MAKR
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(232,236,240,0.15)', letterSpacing: '0.5px' }}>
            © {new Date().getFullYear()} Story Makr. All rights reserved.
          </span>
          <a href="mailto:hello@storymakr.com" style={{ fontSize: '11px', color: 'rgba(232,236,240,0.3)', textDecoration: 'none' }}>
            hello@storymakr.com
          </a>
        </footer>

      </div>

    </div>
  );
};
