import { NextResponse } from "next/server";
import { MemberMediaType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertMemberApiRequest } from "@/lib/member-auth";
import { saveMemberMediaFile } from "@/lib/member-media";

export async function POST(request: Request) {
  try {
    const session = await assertMemberApiRequest();
    const memberId = session.user?.memberId;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a file before submitting." }, { status: 400 });
    }

    const title = String(formData.get("title") || "").trim();
    const eventTitle = String(formData.get("eventTitle") || "").trim();
    const caption = String(formData.get("caption") || "").trim();
    const durationSecondsRaw = Number(formData.get("durationSeconds") || 0);

    if (!title) {
      return NextResponse.json({ error: "Add a title so the social team knows what this submission is." }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const mediaType = isVideo ? MemberMediaType.VIDEO : MemberMediaType.PHOTO;

    if (isVideo) {
      if (!durationSecondsRaw || Number.isNaN(durationSecondsRaw)) {
        return NextResponse.json({ error: "We could not read the video length. Please try a different file." }, { status: 400 });
      }

      if (durationSecondsRaw > 30) {
        return NextResponse.json({ error: "Videos must be 30 seconds or shorter." }, { status: 400 });
      }
    }

    const saved = await saveMemberMediaFile(file);

    await prisma.memberMediaSubmission.create({
      data: {
        memberId: memberId ?? "",
        title,
        eventTitle: eventTitle || null,
        mediaType,
        filePath: saved.filePath,
        fileName: saved.fileName,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        durationSeconds: isVideo ? Math.round(durationSecondsRaw) : null,
        caption: caption || null
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload media right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
