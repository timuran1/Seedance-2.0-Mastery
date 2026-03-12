import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AnalysisResult, GenerationResult, EnhancedPromptResult, FilterBypassResult, FilterStrategy } from '../types';

// Helper to safely get the client
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const analyzePrompt = async (prompt: string): Promise<AnalysisResult> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are an expert instructor for an advanced AI image and video generation model called "Seedance 2.0".
    Your job is to critique user prompts based on best practices:
    1. Clear Subject and Action.
    2. Detailed Environment/Setting.
    3. Specific Lighting/Atmosphere.
    4. Explicit Camera Movement or Angle.
    5. Style/Format definition.
    
    Evaluate the user's prompt, provide a score out of 100, brief encouraging feedback, and exactly two actionable suggestions to make it better.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Critique this prompt: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.NUMBER,
              description: "A score from 0 to 100 evaluating the prompt quality.",
            },
            feedback: {
              type: Type.STRING,
              description: "Brief, encouraging overall feedback on the prompt.",
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly two specific suggestions to improve the prompt.",
            }
          },
          required: ["score", "feedback", "suggestions"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    try {
      const result = JSON.parse(jsonStr) as AnalysisResult;
      return result;
    } catch (e) {
      console.error("Failed to parse Gemini JSON response", e);
      return {
        score: 50,
        feedback: "Could not analyze prompt properly, but keep practicing!",
        suggestions: ["Try adding more details.", "Ensure you have a clear subject."]
      };
    }
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    throw new Error("Failed to connect to the AI tutor.");
  }
};

export const generatePreviewImage = async (prompt: string): Promise<GenerationResult> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Generate an image based on this highly detailed prompt meant for a video generator: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    let imageUrl = undefined;
    
    if (response.candidates && response.candidates.length > 0) {
       for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          // The mimeType might be returned, or default to jpeg/png
          const mimeType = part.inlineData.mimeType || 'image/jpeg';
          imageUrl = `data:${mimeType};base64,${base64EncodeString}`;
          break; // Found the image, stop looking
        }
      }
    }

    if (imageUrl) {
        return { imageUrl };
    } else {
        return { error: "No image generated. The prompt might have been blocked by safety filters." };
    }

  } catch (error: any) {
    console.error("Error generating image:", error);
    return { error: error.message || "Failed to generate preview image." };
  }
};

