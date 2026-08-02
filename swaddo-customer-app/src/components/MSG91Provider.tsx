"use client";

import Script from "next/script";

export default function MSG91Provider() {
  return (
    <Script
      id="msg91-init"
      src="https://verify.msg91.com/otp-provider.js"
      strategy="lazyOnload"
      onLoad={() => {
        if (typeof window.initSendOTP === "function") {
          window.initSendOTP({
            widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "",
            tokenAuth: process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "",
            exposeMethods: true,
            success: (data: any) => console.log("MSG91 success:", data),
            failure: (error: any) => console.log("MSG91 failure:", error),
          });
        }
      }}
    />
  );
}
