import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "products";

export async function POST(req: NextRequest) {
  const { fileName, contentType } = await req.json();
  if (!fileName) return NextResponse.json({ error: "파일명이 없습니다" }, { status: 400 });

  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
