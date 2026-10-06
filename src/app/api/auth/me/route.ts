/*
|--------------------------------------------------
| npm imports
|--------------------------------------------------
*/
import { NextResponse } from "next/server";

/*
|--------------------------------------------------
| custom imports
|--------------------------------------------------
*/
import { getCurrentUser } from "@/lib/auth/session";

/*
|----------------------------------------------------------------------------------------------------
| GET
|----------------------------------------------------------------------------------------------------
| Handles incoming HTTP GET requests for this endpoint.
*/
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user session" },
      { status: 500 }
    );
  }
}
