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
        params: { scope: "profile_nickname account_email" },
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
        const kakaoAccount = profile?.kakao_account;
        const email = (token.email as string) || `kakao_${kakaoId}@kakao.local`;

        const realName = kakaoAccount?.name as string | undefined;
        const kakaoName = (kakaoAccount?.profile?.nickname || profile?.properties?.nickname || token.name) as string | undefined;
        const name = realName?.trim() || kakaoName?.trim() || "고객";

        const rawPhone = kakaoAccount?.phone_number as string | undefined;
        const phone = rawPhone ? rawPhone.replace(/^\+82\s*/, "0").replace(/\s/g, "") : null;
        const gender = (kakaoAccount?.gender as string | undefined) ?? null;
        const ageRange = (kakaoAccount?.age_range as string | undefined) ?? null;
        const birthyear = (kakaoAccount?.birthyear as string | undefined) ?? null;

        const dbUser = await prisma.user.upsert({
          where: { email },
          create: { email, name, password: null, role: "CUSTOMER", phone, gender, ageRange, birthyear },
          update: {},
        });
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
    signIn: "/sign/signin",
    error: "/sign/signin",
  },
  session: { strategy: "jwt" },
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
    state: {
      name: "next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
        maxAge: 900,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: true,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
