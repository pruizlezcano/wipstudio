import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function proxy(request: NextRequest) {
  const isAuthenticated = await auth.api.getSession({
    headers: request.headers,
  });

  // If the user is authenticated, redirect to projects page
  if (isAuthenticated) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // If not authenticated, proceed to the requested auth page
  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/((?!sign-out).*)", "/"],
};
