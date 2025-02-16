import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Admin user
          if (credentials?.email === "admin@viken.com" && credentials?.password === "Admin123!!") {
            return {
              id: "1",
              name: "Admin User",
              email: credentials.email,
              role: "admin"
            }
          }
          // Regular user
          if (credentials?.email === "adham.nidam@gmail.com" && credentials?.password === "Password123!!") {
            return {
              id: "2",
              name: "Test User",
              email: credentials.email,
              role: "user"
            }
          }
          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET
})

export { handler as GET, handler as POST } 