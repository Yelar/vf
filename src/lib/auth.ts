import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Dynamic import type for auth functions
type AuthDbModule = {
  verifyPassword: (email: string, password: string) => Promise<{ id: string; email: string; name: string } | null>;
};

// Only import MongoDB functions when not in Edge Runtime
let authDbModule: AuthDbModule | null = null;

async function getAuthModule(): Promise<AuthDbModule | null> {
  if (typeof window === 'undefined' && process.env.NEXT_RUNTIME !== 'edge') {
    if (!authDbModule) {
      try {
        authDbModule = await import("./auth-db-mongo");
      } catch (error) {
        console.error("Failed to load auth-db-mongo:", error);
        return null;
      }
    }
    return authDbModule;
  }
  return null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Skip auth logic in Edge Runtime (middleware will handle auth differently)
        if (process.env.NEXT_RUNTIME === 'edge') {
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const authModule = await getAuthModule();
          if (!authModule) {
            console.error("Auth module not available");
            return null;
          }

          const user = await authModule.verifyPassword(
            credentials.email as string,
            credentials.password as string
          );

          if (user) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: user.name,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          
          // Check if the error is due to unverified email
          if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
            // Return a special error that can be handled by the client
            throw new Error('EMAIL_NOT_VERIFIED');
          }
          
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
}); 