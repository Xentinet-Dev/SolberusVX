
import { ModelType, ShotCountMode, FeatureMode } from './types';

export const MODELS = {
  textBasic: ModelType.FLASH,
  textFast: ModelType.FLASH_LITE,
  textComplex: ModelType.PRO,
  imageGenHigh: ModelType.PRO_IMAGE,
  imageEdit: ModelType.FLASH_IMAGE,
  videoFast: ModelType.VEO_FAST,
  videoGen: ModelType.VEO_GEN,
  live: ModelType.LIVE,
  transcribe: ModelType.FLASH,
  vision: ModelType.PRO,
};

// UPGRADED DNA FOR "OCTANE 2026" TARGET
export const OCTANE_DNA = ", Octane Render 2026, Path Tracing, ACES Filmic Tone Mapping, OpenPBR Materials, Neural Radiance Cache (NRC), 8K UHD, 32-bit Float EXR, Nanite Geometry, Lumen Global Illumination, Subsurface Scattering, Chromatic Aberration, ISO 100, f/1.4";

export const CINEMATIC_PROMPT_LAYER = "shot on IMAX 70mm, Panavision lenses, color graded, high dynamic range, volumetric lighting, micro-details, sharp focus";

// --- VIRTUAL CAMERA KIT (SORTED BY QUALITY) ---
export const OCTANE_MATERIALS = [
    { label: "Subsurface Scattering (SSS)", value: "waxy subsurface scattering material, translucent, organic skin-like light penetration, marble texture", desc: "Skin/Wax/Jade. Light passes through the object. Essential for realistic creatures." },
    { label: "Dielectric Glass", value: "dielectric glass material, caustic dispersion, refraction, prismatic color splitting, crystal clear", desc: "Prismatic Glass. Bends light, creates rainbows (caustics). Complex and beautiful." },
    { label: "Glossy Car Paint", value: "metallic car paint, multi-layered clearcoat, metallic flakes, high gloss reflection, studio automotive", desc: "Automotive. Shiny, reflective, metallic flakes. High luxury." },
    { label: "Brushed Titanium", value: "brushed titanium metal, anisotropic reflections, micro-scratches, industrial look, heavy metal", desc: "Sci-Fi Metal. Micro-scratches, industrial, heavy." },
    { label: "Carbon Fiber", value: "woven carbon fiber texture, clearcoat finish, geometric pattern, high tech material", desc: "Racing/Tech. Woven pattern with clear coat." },
    { label: "Emissive Neon", value: "blackbody emissive material, glowing neon light source, bloom effect, light casting", desc: "Light Source. The object itself emits light." },
    { label: "Rusted Iron", value: "heavily rusted iron, oxidized metal texture, grunge details, rough surface, post-apocalyptic", desc: "Decay. Old, weathered, textured metal." },
    { label: "Matte Plastic", value: "smooth matte plastic material, diffuse surface, soft specular highlights, product design", desc: "Modern Tech. Smooth, non-reflective, soft touch." },
    { label: "Clay (Review)", value: "white untextured clay material, ambient occlusion, sculpt visualization style, minimal", desc: "Sculpt Mode. Pure form, no color. Good for checking geometry." },
    { label: "Standard / None", value: "", desc: "Default AI decision. Let the model choose based on prompt." }
];

