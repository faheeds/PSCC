import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getCell(row: Record<string, unknown>, headerMap: Map<string, string>, candidates: string[]) {
  for (const candidate of candidates) {
    const key = headerMap.get(candidate);
    if (key) {
      return row[key];
    }
  }

  return undefined;
}

function parseExcelDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S);
    }
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

export async function importGamesWorkbook(file: File) {
  if (!file.size) {
    throw new Error("Choose an Excel file before importing.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The workbook does not contain any sheets.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true
  });

  if (!rows.length) {
    throw new Error("The uploaded spreadsheet is empty.");
  }

  const headerMap = new Map<string, string>();
  for (const key of Object.keys(rows[0])) {
    headerMap.set(normalizeHeader(key), key);
  }

  const imports: Array<{
    gameTypeId: string;
    title: string;
    opponent: string | null;
    venue: string | null;
    gameDate: Date;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    notes: string | null;
  }> = [];

  for (const row of rows) {
    const gameTypeName = String(getCell(row, headerMap, ["gametype", "matchtype", "format", "type"]) ?? "").trim();
    const titleValue = String(getCell(row, headerMap, ["title", "gametitle", "matchtitle"]) ?? "").trim();
    const opponentValue = String(getCell(row, headerMap, ["opponent", "vs", "against"]) ?? "").trim();
    const venueValue = String(getCell(row, headerMap, ["venue", "ground", "location"]) ?? "").trim();
    const notesValue = String(getCell(row, headerMap, ["notes", "comment", "comments"]) ?? "").trim();
    const statusValue = String(getCell(row, headerMap, ["status"]) ?? "SCHEDULED")
      .trim()
      .toUpperCase();
    const dateValue = getCell(row, headerMap, ["gamedate", "date", "matchdate", "datetime"]);

    if (!gameTypeName) {
      throw new Error("Each row must include a game type / format column.");
    }

    const gameType = await prisma.gameType.findFirst({
      where: {
        name: {
          equals: gameTypeName,
          mode: "insensitive"
        }
      }
    });

    if (!gameType) {
      throw new Error(`Game type "${gameTypeName}" does not exist. Create the fee rule first.`);
    }

    const gameDate = parseExcelDate(dateValue);
    if (!gameDate) {
      throw new Error(`Could not parse a game date for "${titleValue || opponentValue || gameTypeName}".`);
    }

    const title = titleValue || (opponentValue ? `PSCC vs ${opponentValue}` : `${gameType.name} fixture`);
    const normalizedStatus =
      statusValue === "COMPLETED" || statusValue === "CANCELLED" ? statusValue : "SCHEDULED";

    imports.push({
      gameTypeId: gameType.id,
      title,
      opponent: opponentValue || null,
      venue: venueValue || null,
      gameDate,
      status: normalizedStatus,
      notes: notesValue || null
    });
  }

  let createdCount = 0;

  for (const entry of imports) {
    const existing = await prisma.game.findFirst({
      where: {
        title: entry.title,
        opponent: entry.opponent,
        gameDate: entry.gameDate
      }
    });

    if (existing) {
      continue;
    }

    await prisma.game.create({
      data: entry
    });
    createdCount += 1;
  }

  return createdCount;
}