export const enhancePrompt = async (idea: string, mode: 'regular' | 'multi-shot'): Promise<EnhancedPromptResult> => {
  const ai = getAiClient();
  
  const systemInstruction = `
    You are an expert prompt engineer for "Seedance 2.0", a high-end AI video and image generator.
    The user will provide a vague idea. You must transform it into a highly detailed, perfect prompt.
    Ensure you include: Subject, Action, Environment, Lighting, Camera Dynamics, and Style.
    
    Mode: ${mode === 'regular' ? 
      "Generate a single, continuous, highly descriptive prompt block." : 
      "Generate a multi-shot sequence prompt. Break the idea down into 3 distinct camera shots (e.g., 'Shot 1: Wide establishing shot... Shot 2: Medium tracking shot... Shot 3: Extreme close-up...'). Make it feel like a cohesive scene directed by a professional cinematographer."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Enhance this vague idea into a professional Seedance 2.0 prompt: "${idea}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enhancedPrompt: {
              type: Type.STRING,
              description: "The final, corrected, and expanded prompt text ready to be pasted into the generator.",
            },
            explanation: {
              type: Type.STRING,
              description: "A short sentence explaining what was added to make the prompt better.",
            }
          },
          required: ["enhancedPrompt", "explanation"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    try {
      const result = JSON.parse(jsonStr) as EnhancedPromptResult;
      return result;
    } catch (e) {
      console.error("Failed to parse Gemini JSON response", e);
      throw new Error("Failed to parse AI response.");
    }
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw new Error("Failed to connect to the AI Enhancer.");
  }
};

export const refinePromptForFilter = async (prompt: string, strategy: FilterStrategy = 'auto'): Promise<FilterBypassResult> => {
  const ai = getAiClient();
  
  let strategyInstruction = "";
  switch (strategy) {
    case 'cinematic':
      strategyInstruction = "FOCUS EXCLUSIVELY on using film terminology (35mm, wide shot, anamorphic) to anchor the prompt as a creative production. (Tip 5)";
      break;
    case 'roles':
      strategyInstruction = "FOCUS EXCLUSIVELY on replacing age-specific terms for minors (boy, girl, child) with roles (rider, student, figure) to avoid triggering minor safety filters. (Tip 2)";
      break;
    case 'context':
      strategyInstruction = "FOCUS EXCLUSIVELY on contextualizing sensitive elements. Don't remove dramatic elements (like weapons), but surround them with clear, safe context (e.g., 'cinematic movie scene', 'historical reenactment'). (Tip 1)";
      break;
    case 'noise':
      strategyInstruction = "FOCUS EXCLUSIVELY on cutting unnecessary backstory or emotional narration that might be misread. (Tip 3)";
      break;
    default:
      strategyInstruction = "Apply ALL principles from the official guide balancedly.";
      break;
  }
  
  const systemInstruction = `
    You are a safety filter expert for "Seedance 2.0". Your goal is to help users rewrite their prompts to pass strict safety filters while maintaining their original creative intent.
    
    The Seedance 2.0 filter uses an LLM to evaluate context, not just keywords.
    
    Your current strategy is: ${strategyInstruction}
    
    General Principles (use as backup if the specific strategy isn't applicable):
    1. **Contextualize Sensitive Elements**: Don't remove dramatic elements, but surround them with clear, safe context.
    2. **Role over Age**: Replace age-specific terms for minors with roles.
    3. **Cinematic Language**: Use film terminology to anchor the prompt as a creative production.
    4. **Remove Noise**: Cut unnecessary backstory.
    
    You must also provide a Chinese translation of the SAFE version, as the filter is often more permissive with Chinese prompts.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze and refine this prompt to bypass safety filters safely: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safePrompt: {
              type: Type.STRING,
              description: "The rewritten prompt that is safer and context-rich.",
            },
            explanation: {
              type: Type.STRING,
              description: "Explain what was changed and why (e.g., 'Replaced 'boy' with 'young rider' and added cinematic context').",
            },
            chineseTranslation: {
              type: Type.STRING,
              description: "The direct translation of the SAFE prompt into Chinese.",
            }
          },
          required: ["safePrompt", "explanation", "chineseTranslation"]
        }
      }
    });

    const jsonStr = response.text || "{}";
    try {
      return JSON.parse(jsonStr) as FilterBypassResult;
    } catch (e) {
      console.error("Failed to parse Gemini JSON response", e);
      throw new Error("Failed to parse AI response.");
    }
  } catch (error) {
    console.error("Error refining prompt:", error);
    throw new Error("Failed to connect to the Filter Guard.");
  }
};

export const translateToChinese = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following prompt into Chinese for an AI video generator. Keep technical terms (like '4k', 'cinematic') in English if appropriate, but translate the descriptive text. Only return the translation, nothing else. Prompt: "${prompt}"`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error translating prompt:", error);
    throw new Error("Failed to translate prompt.");
  }
};

export const createDirectorChat = (): Chat => {
  const ai = getAiClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview', // Pro model for deep conversational reasoning
    config: {
      systemInstruction: 'You are an award-winning Hollywood cinematographer and expert AI prompt engineer for the Seedance 2.0 video generator. Your goal is to help users craft the most visually stunning, cinematic video prompts. Ask clarifying questions about their vision, suggest dynamic camera angles (pan, tracking, FPV), dramatic lighting (volumetric, golden hour, chiaroscuro), and specific artistic styles. Keep your responses concise, creative, encouraging, and action-oriented. Provide prompt snippets they can easily use. Format your text using simple markdown: use **bold** for emphasis, *italics*, and bullet points (*). Do NOT use code blocks or complex markdown that might break a simple parser.',
    },
  });
};
