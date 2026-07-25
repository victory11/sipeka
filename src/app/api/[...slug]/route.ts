import { NextRequest } from "next/server";
import { apiRouter } from "@/server/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string[] }> };

async function dispatch(request: NextRequest, context: Ctx) {
  const { slug } = await context.params;
  return apiRouter(request, slug ?? []);
}

export async function GET(request: NextRequest, context: Ctx) {
  return dispatch(request, context);
}
export async function POST(request: NextRequest, context: Ctx) {
  return dispatch(request, context);
}
export async function PATCH(request: NextRequest, context: Ctx) {
  return dispatch(request, context);
}
export async function PUT(request: NextRequest, context: Ctx) {
  return dispatch(request, context);
}
