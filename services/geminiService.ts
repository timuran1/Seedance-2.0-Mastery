import { AnalysisResult, EnhancedPromptResult, FilterBypassResult, FilterStrategy } from '../types';

// All AI calls go through our own server-side API routes.
// The Gemini API key never leaves the server.

export const analyzePrompt = async (prompt: string): Promise<AnalysisResult> => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('Failed to analyze prompt');
  return res.json();
};

export const enhancePrompt = async (idea: string, mode: 'regular' | 'multi-shot'): Promise<EnhancedPromptResult> => {
  const res = await fetch('/api/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, mode })
  });
  if (!res.ok) throw new Error('Failed to enhance prompt');
  return res.json();
};

export const refinePromptForFilter = async (prompt: string, strategy: FilterStrategy = 'auto'): Promise<FilterBypassResult> => {
  const res = await fetch('/api/filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, strategy })
  });
  if (!res.ok) throw new Error('Failed to refine prompt');
  return res.json();
};

export const translateToChinese = async (prompt: string): Promise<string> => {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('Failed to translate');
  const data = await res.json();
  return data.translation;
};
