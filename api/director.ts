import { directorHandler } from '../lib/handlers';

// Increase max duration for streaming responses (Vercel Pro: up to 300s)
export const maxDuration = 60;

export default directorHandler;
