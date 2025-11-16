import bcrypt from "bcryptjs"
import type { DocumentReference } from "firebase-admin/firestore"

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"]

export function isBcryptHash(value: string): boolean {
  return BCRYPT_PREFIXES.some((prefix) => value.startsWith(prefix))
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function ensurePasswordHash(
  ref: DocumentReference | null,
  storedPassword: string,
): Promise<string> {
  if (!storedPassword) {
    return ""
  }
  if (isBcryptHash(storedPassword)) {
    return storedPassword
  }
  const hashed = await hashPassword(storedPassword)
  if (ref) {
    try {
      await ref.update({ password: hashed })
    } catch (error) {
      console.error("Failed to persist hashed password", error)
    }
  }
  return hashed
}

export async function verifyPassword(
  storedPassword: string,
  provided: string,
): Promise<boolean> {
  if (!storedPassword || !provided) {
    return false
  }
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(provided, storedPassword)
  }
  return storedPassword === provided
}
