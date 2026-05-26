import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "products";

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "서버 설정 오류: 환경변수 없음" }, { status: 500 });
  }

  const { fileName } = await req.json();
  const ext = (fileName || "image").split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) {
    return NextResponse.json({ error: `서명 URL 생성 실패: ${error.message}` }, { status: 500 });
  }

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return NextResponse.json({ signedUrl: data.signedUrl, publicUrl });
}
