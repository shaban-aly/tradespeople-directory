import { NextResponse } from "next/server";
import { getSearchData } from "@/lib/db/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getSearchData();
  return NextResponse.json(data);
}
