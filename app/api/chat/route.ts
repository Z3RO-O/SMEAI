export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  const { message } = await req.json();

  const result = await geminiModel.generateContent(message);

  return NextResponse.json({
    reply: result.response.text(),
  });
}
