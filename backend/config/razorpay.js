const Razorpay = require('razorpay');

/**
 * Initializes the Razorpay instance in TEST mode.
 * key_id and key_secret must start with "rzp_test_" for test mode.
 */
let razorpayInstance;

const getRazorpay = () => {
    try {
        if (!razorpayInstance) {
            razorpayInstance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });
            console.log('[Razorpay] Instance created in TEST mode.');
        }
        return razorpayInstance;
    } catch (error) {
        console.error('[Razorpay] Initialization error:', error.message);
        throw error;
    }
};

module.exports = { getRazorpay };
