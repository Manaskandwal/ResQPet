const Razorpay = require('razorpay');

/**
 * Initializes the Razorpay instance in TEST mode.
 * key_id and key_secret must start with "rzp_test_" for test mode.
 */
let razorpayInstance;
let initializationError = null;

const getRazorpay = () => {
    try {
        if (initializationError) {
            throw initializationError;
        }

        if (!razorpayInstance) {
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;

            // Check if keys are configured
            if (!keyId || !keySecret || 
                keyId === 'rzp_test_xxxxxxxxxxxxxxxxxx' || 
                keySecret === 'your_razorpay_test_secret') {
                initializationError = new Error(
                    'Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file, ' +
                    'or use the mock payment endpoint (/api/payment/mock-topup) for testing.'
                );
                throw initializationError;
            }

            razorpayInstance = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
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
