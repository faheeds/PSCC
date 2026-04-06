import { Buffer } from "node:buffer";
import { GroundBookingStatus, GroundPaymentStatus } from "@prisma/client";
import { prisma as db } from "@/lib/db";

type UploadedConfirmationFile = {
  name: string;
  data: Buffer;
};

type ParsedReservation = {
  importKey: string;
  title: string;
  groundName: string;
  facilityName: string | null;
  permitReference: string;
  sourceDocumentName: string;
  authorizedAt: Date;
  bookingDate: Date;
  startAt: Date;
  endAt: Date;
  status: GroundBookingStatus;
  paymentStatus: GroundPaymentStatus;
  costCents: number;
  paidCents: number;
  balanceDueCents: number;
  cityContactName: string | null;
  cityContactEmail: string | null;
  cityContactPhone: string | null;
  notes: string | null;
};

type ParsedConfirmation = {
  permitReference: string;
  authorizedAt: Date;
  permitTitle: string;
  note: string | null;
  groundName: string;
  locationAddress: string | null;
  facilityName: string | null;
  primaryContactName: string | null;
  permitHolderName: string | null;
  cityContactName: string | null;
  cityContactEmail: string | null;
  cityContactPhone: string | null;
  sourceDocumentName: string;
  reservations: ParsedReservation[];
};

type ImportSummary = {
  documentsProcessed: number;
  created: number;
  updated: number;
  skippedOlder: number;
};

export async function importGroundConfirmations(files: UploadedConfirmationFile[], bookedByAdminId?: string | null): Promise<ImportSummary> {
  const parsedConfirmations = await Promise.all(files.map((file) => parseGroundConfirmationPdf(file)));
  const reservations = parsedConfirmations.flatMap((item) => item.reservations);

  if (!reservations.length) {
    return {
      documentsProcessed: parsedConfirmations.length,
      created: 0,
      updated: 0,
      skippedOlder: 0
    };
  }

  const existingBookings = await db.groundBooking.findMany({
    where: {
      importKey: {
        in: reservations.map((reservation) => reservation.importKey)
      }
    },
    select: {
      id: true,
      importKey: true,
      authorizedAt: true
    }
  });

  const existingByImportKey = new Map(existingBookings.map((booking) => [booking.importKey, booking]));
  let created = 0;
  let updated = 0;
  let skippedOlder = 0;

  for (const reservation of reservations) {
    const existing = existingByImportKey.get(reservation.importKey);
    if (existing?.authorizedAt && existing.authorizedAt.getTime() > reservation.authorizedAt.getTime()) {
      skippedOlder += 1;
      continue;
    }

    const data = {
      title: reservation.title,
      groundName: reservation.groundName,
      facilityName: reservation.facilityName,
      cityContactName: reservation.cityContactName,
      cityContactEmail: reservation.cityContactEmail,
      cityContactPhone: reservation.cityContactPhone,
      permitReference: reservation.permitReference,
      sourceDocumentName: reservation.sourceDocumentName,
      authorizedAt: reservation.authorizedAt,
      bookingDate: reservation.bookingDate,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      status: reservation.status,
      paymentStatus: reservation.paymentStatus,
      costCents: reservation.costCents,
      paidCents: reservation.paidCents,
      balanceDueCents: reservation.balanceDueCents,
      notes: reservation.notes
    };

    if (existing?.id) {
      await db.groundBooking.update({
        where: { id: existing.id },
        data
      });
      updated += 1;
    } else {
      await db.groundBooking.create({
        data: {
          importKey: reservation.importKey,
          bookedByAdminId: bookedByAdminId || null,
          amountRecoveredCents: 0,
          ...data
        }
      });
      created += 1;
    }
  }

  return {
    documentsProcessed: parsedConfirmations.length,
    created,
    updated,
    skippedOlder
  };
}

