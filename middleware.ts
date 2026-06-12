import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const protectedRoutes = [
  "/dashboard",
  "/kill-list",
  "/goals",
  "/groups",
  "/settings",
  "/timeline",
  "/templates",
  "/ai",
  "/customers",
  "/contacts",
  "/opportunities",
  "/flows",
  "/follow-ups",
  "/tasks",
  "/pipeline",
  "/reports",
  "/onboarding",
];

const authRoutes = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!isAuthed && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthed && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|manifest.json|icons/|api/auth/).*)"],
};
