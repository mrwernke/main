import { base44 } from "@/api/base44Client";

let cached = null;

export async function getSettings() {
  if (cached) return cached;
  try {
    const list = await base44.entities.Settings.list();
    cached = list[0] || {
      tutor_email: "tutor@example.com",
      zoom_link: "https://zoom.us/j/0000000000",
      admin_username: "",
      admin_password: "",
    };
  } catch {
    cached = { tutor_email: "tutor@example.com", zoom_link: "https://zoom.us/j/0000000000" };
  }
  return cached;
}

export function clearSettingsCache() {
  cached = null;
}