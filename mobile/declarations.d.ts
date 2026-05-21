declare module 'react-native-razorpay' {
  const RazorpayCheckout: {
    open(options: Record<string, unknown>): Promise<Record<string, string>>;
  };
  export default RazorpayCheckout;
}

declare const process: {
  env: Record<string, string | undefined>;
};

declare module '@expo-google-fonts/manrope' {
  import { FontSource } from 'expo-font';
  export const Manrope_400Regular: FontSource;
  export const Manrope_600SemiBold: FontSource;
  export const Manrope_700Bold: FontSource;
  export const Manrope_800ExtraBold: FontSource;
  export function useFonts(map: Record<string, FontSource>): [boolean, Error | null];
}
