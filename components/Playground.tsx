import React, { useState } from 'react';
import { PROMPT_TAGS, EXAMPLE_PROMPTS } from '../constants';
import { analyzePrompt, enhancePrompt, refinePromptForFilter, translateToChinese } from '../services/geminiService';
import { AnalysisResult, PromptTag, EnhancedPromptResult, FilterBypassResult, FilterStrategy } from '../types';

type Tab = 'builder' | 'examples' | 'enhancer' | 'filter-guard';
type EnhancerMode = 'regular' | 'multi-shot';

interface PlaygroundProps {
  initialPrompt?: { text: string; timestamp: number } | null;
}

const Playground: React.FC<PlaygroundProps> = ({ initialPrompt }) => {
  const [prompt, setPrompt] = useState(initialPrompt?.text || '');
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  
  // Update prompt if initialPrompt changes (e.g. from AI Director)
  React.useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt.text);
    }
  }, [initialPrompt]);
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  // Enhancer state
  const [vagueIdea, setVagueIdea] = useState('');
  const [enhancerMode, setEnhancerMode] = useState<EnhancerMode>('regular');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedResult, setEnhancedResult] = useState<EnhancedPromptResult | null>(null);
  const [enhancerError, setEnhancerError] = useState<string | null>(null);

  // Filter Guard state
  const [filterInput, setFilterInput] = useState('');
  const [filterStrategy, setFilterStrategy] = useState<FilterStrategy>('auto');
  const [isRefining, setIsRefining] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [filterResult, setFilterResult] = useState<FilterBypassResult | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);

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

  const handleRefinePrompt = async () => {
    if (!filterInput.trim()) return;
    setIsRefining(true);
    setFilterError(null);
    setFilterResult(null);

    try {
      const result = await refinePromptForFilter(filterInput, filterStrategy);
      setFilterResult(result);
    } catch (err) {
      setFilterError("Failed to refine the prompt. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleTranslate = async () => {
    if (!filterInput.trim()) return;
    setIsTranslating(true);
    setFilterError(null);
    setFilterResult(null);

    try {
      const translation = await translateToChinese(filterInput);
      setFilterResult({
        safePrompt: filterInput, // Keep original as "safe" since we are just translating
        explanation: "Direct translation to Chinese (Tip #6). This often bypasses filters for simple prompts.",
        chineseTranslation: translation
      });
    } catch (err) {
      setFilterError("Failed to translate the prompt. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const applyEnhancedPrompt = () => {
    if (enhancedResult) {
      setPrompt(enhancedResult.enhancedPrompt);
      setVagueIdea('');
      setEnhancedResult(null);
      setAnalysis(null);
    }
  };

  const applySafePrompt = () => {
    if (filterResult) {
      setPrompt(filterResult.safePrompt);
      setFilterInput('');
      setFilterResult(null);
      setAnalysis(null);
    }
  };

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await analyzePrompt(prompt);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
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
          <div className="flex border-b border-slate-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'builder' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Builder Blocks
            </button>
            <button
              onClick={() => setActiveTab('examples')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'examples' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Example Prompts
            </button>
            <button
              onClick={() => setActiveTab('enhancer')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'enhancer' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              AI Enhancer ✨
            </button>
            <button
              onClick={() => setActiveTab('filter-guard')}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'filter-guard' 
                  ? 'border-brand-500 text-brand-400' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              Filter Guard 🛡️
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
                <div className="relative">
                  <textarea
                    value={vagueIdea}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setVagueIdea(e.target.value);
                      }
                    }}
                    placeholder="e.g. A cat drinking coffee on the moon..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none h-24"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-slate-500 bg-slate-900/80 px-1.5 rounded">
                    {vagueIdea.length}/500 chars • {vagueIdea.trim() ? vagueIdea.trim().split(/\s+/).length : 0} words
                  </div>
                </div>
                
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

            {activeTab === 'filter-guard' && (
              <div className="space-y-4 flex flex-col h-full">
                <p className="text-sm text-slate-400">
                  Paste a prompt that might get flagged. We'll rewrite it using "safe context" principles to help it pass.
                </p>
                <textarea
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  placeholder="e.g. A soldier firing a rifle..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none h-24"
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 font-medium">Strategy:</label>
                    <select
                      value={filterStrategy}
                      onChange={(e) => setFilterStrategy(e.target.value as FilterStrategy)}
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    >
                      <option value="auto">Auto (Best Practice)</option>
                      <option value="cinematic">Cinematic Language (Tip 5)</option>
                      <option value="roles">Role Rephrasing (Tip 2)</option>
                      <option value="context">Safe Context Wrapper (Tip 1)</option>
                      <option value="noise">Remove Noise (Tip 3)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleRefinePrompt}
                    disabled={isRefining || isTranslating || !filterInput.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isRefining ? 'Analyzing...' : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Analyze & Fix
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleTranslate}
                    disabled={isRefining || isTranslating || !filterInput.trim()}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ml-2"
                  >
                    {isTranslating ? 'Translating...' : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                        Translate Only
                      </>
                    )}
                  </button>
                </div>

                {filterError && (
                  <div className="text-red-400 text-sm p-2 bg-red-500/10 rounded">{filterError}</div>
                )}

                {filterResult && (
                  <div className="mt-2 p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg space-y-3 animate-fade-in flex-1 overflow-y-auto custom-scrollbar">
                    <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Safe Version</div>
                    <p className="text-slate-200 text-sm whitespace-pre-wrap">{filterResult.safePrompt}</p>
                    
                    <div className="pt-2 border-t border-emerald-500/20">
                      <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-1">Chinese Translation (Tip #6)</div>
                      <p className="text-slate-300 text-sm font-mono bg-slate-900/50 p-2 rounded select-all">{filterResult.chineseTranslation}</p>
                    </div>

                    <p className="text-slate-400 text-xs italic">Fix: {filterResult.explanation}</p>
                    
                    <button
                      onClick={applySafePrompt}
                      className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-200 border border-emerald-500/50 rounded-md text-sm transition-colors mt-2"
                    >
                      Use Safe Prompt
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final Prompt Textarea */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-300">
                Your Final Prompt
              </label>
              <span className="text-xs text-slate-500">
                {prompt.trim() ? prompt.trim().split(/\s+/).length : 0} words
              </span>
            </div>
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
                disabled={isAnalyzing || !prompt.trim()}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-brand-500/20 flex items-center gap-2"
              >
                {isAnalyzing ? (
                   <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
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
                  <div className={`space-y-2 ${analysis.score < 70 ? 'p-4 bg-yellow-900/20 border border-yellow-500/40 rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.1)]' : ''}`}>
                    <h4 className={`text-xs font-semibold uppercase ${analysis.score < 70 ? 'text-yellow-400 flex items-center gap-2' : 'text-slate-400'}`}>
                      {analysis.score < 70 && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      )}
                      Suggestions to improve:
                    </h4>
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

        </div>
      </div>
    </div>
  );
};

export default Playground;