import { Organization } from "@/types/organization.types";

export const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: "org_1",
    name: "Acme Corp",
    slug: "acme-corp",
    plan: "pro",
    settings: {
      require2FA: true,
      allowedDomains: ["acme.corp"],
      timezone: "America/New_York",
    },
    createdAt: "2023-01-15T08:30:00Z",
  },
];
