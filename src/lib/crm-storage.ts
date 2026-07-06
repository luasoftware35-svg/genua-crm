import type { Activity, Company, Contact, Deal } from "@/types";

const STORAGE_KEY = "genua-crm-v1";

export type CrmPersistedState = {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
};

export const EMPTY_CRM_STATE: CrmPersistedState = {
  companies: [],
  deals: [],
  contacts: [],
  activities: [],
};

export function loadCrmState(): CrmPersistedState {
  if (typeof window === "undefined") return EMPTY_CRM_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_CRM_STATE;
    const parsed = JSON.parse(raw) as CrmPersistedState;
    return {
      companies: parsed.companies ?? [],
      deals: parsed.deals ?? [],
      contacts: parsed.contacts ?? [],
      activities: parsed.activities ?? [],
    };
  } catch {
    return EMPTY_CRM_STATE;
  }
}

export function saveCrmState(state: CrmPersistedState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / private mode
  }
}

export function clearCrmState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
