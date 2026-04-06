import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { importGroundConfirmations } from "@/lib/ground-confirmations";

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user;
  const email = user?.email?.toLowerCase();

  if (!user || !email || !isAllowedAdminEmail(email) || user.role !== "ADMIN" || !user.adminUserId) {
    return redirectTo(request, "/admin/login");
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) {
    return redirectTo(request, "/admin/grounds?error=Choose+one+or+more+PDF+confirmation+files+to+import.");
  }

  try {
    const result = await importGroundConfirmations(
      await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: Buffer.from(await file.arrayBuffer())
        }))
      ),
      user.adminUserId
    );

    revalidatePath("/admin/grounds");
    revalidatePath("/admin/dashboard");

    return redirectTo(
      request,
      `/admin/grounds?imported=${result.documentsProcessed}&created=${result.created}&updated=${result.updated}&skipped=${result.skippedOlder}`
    );
  } catch (error) {
    console.error("Ground confirmation import failed", error);
    return redirectTo(request, "/admin/grounds?error=Unable+to+import+the+confirmation+PDF+right+now.");
  }
}

function redirectTo(request: Request, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url), { status: 303 });
}
