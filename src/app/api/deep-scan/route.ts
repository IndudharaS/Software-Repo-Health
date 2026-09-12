import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const workerUrl = process.env.ARCAN_WORKER_URL;
  if (!workerUrl) {
    return NextResponse.json(
      {
        error:
          "Deep scan isn't configured. Deploy the worker in /worker and set ARCAN_WORKER_URL.",
      },
      { status: 501 }
    );
  }

  let body: { repoUrl?: string; sizeKb?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const res = await fetch(`${workerUrl.replace(/\/$/, "")}/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ARCAN_WORKER_TOKEN
          ? { Authorization: `Bearer ${process.env.ARCAN_WORKER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        repoUrl: body.repoUrl,
        sizeKb: body.sizeKb,
      }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Deep scan proxy error:", err);
    return NextResponse.json(
      { error: "Couldn't reach the deep-scan worker. It may be starting up — try again shortly." },
      { status: 502 }
    );
  }
}
