import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isAdminPath = nextUrl.pathname.startsWith("/admin");
  const isDashboardPath = nextUrl.pathname.startsWith("/dashboard");

  if (!isAdminPath && !isDashboardPath) return NextResponse.next();

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/forbidden", nextUrl));
  }

  if (isDashboardPath && req.auth.user.role !== "USER") {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"]
};
