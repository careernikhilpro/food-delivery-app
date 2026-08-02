export {};
declare global {
  interface Window {
    sendOtp: (identifier: string, success: (data: any) => void, failure: (error: any) => void) => void;
    verifyOtp: (otp: string, success: (data: any) => void, failure: (error: any) => void) => void;
    initSendOTP: (config: any) => void;
  }
}
