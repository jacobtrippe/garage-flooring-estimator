import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    maxAge: 24 * 60 * 60,   // expire after 24h of inactivity
    updateAge: 30 * 60,      // slide the window every 30min of use
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const users = [
          { id: "admin", username: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: "Admin" },
          { id: "user2", username: process.env.USER2_USERNAME, password: process.env.USER2_PASSWORD, name: process.env.USER2_USERNAME },
        ];
        const match = users.find(
          (u) => u.username && u.password && credentials?.email === u.username && credentials?.password === u.password
        );
        if (match) return { id: match.id, email: match.username, name: match.name };
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
      }
      return session;
    },
  },
};
