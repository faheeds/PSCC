import bcrypt from "bcryptjs";
import {
  PrismaClient,
  LedgerCategory,
  MemberStatus,
  CommunicationAudience,
  CommunicationChannel,
  CommunicationStatus,
  EquipmentCondition,
  EquipmentTransactionType,
  GroundBookingStatus,
  GroundPaymentStatus,
  GroundUsageType,
  MediaContentType,
  PracticeStatus,
  SocialPostStatus,
  TaskPriority,
  TaskStatus
} from "@prisma/client";
import { PRACTICE_GROUND_ADDRESS } from "../lib/practice-location";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "treasurer@pscc.org").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const memberPassword = process.env.SEED_MEMBER_PASSWORD ?? "Welcome123!";
  const allowedAdminEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const seededAdminProfiles = [
    { email: allowedAdminEmails[0] ?? adminEmail, name: "M Tameem", title: "Ground Manager" },
    { email: allowedAdminEmails[1] ?? "jedi.warlord@gmail.com", name: "Jedi Warlord", title: "Social Media Manager" },
    { email: allowedAdminEmails[2] ?? "ally.kumail@gmail.com", name: "Kumail Ally", title: "Club Manager" },
    { email: allowedAdminEmails[3] ?? "tushar.gonawala96@gmail.com", name: "Tushar Gonawala", title: "Practice Coordinator and Equipment Manager" },
    { email: allowedAdminEmails[4] ?? "faheed.subhani@gmail.com", name: "Faheed Subhani", title: "Finance Manager" },
    { email: allowedAdminEmails[5] ?? "z2alam90@gmail.com", name: "Zeeshan Alam", title: "Practice Coordinator and Equipment Manager" },
    { email: allowedAdminEmails[6] ?? "nisar.ansari786@gmail.com", name: "Nisar Ansari", title: "Practice Coordinator and Equipment Manager" },
    { email: allowedAdminEmails[7] ?? "inboxabbas@gmail.com", name: "Abbas", title: "Admin" }
  ];

  const [adminPasswordHash, memberPasswordHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(memberPassword, 12)
  ]);

  const admins = await Promise.all(
    seededAdminProfiles.map((admin, index) =>
      prisma.adminUser.upsert({
        where: { email: admin.email },
        update: {
          name: admin.name,
          title: admin.title,
          passwordHash: adminPasswordHash
        },
        create: {
          email: admin.email,
          name: admin.name,
          title: admin.title,
          passwordHash: adminPasswordHash,
          phone: `(425) 555-020${index}`
        }
      })
    )
  );

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: "PSCC Treasurer",
      title: "Finance Manager",
      passwordHash: adminPasswordHash
    },
    create: {
      email: adminEmail,
      name: "PSCC Treasurer",
      title: "Finance Manager",
      passwordHash: adminPasswordHash
    }
  });

  const league = await prisma.gameType.upsert({
    where: { name: "League Match" },
    update: { feeCents: 2500, description: "Standard league fixture", sortOrder: 1, isActive: true },
    create: {
      name: "League Match",
      feeCents: 2500,
      description: "Standard league fixture",
      sortOrder: 1
    }
  });

  const t20 = await prisma.gameType.upsert({
    where: { name: "T20 Match" },
    update: { feeCents: 1800, description: "Short-format match", sortOrder: 2, isActive: true },
    create: {
      name: "T20 Match",
      feeCents: 1800,
      description: "Short-format match",
      sortOrder: 2
    }
  });

  const members = await Promise.all(
    [
      { name: "Arjun Mehta", email: "arjun@pscc.org", phone: "(425) 555-0100", jerseySize: "M" },
      { name: "Hamza Khan", email: "hamza@pscc.org", phone: "(425) 555-0101", jerseySize: "L" },
      { name: "Rohan Patel", email: "rohan@pscc.org", phone: "(425) 555-0102", jerseySize: "XL" }
    ].map((member) =>
      prisma.member.upsert({
        where: { email: member.email },
        update: {
          ...member,
          passwordHash: memberPasswordHash,
          status: MemberStatus.ACTIVE
        },
        create: {
          ...member,
          passwordHash: memberPasswordHash
        }
      })
    )
  );

  const gameOne = await prisma.game.upsert({
    where: { id: "seed-league-match-1" },
    update: {},
    create: {
      id: "seed-league-match-1",
      gameTypeId: league.id,
      title: "PSCC vs Seattle Stags",
      opponent: "Seattle Stags",
      venue: "Marymoor Park",
      gameDate: new Date("2026-04-12T10:00:00.000Z"),
      status: "COMPLETED",
      notes: "Sunday league fixture"
    }
  });

  await prisma.game.upsert({
    where: { id: "seed-t20-match-1" },
    update: {},
    create: {
      id: "seed-t20-match-1",
      gameTypeId: t20.id,
      title: "PSCC T20 vs Bellevue Blazers",
      opponent: "Bellevue Blazers",
      venue: "Robinswood Park",
      gameDate: new Date("2026-04-19T18:00:00.000Z"),
      status: "SCHEDULED",
      notes: "Evening T20"
    }
  });

  for (const member of members) {
    await prisma.ledgerEntry.upsert({
      where: { id: `club-fee-${member.id}` },
      update: {},
      create: {
        id: `club-fee-${member.id}`,
        memberId: member.id,
        category: LedgerCategory.CLUB_FEE,
        description: "2026 annual club membership",
        amountCents: 12000,
        occurredAt: new Date("2026-04-01T08:00:00.000Z")
      }
    });
  }

  await prisma.ledgerEntry.upsert({
    where: { id: `uniform-${members[0].id}` },
    update: {},
    create: {
      id: `uniform-${members[0].id}`,
      memberId: members[0].id,
      category: LedgerCategory.UNIFORM,
      description: "Club jersey and cap",
      amountCents: 4500,
      occurredAt: new Date("2026-04-02T08:00:00.000Z")
    }
  });

  const participation = await prisma.gameParticipation.upsert({
    where: {
      memberId_gameId: {
        memberId: members[0].id,
        gameId: gameOne.id
      }
    },
    update: {},
    create: {
      memberId: members[0].id,
      gameId: gameOne.id,
      feeCents: league.feeCents,
      notes: "Opening weekend"
    }
  });

  await prisma.ledgerEntry.upsert({
    where: { gameParticipationId: participation.id },
    update: {},
    create: {
      memberId: members[0].id,
      category: LedgerCategory.GAME_FEE,
      description: `${gameOne.title} player fee`,
      amountCents: league.feeCents,
      occurredAt: gameOne.gameDate,
      gameParticipationId: participation.id
    }
  });

  const payment = await prisma.payment.upsert({
    where: { id: `payment-${members[0].id}` },
    update: {},
    create: {
      id: `payment-${members[0].id}`,
      memberId: members[0].id,
      amountCents: 5000,
      status: "PAID",
      paidAt: new Date("2026-04-03T08:00:00.000Z")
    }
  });

  await prisma.ledgerEntry.upsert({
    where: { paymentId: payment.id },
    update: {},
    create: {
      memberId: members[0].id,
      category: LedgerCategory.PAYMENT,
      description: "Online member payment",
      amountCents: -5000,
      occurredAt: payment.paidAt ?? new Date(),
      paymentId: payment.id
    }
  });

  const groundBooking = await prisma.groundBooking.upsert({
    where: { id: "seed-ground-booking-1" },
    update: {},
    create: {
      id: "seed-ground-booking-1",
      title: "Marymoor Sunday Ground Slot",
      groundName: "Marymoor Park",
      cityContactName: "Redmond Parks Desk",
      cityContactEmail: "parks@redmond.gov",
      permitReference: "MR-2026-0413",
      bookingDate: new Date("2026-04-13T00:00:00.000Z"),
      startAt: new Date("2026-04-13T17:00:00.000Z"),
      endAt: new Date("2026-04-13T21:00:00.000Z"),
      status: GroundBookingStatus.CONFIRMED,
      paymentStatus: GroundPaymentStatus.PAID,
      costCents: 28000,
      amountRecoveredCents: 9000,
      notes: "Booked for league prep and external half-slot rental.",
      bookedByAdminId: admins[0]?.id
    }
  });

  await prisma.groundAllocation.upsert({
    where: { id: "seed-ground-allocation-1" },
    update: {},
    create: {
      id: "seed-ground-allocation-1",
      groundBookingId: groundBooking.id,
      usageType: GroundUsageType.PSCC_TEAM,
      allocatedToName: "PSCC T40 Squad",
      amountCents: 0,
      notes: "Primary team slot"
    }
  });

  await prisma.groundAllocation.upsert({
    where: { id: "seed-ground-allocation-2" },
    update: {},
    create: {
      id: "seed-ground-allocation-2",
      groundBookingId: groundBooking.id,
      usageType: GroundUsageType.EXTERNAL_CLUB,
      allocatedToName: "Rain City Cricket",
      amountCents: 9000,
      notes: "Shared second half"
    }
  });

  await prisma.socialContentItem.upsert({
    where: { id: "seed-social-1" },
    update: {},
    create: {
      id: "seed-social-1",
      title: "Opening league match highlights",
      contentType: MediaContentType.REEL,
      eventTitle: "PSCC vs Seattle Stags",
      capturedAt: new Date("2026-04-12T18:00:00.000Z"),
      sourceUrl: "https://drive.google.com/pscc-opening-weekend",
      caption: "Opening weekend energy from the PSCC squad.",
      hashtags: "#pscc #nwcl #cricket",
      platforms: "Instagram, Facebook",
      status: SocialPostStatus.READY_TO_POST,
      createdByAdminId: admins[1]?.id
    }
  });

  await prisma.communicationMessage.upsert({
    where: { id: "seed-communication-1" },
    update: {},
    create: {
      id: "seed-communication-1",
      subject: "Weekend fixtures and arrival time reminder",
      audience: CommunicationAudience.ALL_MEMBERS,
      channel: CommunicationChannel.EMAIL,
      status: CommunicationStatus.SCHEDULED,
      body: "Reminder to arrive 45 minutes before your match slot and bring full whites.",
      summary: "Match day reminder for all active members.",
      scheduledFor: new Date("2026-04-11T17:00:00.000Z"),
      createdByAdminId: admins[2]?.id
    }
  });

  await prisma.leagueContactLog.upsert({
    where: { id: "seed-league-log-1" },
    update: {},
    create: {
      id: "seed-league-log-1",
      subject: "Fixture reschedule request",
      counterpartName: "NWCL Scheduling Desk",
      counterpartOrg: "NWCL",
      channel: CommunicationChannel.EMAIL,
      contactAt: new Date("2026-04-08T18:30:00.000Z"),
      summary: "Requested a backup date in case of rain for the April T20 match.",
      actionItems: "Confirm if Bellevue can move to the reserve Sunday slot.",
      nextStep: "Follow up after weather advisory update.",
      createdByAdminId: admins[2]?.id
    }
  });

  await prisma.practiceSession.upsert({
    where: { id: "seed-practice-1" },
    update: {},
    create: {
      id: "seed-practice-1",
      title: "Tuesday nets and fielding",
      location: PRACTICE_GROUND_ADDRESS,
      startsAt: new Date("2026-04-14T02:00:00.000Z"),
      endsAt: new Date("2026-04-14T04:00:00.000Z"),
      status: PracticeStatus.PLANNED,
      focusArea: "Batting rotation and boundary fielding",
      expectedAttendance: 18,
      notes: "Bring extra cones and side-arm throwers.",
      coordinatorId: admins[3]?.id
    }
  });

  const equipmentItem = await prisma.equipmentItem.upsert({
    where: { id: "seed-equipment-1" },
    update: {},
    create: {
      id: "seed-equipment-1",
      name: "Match balls",
      category: "Consumables",
      quantityOnHand: 8,
      reorderLevel: 10,
      storageLocation: "Equipment locker A",
      condition: EquipmentCondition.GOOD,
      preferredVendor: "Cricket Direct",
      notes: "Order another dozen before the May fixtures.",
      lastPurchasedAt: new Date("2026-03-29T00:00:00.000Z"),
      lastPurchaseCostCents: 12000
    }
  });

  await prisma.equipmentTransaction.upsert({
    where: { id: "seed-equipment-log-1" },
    update: {},
    create: {
      id: "seed-equipment-log-1",
      equipmentItemId: equipmentItem.id,
      transactionType: EquipmentTransactionType.PURCHASE,
      quantity: 12,
      unitCostCents: 1000,
      reference: "Cricket Direct",
      notes: "Restock for April and May fixtures.",
      performedByAdminId: admins[3]?.id,
      occurredAt: new Date("2026-03-29T00:00:00.000Z")
    }
  });

  await prisma.clubTask.upsert({
    where: { id: "seed-task-1" },
    update: {},
    create: {
      id: "seed-task-1",
      title: "Confirm Marymoor permit payment receipt",
      module: "Grounds",
      description: "Upload the city receipt and confirm the booking ledger entry matches the actual payment.",
      status: TaskStatus.OPEN,
      priority: TaskPriority.HIGH,
      dueAt: new Date("2026-04-10T20:00:00.000Z"),
      createdByAdminId: admins[4]?.id,
      assignedToAdminId: admins[0]?.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
