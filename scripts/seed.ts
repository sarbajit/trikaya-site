import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import { connectDB } from "../lib/db";
import { SiteSettings } from "../models/SiteSettings";
import { Agent } from "../models/Agent";
import { Property } from "../models/Property";
import { RoomType } from "../models/RoomType";
import { RatePlan } from "../models/RatePlan";
import {
  siteSettingsSeed,
  agentsSeed,
  propertiesSeed,
  roomTypesSeed,
  ratePlansSeed,
} from "../data/seed-data";

const PLACEHOLDER_AGENT_PASSWORD = "ChangeMe123!";

async function seedSiteSettings() {
  await SiteSettings.findOneAndUpdate(
    { key: "main" },
    { $set: { ...siteSettingsSeed, key: "main" } },
    { upsert: true, new: true }
  );
  return 1;
}

async function seedAgents() {
  const passwordHash = await bcrypt.hash(PLACEHOLDER_AGENT_PASSWORD, 10);
  let count = 0;
  for (const agent of agentsSeed) {
    await Agent.findOneAndUpdate(
      { email: agent.email },
      { $set: { ...agent, passwordHash } },
      { upsert: true, new: true }
    );
    count++;
  }
  return count;
}

async function seedProperties(): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>();
  for (const property of propertiesSeed) {
    const doc = await Property.findOneAndUpdate(
      { slug: property.slug },
      { $set: property },
      { upsert: true, new: true }
    );
    slugToId.set(property.slug, doc._id.toString());
  }
  return slugToId;
}

async function seedRoomTypes(
  slugToPropertyId: Map<string, string>
): Promise<Map<string, string>> {
  const keyToId = new Map<string, string>();
  for (const roomType of roomTypesSeed) {
    const propertyId = slugToPropertyId.get(roomType.propertySlug);
    if (!propertyId) {
      throw new Error(
        `roomTypesSeed references unknown propertySlug "${roomType.propertySlug}"`
      );
    }
    const { propertySlug, ...rest } = roomType;
    const doc = await RoomType.findOneAndUpdate(
      { propertyId, name: roomType.name },
      { $set: { ...rest, propertyId } },
      { upsert: true, new: true }
    );
    keyToId.set(`${propertySlug}|${roomType.name}`, doc._id.toString());
  }
  return keyToId;
}

async function seedRatePlans(roomTypeKeyToId: Map<string, string>) {
  let count = 0;
  for (const ratePlan of ratePlansSeed) {
    const key = `${ratePlan.propertySlug}|${ratePlan.roomTypeName}`;
    const roomTypeId = roomTypeKeyToId.get(key);
    if (!roomTypeId) {
      throw new Error(
        `ratePlansSeed references unknown property/room type "${key}"`
      );
    }
    const { propertySlug, roomTypeName, ...rest } = ratePlan;
    await RatePlan.findOneAndUpdate(
      { roomTypeId, label: ratePlan.label },
      {
        $set: {
          ...rest,
          roomTypeId,
          startDate: new Date(ratePlan.startDate),
          endDate: new Date(ratePlan.endDate),
        },
      },
      { upsert: true, new: true }
    );
    count++;
  }
  return count;
}

async function main() {
  await connectDB();

  const siteSettingsCount = await seedSiteSettings();
  const agentCount = await seedAgents();
  const slugToPropertyId = await seedProperties();
  const roomTypeKeyToId = await seedRoomTypes(slugToPropertyId);
  const ratePlanCount = await seedRatePlans(roomTypeKeyToId);

  console.log("Seed complete:");
  console.log(`  SiteSettings: ${siteSettingsCount}`);
  console.log(`  Agents: ${agentCount} (placeholder password: ${PLACEHOLDER_AGENT_PASSWORD})`);
  console.log(`  Properties: ${slugToPropertyId.size}`);
  console.log(`  RoomTypes: ${roomTypeKeyToId.size}`);
  console.log(`  RatePlans: ${ratePlanCount}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
