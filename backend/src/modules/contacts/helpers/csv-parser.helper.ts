export interface ParsedContact {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
}

export function parseCsv(buffer: Buffer): ParsedContact[] {
  const content = buffer.toString('utf-8');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const phoneIdx = header.findIndex((h) =>
    ['phonenumber', 'phone_number', 'phone', 'tel', 'number'].includes(h),
  );
  const firstNameIdx = header.findIndex((h) =>
    ['firstname', 'first_name', 'name', 'ism'].includes(h),
  );
  const lastNameIdx = header.findIndex((h) =>
    ['lastname', 'last_name', 'surname', 'familiya'].includes(h),
  );

  if (phoneIdx === -1) {
    throw new Error(
      'CSV file must contain a "phoneNumber" or "phone" column',
    );
  }

  const contacts: ParsedContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const phoneNumber = values[phoneIdx];

    if (!phoneNumber) continue;

    contacts.push({
      phoneNumber,
      firstName: firstNameIdx !== -1 ? values[firstNameIdx] || undefined : undefined,
      lastName: lastNameIdx !== -1 ? values[lastNameIdx] || undefined : undefined,
    });
  }

  return contacts;
}
