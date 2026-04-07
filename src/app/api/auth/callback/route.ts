import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createClient();

  // PKCE flow (OAuth / magic link con code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = next ?? (await getRoleRedirect(supabase));
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Token-hash flow (confirmación de email / recuperación de contraseña)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });

    if (!error) {
      // Recuperación de contraseña → siempre a la página de nueva contraseña
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Confirmación de email → redirigir según rol
      const redirectTo = next ?? (await getRoleRedirect(supabase));
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

async function getRoleRedirect(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "/login";

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("userId", user.id)
    .maybeSingle();

  return employee?.role === "ADMIN" ? "/admin" : "/employee";
}
