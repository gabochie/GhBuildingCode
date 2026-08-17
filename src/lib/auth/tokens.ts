import jwt from "jsonwebtoken";

export interface SessionClaims {
  sub: string;
  email: string;
  name: string;
  role: string;
  plan: string;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set to a value of at least 16 chars.");
  }
  return secret;
}

export function signSession(claims: SessionClaims): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(claims, getSecret(), { expiresIn: expiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifySession(token: string): SessionClaims | null {
  try {
    return jwt.verify(token, getSecret()) as SessionClaims;
  } catch {
    return null;
  }
}
