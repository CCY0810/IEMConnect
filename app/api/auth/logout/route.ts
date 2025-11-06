import { type NextRequest, NextResponse } from "next/server"

const sessions = new Map<string, { email: string; expires: number }>()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      sessions.delete(token)
    }

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
