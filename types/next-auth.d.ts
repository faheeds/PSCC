import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      adminUserId?: string;
      memberId?: string;
      title?: string | null;
    };
  }

  interface User {
    role?: string;
    adminUserId?: string;
    memberId?: string;
    title?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    adminUserId?: string;
    memberId?: string;
    title?: string | null;
  }
}
