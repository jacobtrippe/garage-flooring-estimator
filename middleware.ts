export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/((?!login|api/auth|sign|api/sign|_next/static|_next/image|favicon.ico).*)",
  ],
};
