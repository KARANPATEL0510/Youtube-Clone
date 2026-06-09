'use client';

import { useState } from 'react';
import { X, Crown, Zap, Download, Infinity, Check, Loader2 } from 'lucide-react';

interface PremiumModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

export default function PremiumModal({ userId, onClose, onSuccess }: PremiumModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      // Create order
      const res = await fetch('/api/premium/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const orderData = await res.json();

      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      // If mock mode (no Razorpay keys configured), simulate payment
      if (orderData.isMock) {
        const verifyRes = await fetch('/api/premium/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, isMock: true }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          onSuccess();
          onClose();
        } else {
          throw new Error('Payment verification failed');
        }
        return;
      }

      // Real Razorpay checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay');

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ViewTube Premium',
        description: 'Unlimited Downloads — Lifetime Access',
        order_id: orderData.orderId,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verifyRes = await fetch('/api/premium/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            onSuccess();
            onClose();
          } else {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {},
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: { error: { description: string } }) => {
        setError(response.error.description || 'Payment failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const features = [
    { icon: Infinity, text: 'Unlimited daily downloads' },
    { icon: Download, text: 'Access all video downloads' },
    { icon: Zap, text: 'Priority download speed' },
    { icon: Crown, text: 'Premium badge on profile' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <Crown className="w-8 h-8 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Go Premium</h2>
          <p className="text-white/80 text-sm">Unlock unlimited video downloads</p>
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-gray-900 p-6">
          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-gray-500 text-lg">₹</span>
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">499</span>
              <span className="text-gray-500">/lifetime</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">One-time payment. No recurring charges.</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
                <Check className="w-4 h-4 text-green-500 ml-auto" />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all duration-200 shadow-lg hover:shadow-violet-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                Upgrade to Premium
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-400 mt-3">
            🔒 Secure payment powered by Razorpay (Test Mode)
          </p>
        </div>
      </div>
    </div>
  );
}
