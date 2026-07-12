import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createSupabaseAdmin, isSupabaseConfigured } from "./supabase";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function uploadPhoto(
  buffer: Buffer,
  filename: string,
  contentType = "image/jpeg"
): Promise<string> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseAdmin()!;
    const filePath = `fotos/${Date.now()}-${filename}`;
    const { error } = await supabase.storage
      .from("relatorio-fotos")
      .upload(filePath, buffer, { contentType, upsert: false });

    if (error) throw new Error(`Erro no upload Supabase: ${error.message}`);

    const { data } = supabase.storage
      .from("relatorio-fotos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  await writeFile(filePath, buffer);
  return `/uploads/${safeName}`;
}

export function getUploadDir() {
  return UPLOAD_DIR;
}
