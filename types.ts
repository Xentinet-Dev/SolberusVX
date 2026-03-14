
export enum FeatureMode {
  DASHBOARD = 'DASHBOARD',
  INTELLIGENCE = 'INTELLIGENCE', 
  VISUALS = 'VISUALS', 
  RECON = 'RECON', 
  LIVE_UPLINK = 'LIVE_UPLINK',
  STUDIO = 'STUDIO',
  CAMPAIGNS = 'CAMPAIGNS',
  STYLE_PROTOCOL = 'STYLE_PROTOCOL', // New Consistency Engine
  BATCH_FACTORY = 'BATCH_FACTORY', // New Automated Pipeline
  ASSET_LIBRARY = 'ASSET_LIBRARY', // New Dedicated Library
  UI_ARCHITECT = 'UI_ARCHITECT' // New UI Deconstruction Engine
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isThinking?: boolean;
  timestamp: number;
  images?: string[]; // Base64
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface GeneratedVideo {
  url: string;
  prompt: string;
}

export enum ModelType {
  FLASH_LITE = 'gemini-flash-lite-latest',
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  IMAGEN_3 = 'imagen-3.0-generate-002',
  IMAGEN_4 = 'imagen-4.0-generate-001',
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO_GEN = 'veo-3.1-generate-preview',
  LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025'
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "2:3" | "3:2" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";

// --- OCTANE KERNEL SETTINGS ---
export interface OctaneRenderSettings {
  lens: string;      // e.g., "35mm Wide"
  aperture: string;  // e.g., "f/1.4 (Shallow)"
  lighting: string;  // e.g., "Studio Softbox"
  filmStock: string; // e.g., "Kodak Portra 400"
  material: string;  // e.g., "Brushed Titanium"
  spectral: boolean; // Chromatic aberration / dispersion
}

// --- CAMPAIGN TYPES ---

export interface CampaignPost {
  id: string;
  day: number;
  type: 'IMAGE' | 'VIDEO';
  goal: string;
  visualPrompt: string;
  socialCopy: string;
  status: 'PENDING' | 'GENERATING' | 'READY' | 'UPLINKED' | 'FAILED';
  assetUrl?: string;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  objective: string;
  brandVoice: string;
  visualStyle: string;
  created: number;
  posts: CampaignPost[];
  status: 'PLANNING' | 'EXECUTING' | 'COMPLETED';
}

// --- STUDIO TYPES ---

export enum StudioStage {
  SCRIPTING = 'SCRIPTING',
  AUDITING = 'AUDITING', 
  STORYBOARDING = 'STORYBOARDING', 
  FILMING = 'FILMING', 
  EDITING = 'EDITING', 
  FINISHED = 'FINISHED'
}

export enum ShotCountMode {
  STANDARD = 'STANDARD', 
  EXTENDED = 'EXTENDED', 
  DEEP = 'DEEP'          
}

export interface StudioShot {
  id: string;
  type: 'ESTABLISHING' | 'WIDE' | 'ACTION' | 'DETAIL' | 'ALT' | 'INSERT' | 'CLOSEUP';
  description: string; 
  imagePrompt: string;
  videoPrompt: string;
  status: 'PENDING' | 'GENERATING_IMG' | 'READY_IMG' | 'GENERATING_VID' | 'READY_VID' | 'FAILED';
  imageUrl?: string;
  videoUrl?: string;
  trimStart: number; 
  trimEnd: number; 
  volume: number;
  duration: number; 
  hasDialogue?: boolean; 
}

export interface StudioScene {
  id: string;
  number: number;
  title: string;
  rawDescription: string;
  optimizedDescription: string;
  cameraStyle: string;
  lightingStyle: string;
  mood: string;
  soundscape?: string;
  shots: StudioShot[];
  status: 'PENDING' | 'AUDITED' | 'STORYBOARDED' | 'FILMED';
}

export interface StudioProject {
  id: string;
  name: string;
  created: number;
  script: string;
  scenes: StudioScene[];
  stage: StudioStage;
  autoRun: boolean;
  settings: {
    aspectRatio: AspectRatio;
    styleSeed: string;
    colorGrade: string; 
    musicTrack?: string;
    fps: number;
    shotCountMode: ShotCountMode;
    autoDuck: boolean;
  };
}
