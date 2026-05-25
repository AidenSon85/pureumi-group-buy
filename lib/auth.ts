import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
      authorization: {
        params: { scope: "profile_nickname account_email phone_number" },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { factory: true },
        });

        if (!user || !user.isActive || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          factoryId: user.factoryId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }: any) {
      // Kakao 로그인: DB에서 유저 찾기 또는 자동 생성
      if (account?.provider === "kakao") {
        const kakaoId = String(account.providerAccountId);
        const email = (token.email as string) || `kakao_${kakaoId}@kakao.local`;

        // 카카오 계정에서 전화번호 추출 (+82 10-XXXX-XXXX → 010-XXXX-XXXX)
        const rawPhone = profile?.kakao_account?.phone_number as string | undefined;
        let phone: string | null = null;
        if (rawPhone) {
          phone = rawPhone.replace(/^\+82\s*/, "0").replace(/\s/g, "");
        }

        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: { email, name: (token.name as string) || "고객", password: null, role: "CUSTOMER", phone },
          });
        } else if (phone && !dbUser.phone) {
          dbUser = await prisma.user.update({ where: { id: dbUser.id }, data: { phone } });
        }
        token.sub = dbUser.id;
        token.role = dbUser.role;
        token.factoryId = dbUser.factoryId ?? null;
        return token;
      }

      // Credentials 로그인
      if (user && account?.provider === "credentials") {
        token.role = (user as any).role;
        token.factoryId = (user as any).factoryId ?? null;
        return token;
      }

      // 세션 업데이트 (매장 자동 배정 후)
      if (trigger === "update" && session != null && "factoryId" in session) {
        token.factoryId = session.factoryId;
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).factoryId = token.factoryId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign/signin_mng",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
