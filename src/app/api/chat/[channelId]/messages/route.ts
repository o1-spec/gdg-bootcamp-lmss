import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getChannelIfAuthorized, getChannelMessages } from "@/lib/chat/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { channelId } = await params;
    const channel = await getChannelIfAuthorized(channelId, user.id, user.role);
    if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = await getChannelMessages(channelId);
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
