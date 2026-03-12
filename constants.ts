import { Lesson, PromptTag, ExamplePrompt } from './types';

export const COURSE_MODULES: Lesson[] = [
  {
    id: 'intro',
    category: 'Getting Started',
    title: 'Welcome to Seedance 2.0',
    content: `
# Mastering Seedance 2.0

Welcome to the ultimate interactive guide based on the selected tips for Seedance 2.0. Whether you are generating highly realistic videos or stylized animations, the way you construct your prompt is the foundation of your success.

## The Core Formula
A highly effective prompt usually follows this structure:

**[Subject] + [Action/Motion] + [Setting/Environment] + [Lighting/Atmosphere] + [Camera Movement] + [Style/Format]**

Instead of just saying "A dog running", you want to build a scene:
*"A golden retriever running through a dense, misty forest during golden hour, cinematic lighting, tracking shot from a low angle, photorealistic, 8k resolution."*

Explore the modules on the left to dive deep into each component of a perfect prompt, and use the **Playground** to test your skills!
    `
  },
  {
    id: 'camera',
    category: 'Techniques',
    title: 'Camera Dynamics',
    content: `
# Camera Movement & Angles

Seedance 2.0 is highly responsive to specific camera terminology. Using these terms gives you directorial control over the output.

## Essential Camera Moves:
*   **Pan**: The camera moves horizontally from left to right or right to left. Example: *"Slow pan across a bustling cyberpunk street."*
*   **Tilt**: The camera points up or down from a fixed position. Example: *"Tilt up from the protagonist's boots to their determined face."*
*   **Tracking / Dolly Shot**: The camera moves through space to follow the subject. Example: *"Tracking shot following a sports car on a coastal highway."*
*   **FPV (First Person View)**: Simulates the perspective of a character or drone. Extremely dynamic. Example: *"FPV flying rapidly through a dense neon-lit futuristic city canyon."*
*   **Zoom In/Out**: Changes focal length. *Tip: True dolly shots often look better than simple zooms in AI generation.*

## Angles:
*   **Low Angle**: Makes the subject look powerful or imposing.
*   **High Angle / Top-down / Drone Shot**: Good for establishing geography or making subjects look small.
*   **Eye Level**: Neutral, relatable perspective.
    `
  },
  {
    id: 'lighting',
    category: 'Techniques',
    title: 'Lighting & Atmosphere',
    content: `
# Painting with Light

Lighting defines the mood and realism of your generation. Seedance 2.0 understands complex lighting setups.

## Keywords to Try:
*   **Cinematic Lighting**: Generally improves contrast, color grading, and realism.
*   **Golden Hour**: Soft, warm light shortly after sunrise or before sunset. Excellent for beautiful, nostalgic scenes.
*   **Volumetric Lighting (God Rays)**: Light beams visible in dust or mist. Adds incredible depth to environments like forests or dusty rooms.
*   **Neon / Cyberpunk Lighting**: High contrast, saturated magentas, cyans, and deep shadows.
*   **Chiaroscuro**: Strong contrasts between light and dark, often used in classical art and film noir for dramatic effect.
*   **Studio Lighting**: Clean, controlled light. Good for product shots or clear character portraits.

*Pro Tip:* Combine weather effects with lighting, e.g., *"Neon lighting reflecting off wet rain-slicked pavement."*
    `
  },
  {
    id: 'advanced',
    category: 'Mastery',
    title: 'Advanced Prompting Tips',
    content: `
# Leveling Up Your Prompts

Once you have the basics, you can start refining your outputs.

## 1. The Power of Adjectives
Don't just say "a car". Say "a vintage, rust-covered 1970s muscle car". Details give the AI specific anchors to render.

## 2. Order Matters
Seedance models generally prioritize words at the *beginning* of the prompt. Put your main subject and action first. Put secondary details, style, and camera moves later.

## 3. Negative Prompting (Conceptually)
While not all interfaces have a separate negative prompt box, you can guide the AI away from things by being explicit about what you *do* want. Instead of "no modern buildings", use "surrounded entirely by ancient, decaying ruins".

## 4. Continuity & Consistency
If you want to maintain a specific look, consistency in your style keywords across different prompts is key. Always append your specific style block (e.g., ", shot on 35mm film, grainy, highly detailed, photorealistic") to the end.
    `
  }
];

