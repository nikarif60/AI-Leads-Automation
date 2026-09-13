export type ScanState =
  | "idle"
  | "running"
  | "completed_with_leads"
  | "completed_no_leads"
  | "failed";

export type LeadStatus =
  | "New"
  | "Qualified"
  | "Draft Ready"
  | "Contacted"
  | "Replied"
  | "Meeting"
  | "Won"
  | "Lost"
  | "Skip"
  | "Blacklist";

export type WebsiteStatus =
  | "No website"
  | "Social only"
  | "Outdated"
  | "Good website";

export type Lead = {
  id: string;
  company: string;
  niche: string;
  city: string;
  state: string;
  score: number;
  websiteStatus: WebsiteStatus;
  opportunity: string;
  reason: string;
  status: LeadStatus;
  phone: string;
  whatsapp: string;
  address: string;
  website?: string;
  social?: string;
  lastSeen: string;
  discoveredAt: string;
  englishDraft: string;
  bmDraft: string;
  scope: string[];
  scoreReasons: { label: string; points: number }[];
};

export type ScanJob = {
  id: string;
  status: ScanState;
  startedAt: string;
  completedAt?: string;
  niche: string;
  cities: string[];
  scanned: number;
  newLeads: number;
  qualified: number;
  notifications: number;
  error?: string;
};
