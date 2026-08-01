// One-way salted SHA-256 password & PIN hashing utility using Web Crypto API

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashTextWithSalt(text: string, salt: string): Promise<string> {
  if (!text) return '';
  const trimmed = text.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashText(text: string, salt?: string): Promise<{ hash: string; salt: string }> {
  if (!text) return { hash: '', salt: '' };
  const trimmed = text.trim();
  const activeSalt = salt || generateSalt();
  const hash = await hashTextWithSalt(trimmed, activeSalt);
  return { hash, salt: activeSalt };
}

export async function verifyTextMatch(
  entered: string,
  storedHashOrPlain?: string,
  salt?: string
): Promise<boolean> {
  if (!entered || !storedHashOrPlain) return false;
  const enteredTrimmed = entered.trim();
  const storedTrimmed = storedHashOrPlain.trim();

  // 1. If salt exists, calculate hash with salt and compare
  if (salt) {
    const saltedHash = await hashTextWithSalt(enteredTrimmed, salt);
    if (saltedHash.toLowerCase() === storedTrimmed.toLowerCase()) {
      return true;
    }
  }

  // 2. Legacy direct plaintext match check
  if (enteredTrimmed === storedTrimmed) return true;

  // 3. Legacy un-salted SHA-256 Hash match check
  const encoder = new TextEncoder();
  const data = encoder.encode(enteredTrimmed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return legacyHash.toLowerCase() === storedTrimmed.toLowerCase();
}

