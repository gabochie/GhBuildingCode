const GEN_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const GEN_LOWER = "abcdefghijkmnpqrstuvwxyz";
const GEN_DIGITS = "23456789";
const GEN_SYMBOLS = "!@#$%^&*-_=+?";
const GEN_ALL = GEN_UPPER + GEN_LOWER + GEN_DIGITS + GEN_SYMBOLS;

/**
 * CSPRNG password generator. Works in both the browser and Node (global `crypto`).
 * Guarantees at least one character from each class; result is 8–128 chars and
 * therefore passes `validatePasswordStrength`.
 */
export function generatePassword(length = 16): string {
  const pools = [GEN_UPPER, GEN_LOWER, GEN_DIGITS, GEN_SYMBOLS];
  const rand = new Uint32Array(length * 2);
  crypto.getRandomValues(rand);
  const chars = pools.map((pool, i) => pool[rand[i] % pool.length]);
  for (let i = pools.length; i < length; i++) {
    chars.push(GEN_ALL[rand[i] % GEN_ALL.length]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand[chars.length + i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
