export type ServiceProduct = {
  id: string;
  productType: string;
  productName: string;
  planName: string;
  unitPrice: number;
  billingCycle: "monthly" | "annually";
  description: string;
  highlights: string[];
};

export type ServiceCategory = {
  type: string;
  label: string;
  products: ServiceProduct[];
};

export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    type: "SHARED_HOSTING",
    label: "Shared Hosting",
    products: [
      {
        id: "shared-starter",
        productType: "SHARED_HOSTING",
        productName: "Shared Hosting - Starter",
        planName: "Starter",
        unitPrice: 499,
        billingCycle: "monthly",
        description: "Ideal for personal sites and small blogs.",
        highlights: ["10 GB SSD", "1 website", "Free SSL", "cPanel included"],
      },
      {
        id: "shared-plus",
        productType: "SHARED_HOSTING",
        productName: "Premium Shared Hosting - Plus",
        planName: "Plus",
        unitPrice: 1499,
        billingCycle: "annually",
        description: "Best for growing business websites.",
        highlights: ["15 GB SSD", "10 addon domains", "25 email accounts", "cPanel included"],
      },
    ],
  },
  {
    type: "VPS",
    label: "VPS Hosting",
    products: [
      {
        id: "vps-2gb",
        productType: "VPS",
        productName: "VPS 2GB",
        planName: "2 GB RAM, 2 vCPU, 50 GB SSD",
        unitPrice: 999,
        billingCycle: "monthly",
        description: "Entry-level virtual private server.",
        highlights: ["Ubuntu 22.04", "Full root access", "Snapshots", "Firewall"],
      },
      {
        id: "vps-4gb",
        productType: "VPS",
        productName: "VPS 4GB",
        planName: "4 GB RAM, 2 vCPU, 80 GB SSD",
        unitPrice: 1499,
        billingCycle: "monthly",
        description: "More power for apps and APIs.",
        highlights: ["Ubuntu 22.04", "Backups", "Snapshots", "Dedicated IP"],
      },
    ],
  },
  {
    type: "RESELLER_HOSTING",
    label: "Reseller Hosting",
    products: [
      {
        id: "reseller-basic",
        productType: "RESELLER_HOSTING",
        productName: "Reseller Hosting - Basic",
        planName: "Basic Reseller",
        unitPrice: 1999,
        billingCycle: "monthly",
        description: "Start your own hosting brand.",
        highlights: ["50 GB storage", "WHM/cPanel", "White-label ready", "Client accounts"],
      },
    ],
  },
  {
    type: "BUSINESS_EMAIL",
    label: "Business Email",
    products: [
      {
        id: "m365-business",
        productType: "BUSINESS_EMAIL",
        productName: "Microsoft 365 Business",
        planName: "Microsoft 365 Business Standard",
        unitPrice: 1099,
        billingCycle: "monthly",
        description: "Professional email and Office apps.",
        highlights: ["5 mailboxes included", "Microsoft 365", "Web apps", "1 TB OneDrive/mailbox"],
      },
    ],
  },
];

export function getCatalogCategory(type: string | null | undefined) {
  if (!type) return null;
  return SERVICE_CATALOG.find((c) => c.type === type) ?? null;
}

export function buildCartPayload(product: ServiceProduct) {
  return {
    productType: product.productType,
    productName: product.productName,
    quantity: 1,
    unitPrice: product.unitPrice,
    metadata: {
      planName: product.planName,
      billingCycle: product.billingCycle,
    },
  };
}