export const PROMPT_TAGS: PromptTag[] = [
  // Subjects
  { id: 's1', label: 'Cybernetic Ninja', category: 'Subject' },
  { id: 's2', label: 'Vintage Sports Car', category: 'Subject' },
  { id: 's3', label: 'Ethereal Forest Spirit', category: 'Subject' },
  { id: 's4', label: 'Astronaut', category: 'Subject' },
  
  // Actions
  { id: 'a1', label: 'sprinting intensely', category: 'Action' },
  { id: 'a2', label: 'drifting around a corner', category: 'Action' },
  { id: 'a3', label: 'casting a glowing spell', category: 'Action' },
  { id: 'a4', label: 'floating weightlessly', category: 'Action' },

  // Environments
  { id: 'e1', label: 'in a neon-lit alleyway', category: 'Environment' },
  { id: 'e2', label: 'on a rain-slicked mountain pass', category: 'Environment' },
  { id: 'e3', label: 'in an ancient overgrown temple', category: 'Environment' },
  { id: 'e4', label: 'orbiting a gas giant', category: 'Environment' },

  // Lighting
  { id: 'l1', label: 'cinematic lighting', category: 'Lighting' },
  { id: 'l2', label: 'volumetric god rays', category: 'Lighting' },
  { id: 'l3', label: 'harsh rim light', category: 'Lighting' },
  { id: 'l4', label: 'golden hour', category: 'Lighting' },

  // Camera
  { id: 'c1', label: 'FPV drone shot', category: 'Camera' },
  { id: 'c2', label: 'slow panning shot', category: 'Camera' },
  { id: 'c3', label: 'low angle tracking shot', category: 'Camera' },
  { id: 'c4', label: 'close up portrait', category: 'Camera' },

  // Style
  { id: 'st1', label: 'photorealistic 8k', category: 'Style' },
  { id: 'st2', label: 'Studio Ghibli anime style', category: 'Style' },
  { id: 'st3', label: 'gritty film noir 35mm', category: 'Style' },
  { id: 'st4', label: 'vibrant 3D render', category: 'Style' },
];

export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: 'ex1',
    title: 'Neon Drift (Action & FPV)',
    prompt: 'A vintage rust-covered 1970s muscle car drifting violently around a sharp corner, on a rain-slicked mountain pass, neon cyberpunk streetlights reflecting off the wet asphalt, volumetric fog, FPV drone shot following closely behind, gritty film noir 35mm style, hyper-detailed, 8k resolution.'
  },
  {
    id: 'ex2',
    title: 'Ancient Discovery (Atmosphere)',
    prompt: 'A weary explorer with a glowing torch carefully uncovering an ancient mossy artifact, in an ancient overgrown temple deep in the jungle, dense volumetric god rays piercing through the canopy, dust motes floating in the air, slow panning shot from right to left, cinematic lighting, photorealistic 8k.'
  },
  {
    id: 'ex3',
    title: 'Zero Gravity (Sci-Fi)',
    prompt: 'An astronaut in a sleek white suit floating weightlessly outside an airlock, orbiting a colossal blue gas giant, harsh rim lighting from a distant sun illuminating the suit visor, extremely slow tracking shot moving closer, hyper-realistic, IMAX 70mm style.'
  },
  {
    id: 'ex4',
    title: 'Dramatic Noir (Lighting & Angles)',
    prompt: 'A detective in a trench coat standing under a flickering streetlamp in a rainy alleyway, high contrast chiaroscuro lighting, deep shadows, low angle shot looking up at the detective\'s face, rain falling heavily, 35mm film grain, cinematic masterpiece.'
  }
];
