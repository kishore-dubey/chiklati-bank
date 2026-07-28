import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@chiklati/db";
import { loginSchema } from "@chiklati/shared";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Auth.js only auto-trusts the request Host in development or on Vercel;
  // self-hosted behind Caddy in production needs this set explicitly, or
  // every auth request 500s with "UntrustedHost" (confirmed running the
  // built container with NODE_ENV=production before this fix existed).
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
