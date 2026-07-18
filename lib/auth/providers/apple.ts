/**
 * Apple Sign-In Architecture
 *
 * Prerequisites for production Apple Sign-In:
 *
 * 1. Apple Developer Account
 *    - Create an App ID with Sign In with Apple capability
 *    - Create a Services ID for web authentication
 *    - Configure return URLs: https://<domain>/__/auth/handler
 *
 * 2. Firebase Console
 *    - Enable Apple provider in Authentication > Sign-in method
 *    - Add Services ID, Team ID, Key ID, and private key (.p8)
 *
 * 3. Environment Variables
 *    - NEXT_PUBLIC_APPLE_SIGNIN_ENABLED=true
 *
 * 4. Domain Configuration
 *    - Add domain to Apple Services ID redirect URLs
 *    - Add domain to Firebase authorized domains
 *
 * 5. Implementation
 *    - Client: lib/firebase/auth-actions.ts (signInWithApple)
 *    - Component: components/auth/apple-sign-in-button.tsx
 *    - Uses OAuthProvider("apple.com") with popup or redirect flow
 *
 * 6. Privacy Requirements
 *    - Apple may hide user email (privaterelay.appleid.com)
 *    - Handle nullable email in user profile creation
 *    - Request only email and name scopes
 */

export const APPLE_SIGNIN_SCOPES = ["email", "name"] as const;

export const APPLE_AUTH_HANDLER_PATH = "/__/auth/handler";

export function getAppleRedirectUrls(domain: string): string[] {
  return [
    `https://${domain}${APPLE_AUTH_HANDLER_PATH}`,
    `https://${domain}/login`,
  ];
}

export function isApplePrivateRelayEmail(email: string): boolean {
  return email.endsWith("@privaterelay.appleid.com");
}
