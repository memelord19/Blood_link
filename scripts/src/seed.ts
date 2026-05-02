import { db, usersTable, donorsTable, bloodBagsTable, appointmentsTable, bloodRequestsTable, alertsTable, invoicesTable, notificationsTable } from "@workspace/db";

function hashPassword(password: string): string {
  return Buffer.from(password + "bloodlink_salt_2025").toString("base64");
}

async function seed() {
  console.log("Seeding BloodLink database...");

  // Clear existing data
  await db.delete(notificationsTable);
  await db.delete(invoicesTable);
  await db.delete(alertsTable);
  await db.delete(bloodRequestsTable);
  await db.delete(appointmentsTable);
  await db.delete(bloodBagsTable);
  await db.delete(donorsTable);
  await db.delete(usersTable);

  const pass = hashPassword("demo123");

  // 1. Donor user
  const [donorUser] = await db.insert(usersTable).values({
    firstName: "Ahmed", lastName: "Ben Salem", email: "ahmed.ben@demo.tn",
    passwordHash: pass, role: "donor", phone: "20123456", region: "Tunis",
  }).returning();

  // 2. Transfusion center user
  const [centerUser] = await db.insert(usersTable).values({
    firstName: "Fatima", lastName: "Charfi", email: "centre@cnts.tn",
    passwordHash: pass, role: "transfusion_center", phone: "71234567", region: "Tunis",
    organizationName: "Centre National de Transfusion Sanguine",
  }).returning();

  // 3. Blood bank user
  const [bankUser] = await db.insert(usersTable).values({
    firstName: "Mohamed", lastName: "Tlili", email: "banque@blood.tn",
    passwordHash: pass, role: "blood_bank", phone: "74234567", region: "Sfax",
    organizationName: "Banque de Sang Régionale - Sfax",
  }).returning();

  // 4. Hospital user
  const [hospitalUser] = await db.insert(usersTable).values({
    firstName: "Sonia", lastName: "Karray", email: "hopital@sante.tn",
    passwordHash: pass, role: "hospital", phone: "71345678", region: "Tunis",
    organizationName: "Hôpital Charles Nicolle",
  }).returning();

  // 5. Clinic user
  const [clinicUser] = await db.insert(usersTable).values({
    firstName: "Khalil", lastName: "Mansouri", email: "clinique@sante.tn",
    passwordHash: pass, role: "clinic", phone: "71456789", region: "Sousse",
    organizationName: "Clinique El Manar",
  }).returning();

  console.log("Users created:", [donorUser, centerUser, bankUser, hospitalUser, clinicUser].map(u => u.email));

  // Donors
  const donors = await db.insert(donorsTable).values([
    { userId: donorUser.id, firstName: "Ahmed", lastName: "Ben Salem", cin: "12345678", dateOfBirth: "1990-05-15", gender: "male", weight: 75, phone: "20123456", email: "ahmed.ben@demo.tn", region: "Tunis", bloodType: "O+", eligibilityStatus: "eligible", totalDonations: 7, annualDonationsCount: 2, lastDonationDate: "2025-01-15", nextEligibleDate: "2025-03-12" },
    { firstName: "Leila", lastName: "Trabelsi", cin: "23456789", dateOfBirth: "1985-03-22", gender: "female", weight: 62, phone: "25987654", email: "leila.t@gmail.com", region: "Tunis", bloodType: "A+", eligibilityStatus: "eligible", totalDonations: 12, annualDonationsCount: 3 },
    { firstName: "Karim", lastName: "Bouazizi", cin: "34567890", dateOfBirth: "1995-11-08", gender: "male", weight: 80, phone: "22345678", email: "karim.b@yahoo.com", region: "Sfax", bloodType: "B+", eligibilityStatus: "temporarily_excluded", totalDonations: 3, annualDonationsCount: 1, lastDonationDate: "2025-03-01", nextEligibleDate: "2025-05-15" },
    { firstName: "Amira", lastName: "Saidi", cin: "45678901", dateOfBirth: "1988-07-14", gender: "female", weight: 58, phone: "27654321", email: "amira.s@outlook.com", region: "Sousse", bloodType: "AB+", eligibilityStatus: "eligible", totalDonations: 5, annualDonationsCount: 1 },
    { firstName: "Omar", lastName: "Najjar", cin: "56789012", dateOfBirth: "1992-09-30", gender: "male", weight: 70, phone: "20567890", email: "omar.n@gmail.com", region: "Nabeul", bloodType: "O-", eligibilityStatus: "eligible", totalDonations: 15, annualDonationsCount: 4 },
    { firstName: "Yasmine", lastName: "Hammami", cin: "67890123", dateOfBirth: "1998-02-18", gender: "female", weight: 55, phone: "29876543", email: "yasmine.h@gmail.com", region: "Bizerte", bloodType: "A-", eligibilityStatus: "eligible", totalDonations: 2, annualDonationsCount: 1 },
    { firstName: "Tarek", lastName: "Oueslati", cin: "78901234", dateOfBirth: "1983-12-05", gender: "male", weight: 88, phone: "21234567", email: "tarek.o@yahoo.com", region: "Monastir", bloodType: "B-", eligibilityStatus: "eligible", totalDonations: 8, annualDonationsCount: 2 },
    { firstName: "Nour", lastName: "Belhaj", cin: "89012345", dateOfBirth: "2000-06-21", gender: "female", weight: 60, phone: "26543210", email: "nour.b@gmail.com", region: "Gabès", bloodType: "AB-", eligibilityStatus: "eligible", totalDonations: 1, annualDonationsCount: 0 },
  ]).returning();

  console.log(`Created ${donors.length} donors`);

  const today = new Date();
  const dateStr = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const subDays = (d: Date, n: number) => addDays(d, -n);

  // Blood bags — rich stock
  const bagData: any[] = [];
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const amounts = { "O+": 25, "A+": 22, "B+": 12, "AB+": 6, "O-": 8, "A-": 5, "B-": 3, "AB-": 2 };
  let bagSeq = 1;
  for (const bt of bloodTypes) {
    const count = amounts[bt as keyof typeof amounts] || 5;
    for (let i = 0; i < count; i++) {
      const collected = subDays(today, Math.floor(Math.random() * 30));
      const expires = addDays(collected, 42);
      bagData.push({
        barcode: `BL-${bt.replace("+", "P").replace("-", "N")}-${String(bagSeq++).padStart(5, "0")}`,
        bloodType: bt, centerId: 1, centerName: "Centre National de Transfusion Sanguine",
        collectionDate: dateStr(collected), expirationDate: dateStr(expires), status: "available",
        donorId: donors[i % donors.length].id,
      });
    }
    // A few expiring soon
    for (let i = 0; i < 2; i++) {
      const collected = subDays(today, 38);
      const expires = addDays(today, 3 + i);
      bagData.push({
        barcode: `BL-${bt.replace("+", "P").replace("-", "N")}-EXP${String(bagSeq++).padStart(3, "0")}`,
        bloodType: bt, centerId: 1, centerName: "Centre National de Transfusion Sanguine",
        collectionDate: dateStr(collected), expirationDate: dateStr(expires), status: "available",
        donorId: donors[0].id,
      });
    }
  }
  await db.insert(bloodBagsTable).values(bagData);
  console.log(`Created ${bagData.length} blood bags`);

  // Appointments
  await db.insert(appointmentsTable).values([
    { donorId: donors[0].id, centerId: 1, centerName: "Centre National de Transfusion Sanguine", region: "Tunis", date: dateStr(addDays(today, 3)), time: "09:00", status: "pending" },
    { donorId: donors[1].id, centerId: 1, centerName: "Centre National de Transfusion Sanguine", region: "Tunis", date: dateStr(addDays(today, 5)), time: "10:30", status: "confirmed" },
    { donorId: donors[2].id, centerId: 2, centerName: "Centre Régional de Transfusion - Sfax", region: "Sfax", date: dateStr(addDays(today, 7)), time: "14:00", status: "pending" },
    { donorId: donors[3].id, centerId: 1, centerName: "Centre National de Transfusion Sanguine", region: "Tunis", date: dateStr(subDays(today, 5)), time: "09:30", status: "completed" },
    { donorId: donors[4].id, centerId: 3, centerName: "Banque de Sang - Sousse", region: "Sousse", date: dateStr(addDays(today, 2)), time: "08:30", status: "pending" },
  ]);
  console.log("Appointments created");

  // Blood requests
  const [req1, req2, req3] = await db.insert(bloodRequestsTable).values([
    { establishmentId: hospitalUser.id, establishmentName: "Hôpital Charles Nicolle", centerId: 1, centerName: "CNTS", bloodType: "O+", volume: 450, urgency: "urgent", status: "submitted" },
    { establishmentId: clinicUser.id, establishmentName: "Clinique El Manar", centerId: 1, centerName: "CNTS", bloodType: "A+", volume: 250, urgency: "normal", status: "shipped", estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
    { establishmentId: hospitalUser.id, establishmentName: "Hôpital Charles Nicolle", centerId: 1, centerName: "CNTS", bloodType: "AB-", volume: 500, urgency: "critical", status: "delivered" },
    { establishmentId: clinicUser.id, establishmentName: "Clinique El Manar", centerId: 1, centerName: "CNTS", bloodType: "B+", volume: 300, urgency: "normal", status: "submitted" },
  ]).returning();
  console.log("Blood requests created");

  // Alerts
  await db.insert(alertsTable).values([
    { centerId: bankUser.id, centerName: "Banque de Sang Régionale - Sfax", bloodType: "O-", region: "Sfax", urgency: "critical", message: "Stock critique de sang O négatif. Donateurs urgents nécessaires dans la région de Sfax.", status: "active" },
    { centerId: bankUser.id, centerName: "Banque de Sang Régionale - Sfax", bloodType: "AB-", region: "Tunis", urgency: "urgent", message: "Faible stock de AB négatif au niveau national. Appel aux donneurs AB- de la région de Tunis.", status: "active" },
    { centerId: bankUser.id, centerName: "Banque de Sang Régionale - Sfax", bloodType: "B-", region: "Sousse", urgency: "normal", message: "Renouvellement de stock B négatif nécessaire pour la région de Sousse.", status: "resolved", resolvedAt: dateStr(subDays(today, 2)) },
  ]);
  console.log("Alerts created");

  // Invoices for clinic
  await db.insert(invoicesTable).values([
    { establishmentId: clinicUser.id, establishmentName: "Clinique El Manar", requestId: req2.id, amount: 185.50, status: "pending", isEmergency: false, dueDate: dateStr(addDays(today, 30)) },
    { establishmentId: clinicUser.id, establishmentName: "Clinique El Manar", amount: 320.00, status: "paid", isEmergency: true, dueDate: dateStr(subDays(today, 10)), paidAt: dateStr(subDays(today, 5)) },
    { establishmentId: clinicUser.id, establishmentName: "Clinique El Manar", amount: 97.75, status: "pending", isEmergency: false, dueDate: dateStr(addDays(today, 15)) },
  ]);
  console.log("Invoices created");

  // Notifications for donor
  await db.insert(notificationsTable).values([
    { userId: donorUser.id, type: "shortage_alert", title: "Alerte pénurie O négatif — Sfax", message: "La banque de sang de Sfax manque cruellement de sang O négatif. En tant que donneur O+, votre aide est précieuse !", read: false },
    { userId: donorUser.id, type: "shortage_alert", title: "Besoin urgent de AB négatif — Tunis", message: "Le groupe AB- est en pénurie critique dans la région de Tunis. Vos dons peuvent sauver des vies.", read: false },
    { userId: donorUser.id, type: "reminder", title: "Rappel de don", message: "Il y a 8 semaines depuis votre dernier don ! Vous pouvez à nouveau donner votre sang. Prenez rendez-vous dès aujourd'hui.", read: true },
    { userId: donorUser.id, type: "appointment_update", title: "Rendez-vous confirmé", message: "Votre rendez-vous du 5 mai à 10h30 au CNTS a été confirmé. N'oubliez pas d'apporter votre CIN.", read: true },
    { userId: donorUser.id, type: "general", title: "Bienvenue sur BloodLink", message: "Merci de rejoindre BloodLink, la plateforme nationale de gestion des banques de sang. Ensemble, sauvons des vies !", read: true },
  ]);
  console.log("Notifications created for donor");

  // Notifications for hospital
  await db.insert(notificationsTable).values([
    { userId: hospitalUser.id, type: "request_update", title: "Demande acceptée", message: "Votre demande de 500mL AB- a été acceptée et est en cours de traitement.", read: false },
    { userId: hospitalUser.id, type: "request_update", title: "Demande O+ soumise", message: "Votre demande urgente de 450mL O+ a été reçue et est en cours d'examen.", read: true },
  ]);

  console.log("\nSeed complete!");
  console.log("\nDemo accounts (password: demo123):");
  console.log("  Donneur:            ahmed.ben@demo.tn");
  console.log("  Centre transfusion: centre@cnts.tn");
  console.log("  Banque de sang:     banque@blood.tn");
  console.log("  Hôpital:            hopital@sante.tn");
  console.log("  Clinique:           clinique@sante.tn");
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
