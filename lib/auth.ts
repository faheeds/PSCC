import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/account/sign-in"
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.toLowerCase();
      const portalIntent = await getPortalIntent();
      if (!email) {
        return false;
      }

      if (portalIntent === "admin") {
        if (!isAllowedAdminEmail(email)) {
          return true;
        }

        const existingAdmin = await prisma.adminUser.findUnique({
          where: { email }
        });

        await prisma.adminUser.upsert({
          where: { email },
          update: {
            name: user.name ?? existingAdmin?.name ?? email.split("@")[0],
            image: user.image ?? existingAdmin?.image ?? null,
            authProvider: account.provider,
            authProviderId: account.providerAccountId
          },
          create: {
            email,
            name: user.name ?? email.split("@")[0],
            image: user.image ?? null,
            authProvider: account.provider,
            authProviderId: account.providerAccountId,
            title: "Admin"
          }
        });

        return true;
      }

      if (portalIntent === "member") {
        const existingMember = await prisma.member.findUnique({
          where: { email }
        });

        if (existingMember?.status === "INACTIVE") {
          return false;
        }

        await prisma.member.upsert({
          where: { email },
          update: {
            name: user.name ?? existingMember?.name ?? email.split("@")[0],
            image: user.image ?? existingMember?.image ?? null,
            authProvider: account.provider,
            authProviderId: account.providerAccountId
          },
          create: {
            email,
            name: user.name ?? email.split("@")[0],
            image: user.image ?? null,
            authProvider: account.provider,
            authProviderId: account.providerAccountId,
            status: "ACTIVE"
          }
        });

        return true;
      }

      if (isAllowedAdminEmail(email)) {
        const existingAdmin = await prisma.adminUser.findUnique({
          where: { email }
        });

        await prisma.adminUser.upsert({
          where: { email },
          update: {
            name: user.name ?? existingAdmin?.name ?? email.split("@")[0],
            image: user.image ?? existingAdmin?.image ?? null,
            authProvider: account.provider,
            authProviderId: account.providerAccountId
          },
          create: {
            email,
            name: user.name ?? email.split("@")[0],
            image: user.image ?? null,
            authProvider: account.provider,
            authProviderId: account.providerAccountId,
            title: "Admin"
          }
        });

        return true;
      }

      const existingMember = await prisma.member.findUnique({
        where: { email }
      });

      if (existingMember?.status === "INACTIVE") {
        return false;
      }

      await prisma.member.upsert({
        where: { email },
        update: {
          name: user.name ?? existingMember?.name ?? email.split("@")[0],
          image: user.image ?? existingMember?.image ?? null,
          authProvider: account.provider,
          authProviderId: account.providerAccountId
        },
        create: {
          email,
          name: user.name ?? email.split("@")[0],
          image: user.image ?? null,
          authProvider: account.provider,
          authProviderId: account.providerAccountId,
          status: "ACTIVE"
        }
      });

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role;
        token.adminUserId = (user as { adminUserId?: string }).adminUserId;
        token.memberId = (user as { memberId?: string }).memberId;
        token.title = (user as { title?: string | null }).title ?? null;
      }

      if (account?.provider === "google") {
        const portalIntent = await getPortalIntent();
        const email = user?.email?.toLowerCase() ?? (typeof token.email === "string" ? token.email.toLowerCase() : undefined);
        if (email) {
          if (portalIntent === "member") {
            const member = await prisma.member.findUnique({
              where: { email }
            });

            if (member?.status === "ACTIVE") {
              token.role = "MEMBER";
              token.memberId = member.id;
              token.adminUserId = undefined;
              token.title = undefined;
            }

            return token;
          }

          if (portalIntent === "admin") {
            const admin = isAllowedAdminEmail(email)
              ? await prisma.adminUser.findUnique({
                  where: { email }
                })
              : null;

            if (admin) {
              token.role = "ADMIN";
              token.adminUserId = admin.id;
              token.memberId = undefined;
              token.title = admin.title ?? null;
            } else {
              token.role = undefined;
              token.adminUserId = undefined;
              token.memberId = undefined;
              token.title = undefined;
            }

            return token;
          }

          const admin = isAllowedAdminEmail(email)
            ? await prisma.adminUser.findUnique({
                where: { email }
              })
            : null;

          if (admin) {
            token.role = "ADMIN";
            token.adminUserId = admin.id;
            token.memberId = undefined;
            token.title = admin.title ?? null;
            return token;
          }

          const member = await prisma.member.findUnique({
            where: { email }
          });

          if (member?.status === "ACTIVE") {
            token.role = "MEMBER";
            token.memberId = member.id;
            token.adminUserId = undefined;
            token.title = undefined;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string | undefined) ?? "MEMBER";
        session.user.adminUserId = token.adminUserId as string | undefined;
        session.user.memberId = token.memberId as string | undefined;
        session.user.title = (token.title as string | undefined) ?? null;
      }

      return session;
    }
  },
  providers: [
    Credentials({
      id: "admin-credentials",
      name: "Admin Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        if (!isAllowedAdminEmail(parsed.data.email)) {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email.toLowerCase() }
        });

        if (!admin) {
          return null;
        }

        if (!admin.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, admin.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "ADMIN",
          adminUserId: admin.id,
          title: admin.title
        };
      }
    }),
    Credentials({
      id: "member-credentials",
      name: "Member Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const member = await prisma.member.findUnique({
          where: { email: parsed.data.email.toLowerCase() }
        });

        if (!member || member.status !== "ACTIVE") {
          return null;
        }

        if (!member.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, member.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          role: "MEMBER",
          memberId: member.id
        };
      }
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
          })
        ]
      : [])
  ]
});

async function getPortalIntent() {
  const cookieStore = await cookies();
  const value = cookieStore.get("pscc-portal-intent")?.value;
  return value === "admin" || value === "member" ? value : null;
}
