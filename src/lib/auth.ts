import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export const authOptions = {
  // In production NextAuth requires a secret. Reuse RESET_TOKEN_SECRET if NEXTAUTH_SECRET isn't set.
  secret: process.env.NEXTAUTH_SECRET || process.env.RESET_TOKEN_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email?.toLowerCase().trim();
          const password = credentials?.password;
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          };
        } catch (err) {
          // Avoid throwing from authorize() (causes generic server error UI).
          console.error('AUTH_AUTHORIZE_ERROR', err);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV !== 'production',
  trustHost: true,
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user.id = token.id as string;
      session.user.role = token.role as 'client' | 'dj' | 'admin';
      return session;
    },
  },
} as const;