export const OCTANE_LENSES = [
    { label: "85mm Cine-Prime", value: "85mm cine-prime lens, strong subject isolation, cinematic compression, shallow depth of field", desc: "The 'Hollywood' lens. Compresses background, isolates subject. Best for portraits and cinematic shots." },
    { label: "50mm Prime", value: "50mm prime lens, perfect portrait perspective, flattering compression, natural field of view", desc: "Nifty Fifty. Matches the human eye. Great for standard portraits and object focus." },
    { label: "35mm Standard", value: "35mm lens, street photography style, balanced composition, slight context visibility", desc: "The Storyteller. Shows subject + environment. Standard for most cinema." },
    { label: "Macro 100mm", value: "100mm macro lens, extreme close-up, microscopic detail, shallow focus, texture heavy", desc: "Microscope View. For extreme detail on textures, insects, or eyes." },
    { label: "200mm Telephoto", value: "200mm telephoto lens, extreme compression, flat background, sniper view, distant focus", desc: "Sniper / Sports. Flattens depth completely. Makes background look huge relative to subject." },
    { label: "16mm Wide Angle", value: "16mm wide-angle lens, expansive field of view, slight distortion, dynamic perspective", desc: "GoPro / Action. Distorts edges, captures vast scenes. High energy." }
];

export const OCTANE_APERTURES = [
    { label: "f/1.2 Dreamy Bokeh", value: "f/1.2 aperture, razor thin depth of field, creamy bokeh background, soft focus falloff, ethereal look", desc: "Maximum Blur. Only the eyes are in focus. Background melts away. Ethereal." },
    { label: "f/1.8 Fast Prime", value: "f/1.8 aperture, strong bokeh, excellent subject separation, low light mastery", desc: "Professional Standard. Good separation without losing the nose in blur." },
    { label: "f/2.8 Cinematic", value: "f/2.8 aperture, standard cinematic depth of field, balanced separation, sharp subject", desc: "Movie Standard. The classic film look. Background is soft but recognizable." },
    { label: "f/8.0 Deep Focus", value: "f/8.0 aperture, deep depth of field, sharp background, commercial product look", desc: "Commercial Sharpness. Everything is in focus. Good for landscapes and products." },
    { label: "f/16 Hyper-Sharp", value: "f/16 aperture, hyper-focal distance, infinite focus, crisp details everywhere, no blur", desc: "Infinite Focus. No blur anywhere. Technical drawings or vast landscapes." }
];

export const OCTANE_LIGHTING = [
    { label: "Cinematic Volumetric", value: "volumetric lighting, god rays, atmospheric haze, tyndall effect, dusty air, dramatic beams", desc: "God Rays. Adds fog, haze, and beams of light. Highly atmospheric and moody." },
    { label: "Studio Three-Point", value: "professional studio lighting, three-point setup, key light, rim light, fill light, controlled contrast, commercial look", desc: "Professional Studio. Key, Fill, and Rim lights. Perfect for character rendering." },
    { label: "Neon Cyberpunk", value: "neon emissive lighting, bioluminescent accents, dark environment, colored rim lights, night city ambience", desc: "Blade Runner Style. Dark scenes lit by colored neon signs and screens." },
    { label: "Golden Hour (Natural)", value: "natural sunlight, golden hour, warm sun rays, global illumination, long shadows, outdoor realism", desc: "Sunset/Sunrise. Warm, emotional, natural outdoor lighting." },
    { label: "Chiaroscuro Noir", value: "chiaroscuro lighting, deep shadows, high contrast, silhouette, dramatic mood, film noir style", desc: "High Contrast. Deep blacks, bright whites. Mystery and drama." },
    { label: "Softbox Commercial", value: "large softbox lighting, even illumination, clean look, product photography style, no harsh shadows", desc: "Apple Ad. Soft, wrap-around light. No harsh shadows. Clean." }
];

export const OCTANE_FILM_STOCKS = [
    { label: "Kodak Portra 400", value: "Kodak Portra 400 film stock, warm tones, fine grain, analog aesthetic, skin tone optimized", desc: "The Gold Standard. Warm, natural grain. Best for skin tones." },
    { label: "CineStill 800T", value: "CineStill 800T, tungsten balanced, halation around highlights, cinematic night look, blue cool tones", desc: "Night Cinema. Glowing red halos around lights (halation). Cool blue tones." },
    { label: "Fujifilm Velvia", value: "Fujifilm Velvia, high saturation, vibrant colors, cool undertones, nature photography style", desc: "Vibrant Punch. High contrast and saturation. Great for nature and fashion." },
    { label: "Ilford HP5 B&W", value: "Ilford HP5 Plus, black and white photography, high contrast, gritty texture, timeless look", desc: "Gritty B&W. Classic, high grain black and white." },
    { label: "Digital Clean", value: "digital sensor, clean output, no noise, 8k sharp, modern rendering", desc: "Modern Digital. No grain, no noise. Just pure pixels." }
];

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "2:3", "3:2"];
export const IMAGE_SIZES = ["1K", "2K", "4K"];

