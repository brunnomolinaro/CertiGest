export interface Company {
  id: string;
  razãoSocial: string;
  cnpj: string;
  createdAt: string;
}

export enum CertificateCategory {
  FEDERAL = 'Federal',
  ESTADUAL = 'Estadual',
  MUNICIPAL = 'Municipal',
  TRABALHISTA = 'Trabalhista',
  JUDICIAL = 'Judicial',
  OUTROS = 'Outros'
}

export interface CertificateDefinition {
  id: string;
  name: string;
  url: string;
  category: CertificateCategory;
  description?: string;
}

export enum EmissionStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  EXPIRED = 'EXPIRED' // Optional for future use
}

export interface EmissionRecord {
  id: string;
  companyId: string;
  certificateDefId: string;
  cycle: string; // Format "YYYY-MM"
  status: EmissionStatus;
  issuedAt?: string;
  fileName?: string;
  fileUrl?: string; // Generated on runtime from Blob
  fileBlob?: Blob; // Stored in IndexedDB
}

export interface DashboardStats {
  totalCompanies: number;
  totalCertificatesInCycle: number;
  completedCertificates: number;
  pendingCertificates: number;
}