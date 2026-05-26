import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "products";

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "서버 설정 오류: Supabase 환경변수 없음" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e: any) {
    return NextResponse.json({ error: `폼데이터 파싱 실패: ${e.message}` }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 });

  const originalName = file.name || "image";
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"].includes(ext) ? ext : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

  const contentType = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType, upsert: false });

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ error: `Supabase 오류: ${error.message}` }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return NextResponse.json({ url: publicUrl });
}
