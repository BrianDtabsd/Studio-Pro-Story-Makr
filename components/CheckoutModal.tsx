import React, { useCallback, useState } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createCheckoutSession } from '../services/stripeService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');

const PRO_FEATURES = [
  'AI script generation',
  'Voice narration',
  'Scene visuals',
  'Episode series',
  'Project export',
  'Priority support',
];

interface Props {
  priceId: string;
  onClose: () => void;
}

const CheckoutModal: React.FC<Props> = ({ priceId, onClose }) => {
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    try {
      const { clientSecret } = await createCheckoutSession(priceId);
      if (!clientSecret) throw new Error('No client secret returned from server.');
      return clientSecret;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not start checkout.';
      setFetchError(msg);
      throw e;
    }
  }, [priceId]);

  // Derive display price from priceId
  const isAnnual = priceId.includes('jAgSiw') || priceId.includes('jAtgJt');
  const isCad    = priceId.includes('jA2JwH') || priceId.includes('jAtgJt');
  const currency = isCad ? 'CA$' : 'US$';
  const monthlyEquiv = isAnnual ? (isCad ? '39' : '29') : (isCad ? '49' : '39');
  const annualTotal  = isCad ? '468' : '348';

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 0 80px rgba(255,173,102,0.1), 0 32px 64px rgba(0,0,0,0.6)',
        border: '1px solid rgba(255,173,102,0.15)',
      }}>

        {/* ── Left branded panel ── */}
        <div style={{
          width: '300px', flexShrink: 0,
          background: '#0b0c10',
          borderRight: '1px solid rgba(255,173,102,0.1)',
          display: 'flex', flexDirection: 'column',
          padding: '36px 28px',
          fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffad66', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', letterSpacing: '3px', color: '#ffad66' }}>
                STORY MAKR
              </span>
            </div>
            <span style={{
              display: 'inline-block',
              fontSize: '9px', fontWeight: 700, letterSpacing: '3px',
              color: '#0b0c10', background: '#ffad66',
              padding: '3px 10px', borderRadius: 4,
            }}>PRO</span>
          </div>

          {/* Price */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '52px', color: '#fff', lineHeight: 1 }}>
                {currency}{monthlyEquiv}
              </span>
              <span style={{ fontSize: '13px', color: 'rgba(232,236,240,0.4)' }}>/mo</span>
            </div>
            {isAnnual && (
              <p style={{ fontSize: '11px', color: 'rgba(232,236,240,0.35)', margin: '6px 0 0', lineHeight: 1.4 }}>
                Billed {currency}{annualTotal} annually
              </p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: '24px' }} />

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {PRO_FEATURES.map((f) => (
              <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '13px', color: 'rgba(232,236,240,0.7)' }}>
                <span style={{ color: '#ffad66', fontSize: '14px', flexShrink: 0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* Trust */}
          <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: '12px' }}>🔒</span>
            <span style={{ fontSize: '10px', color: 'rgba(232,236,240,0.25)', lineHeight: 1.4 }}>
              Secured by Stripe · Cancel anytime
            </span>
          </div>
        </div>

        {/* ── Right: Stripe iFrame ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0 }}>

          {/* Close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer',
                color: 'rgba(0,0,0,0.4)', fontSize: '18px', lineHeight: 1,
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {fetchError ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 16, padding: 40, minHeight: 300,
              }}>
                <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 700, margin: 0 }}>Checkout unavailable</p>
                <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: 12, textAlign: 'center', maxWidth: 280, margin: 0 }}>{fetchError}</p>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 20px', borderRadius: 20,
                    border: '1px solid rgba(0,0,0,0.2)',
                    background: 'none', color: '#000', fontSize: 12,
                    cursor: 'pointer', fontWeight: 700,
                  }}
                >Close</button>
              </div>
            ) : (
              <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
