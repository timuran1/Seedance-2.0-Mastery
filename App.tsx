import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { COURSE_MODULES } from './constants';
import MarkdownRenderer from './components/MarkdownRenderer';
import Playground from './components/Playground';
import AiDirectorChat from './components/AiDirectorChat';
import CommunityForum from './components/CommunityForum';

function App() {
  const [currentView, setCurrentView] = useState<string>('intro');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sharedPrompt, setSharedPrompt] = useState<{ text: string; timestamp: number } | null>(null);

  // Find the current lesson content if it's not the playground
  const currentLesson = COURSE_MODULES.find(m => m.id === currentView);

  const handleApplyPrompt = (prompt: string) => {
    setSharedPrompt({ text: prompt, timestamp: Date.now() });
    setCurrentView('playground');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="font-bold text-white">Seedance 2.0</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-12 relative">
           {/* Background glow effect */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

          <div className="max-w-4xl mx-auto w-full">
            {/* Referral Banner */}
            <a 
              href="https://seedance2-pro.com/?utm_source=partner_E738A269&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-8 p-4 bg-gradient-to-r from-brand-900/40 to-purple-900/40 border border-brand-500/30 rounded-xl hover:border-brand-400/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium group-hover:text-brand-300 transition-colors">Upgrade to Seedance 2.0 Pro</h3>
                    <p className="text-sm text-slate-300 mt-0.5">Use code <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">E738A269</span> for a special discount</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-brand-400 text-sm font-medium px-4 py-2 rounded-lg bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors">
                  Claim Offer
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </a>

            {currentView === 'playground' ? (
              <Playground initialPrompt={sharedPrompt} />
            ) : currentView === 'forum' ? (
              <CommunityForum />
            ) : currentLesson ? (
              <div className="animate-fade-in pb-12">
                <div className="mb-2 text-brand-400 font-medium text-sm tracking-wide uppercase">
                  {currentLesson.category}
                </div>
                <MarkdownRenderer content={currentLesson.content} />
                
                {/* Module Navigation footer */}
                <div className="mt-16 pt-8 border-t border-slate-800 flex justify-end">
                   <button
                    onClick={() => setCurrentView('playground')}
                    className="group flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                  >
                    <span>Practice in Playground</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 mt-20">View not found</div>
            )}
          </div>
        </main>
      </div>

      {/* Floating AI Director Assistant */}
      <AiDirectorChat onApplyPrompt={handleApplyPrompt} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}

export default App;
