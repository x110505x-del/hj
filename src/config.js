/**
 * OAuth Authentication Configuration
 * 
 * Set USE_SANDBOX_DEV_MODE to false to use real Google and Kakao OAuth.
 * Make sure to register your app and set up your client keys in the respective developer consoles.
 */
export const OAUTH_CONFIG = {
  // 1. Google Client ID (from Google Cloud Console -> APIs & Services -> Credentials)
  // Example: '123456789-abcd.apps.googleusercontent.com'
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // 2. Kakao JavaScript Key (from Kakao Developers Console -> My Application -> App Settings -> Keys)
  // Example: 'abcdef0123456789abcdef0123456789'
  KAKAO_JS_KEY: 'YOUR_KAKAO_JAVASCRIPT_KEY',

  // 3. Sandbox Mode (Default: true)
  // Simulates Google/Kakao verification flow for testing in emulator/development.
  // Set to false when deploying with real client keys.
  USE_SANDBOX_DEV_MODE: true
};
