import mongoose from "mongoose";
import Staff from "../models/Staff.js";

/**
 * Auto-migration: runs once on server start.
 *
 * Scans Room documents for janitor fields that are still plain strings
 * (legacy data before the Staff model was introduced). For each unique
 * name it finds or creates a Staff document, then replaces the string
 * value in Room.janitors with the corresponding Staff ObjectId.
 *
 * Also migrates legacy Rating documents that have janitorName (string)
 * but no staffId, by matching the name to a Staff document.
 */
export async function migrateStaffFromRooms() {
  const db = mongoose.connection.db;

  // ── 1. Migrate Room documents ────────────────────────────────────────────
  const rooms = await db.collection("rooms").find({}).toArray();

  const legacyRooms = rooms.filter((r) => {
    const j = r.janitors || {};
    // A field is "legacy" if it's a non-empty string (not an ObjectId)
    return (
      (j.roomCleaner     && typeof j.roomCleaner     === "string") ||
      (j.corridorCleaner && typeof j.corridorCleaner === "string") ||
      (j.washroomCleaner && typeof j.washroomCleaner === "string")
    );
  });

  if (legacyRooms.length > 0) {
    console.log(`🔄 Migrating ${legacyRooms.length} room(s) to Staff references...`);

    // Collect every unique string name across all legacy rooms
    const nameSet = new Set();
    for (const room of legacyRooms) {
      const j = room.janitors || {};
      if (typeof j.roomCleaner     === "string" && j.roomCleaner)     nameSet.add(j.roomCleaner);
      if (typeof j.corridorCleaner === "string" && j.corridorCleaner) nameSet.add(j.corridorCleaner);
      if (typeof j.washroomCleaner === "string" && j.washroomCleaner) nameSet.add(j.washroomCleaner);
    }

    // Find-or-create a Staff document for each unique name
    const nameToId = {};
    for (const name of nameSet) {
      let staff = await Staff.findOne({ name });
      if (!staff) {
        staff = await Staff.create({ name, isActive: true });
        console.log(`  ✅ Created Staff: "${name}" (${staff._id})`);
      } else {
        console.log(`  ♻️  Found existing Staff: "${name}" (${staff._id})`);
      }
      nameToId[name] = staff._id;
    }

    // Replace string values with ObjectIds in each legacy Room document
    for (const room of legacyRooms) {
      const j = room.janitors || {};
      const update = {};
      if (typeof j.roomCleaner     === "string" && j.roomCleaner)     update["janitors.roomCleaner"]     = nameToId[j.roomCleaner];
      if (typeof j.corridorCleaner === "string" && j.corridorCleaner) update["janitors.corridorCleaner"] = nameToId[j.corridorCleaner];
      if (typeof j.washroomCleaner === "string" && j.washroomCleaner) update["janitors.washroomCleaner"] = nameToId[j.washroomCleaner];

      await db.collection("rooms").updateOne({ _id: room._id }, { $set: update });
    }

    console.log("✅ Room migration complete.");
  } else {
    console.log("✅ No Room migration needed.");
  }

  // ── 2. Migrate Rating documents ──────────────────────────────────────────
  const legacyRatings = await db.collection("ratings").find({
    janitorName: { $ne: null, $exists: true },
    $or: [{ staffId: null }, { staffId: { $exists: false } }],
  }).toArray();

  if (legacyRatings.length > 0) {
    console.log(`🔄 Migrating ${legacyRatings.length} legacy rating(s) to staffId references...`);

    // Build a name → _id map from Staff collection
    const allStaff = await Staff.find({});
    const nameToStaffId = {};
    for (const s of allStaff) nameToStaffId[s.name] = s._id;

    let migrated = 0;
    for (const rating of legacyRatings) {
      const staffId = nameToStaffId[rating.janitorName];
      if (staffId) {
        await db.collection("ratings").updateOne(
          { _id: rating._id },
          { $set: { staffId } }
        );
        migrated++;
      }
    }
    console.log(`✅ Rating migration complete. ${migrated}/${legacyRatings.length} matched.`);
  } else {
    console.log("✅ No Rating migration needed.");
  }
}
