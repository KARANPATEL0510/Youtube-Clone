import { NextRequest, NextResponse } from 'next/server';

// POST /api/premium/create-order
export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const selectedPlan = plan || 'gold';
    const planPrices: Record<string, number> = {
      bronze: 10,
      silver: 50,
      gold: 100,
    };
    const price = planPrices[selectedPlan] || 100;
    const amount = price * 100; // convert to paise

    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      // Fallback mock order (no keys configured)
      return NextResponse.json({
        orderId: `mock_order_${Date.now()}`,
        amount,
        currency: 'INR',
        keyId: 'rzp_test_demo',
        isMock: true,
      });
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const receipt = `prem_${Date.now().toString().slice(-10)}`;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Razorpay order error:', responseText);
      let razorpayMsg = 'Failed to create order';
      try {
        const parsed = JSON.parse(responseText);
        razorpayMsg = parsed?.error?.description || parsed?.error?.reason || razorpayMsg;
      } catch {}
      return NextResponse.json({ error: razorpayMsg }, { status: 500 });
    }

    const order = JSON.parse(responseText);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
