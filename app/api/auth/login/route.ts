import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const users = new Map<string, { password: string; email: string; totp_secret?: string }>()

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password)
  return newHash === hash
}

function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  const base32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let secret = ""
  let bits = 0
  let value = 0

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i]
    bits += 8
    while (bits >= 5) {
      bits -= 5
      secret += base32[(value >> bits) & 31]
    }
  }

  if (bits > 0) {
    secret += base32[(value << (5 - bits)) & 31]
  }

  return secret
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = users.get(email)
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const passwordValid = await verifyPassword(password, user.password)
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Generate TOTP secret if user doesn't have one
    if (!user.totp_secret) {
      user.totp_secret = generateTOTPSecret()
      users.set(email, user)
    }

    // Generate temp token for 2FA verification
    const tempToken = crypto.randomBytes(32).toString("hex")

    return NextResponse.json(
      {
        message: "2FA required",
        requires_2fa: true,
        temp_token: tempToken,
        totp_secret: user.totp_secret,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
