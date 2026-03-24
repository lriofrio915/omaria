import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  const path = request.nextUrl.pathname;

  const isAuthRoute = path === "/login" || path === "/register";
  const isRoot = path === "/";
  const isAdminOnlyRoute =
    path.startsWith("/admin") || path.startsWith("/employees");
  const isDashboardRoute =
    path.startsWith("/admin") ||
    path.startsWith("/employee") ||
    path.startsWith("/employees") ||
    path.startsWith("/documents") ||
    path.startsWith("/payroll") ||
    path.startsWith("/organigram") ||
    path.startsWith("/ai-agent") ||
    path.startsWith("/profile");

  // No autenticado → redirigir a login
  if (!user && (isDashboardRoute || isRoot)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Autenticado en auth routes o root → redirigir al dashboard correspondiente
  if (user && (isAuthRoute || isRoot)) {
    const url = request.nextUrl.clone();
    url.pathname = role === "ADMIN" ? "/admin" : "/employee";
    return NextResponse.redirect(url);
  }

  // Empleado intentando acceder a rutas solo-admin
  if (user && role === "EMPLOYEE" && isAdminOnlyRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/employee";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
