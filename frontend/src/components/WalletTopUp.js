import React from 'react';
import { useState } from 'react';
import api from '../api/axios';
import { toast } from 'react-toast';

const WalletTopUp = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    const amountValue = parseFloat(amount);
    if (!amountValue || amountValue < 10) {
      toast.error('Please enter a valid amount (minimum ₹10)');
      return;
    }
    if (amountValue > 100000) {
      toast.error('Amount should not exceed ₹1,00,000');
      return;
      }

    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Please check your internet connection.');
        return;
      }

      const { data } = await api.post('/payment/create-order', { amount: amountValue });
      
      if (!data.order) {
        toast.error(data.message || 'Failed to create payment order');
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: 'INR',
        name: 'VetsCue',
        description: 'Wallet Top-up',
        order_id: data.order.id,
        handler: function (response) {
          // Verify payment on backend
          api.post('/payment/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: amountValue
          }).then(() => {
            toast.success(`₹${amountValue} added to wallet!`);
          }).catch(() => {
            toast.error('Payment verification failed');
          });
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com'
        },
        theme: { color: '#0d9488' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        toast.error('Payment failed: ' + resp.error.description);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Wallet Top-up</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount to top-up"
      />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Top-up Wallet'}
      </button>
    </div>
  );
};

export default WalletTopUp;