declare module 'react-native-razorpay' {
  const RazorpayCheckout: {
    open(options: Record<string, unknown>): Promise<Record<string, string>>;
  };
  export default RazorpayCheckout;
}

declare const process: {
  env: Record<string, string | undefined>;
};
