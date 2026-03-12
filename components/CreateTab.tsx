import React, { useState, useEffect, useRef } from 'react';

type Mode = 't2v' | 'i2v' | 'extend';
type Quality = 'basic' | 'high';
type Duration = 5 | 10 | 15;
type AspectRatio = '16:9' | '9:16' | '4:3' | '3:4';

interface Generation {
  requestId: string;
  mode: Mode;
  prompt: string;
  imageUrl?: string;
  aspectRatio?: AspectRatio;
  duration: Duration;
  quality: Quality;
  status: 'pending' | 'completed' | 'failed';
  videoUrl?: string;
  timestamp: number;
}

// Update these prices if muapi changes pricing
const PRICING: Record<Quality, Record<number, number>> = {
  basic: { 5: 0.60, 10: 1.20, 15: 1.80 },
  high:  { 5: 1.20, 10: 2.40, 15: 3.60 },
};

const ASPECT_RATIOS: { value: AspectRatio; label: string; wRatio: number; hRatio: number }[] = [
  { value: '16:9', label: 'Landscape', wRatio: 16, hRatio: 9 },
  { value: '9:16', label: 'Portrait',  wRatio: 9,  hRatio: 16 },
  { value: '4:3',  label: 'Classic',   wRatio: 4,  hRatio: 3 },
  { value: '3:4',  label: 'Tall',      wRatio: 3,  hRatio: 4 },
];

const HISTORY_KEY = 'seedance_generations';

