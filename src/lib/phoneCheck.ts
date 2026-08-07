import { Client, Lead } from '../types';

export interface PhoneCheckResult {
  isDuplicate: boolean;
  matchType?: 'client' | 'lead';
  matchedName?: string;
  matchedPhone?: string;
  matchedId?: string;
}

export function checkPhoneDuplicate(
  inputPhone: string,
  clients: Client[] = [],
  leads: Lead[] = [],
  excludeLeadId?: string,
  excludeClientId?: string
): PhoneCheckResult {
  if (!inputPhone) return { isDuplicate: false };
  const cleanInput = inputPhone.replace(/\D/g, '');
  if (!cleanInput || cleanInput.length < 8) {
    return { isDuplicate: false };
  }

  // 1. Check in Clients
  for (const client of clients) {
    if (excludeClientId && client.id === excludeClientId) continue;
    if (!client.phone) continue;
    const cleanClientPhone = client.phone.replace(/\D/g, '');
    if (!cleanClientPhone) continue;

    if (
      cleanInput === cleanClientPhone ||
      (cleanInput.length >= 8 && cleanClientPhone.length >= 8 &&
        (cleanInput.endsWith(cleanClientPhone) || cleanClientPhone.endsWith(cleanInput)))
    ) {
      return {
        isDuplicate: true,
        matchType: 'client',
        matchedName: client.shopName ? `${client.name} (${client.shopName})` : client.name,
        matchedPhone: client.phone,
        matchedId: client.id,
      };
    }
  }

  // 2. Check in Leads
  for (const lead of leads) {
    if (excludeLeadId && lead.id === excludeLeadId) continue;
    if (!lead.phone) continue;
    const cleanLeadPhone = lead.phone.replace(/\D/g, '');
    if (!cleanLeadPhone) continue;

    if (
      cleanInput === cleanLeadPhone ||
      (cleanInput.length >= 8 && cleanLeadPhone.length >= 8 &&
        (cleanInput.endsWith(cleanLeadPhone) || cleanLeadPhone.endsWith(cleanInput)))
    ) {
      return {
        isDuplicate: true,
        matchType: 'lead',
        matchedName: lead.name,
        matchedPhone: lead.phone,
        matchedId: lead.id,
      };
    }
  }

  return { isDuplicate: false };
}
