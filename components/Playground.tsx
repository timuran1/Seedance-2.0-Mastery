import React, { useState } from 'react';
import { PROMPT_TAGS, EXAMPLE_PROMPTS } from '../constants';
import { analyzePrompt, generatePreviewImage, enhancePrompt } from '../services/geminiService';
import { AnalysisResult, PromptTag, EnhancedPromptResult } from '../types';

type Tab = 'builder' | 'examples' | 'enhancer';
type EnhancerMode = 'regular' | 'multi-shot';

const Playground: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  
  // Analysis & Generation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Enhancer state
  const [vagueIdea, setVagueIdea] = useState('');
  const [enhancerMode, setEnhancerMode] = useState<EnhancerMode>('regular');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedPromptResult | null>(null);
  const [enhancerError, setEnhancerError] = useState<string | null>(null);

  // Group tags for the builder
  const groupedTags = PROMPT_TAGS.reduce((acc, tag) => {
    if (!acc[tag.category]) {
      acc[tag.category] = [];
    }
    acc[tag.category].push(tag);
    return acc;
  }, {} as Record<string, PromptTag[]>);

  const handleTagClick = (label: string) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      if (trimmed === '') return label;
      return `${trimmed}, ${label}`;
    });
  };

  const loadExample = (exampleText: string) => {
    setPrompt(exampleText);
    // Clear previous analysis when loading new
    setAnalysis(null);
    setGeneratedImage(null);
    setGenerationError(null);
  };

  const handleEnhance = async () => {
    if (!vagueIdea.trim()) return;
    setIsEnhancing(true);
    setEnhancerError(null);
    setEnhancedResult(null);

    try {
      const result = await enhancePrompt(vagueIdea, enhancerMode);
      setEnhancedResult(result);
    } catch (err) {
      setEnhancerError("Failed to enhance the prompt. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhancedPrompt = () => {
    if (enhancedResult) {
      setPrompt(enhancedResult.enhancedPrompt);
      setVagueIdea('');
      setEnhancedResult(null);
      // Clean analysis
      setAnalysis(null);
      setGeneratedImage(null);
    }
  };

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setGenerationError(null);
    
    try {
      // Run analysis
      const result = await analyzePrompt(prompt);
      setAnalysis(result);
      
      // Run generation in parallel
      setIsGenerating(true);
      const imgResult = await generatePreviewImage(prompt);
      if (imgResult.error) {
        setGenerationError(imgResult.error);
      } else if (imgResult.imageUrl) {
        setGeneratedImage(imgResult.imageUrl);
      }
    } catch (error) {
      console.error(error);
      setGenerationError("Failed to communicate with AI.");
    } finally {
      setIsAnalyzing(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Interactive Playground</h1>
        <p className="text-slate-400">Build your prompt using blocks, load examples, or let our AI expand your vague idea.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Input Management */}
        <div className="space-y-6 flex flex-col">
          
          {/* Tabs header */}
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'builder' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Builder Blocks
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'examples' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Example Prompts
            </button>
            <button
              onClick={() => setActiveTab('enhancer')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'enhancer' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              AI Enhancer ✨
            </button>
          </div>

          {/* Tab Content Areas */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 min-h-[340px] flex flex-col">
            
            {activeTab === 'builder' && (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(groupedTags).map(([category, tags]) => (
                  <div key={category}>
                    <div className="text-xs text-slate-500 mb-2">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.label)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-brand-600 hover:text-white text-slate-300 rounded-md text-sm transition-colors border border-slate-600 hover:border-brand-500"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                <p className="text-sm text-slate-400 mb-2">Click an example below to load it into your prompt editor.</p>
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => loadExample(ex.prompt)}
                    className="w-full text-left p-4 bg-slate-900/50 hover:bg-slate-700/50 border border-slate-700 hover:border-brand-500 rounded-lg transition-all group"
                  >
                    <h3 className="text-white font-medium mb-1 group-hover:text-brand-300">{ex.title}</h3>
                    <p className="text-slate-400 text-sm line-clamp-2">{ex.prompt}</p>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'enhancer' && (
              <div className="space-y-4 flex flex-col h-full">
                <p className="text-sm text-slate-400">
                  Have a rough idea? Type it below and the AI will expand it into a perfect Seedance 2.0 prompt.
                </p>
                <textarea
                  value={vagueIdea}
                  onChange={(e) => setVagueIdea(e.target.value)}
                  placeholder="e.g. A cat drinking coffee on the moon..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none h-24"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="enhancerMode" 
                        value="regular"
                        checked={enhancerMode === 'regular'}
                        onChange={() => setEnhancerMode('regular')}
                        className="text-brand-500 bg-slate-900 border-slate-700 focus:ring-brand-500"
                      />
                      Regular Shot
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="enhancerMode" 
                        value="multi-shot"
                        checked={enhancerMode === 'multi-shot'}
                        onChange={() => setEnhancerMode('multi-shot')}
                        className="text-brand-500 bg-slate-900 border-slate-700 focus:ring-brand-500"
                      />
                      Multi-Shot Sequence
                    </label>
                  </div>
                  <button
                    onClick={handleEnhance}
                    disabled={isEnhancing || !vagueIdea.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isEnhancing ? 'Enhancing...' : 'Enhance Idea'}
                  </button>
                </div>

                {enhancerError && (
                  <div className="text-red-400 text-sm p-2 bg-red-500/10 rounded">{enhancerError}</div>
                )}

                {enhancedResult && (
                  <div className="mt-2 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg space-y-3 animate-fade-in flex-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Result</div>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap">{enhancedResult.enhancedPrompt}</p>
                    <p className="text-slate-400 text-xs italic">Why: {enhancedResult.explanation}</p>
                    <button
                      onClick={applyEnhancedPrompt}
                      className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-500/50 rounded-md text-sm transition-colors mt-2"
                    >
                      Apply to Final Prompt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final Prompt Textarea */}
          <div className="space-y-3">
            <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-300">
              Your Final Prompt
            </label>
            <textarea
              id="prompt-input"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Your prompt will appear here. Build it, load an example, or paste your own..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || isGenerating || !prompt.trim()}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2"
              >
                {(isAnalyzing || isGenerating) ? (
                   <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Simulating...
                   </>
                ) : (
                   <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Test Prompt
                   </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Feedback */}
        <div className="space-y-6">
          {/* Tutor Analysis */}
          <div className={`bg-slate-800/80 backdrop-blur-sm rounded-xl border ${analysis ? 'border-brand-500/50' : 'border-slate-700'} p-6 transition-all min-h-[200px] flex flex-col`}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              AI Tutor Analysis
            </h2>
            
            {!analysis && !isAnalyzing && (
              <div className="flex-1 flex items-center justify-center text-slate-500 italic text-sm text-center">
                Submit a final prompt to get feedback on your structure, terminology, and overall quality.
              </div>
            )}

            {isAnalyzing && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                 <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                 <p className="text-slate-400 text-sm animate-pulse">Analyzing prompt structure...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4 animate-fade-in flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Prompt Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          analysis.score > 80 ? 'bg-brand-500' : analysis.score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${analysis.score}%` }}
                      />
                    </div>
                    <span className="font-bold text-white w-8 text-right">{analysis.score}</span>
                  </div>
                </div>
                
                <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <p className="text-slate-300 text-sm leading-relaxed">{analysis.feedback}</p>
                </div>

                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase">Suggestions to improve:</h4>
                    <ul className="space-y-2">
                      {analysis.suggestions.map((sug, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-300">
                          <span className="text-brand-400 mt-0.5">•</span>
                          {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Visual Preview */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Simulated Output
            </h2>
            
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              {!generatedImage && !isGenerating && !generationError && (
                 <div className="text-slate-600 text-sm flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Preview will appear here
                 </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                   <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-3"></div>
                   <p className="text-brand-300 text-sm animate-pulse font-medium">Generating visual preview...</p>
                </div>
              )}

              {generationError && !isGenerating && (
                <div className="p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <p className="text-red-400 text-sm">{generationError}</p>
                </div>
              )}

              {generatedImage && !isGenerating && (
                <img 
                  src={generatedImage} 
                  alt="Generated preview" 
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}
            </div>
            {generatedImage && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                * Note: Image generated by Gemini as a static proxy for Seedance 2.0 video output.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Playground;