export async function parseGroundConfirmationPdf(file: UploadedConfirmationFile): Promise<ParsedConfirmation> {
  const text = await extractTextFromPdf(file.data);
  const permitHeader = matchOrThrow(text, /PERMIT #(\d+)\s+Authorized On:\s+([0-9/]+\s+[0-9:]+\s+[AP]M)/, "permit header");
  const permitReference = permitHeader[1] ?? "";
  const authorizedAt = parseUsDateTime(permitHeader[2] ?? "");
  const permitTitle = matchLine(text, /^Title:\s*(.+)$/m, "permit title") ?? "Ground Booking";
  const note = matchLine(text, /^NOTE:\s*(.+)$/m);
  const locationBlock = extractBlock(text, "Location", "Permit Holder");
  const permitHolderBlock = extractBlock(text, "Permit Holder", "Primary Contact");
  const primaryContactBlock = extractBlock(text, "Primary Contact", "Authorized Agent");
  const authorizedAgentBlock = extractBlock(text, "Authorized Agent", "RESERVATIONS");
  const reservationsBlock = extractBlock(text, "RESERVATIONS", "CHARGES");
  const chargesBlock = extractBlock(text, "CHARGES", text.includes("PAYMENTS") ? "PAYMENTS" : "The City of Bellevue hereby");
  const cityContactEmail = matchLine(text, /([A-Za-z0-9._%+-]+@BellevueWA\.gov)/i);
  const cityContactPhone = matchLine(text, /^425-\d{3}-\d{4}$/m);

  const locationLines = locationBlock.split("\n").map(cleanLine).filter(Boolean);
  const permitHolderLines = permitHolderBlock.split("\n").map(cleanLine).filter(Boolean);
  const primaryContactLines = primaryContactBlock.split("\n").map(cleanLine).filter(Boolean);
  const authorizedAgentLines = authorizedAgentBlock.split("\n").map(cleanLine).filter(Boolean);

  const groundName = locationLines.slice(0, 2).join(" ").trim();
  const locationAddress = locationLines.slice(2).join(", ").trim() || null;
  const permitHolderName = permitHolderLines.slice(0, 2).join(" ").trim() || null;
  const primaryContactName = primaryContactLines[0] ?? null;
  const cityContactName = authorizedAgentLines[0] ?? null;

  const chargeMap = parseCharges(chargesBlock);
  const reservations = parseReservations(reservationsBlock).map((reservation) => {
    const charge = chargeMap.get(reservation.chargeKey);
    const notes = [
      note ? `Permit note: ${note}` : null,
      locationAddress ? `Address: ${locationAddress}` : null,
      permitHolderName ? `Permit holder: ${permitHolderName}` : null,
      primaryContactName ? `Primary contact: ${primaryContactName}` : null,
      `Imported from ${file.name}`
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      importKey: `${permitReference}:${reservation.chargeKey}`,
      title: permitTitle,
      groundName,
      facilityName: reservation.facilityName,
      permitReference,
      sourceDocumentName: file.name,
      authorizedAt,
      bookingDate: reservation.bookingDate,
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      status: reservation.endAt.getTime() < Date.now() ? GroundBookingStatus.COMPLETED : GroundBookingStatus.CONFIRMED,
      paymentStatus: derivePaymentStatus(charge?.paidCents ?? 0, charge?.balanceDueCents ?? reservation.costCents, reservation.costCents),
      costCents: charge?.costCents ?? reservation.costCents,
      paidCents: charge?.paidCents ?? 0,
      balanceDueCents: charge?.balanceDueCents ?? Math.max(reservation.costCents - (charge?.paidCents ?? 0), 0),
      cityContactName,
      cityContactEmail: cityContactEmail ?? null,
      cityContactPhone: cityContactPhone ?? null,
      notes: notes || null
    } satisfies ParsedReservation;
  });

  return {
    permitReference,
    authorizedAt,
    permitTitle,
    note: note ?? null,
    groundName,
    locationAddress,
    facilityName: reservations[0]?.facilityName ?? null,
    primaryContactName,
    permitHolderName,
    cityContactName,
    cityContactEmail: cityContactEmail ?? null,
    cityContactPhone: cityContactPhone ?? null,
    sourceDocumentName: file.name,
    reservations
  };
}

async function extractTextFromPdf(data: Buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(data)
  } as {
    data: Uint8Array;
  });

  try {
    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const lines: Array<{ y: number; text: string; x: number }> = [];

      for (const item of content.items) {
        if (!("str" in item) || !item.str) {
          continue;
        }

        const y = typeof item.transform?.[5] === "number" ? item.transform[5] : 0;
        const x = typeof item.transform?.[4] === "number" ? item.transform[4] : 0;
        const currentLine = lines.at(-1);

        if (!currentLine || Math.abs(currentLine.y - y) > 2) {
          lines.push({ y, text: item.str, x });
          continue;
        }

        const gap = x - currentLine.x;
        currentLine.text += gap > 3 ? ` ${item.str}` : item.str;
        currentLine.x = x + (item.width ?? 0);

        if (item.hasEOL) {
          lines.push({ y: y - 100, text: "", x: 0 });
        }
      }

      const pageText = lines
        .map((line) => cleanLine(line.text))
        .filter(Boolean)
        .join("\n");

      page.cleanup();
      pages.push(pageText);
    }

    return normalizeExtractedText(pages.join("\n"));
  } finally {
    await loadingTask.destroy();
  }
}

