import bcrypt from "bcryptjs"

const BCRYPT_PREFIXES = ["$2a$", "$2b$", "$2y$"]

function isBcryptHash(value: string) {
  return BCRYPT_PREFIXES.some((prefix) => value.startsWith(prefix))
}

export async function compareEventPassword(provided: string, stored: string) {
  if (!stored || !provided) return false
  if (isBcryptHash(stored)) {
    try {
      return await bcrypt.compare(provided, stored)
    } catch (err) {
      console.warn("failed to compare event password", err)
      return false
    }
  }
  return provided === stored
}

export async function hashEventPassword(password: string) {
  if (!password) return ""
  if (isBcryptHash(password)) return password
  const SALT_ROUNDS = 12
  return bcrypt.hash(password, SALT_ROUNDS)
}

export function extractEventTokens(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((token): token is string => typeof token === "string" && token.trim() !== "")
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    return [raw.trim()]
  }
  return []
}
