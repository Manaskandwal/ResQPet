import React, { useState } from 'react';
import axios from 'axios';

const PaymentComponent = () => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create order on backend
      const orderResponse = await axios.post('/api/payment/create-order', { amount });
      
      if (orderResponse.data.success) {
        const options = {
          key: orderResponse.data.keyId, // Use the keyId from backend response
          amount: orderResponse.data.order.amount,
          currency: "INR",
          name: "VetsCue Wallet Top-up",
          description: "VetsCue Wallet Top-up",
          order_id: orderResponse.data.order.id,
          handler: function (response) {
            // Verify payment on backend
            // This would typically call your backend's verify endpoint
          },
          //prefill: {
          //  name: "User Name",
          //  email: "user@example.com",
          //  contact: "9999999999"
          //},
          notes: {
            "address": "Corporate Office"
          },
          theme: {
            "color": "#333"
          }
        };
        
        //const razorpay = new window.Razorpay(options);
        //razorpay.open();
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  // This is a simplified example - you would need to adapt this to your actual frontend framework
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
      {message && <p>{message}</p>}
    </div>
  );
};

export default PaymentComponent;