function parseReservations(blockText: string) {
  const lines = blockText.split("\n").map(cleanLine).filter(Boolean);
  const reservations: Array<{
    facilityName: string | null;
    bookingDate: Date;
    startAt: Date;
    endAt: Date;
    costCents: number;
    chargeKey: string;
  }> = [];

  for (const line of lines) {
    if (
      line.startsWith("Location Facility Date Time Hours Fee") ||
      line.startsWith("TOTAL:") ||
      line.startsWith("Addons ") ||
      line.startsWith("-- ") ||
      line.startsWith("City of Bellevue")
    ) {
      continue;
    }

    const match = line.match(
      /^(.+?)\s+(.+?)\s+((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+\w{3}\s+\d{1,2}(?:st|nd|rd|th)\s+\d{4})\s+(\d{1,2}:\d{2}\s+[AP]M-\d{1,2}:\d{2}\s+[AP]M)\s+(\d+\.\d{2})\s+\$([\d,]+\.\d{2})$/
    );

    if (!match) {
      continue;
    }

    const bookingDate = parseReservationDate(match[3] ?? "");
    const [startLabel, endLabel] = (match[4] ?? "").split("-").map((item) => item.trim());
    const startAt = combineDateAndTime(bookingDate, startLabel);
    const endAt = combineDateAndTime(bookingDate, endLabel);
    const chargeKey = buildChargeKey(bookingDate, startLabel, endLabel);

    reservations.push({
      facilityName: match[2]?.trim() || null,
      bookingDate,
      startAt,
      endAt,
      costCents: parseMoney(match[6] ?? "0.00"),
      chargeKey
    });
  }

  return reservations;
}

function parseCharges(blockText: string) {
  const lines = blockText.split("\n").map(cleanLine).filter(Boolean);
  const charges = new Map<string, { costCents: number; paidCents: number; balanceDueCents: number }>();

  for (const line of lines) {
    if (
      line.startsWith("LOCATION FACILITY DESCRIPTION TOTAL PAID BALANCE DUE") ||
      line.startsWith("TOTAL:") ||
      line.startsWith("The City of Bellevue hereby") ||
      line.startsWith("-- ") ||
      line.startsWith("City of Bellevue")
    ) {
      continue;
    }

    const match = line.match(/^(.+?)\s+(.+?)\s+(.+?)\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})\s+\$([\d,]+\.\d{2})$/);

    if (!match) {
      continue;
    }

    const parsedDescription = parseChargeDescription(match[3] ?? "");
    if (!parsedDescription) {
      continue;
    }

    charges.set(parsedDescription.chargeKey, {
      costCents: parseMoney(match[4] ?? "0.00"),
      paidCents: parseMoney(match[5] ?? "0.00"),
      balanceDueCents: parseMoney(match[6] ?? "0.00")
    });
  }

  return charges;
}

function parseChargeDescription(description: string) {
  const match = description.match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}:\d{2}\s+[AP]M)-(\d{1,2}:\d{2}\s+[AP]M)$/);

  if (!match) {
    return null;
  }

  const bookingDate = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
  return {
    chargeKey: buildChargeKey(bookingDate, match[4] ?? "", match[5] ?? "")
  };
}

function derivePaymentStatus(paidCents: number, balanceDueCents: number, costCents: number) {
  if (costCents === 0 || balanceDueCents === 0) {
    return paidCents > 0 || costCents > 0 ? GroundPaymentStatus.PAID : GroundPaymentStatus.WAIVED;
  }

  if (paidCents > 0) {
    return GroundPaymentStatus.PARTIALLY_PAID;
  }

  return GroundPaymentStatus.PENDING;
}

function buildChargeKey(bookingDate: Date, startLabel: string, endLabel: string) {
  return [
    bookingDate.getFullYear(),
    String(bookingDate.getMonth() + 1).padStart(2, "0"),
    String(bookingDate.getDate()).padStart(2, "0"),
    normalizeTimeLabel(startLabel),
    normalizeTimeLabel(endLabel)
  ].join("|");
}

function normalizeTimeLabel(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function parseReservationDate(value: string) {
  return new Date(value.replace(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+/, "").replace(/(\d)(st|nd|rd|th)/, "$1"));
}

function combineDateAndTime(date: Date, timeLabel: string) {
  const dateLabel = `${date.toLocaleString("en-US", { month: "short" })} ${date.getDate()}, ${date.getFullYear()}`;
  return new Date(`${dateLabel} ${normalizeTimeLabel(timeLabel)}`);
}

function parseUsDateTime(value: string) {
  return new Date(value);
}

function parseMoney(value: string) {
  return Math.round(Number(value.replace(/[$,]/g, "")) * 100);
}

function normalizeExtractedText(value: string) {
  return value.replace(/\r/g, "").replace(/\u00a0/g, " ");
}

function extractBlock(text: string, startLabel: string, endLabel: string) {
  const startIndex = text.indexOf(startLabel);
  if (startIndex === -1) {
    return "";
  }

  const start = startIndex + startLabel.length;
  const endIndex = text.indexOf(endLabel, start);
  if (endIndex === -1) {
    return text.slice(start);
  }

  return text.slice(start, endIndex);
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function matchLine(text: string, pattern: RegExp, label?: string) {
  const match = text.match(pattern);
  if (!match) {
    if (label) {
      throw new Error(`Could not find ${label} in the uploaded confirmation.`);
    }

    return null;
  }

  return (match[1] ?? match[0]).trim();
}

function matchOrThrow(text: string, pattern: RegExp, label: string) {
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Could not find ${label} in the uploaded confirmation.`);
  }

  return match;
}
