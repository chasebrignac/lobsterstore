import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!.trim(),
      clientSecret: process.env.GITHUB_CLIENT_SECRET!.trim(),
    }),
    ...(process.env.ALLOW_TEST_LOGIN === 'true'
      ? [
          CredentialsProvider({
            id: 'credentials',
            name: 'Test Account',
            credentials: {
              email: { label: 'Email', type: 'text' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) return null
              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
              })
              if (!user || !user.passwordHash) return null
              const valid = await bcrypt.compare(
                credentials.password,
                user.passwordHash
              )
              if (!valid) return null
              return user as any
            },
          }),
        ]
      : []),
  ],
  debug: process.env.NEXTAUTH_DEBUG === 'true',
  logger: {
    error(code, metadata) {
      console.error('[next-auth][error]', code, metadata)
    },
    warn(code) {
      console.warn('[next-auth][warn]', code)
    },
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.provider = account?.provider
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.name = (token.name as string) || session.user.name
        session.user.email = (token.email as string) || session.user.email
        session.user.image = (token.picture as string) || session.user.image
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    // Use JWT so middleware token checks work (middleware uses getToken)
    strategy: 'jwt',
  },
}