export const SHOT_COUNT_MODES = [
  { label: "Standard (4-7 Shots)", value: ShotCountMode.STANDARD },
  { label: "Extended (7-15 Shots)", value: ShotCountMode.EXTENDED },
  { label: "Cinematic Deep Pack (15-25 Shots)", value: ShotCountMode.DEEP }
];

export const GENERATION_THEMES = [
  { label: "Hyper-Realistic (Default)", value: ", hyper-realistic, 8K, highly detailed, photorealistic, shot on 35mm, indistinguishable from reality, cinematic lighting, raw photo" },
  { label: "Solberus Cyber-Defense", value: ", dark navy cyber-lab atmosphere, cyan luminescent edge-lighting, solana-green spectral accents, hyper-detailed texture, metallic, industrial, volumetric fog" },
  { label: "Anime / Manga", value: ", anime style, studio ghibli, makoto shinkai, vibrant colors, cel shaded, highly detailed" },
  { label: "Cyberpunk 2077", value: ", cyberpunk, neon lights, night city, rain, futuristic, high tech low life, highly detailed" },
  { label: "Digital Art", value: ", digital art, trending on artstation, octane render, unreal engine 5, masterpiece" },
  { label: "Oil Painting", value: ", oil painting, impasto, visible brushstrokes, classical style, masterpiece" },
  { label: "Watercolor", value: ", watercolor painting, soft edges, pastel colors, artistic, dreamy" },
  { label: "Pencil Sketch", value: ", graphite pencil sketch, rough lines, shading, artistic, monochrome" },
  { label: "Retro 80s Synthwave", value: ", synthwave, retrowave, 80s style, neon grids, vhs effect, chrome" },
  { label: "Film Noir", value: ", film noir, black and white, high contrast, dramatic shadows, cinematic" },
  { label: "Fantasy RPG", value: ", fantasy style, dnd, magic, mythical, intricate armor, glowing runes" },
  { label: "Sci-Fi Concept", value: ", sci-fi concept art, spaceship, alien planet, futuristic technology, clean lines" },
  { label: "Pixar / 3D Cartoon", value: ", pixar style, disney, 3d render, cute, vibrant, smooth textures" },
  { label: "Vintage Photography", value: ", vintage photo, polaroid, film grain, faded colors, antique" },
  { label: "Abstract", value: ", abstract art, geometric shapes, surreal, vibrant colors, chaos" },
  { label: "Vector Art", value: ", vector art, flat design, clean lines, illustrator, minimalist" },
  { label: "Low Poly", value: ", low poly, geometric, 3d render, minimalist, sharp edges" },
  { label: "Steampunk", value: ", steampunk, brass, gears, victorian, steam, copper, mechanical" },
  { label: "Gothic", value: ", gothic, dark, mysterious, cathedral, gargoyles, mist" },
  { label: "Pop Art", value: ", pop art, warhol, comic book dots, bold colors, repetitive" },
];

export const SOCIAL_STYLES = [
  "Viral / Hype",
  "Dramatic",
  "Cryptic / Mysterious",
  "Cinematic Noir",
  "Ethereal / Dreamy",
  "Comedy / Funny",
  "Unhinged / Chaos",
  "Horror / Creepy",
  "Professional / Clean",
  "Philosophical",
  "Tech / Futuristic",
  "Crypto / Degen",
  "Minimalist",
  "Shitpost",
  "Poetic",
  "Custom Voice / Context..."
];

