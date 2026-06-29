/**
 * OAuth Authentication Configuration
 * 
 * Set USE_SANDBOX_DEV_MODE to false to use real Google and Kakao OAuth.
 * You can configure these keys in Vercel Environment Variables or directly below.
 */
export const OAUTH_CONFIG = {
  // 1. Google Client ID (from Google Cloud Console -> APIs & Services -> Credentials)
  // Retrieved from your Google Cloud Console project: hanjamaster
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '129173277068-q1q0eu7enee9gptru1s507q6rfv3shtm.apps.googleusercontent.com',

  // 2. Kakao JavaScript Key (from Kakao Developers Console -> My Application -> App Settings -> Keys)
  // Configured using your actual Kakao Developers Console key.
  KAKAO_JS_KEY: import.meta.env.VITE_KAKAO_JS_KEY || '6a1320893ecff96b18fe95ebacb63028',

  // 3. Sandbox Mode (Default: false)
  // Set to false when deploying with real client keys.
  // Set to true or use VITE_USE_SANDBOX_DEV_MODE=true to simulate OAuth flow in local emulator.
  USE_SANDBOX_DEV_MODE: import.meta.env.VITE_USE_SANDBOX_DEV_MODE === 'true' ? true : false
};
