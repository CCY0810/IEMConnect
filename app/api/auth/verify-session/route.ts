import { type NextRequest, NextResponse } from "next/server"

const sessions = new Map<string, { email: string; expires: number }>()

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const session = sessions.get(token)

    if (!session || session.expires < Date.now()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 })
    }

    return NextResponse.json(
      {
        email: session.email,
        authenticated: true,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
