import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from 'next-auth/adapters';
import { prisma } from '@/lib/prisma';

const providers: NextAuthOptions['providers'] = [
  EmailProvider({
    server: {
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT || 587),
      auth: { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD },
    },
    from: process.env.EMAIL_FROM,
  }),
];

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      (session as any).userId = user.id;
      (session as any).isAdmin = (user as any).isAdmin ?? false;
      return session;
    },
  },
};
