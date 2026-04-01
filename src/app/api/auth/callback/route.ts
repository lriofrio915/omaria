import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createClient();

  // PKCE flow (código de intercambio OAuth / magic link)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const destination = next ?? (type === "recovery" ? "/reset-password" : "/login?confirmed=1");
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Token-hash flow (confirmación de email / recuperación de contraseña)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as Parameters<typeof supabase.auth.verifyOtp>[0]["type"],
    });
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      if (type === "signup" || type === "email") {
        return NextResponse.redirect(`${origin}/login?confirmed=1`);
      }
      return NextResponse.redirect(`${origin}${next ?? "/"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