const loadHistory = (): Generation[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveHistory = (items: Generation[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
};

const formatTime = (ts: number) =>
  new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const elapsed = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};

const CreateTab: React.FC = () => {
  const [mode, setMode] = useState<Mode>('t2v');
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<Duration>(5);
  const [quality, setQuality] = useState<Quality>('basic');
  const [extendRequestId, setExtendRequestId] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGen, setActiveGen] = useState<Generation | null>(null);
  const [elapsedTime, setElapsedTime] = useState('0s');
  const [history, setHistory] = useState<Generation[]>([]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Elapsed timer for active generation
  useEffect(() => {
    if (!activeGen || activeGen.status !== 'pending') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedTime(elapsed(activeGen.timestamp));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeGen?.requestId, activeGen?.status]);

  // Poll for result
  useEffect(() => {
    if (!activeGen || activeGen.status !== 'pending') return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/result?id=${activeGen.requestId}`);
        const data = await res.json();

        const videoUrl = data.video || data.videoUrl || data.output;
        const failed = data.status === 'failed' || data.error;

        if (videoUrl) {
          const updated: Generation = { ...activeGen, status: 'completed', videoUrl };
          setActiveGen(updated);
          const newHistory = [updated, ...loadHistory().filter(g => g.requestId !== updated.requestId)];
          setHistory(newHistory);
          saveHistory(newHistory);
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (failed) {
          const updated: Generation = { ...activeGen, status: 'failed' };
          setActiveGen(updated);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        console.error('polling error:', err);
      }
    }, 5000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeGen?.requestId]);

  const price = PRICING[quality][duration];

  const handleGenerate = async () => {
    if (!prompt.trim()) return setError('Please enter a prompt.');
    if (mode === 'i2v' && !imageUrl.trim()) return setError('Please enter an image URL for Image-to-Video.');
    if (mode === 'extend' && !extendRequestId.trim()) return setError('Please enter a Request ID to extend.');

    setError(null);
    setIsGenerating(true);

    const model =
      mode === 't2v' ? 'seedance-v2.0-t2v' :
      mode === 'i2v' ? 'seedance-v2.0-i2v' :
      'seedance-v2.0-extend';

    const body: any = { model, prompt, duration, quality };
    if (mode === 't2v' || mode === 'i2v') body.aspect_ratio = aspectRatio;
    if (mode === 'i2v') body.images_list = [imageUrl.trim()];
    if (mode === 'extend') body.request_id = extendRequestId.trim();

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const requestId = data.request_id || data.requestId || data.id;
      if (!requestId) throw new Error('No request ID returned. Check API response.');

      const gen: Generation = {
        requestId,
        mode,
        prompt,
        imageUrl: mode === 'i2v' ? imageUrl : undefined,
        aspectRatio: mode !== 'extend' ? aspectRatio : undefined,
        duration,
        quality,
        status: 'pending',
        timestamp: Date.now(),
      };
      setActiveGen(gen);
      setElapsedTime('0s');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtendFromHistory = (gen: Generation) => {
    setMode('extend');
    setExtendRequestId(gen.requestId);
    setPrompt('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const modeLabel: Record<Mode, string> = {
    't2v': 'Text to Video',
    'i2v': 'Image to Video',
    'extend': 'Extend Video',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Create</h1>
        <p className="text-slate-400">Generate videos with Seedance 2.0 — powered by muapi.ai</p>
      </header>

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-700">
        {(['t2v', 'i2v', 'extend'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              mode === m
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {modeLabel[m]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left — Controls */}
        <div className="space-y-5">

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {mode === 'extend' ? 'Continuation Prompt' : 'Prompt'}
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={
                mode === 't2v' ? 'A cinematic drone shot over misty mountains at golden hour, slow pan...' :
                mode === 'i2v' ? 'The subject in @image1 slowly turns toward the camera, wind blowing...' :
                'Continue the motion, camera pulls back revealing the full scene...'
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Image URL (I2V only) */}
          {mode === 'i2v' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reference Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://i.imgur.com/example.jpg"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Need a URL?{' '}
                <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                  Upload free on imgur.com →
                </a>
                {' '}Reference it in the prompt as <code className="text-brand-400 text-xs">@image1</code>
              </p>
              {imageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 h-32 bg-slate-900">
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>
          )}

          {/* Extend Request ID */}
          {mode === 'extend' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Source Video Request ID
              </label>
              <input
                type="text"
                value={extendRequestId}
                onChange={e => setExtendRequestId(e.target.value)}
                placeholder="Paste a request ID or select from history below"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono text-sm"
              />
              {history.filter(g => g.status === 'completed').length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                  {history.filter(g => g.status === 'completed').map(g => (
                    <button
                      key={g.requestId}
                      onClick={() => setExtendRequestId(g.requestId)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border ${
                        extendRequestId === g.requestId
                          ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-mono">{g.requestId.slice(0, 20)}…</span>
                      <span className="ml-2 text-slate-500">{g.prompt.slice(0, 40)}…</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aspect Ratio (T2V and I2V) */}
          {mode !== 'extend' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
              <div className="flex gap-3 flex-wrap">
                {ASPECT_RATIOS.map(ar => {
                  const scale = 32;
                  const w = (ar.wRatio / Math.max(ar.wRatio, ar.hRatio)) * scale;
                  const h = (ar.hRatio / Math.max(ar.wRatio, ar.hRatio)) * scale;
                  return (
                    <button
                      key={ar.value}
                      onClick={() => setAspectRatio(ar.value)}
                      className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                        aspectRatio === ar.value
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
                      }`}
                    >
                      <div
                        className={`rounded-sm border-2 ${aspectRatio === ar.value ? 'border-brand-400' : 'border-slate-500'}`}
                        style={{ width: `${w}px`, height: `${h}px` }}
                      />
                      <div className="text-center">
                        <div className={`text-xs font-bold ${aspectRatio === ar.value ? 'text-brand-400' : 'text-slate-300'}`}>{ar.value}</div>
                        <div className="text-[10px] text-slate-500">{ar.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
            <div className="flex gap-3">
              {([5, 10, 15] as Duration[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-lg border text-center transition-all ${
                    duration === d
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-bold">{d}s</div>
                  <div className="text-xs text-slate-500 mt-0.5">${PRICING[quality][d].toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Quality</label>
            <div className="flex gap-3">
              {(['basic', 'high'] as Quality[]).map(q => (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`flex-1 py-3 rounded-lg border text-center transition-all ${
                    quality === q
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <div className="text-sm font-bold capitalize">{q}</div>
                  <div className="text-xs text-slate-500 mt-0.5">${PRICING[q][duration].toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Price + Generate */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-slate-500 text-sm">Total cost</span>
              <div className="text-2xl font-bold text-white">${price.toFixed(2)}</div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!!activeGen && activeGen.status === 'pending')}
              className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (activeGen && activeGen.status === 'pending') ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generate · ${price.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right — Status / Output */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 min-h-[320px] flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Output
            </h2>

            {!activeGen && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
                <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <p className="text-sm">Your generated video will appear here</p>
              </div>
            )}

            {activeGen?.status === 'pending' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-500/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-brand-300 font-medium animate-pulse">Generating your video…</p>
                  <p className="text-slate-500 text-sm mt-1">Elapsed: {elapsedTime} · checking every 5s</p>
                </div>
                <div className="w-full p-3 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-500 font-mono break-all">ID: {activeGen.requestId}</p>
                </div>
              </div>
            )}

            {activeGen?.status === 'completed' && activeGen.videoUrl && (
              <div className="flex-1 space-y-3">
                <video
                  src={activeGen.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-lg border border-slate-700"
                />
                <div className="flex gap-2">
                  <a
                    href={activeGen.videoUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 text-center text-sm bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleExtendFromHistory(activeGen)}
                    className="flex-1 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    Extend this video
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-mono">ID: {activeGen.requestId}</p>
              </div>
            )}

            {activeGen?.status === 'failed' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-400 font-medium">Generation failed</p>
                <p className="text-slate-500 text-sm">Please try again or adjust your prompt</p>
                <button onClick={() => setActiveGen(null)} className="text-xs text-slate-400 hover:text-slate-200 underline">Dismiss</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Generation History</h2>
            <button onClick={clearHistory} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
              Clear history
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(gen => (
              <div key={gen.requestId} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
                {gen.videoUrl ? (
                  <video src={gen.videoUrl} className="w-full aspect-video object-cover bg-slate-900" muted loop onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()} onMouseLeave={e => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }} />
                ) : (
                  <div className="w-full aspect-video bg-slate-900 flex items-center justify-center">
                    {gen.status === 'pending' ? (
                      <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    )}
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-slate-300 line-clamp-2">{gen.prompt}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 uppercase tracking-wide">{gen.mode}</span>
                    {gen.aspectRatio && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{gen.aspectRatio}</span>}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{gen.duration}s</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 capitalize">{gen.quality}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${
                      gen.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      gen.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>{gen.status}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-600">{formatTime(gen.timestamp)}</span>
                    <div className="flex gap-2">
                      {gen.videoUrl && (
                        <a href={gen.videoUrl} download target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-400 hover:text-brand-300 transition-colors">
                          Download
                        </a>
                      )}
                      {gen.status === 'completed' && (
                        <button onClick={() => handleExtendFromHistory(gen)} className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors">
                          Extend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTab;
