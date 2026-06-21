'use client';

import { useState } from 'react';
import { X, Crown, Zap, Download, Infinity, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null); // tracks active loading plan id
  const [error, setError] = useState('');

  const plans = [
    {
      id: 'bronze',
      name: 'Bronze Plan',
      price: 10,
      limit: '7 Minutes playback limit',
      color: 'from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800',
      description: 'Standard access for casual viewers',
      perks: ['7 Min video limit', 'Ad-free experience', '1 Download/day limit'],
    },
    {
      id: 'silver',
      name: 'Silver Plan',
      price: 50,
      limit: '10 Minutes playback limit',
      color: 'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600',
      description: 'Extended limits for frequent users',
      perks: ['10 Min video limit', 'Ad-free experience', '5 Downloads/day limit'],
    },
    {
      id: 'gold',
      name: 'Gold Plan',
      price: 100,
      limit: 'Unlimited playback & downloads',
      color: 'from-yellow-500 to-amber-500 dark:from-yellow-600 dark:to-amber-600',
      description: 'True unlimited access for power users',
      perks: ['Unlimited playback limit', 'Ad-free experience', 'Unlimited downloads', 'Premium badge on profile'],
    },
  ];

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

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);
    setError('');

    const email = user?.email || '';

    try {
      // Create order
      const res = await fetch('/api/premium/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, plan: planId }),
      });
      const orderData = await res.json();

      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      // If mock mode (no Razorpay keys configured), simulate payment
      if (orderData.isMock) {
        const verifyRes = await fetch('/api/premium/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email, plan: planId, isMock: true }),
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
        description: `${planId.toUpperCase()} Plan Subscription`,
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
              email,
              plan: planId,
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
        prefill: {
          email,
        },
        theme: { color: '#7c3aed' },
        modal: { ondismiss: () => setLoading(null) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: { error: { description: string } }) => {
        setError(response.error.description || 'Payment failed');
        setLoading(null);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl z-10 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Header Branding */}
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-white text-center flex flex-col items-center justify-center md:w-1/3">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 md:hidden text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            <Crown className="w-8 h-8 text-yellow-300 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upgrade Plan</h2>
          <p className="text-white/85 text-xs max-w-xs leading-relaxed">
            Choose the perfect plan to extend your playback duration and unlock premium features.
          </p>
        </div>

        {/* Right Side: Plans Selection Grid */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 hidden md:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Select a Subscription Tier</h3>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </p>
          )}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-100 dark:border-gray-800/80 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/60 transition duration-200"
              >
                {/* Header info */}
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{plan.name}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight min-h-[32px] mb-3">{plan.description}</p>
                
                {/* Pricing badge */}
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl p-2.5 text-center mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">Price</span>
                  <span className="text-2xl font-black">₹{plan.price}</span>
                  <span className="text-[10px] block opacity-80">One-time payment</span>
                </div>

                {/* Perks list */}
                <ul className="space-y-1.5 flex-1 mb-5">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="truncate">{perk}</span>
                    </li>
                  ))}
                </ul>

                {/* Upgrade Action Button */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading !== null}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gray-900 dark:bg-violet-600 hover:bg-black dark:hover:bg-violet-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Crown className="w-3.5 h-3.5" />
                      Get {plan.name.split(' ')[0]}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-center text-gray-400 mt-6">
            🔒 Secure checkout powered by Razorpay. An invoice receipt will be sent to your email.
          </p>
        </div>
      </div>
    </div>
  );
}
