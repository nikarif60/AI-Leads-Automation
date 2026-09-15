export type AppSettings = {
  activeNiches: string[];
  activeLocationBatches: string[];
  minimumLeadScore: number;
  telegramThreshold: number;
  maxAlertsPerScan: number;
  dailySpendLimitUsd: number;
  dailyDigestTime: string;
  cooldownDays: number;
  preferredLanguage: "auto" | "en" | "bm";
  outreachSignature: string;
};

export const niches = [
  ["corporate_services", "Corporate services"], ["renovation_interior", "Renovation & interior"],
  ["property_homestay", "Property & homestay"], ["salon_barber", "Salons & barbers"],
  ["automotive", "Automotive"], ["cafe_restaurant", "Cafes & restaurants"],
] as const;

export const locations = ["Kuala Lumpur & Selangor", "Johor Bahru & Skudai", "Penang & Bukit Mertajam", "Melaka, Negeri Sembilan, Perak & Kedah", "East Coast", "Sabah & Sarawak"];

export const defaultSettings: AppSettings = {
  activeNiches: niches.map(([value]) => value), activeLocationBatches: locations,
  minimumLeadScore: 40, telegramThreshold: 60, maxAlertsPerScan: 5, dailySpendLimitUsd: 0,
  dailyDigestTime: "21:00", cooldownDays: 90, preferredLanguage: "auto", outreachSignature: "Nik\nWeb Developer, NykStack",
};
