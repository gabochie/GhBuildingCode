import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Handles the OAuth/social SSO callback at the custom sign-in path
// (`/login/sso-callback`). Required because the sign-in route uses a custom
// path (`path="/login"`), so Clerk completes the redirect here.
export default function LoginSsoCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