export const SOCIAL_LENGTHS = [
  { label: "Short (<100 chars)", value: "short" },
  { label: "Medium (<280 chars)", value: "medium" },
  { label: "Thread (Long)", value: "long" }
];

export const SYSTEM_INSTRUCTION_SOLBERUS = `You are SOLBERUS-VX, a cyber-defense Tri-Intelligence Engine.
Your responses should be precise, tactical, and analytical.
Adopt a persona of a high-tech military/cyber-security AI.
Use terms like "Affirmative", "Processing", "Visual uplink established", "Threat analysis complete".
Maintain a cool, professional, slightly detached but highly competent tone.`;

// UI ARCHITECT MODES
export const UI_ARCHITECT_MODES = [
  { id: 'professional_clean', label: 'Professional / Clean', desc: 'Modern SaaS, High Whitespace, Minimalist.' },
  { id: 'government_institutional', label: 'Government / Institutional', desc: 'High Contrast, Accessible, Utilitarian.' },
  { id: 'memeart_token', label: 'Meme / Crypto Degen', desc: 'Maximalist, Neon, Glitchy, Chaos.' },
  { id: 'custom_reference', label: 'Custom Reference Fusion', desc: 'Merges structure with uploaded style reference.' }
];

export const UI_ARCHITECT_SYSTEM_INSTRUCTION = `Role: You are UI Architect, a specialized AI model trained for visual deconstruction and non-textual UI synthesis.

Core Directive:
Analyze the input screenshot(s) and regenerate their structural and stylistic essence without reproducing any textual content.

OUTPUT FORMAT:
1. ANALYSIS PHASE:
[ANALYSIS of Source]
- **Layout Pattern Identified:** ...
- **Key UI Components:** ...
- **Deconstructed Style Tokens:** ...
- **Text Region Mapping:** ...

2. REDESIGN CONCEPT:
[REDESIGN: {mode}]
- **Applied Transformation Logic:** ...
- **Visual Description of New UI:** (Detailed paragraph describing the visual output. CRITICAL: This description will be used to generate an image. Focus on colors, shapes, layout, and "abstract text blocks".)

3. SPECS:
[TOKENS & SPECS for Development]
- **Regenerated Color Palette:** ...
- **Spacing Scale:** ...
- **Component Notes:** ...

CRITICAL RULE:
NEVER generate readable text descriptions in the "Visual Description". Describe text as "abstract visual blocks", "solid color bars", or "gradient fields".
`;

