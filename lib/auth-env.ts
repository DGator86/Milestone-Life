/** Auth.js secret — supports legacy NEXTAUTH_SECRET name. */
export function getAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  return secret?.trim() || undefined;
}

/** Google OAuth is only usable when both client id and secret are set. */
export function isGoogleAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

/** Map Auth.js error query codes to user-facing copy. */
export function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "Configuration":
      return "Sign-in is not fully configured on the server. Try email/password, or contact support if this persists.";
    case "AccessDenied":
      return "Access was denied. Please try again or use a different sign-in method.";
    case "Verification":
      return "The sign-in link expired or was already used. Please try again.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "OAuthAccountNotLinked":
      return "Google sign-in failed. Try email/password instead, or sign in with the method you used when you created your account.";
    case "CallbackRouteError":
      return "Sign-in could not be completed. Please try again.";
    case "CredentialsSignin":
      return "Invalid email or password.";
    default:
      return "Sign-in failed. Please try again.";
  }
}
