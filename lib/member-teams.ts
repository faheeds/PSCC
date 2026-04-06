import { T20Team, T40Team } from "@prisma/client";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";

export const T40_TEAM_OPTIONS = [
  { value: T40Team.STEELHEADS, label: "PSCC Steelheads" },
  { value: T40Team.CHINOOKS, label: "PSCC Chinooks" },
  { value: T40Team.SOCKEYES, label: "PSCC Sockeyes" }
] as const;

export const T20_TEAM_OPTIONS = [
  { value: T20Team.STEELHEADS, label: "PSCC Steelheads" },
  { value: T20Team.CHINOOKS, label: "PSCC Chinooks" },
  { value: T20Team.SOCKEYES, label: "PSCC Sockeyes" },
  { value: T20Team.COHOS, label: "PSCC Cohos" }
] as const;

export function formatT40Team(team: T40Team | null) {
  return T40_TEAM_OPTIONS.find((option) => option.value === team)?.label ?? "—";
}

export function formatT20Team(team: T20Team | null) {
  return T20_TEAM_OPTIONS.find((option) => option.value === team)?.label ?? "—";
}

export async function importMemberTeamsWorkbook(file: File) {
  if (!file.size) {
    throw new Error("Choose an Excel or CSV file before importing.");
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

  let updatedCount = 0;

  for (const row of rows) {
    const email = String(getCell(row, headerMap, ["email", "memberemail"]) ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      throw new Error("Each row must include a member email.");
    }

    const member = await prisma.member.findUnique({
      where: { email },
      select: { id: true }
    });

    if (!member) {
      throw new Error(`No member account was found for ${email}.`);
    }

    const t40Team = parseT40Team(getCell(row, headerMap, ["t40team", "t40", "t40squad", "t40teamname"]));
    const t20Team = parseT20Team(getCell(row, headerMap, ["t20team", "t20", "t20squad", "t20teamname"]));

    await prisma.member.update({
      where: { id: member.id },
      data: {
        t40Team,
        t20Team
      }
    });

    updatedCount += 1;
  }

  return updatedCount;
}

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

function parseT40Team(value: unknown) {
  const normalized = normalizeTeamValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "steelheads":
    case "psccsteelheads":
      return T40Team.STEELHEADS;
    case "chinooks":
    case "psccchinooks":
      return T40Team.CHINOOKS;
    case "sockeyes":
    case "psccsockeyes":
      return T40Team.SOCKEYES;
    default:
      throw new Error(`"${String(value)}" is not a valid T40 team. Use PSCC Steelheads, PSCC Chinooks, or PSCC Sockeyes.`);
  }
}

function parseT20Team(value: unknown) {
  const normalized = normalizeTeamValue(value);
  if (!normalized) {
    return null;
  }

  switch (normalized) {
    case "steelheads":
    case "psccsteelheads":
      return T20Team.STEELHEADS;
    case "chinooks":
    case "psccchinooks":
      return T20Team.CHINOOKS;
    case "sockeyes":
    case "psccsockeyes":
      return T20Team.SOCKEYES;
    case "cohos":
    case "pscccohos":
      return T20Team.COHOS;
    default:
      throw new Error(`"${String(value)}" is not a valid T20 team. Use PSCC Steelheads, PSCC Chinooks, PSCC Sockeyes, or PSCC Cohos.`);
  }
}

function normalizeTeamValue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
