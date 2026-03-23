export interface ApiToken {
  id: string;
  name: string;
  tokenPrefix: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}
