import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'client' | 'producer' | 'admin';
      email: string;
      name?: string | null;
    };
  }
}
