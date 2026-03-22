export interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  phoneNumber: string;
  firstName: string | null;
  lastName: string | null;
  groupId: string;
  variables: Record<string, string>;
  createdAt: string;
}