export const MODULE_INSTRUCTIONS: Record<FeatureMode, { title: string, brief: string, steps: string[] }> = {
  [FeatureMode.DASHBOARD]: {
    title: "COMMAND CENTER",
    brief: "This is your HQ. It displays system telemetry and navigation. Use the sidebar to access specific intelligence modules.",
    steps: ["Review telemetry stats (Assets, Campaigns, etc).", "Select a module from the grid or sidebar to begin operations."]
  },
  [FeatureMode.INTELLIGENCE]: {
    title: "PROMPT INTELLIGENCE",
    brief: "The 'Prompt Correcter' and 'DNA Geneticist'. It turns raw, messy ideas into professional 8K prompts.",
    steps: [
      "Paste your raw ideas (single or batch list) into the left panel.",
      "Click 'CORRECT & SYNTHESIZE'.",
      "The system will format them and suggest 3 'Style DNA' options.",
      "Click 'TRANSMIT TO VISUALS' to send the corrected batch directly to the generator."
    ]
  },
  [FeatureMode.VISUALS]: {
    title: "VISUAL ENGINE",
    brief: "The primary asset fabrication unit. Supports Image Generation, Video Generation (Veo), Editing, and specialized Octane 3D Rendering.",
    steps: [
      "Select Sub-Mode (GEN_IMG, GEN_OCTANE, GEN_VIDEO, etc) at the top.",
      "Upload Reference Images (Optional) for Style Transfer.",
      "Enter your Prompt (or receive it from Intelligence Module).",
      "Set Aspect Ratio and Theme.",
      "Click 'INITIALIZE GENERATION'."
    ]
  },
  [FeatureMode.BATCH_FACTORY]: {
    title: "BATCH FACTORY",
    brief: "Automated mass-production pipeline. Converts lists of prompts into a downloadable ZIP archive of assets.",
    steps: [
      "Select Input Mode (JSON for strict control, RAW TEXT for speed).",
      "Paste your prompt list. (Tip: Use the Intelligence Module first to clean them).",
      "Select Model Core (Gemini 3 Pro recommended).",
      "Click 'START BATCH FACTORY'.",
      "Wait for the parallel grid to finish processing, then download the ZIP."
    ]
  },
  [FeatureMode.STYLE_PROTOCOL]: {
    title: "PROTOCOL DNA",
    brief: "Consistency Engine. Ensures all generated assets share the exact same artistic style/DNA.",
    steps: [
      "Upload 1-4 'Anchor Images' (The style reference).",
      "Define 'Master DNA' (The text suffix appended to every prompt).",
      "Enter a 'Subject' (e.g., 'A helmet', 'A car').",
      "Click 'GENERATE'. The system combines Subject + DNA + Anchor Refs."
    ]
  },
  [FeatureMode.CAMPAIGNS]: {
    title: "MARKETING ORCHESTRATOR",
    brief: "Autonomous Campaign Manager. Creates a 7-day content strategy and auto-generates the assets.",
    steps: [
      "Enter a 'Global Objective' (e.g., 'Launch a sci-fi perfume').",
      "Click 'INITIALIZE CAMPAIGN' to generate the 7-day strategy.",
      "Review the strategy in the dashboard.",
      "Click 'DEPLOY CAMPAIGN' to auto-generate the images/videos for each day."
    ]
  },
  [FeatureMode.STUDIO]: {
    title: "CINEMATIC STUDIO",
    brief: "End-to-end Video Production. Converts a script into a fully filmed sequence.",
    steps: [
      "Paste a Script or rough idea into the input.",
      "Click 'CREATE PROJECT'.",
      "Click 'START AUTO-PRODUCTION'.",
      "The system will Audit (Fix script), Storyboard (Gen Images), and Film (Gen Video) automatically."
    ]
  },
  [FeatureMode.RECON]: {
    title: "MEDIA ANALYZER",
    brief: "Multimodal Intelligence. Upload media to extract data, text, or threat analysis.",
    steps: [
      "Select Analysis Type (Image, Video, Audio, etc).",
      "Upload a file.",
      "Click 'EXECUTE ANALYSIS'.",
      "View the AI-generated report on the right."
    ]
  },
  [FeatureMode.LIVE_UPLINK]: {
    title: "VOICE CHAT",
    brief: "Real-time voice conversation with Solberus.",
    steps: [
      "Click 'START CALL'.",
      "Speak into your microphone.",
      "The system will respond with low-latency audio."
    ]
  },
  [FeatureMode.ASSET_LIBRARY]: {
    title: "ASSET ARCHIVE",
    brief: "Centralized storage for all generated content.",
    steps: [
      "Filter by Image, Video, or Octane Renders.",
      "Click an asset to view full screen.",
      "Download or Delete assets."
    ]
  },
  [FeatureMode.UI_ARCHITECT]: {
    title: "UI ARCHITECT",
    brief: "Deconstructs and reimagines user interfaces. Upload a screenshot to analyze layout and generate an abstract mockup.",
    steps: [
      "Upload Source Screenshot.",
      "Select Design Mode (e.g. Clean, Institutional).",
      "Upload Reference Image (Optional).",
      "Click 'INITIATE ARCHITECT'. The system will generate a blueprint and visual mockup."
    ]
  }
};
