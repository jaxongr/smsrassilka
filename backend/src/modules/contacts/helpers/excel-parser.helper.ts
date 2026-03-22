import * as XLSX from 'xlsx';

export interface ParsedContact {
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
}

export function parseExcel(buffer: Buffer): ParsedContact[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
  });

  if (!rows.length) {
    return [];
  }

  const contacts: ParsedContact[] = [];

  for (const row of rows) {
    const keys = Object.keys(row).map((k) => k.toLowerCase());
    const originalKeys = Object.keys(row);

    const phoneKey = originalKeys.find((k) =>
      ['phonenumber', 'phone_number', 'phone', 'tel', 'number'].includes(
        k.toLowerCase(),
      ),
    );
    const firstNameKey = originalKeys.find((k) =>
      ['firstname', 'first_name', 'name', 'ism'].includes(k.toLowerCase()),
    );
    const lastNameKey = originalKeys.find((k) =>
      ['lastname', 'last_name', 'surname', 'familiya'].includes(
        k.toLowerCase(),
      ),
    );

    if (!phoneKey) {
      throw new Error(
        'Excel file must contain a "phoneNumber" or "phone" column',
      );
    }

    const phoneNumber = String(row[phoneKey]).trim();
    if (!phoneNumber) continue;

    contacts.push({
      phoneNumber,
      firstName: firstNameKey ? String(row[firstNameKey]).trim() || undefined : undefined,
      lastName: lastNameKey ? String(row[lastNameKey]).trim() || undefined : undefined,
    });
  }

  return contacts;
}
