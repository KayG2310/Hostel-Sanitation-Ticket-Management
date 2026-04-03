// backend/utils/seedHostels.js
// Run via: node -e "import('./utils/seedHostels.js').then(m => m.seedHostels())"
// Or call seedHostels() on startup (safe — skips if already seeded)

import Hostel from "../models/Hostel.js";

/**
 * Seed initial hostels into the DB.
 * Add or remove entries below as needed.
 * This is safe to call on every startup — it only inserts if the hostel doesn't exist.
 */
const HOSTELS = [
  { name: "Brahmputra Girls", code: "BHG" },
  { name: "Brahmputra Boys", code: "BHB" },
  { name: "Raavi", code: "RAAVI" },
  { name: "Chenab", code: "CHENAB" },
  { name: "Beas", code: "BEAS" },
  { name: "Satluj", code: "SATLUJ" }
  // Add more hostels here 
];

export async function seedHostels() {
  let seeded = 0;
  for (const h of HOSTELS) {
    const exists = await Hostel.findOne({ code: h.code });
    if (!exists) {
      await Hostel.create(h);
      console.log(`🏠 Seeded hostel: ${h.name} (${h.code})`);
      seeded++;
    }
  }
  if (seeded === 0) {
    console.log("✅ Hostels already seeded — no changes.");
  }
}
