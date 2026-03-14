
import { StudioProject, MarketingCampaign } from '../types';

export interface StoredAsset {
  id: string;
  type: 'image' | 'video';
  url: string; // Base64 data URI
  prompt: string;
  timestamp: number;
  tags: string[];
  socialText?: string;
  theme?: string;
}

export interface VoiceSession {
  id: string;
  timestamp: number;
  logs: string[];
}

export interface ReconReport {
  id: string;
  type: 'image' | 'video' | 'audio';
  result: string;
  timestamp: number;
  filename?: string;
}

class StorageService {
  private dbName = 'SolberusDB';
  private version = 3; // Incremented version for Campaigns
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
        const db = (e.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('timestamp', 'timestamp', { unique: false });
          assetStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('voice_sessions')) {
          db.createObjectStore('voice_sessions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('recon_reports')) {
          db.createObjectStore('recon_reports', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('created', 'created', { unique: false });
        }

        // Campaigns Store
        if (!db.objectStoreNames.contains('campaigns')) {
          const campaignStore = db.createObjectStore('campaigns', { keyPath: 'id' });
          campaignStore.createIndex('created', 'created', { unique: false });
        }
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) await this.init();
    return this.db!;
  }

  // --- Campaigns ---

  async saveCampaign(campaign: MarketingCampaign): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('campaigns', 'readwrite');
      tx.objectStore('campaigns').put(campaign);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCampaigns(): Promise<MarketingCampaign[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('campaigns', 'readonly');
      const store = tx.objectStore('campaigns');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a: any, b: any) => b.created - a.created));
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCampaign(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('campaigns', 'readwrite');
      tx.objectStore('campaigns').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Assets ---

  async saveAsset(asset: StoredAsset): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('assets', 'readwrite');
      tx.objectStore('assets').put(asset);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAssets(): Promise<StoredAsset[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('assets', 'readonly');
      const store = tx.objectStore('assets');
      const index = store.index('timestamp');
      const request = index.openCursor(null, 'prev'); 
      const results: StoredAsset[] = [];

      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteAsset(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('assets', 'readwrite');
      tx.objectStore('assets').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- Voice Sessions ---

  async saveVoiceSession(session: VoiceSession): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('voice_sessions', 'readwrite');
      tx.objectStore('voice_sessions').put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getVoiceSessions(): Promise<VoiceSession[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('voice_sessions', 'readonly');
      const request = tx.objectStore('voice_sessions').getAll();
      request.onsuccess = () => resolve(request.result.sort((a: VoiceSession, b: VoiceSession) => b.timestamp - a.timestamp));
      request.onerror = () => reject(request.error);
    });
  }

  // --- Recon Reports ---

  async saveReconReport(report: ReconReport): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recon_reports', 'readwrite');
      tx.objectStore('recon_reports').put(report);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getReconReports(): Promise<ReconReport[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recon_reports', 'readonly');
      const request = tx.objectStore('recon_reports').getAll();
      request.onsuccess = () => resolve(request.result.sort((a: ReconReport, b: ReconReport) => b.timestamp - a.timestamp));
      request.onerror = () => reject(request.error);
    });
  }

  // --- Studio Projects ---

  async saveProject(project: StudioProject): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getProjects(): Promise<StudioProject[]> {
     const db = await this.getDB();
     return new Promise((resolve, reject) => {
        const tx = db.transaction('projects', 'readonly');
        const store = tx.objectStore('projects');
        const index = store.index('created');
        const request = index.openCursor(null, 'prev');
        const results: StudioProject[] = [];
        request.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = () => reject(request.error);
     });
  }
  
  async deleteProject(id: string): Promise<void> {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction('projects', 'readwrite');
          tx.objectStore('projects').delete(id);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
      });
  }
}

export const storageService = new StorageService();
