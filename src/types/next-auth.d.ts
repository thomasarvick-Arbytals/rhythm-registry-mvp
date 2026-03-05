declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'client' | 'dj' | 'admin';
      email: string;
      name?: string | null;
    };
  }
}
