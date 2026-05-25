import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/**
 * Refresh the Supabase session on every request and bounce unauthenticated
 * visitors away from the authed shell. Called from the root `proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("YOUR-PROJECT")) {
    // No Supabase configured yet — let public pages render; gated pages will redirect to /login.
    return response;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const isAppRoute =
    url.pathname.startsWith("/bag") ||
    url.pathname.startsWith("/caddy") ||
    url.pathname.startsWith("/round") ||
    url.pathname.startsWith("/rounds") ||
    url.pathname.startsWith("/courses") ||
    url.pathname.startsWith("/stats") ||
    url.pathname.startsWith("/settings");

  if (!user && isAppRoute) {
    const loginUrl = url.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (url.pathname === "/login" || url.pathname === "/")) {
    if (url.pathname === "/login") {
      const next = url.searchParams.get("next") || "/bag";
      const dest = url.clone();
      dest.pathname = next;
      dest.search = "";
      return NextResponse.redirect(dest);
    }
  }

  return response;
}
