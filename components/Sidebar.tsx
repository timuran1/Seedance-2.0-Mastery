import React from 'react';
import { COURSE_MODULES } from '../constants';

interface SidebarProps {
  currentView: string;
  setCurrentView: (viewId: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen }) => {
  // Group modules by category
  const groupedModules = COURSE_MODULES.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof COURSE_MODULES>);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col h-full`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">Seedance<span className="text-brand-400">2.0</span></h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category}>
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {category}
              </h3>
              <ul className="space-y-1">
                {modules.map((module) => (
                  <li key={module.id}>
                    <button
                      onClick={() => {
                        setCurrentView(module.id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                        currentView === module.id
                          ? 'bg-brand-500/10 text-brand-300'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {module.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
             <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Community
              </h3>
               <button
                  onClick={() => {
                    setCurrentView('forum');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                    currentView === 'forum'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Community Forum
                </button>
          </div>

          <div>
             <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Practice
              </h3>
               <button
                  onClick={() => {
                    setCurrentView('playground');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm font-medium flex items-center gap-2 ${
                    currentView === 'playground'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  Interactive Playground
                </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          Powered by Gemini API
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
