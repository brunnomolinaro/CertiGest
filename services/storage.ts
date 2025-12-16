import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Company, EmissionRecord } from '../types';

interface CertiGestDB extends DBSchema {
  companies: {
    key: string;
    value: Company;
  };
  emissions: {
    key: string;
    value: EmissionRecord;
    indexes: { 'by-company': string; 'by-cycle': string };
  };
}

const DB_NAME = 'CertiGestDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CertiGestDB>>;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<CertiGestDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('companies')) {
          db.createObjectStore('companies', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('emissions')) {
          const store = db.createObjectStore('emissions', { keyPath: 'id' });
          store.createIndex('by-company', 'companyId');
          store.createIndex('by-cycle', 'cycle');
        }
      },
    });
  }
  return dbPromise;
};

export const StorageService = {
  getCompanies: async (): Promise<Company[]> => {
    const db = await getDB();
    return db.getAll('companies');
  },

  saveCompany: async (company: Company): Promise<void> => {
    const db = await getDB();
    const existing = await db.getAll('companies');
    if (existing.some(c => c.cnpj === company.cnpj)) {
      throw new Error('Empresa já cadastrada com este CNPJ.');
    }
    await db.put('companies', company);
  },

  getEmissions: async (companyId: string, cycle: string): Promise<EmissionRecord[]> => {
    const db = await getDB();
    const all = await db.getAllFromIndex('emissions', 'by-company', companyId);
    const filtered = all.filter(r => r.cycle === cycle);
    
    // Convert Blobs to URLs for UI consumption
    return filtered.map(r => {
      if (r.fileBlob && !r.fileUrl) {
        return { ...r, fileUrl: URL.createObjectURL(r.fileBlob) };
      }
      return r;
    });
  },

  getAllEmissionsInCycle: async (cycle: string): Promise<EmissionRecord[]> => {
    const db = await getDB();
    const all = await db.getAllFromIndex('emissions', 'by-cycle', cycle);
    return all;
  },

  getCompanyCycles: async (companyId: string): Promise<string[]> => {
    const db = await getDB();
    const all = await db.getAllFromIndex('emissions', 'by-company', companyId);
    const cycles = new Set<string>(all.map((r) => r.cycle));
    return Array.from(cycles).sort().reverse();
  },

  saveEmission: async (record: EmissionRecord): Promise<void> => {
    const db = await getDB();
    const all = await db.getAllFromIndex('emissions', 'by-company', record.companyId);
    
    // Check if there is an existing record for this certificate in this cycle
    const existing = all.find(r => r.certificateDefId === record.certificateDefId && r.cycle === record.cycle);
    
    if (existing) {
      // Delete previous record to ensure clean state
      await db.delete('emissions', existing.id);
    }
    
    // Clean up record before saving: remove transient fileUrl if present, ensure fileBlob is there
    const { fileUrl, ...dataToSave } = record;
    await db.put('emissions', dataToSave);
  },

  deleteCompany: async (id: string): Promise<void> => {
    const db = await getDB();
    await db.delete('companies', id);
    
    // Optional: Cleanup emissions for this company
    const tx = db.transaction('emissions', 'readwrite');
    const index = tx.store.index('by-company');
    let cursor = await index.openCursor(IDBKeyRange.only(id));
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
};