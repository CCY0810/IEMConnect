import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

const users = new Map<string, { password: string; email: string; totp_secret?: string }>()
const sessions = new Map<string, { email: string; expires: number }>()

function generateTOTP(secret: string, time?: number): string {
  const epoch = Math.floor((time || Date.now()) / 1000)
  const counter = Math.floor(epoch / 30)

  const key = Buffer.alloc(secret.length)
  const base32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

  for (let i = 0; i < secret.length; i++) {
    const digit = base32.indexOf(secret[i])
    if (digit === -1) throw new Error("Invalid character in secret")
    key[i] = digit
  }

  const hmac = crypto.createHmac("sha1", key)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  hmac.update(buf)

  const digest = hmac.digest()
  const offset = digest[digest.length - 1] & 0xf
  const code = digest.readUInt32BE(offset) & 0x7fffffff

  return (code % 1000000).toString().padStart(6, "0")
}

export async function POST(request: NextRequest) {
  try {
    const { temp_token, totp_code } = await request.json()

    if (!temp_token || !totp_code) {
      return NextResponse.json({ error: "Temp token and TOTP code are required" }, { status: 400 })
    }

    // In a real app, validate temp_token and find associated user
    // For demo, we'll find the most recent user
    const user = Array.from(users.values()).pop()

    if (!user || !user.totp_secret) {
      return NextResponse.json({ error: "2FA verification failed" }, { status: 401 })
    }

    const expectedCode = generateTOTP(user.totp_secret)

    if (totp_code !== expectedCode) {
      return NextResponse.json({ error: "Invalid TOTP code" }, { status: 401 })
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString("hex")
    sessions.set(sessionToken, {
      email: user.email,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return NextResponse.json(
      {
        message: "2FA verified successfully",
        session_token: sessionToken,
        email: user.email,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: "2FA verification failed" }, { status: 500 })
  }
}
