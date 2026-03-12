export interface Lesson {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface PromptTag {
  id: string;
  label: string;
  category: 'Subject' | 'Action' | 'Environment' | 'Lighting' | 'Camera' | 'Style';
}

export interface AnalysisResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface ExamplePrompt {
  id: string;
  title: string;
  prompt: string;
}

export interface EnhancedPromptResult {
  enhancedPrompt: string;
  explanation: string;
}

export interface FilterBypassResult {
  safePrompt: string;
  explanation: string;
  chineseTranslation: string;
}

export type FilterStrategy = 'auto' | 'cinematic' | 'roles' | 'context' | 'noise';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isStreaming?: boolean;
}