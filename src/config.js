/**
 * OAuth Authentication Configuration
 * 
 * Set USE_SANDBOX_DEV_MODE to false to use real Google and Kakao OAuth.
 * You can configure these keys in Vercel Environment Variables or directly below.
 */
export const OAUTH_CONFIG = {
  // 1. Google Client ID (from Google Cloud Console -> APIs & Services -> Credentials)
  // Example: '123456789-abcd.apps.googleusercontent.com'
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // 2. Kakao JavaScript Key (from Kakao Developers Console -> My Application -> App Settings -> Keys)
  // Example: 'abcdef0123456789abcdef0123456789'
  KAKAO_JS_KEY: import.meta.env.VITE_KAKAO_JS_KEY || 'YOUR_KAKAO_JAVASCRIPT_KEY',

  // 3. Sandbox Mode (Default: false)
  // Set to false when deploying with real client keys.
  // Set to true or use VITE_USE_SANDBOX_DEV_MODE=true to simulate OAuth flow in local emulator.
  USE_SANDBOX_DEV_MODE: import.meta.env.VITE_USE_SANDBOX_DEV_MODE === 'true' ? true : false
};
