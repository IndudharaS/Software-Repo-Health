import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/deep-scan/[id]">
) {
  const workerUrl = process.env.ARCAN_WORKER_URL;
  if (!workerUrl) {
    return NextResponse.json(
      { error: "Deep scan isn't configured." },
      { status: 501 }
    );
  }

  const { id } = await ctx.params;

  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, "")}/scan/${id}`, {
      headers: process.env.ARCAN_WORKER_TOKEN
        ? { Authorization: `Bearer ${process.env.ARCAN_WORKER_TOKEN}` }
        : {},
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Deep scan poll proxy error:", err);
    return NextResponse.json(
      { error: "Couldn't reach the deep-scan worker." },
      { status: 502 }
    );
  }
}
