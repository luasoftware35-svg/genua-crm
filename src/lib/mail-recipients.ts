import type { Company, Contact } from "@/types";

export function resolveCompanyEmail(
  company: Pick<Company, "email">,
  contacts: Pick<Contact, "email" | "is_primary">[]
): string | null {
  const companyEmail = company.email?.trim();
  if (companyEmail) return companyEmail;

  const primary = contacts.find((c) => c.is_primary && c.email?.trim());
  if (primary?.email) return primary.email.trim();

  const fallback = contacts.find((c) => c.email?.trim());
  return fallback?.email?.trim() ?? null;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
