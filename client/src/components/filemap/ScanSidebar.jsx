import React, { useState } from 'react';
import { Zap, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const ScanSidebar = ({ onScan, scanStatus, progress, progressMessage }) => {
  const [repoPath, setRepoPath] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  
  // Config
  const [languages, setLanguages] = useState({
    JavaScript: true,
    Python: true,
    Ruby: false,
    Go: false
  });
  const [depth, setDepth] = useState(5);
  const [useAST, setUseAST] = useState(true);
  const [includePattern, setIncludePattern] = useState('**/*.{js,ts,jsx,tsx}');
  const [excludePattern, setExcludePattern] = useState('**/node_modules/**');

  const handleScan = () => {
    if (!repoPath) return;

    const langs = Object.keys(languages).filter(k => languages[k]);
    
    // Convert selected langs to simple extension mappings for our backend
    const extMap = {
      JavaScript: '.js,.jsx,.ts,.tsx',
      Python: '.py',
      Ruby: '.rb',
      Go: '.go'
    };
    
    const exts = langs.map(l => extMap[l]).join(',');

    onScan({
      repoPath,
      fileExtensions: exts || '.js,.jsx,.ts,.tsx',
      maxDepth: depth,
      useAST,
      includePattern,
      excludePattern,
      languages: langs
    });
  };

  const isScanning = scanStatus === 'scanning';
  const isCompleted = scanStatus === 'completed';

  const toggleLang = (lang) => {
    setLanguages(prev => ({ ...prev, [lang]: !prev[lang] }));
  };

  return (
    <div className="w-[280px] bg-[#12121F] border-r border-[#2A2A3E] overflow-y-auto px-4 py-4 flex flex-col custom-scrollbar shrink-0 h-full">
      
      {/* SCAN CONTROLS */}
      <div className="flex flex-col">
        <label className="text-xs text-muted uppercase tracking-wide mb-1.5 font-semibold">Repository URL</label>
        <input 
          autoFocus
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          disabled={isScanning}
          className="w-full bg-[#16162A] border border-[#2A2A3E] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue transition-colors disabled:opacity-50"
          placeholder="https://github.com/user/repo"
        />

        <button
          onClick={handleScan}
          disabled={isScanning || !repoPath}
          className="mt-4 w-full bg-blue text-white rounded-lg py-2.5 font-medium flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-70 transition-all shadow-sm"
        >
          {isScanning ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Zap size={16} />
              <span>Scan Repository</span>
            </>
          )}
        </button>

        {isCompleted && (
          <div className="mt-3 bg-[#43D9AD]/10 border border-[#43D9AD]/30 text-mint rounded-md px-3 py-2 text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} />
            <span>Successfully scanned</span>
          </div>
        )}

        {isScanning && (
          <div className="mt-4">
            <div className="w-full bg-[#2A2A3E] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-xs text-muted mt-2 text-center truncate">
              {progressMessage || 'Analyzing repository...'}
            </div>
          </div>
        )}
      </div>

      <hr className="border-[#2A2A3E] my-5" />

      {/* CONFIGURATION */}
      <div className="flex flex-col">
        <div 
          className="flex justify-between items-center cursor-pointer mb-2 group select-none"
          onClick={() => setIsConfigOpen(!isConfigOpen)}
        >
          <span className="text-sm font-medium text-white group-hover:text-blue transition-colors">Configuration</span>
          {isConfigOpen ? (
            <ChevronUp size={16} className="text-muted group-hover:text-blue transition-colors" />
          ) : (
            <ChevronDown size={16} className="text-muted group-hover:text-blue transition-colors" />
          )}
        </div>

        {isConfigOpen && (
          <div className="flex flex-col animate-fade-in mt-1">
            
            {/* Languages */}
            <div className="mt-3">
              <label className="text-xs text-muted uppercase tracking-wide mb-2.5 block font-semibold">Languages</label>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.keys(languages).map(lang => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${languages[lang] ? 'bg-blue border-blue' : 'bg-transparent border-[#2A2A3E] group-hover:border-blue'}`}>
                      {languages[lang] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-[#E2E8F0] select-none group-hover:text-white transition-colors">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Depth Slider */}
            <div className="mt-5">
              <div className="flex justify-between mb-2">
                <label className="text-xs text-muted uppercase tracking-wide font-semibold">Depth</label>
                <span className="text-xs text-white font-mono bg-[#1A1A2E] px-1.5 py-0.5 rounded text-center min-w-[24px]">
                  {depth}
                </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full accent-blue h-1.5 bg-[#2A2A3E] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* AST Toggle */}
            <div className="mt-5 flex justify-between items-center">
              <label className="text-sm text-[#E2E8F0] select-none">AST Analysis</label>
              <button 
                onClick={() => setUseAST(!useAST)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useAST ? 'bg-blue' : 'bg-[#2A2A3E]'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useAST ? 'translate-x-4' : 'translate-x-0'}`}></span>
              </button>
            </div>

            {/* Include & Exclude Patterns */}
            <div className="mt-5">
              <label className="text-xs text-muted font-semibold tracking-wide uppercase mb-1.5 block">Include Pattern</label>
              <input 
                value={includePattern}
                onChange={(e) => setIncludePattern(e.target.value)}
                className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue transition-colors"
              />
            </div>

            <div className="mt-4">
              <label className="text-xs text-muted font-semibold tracking-wide uppercase mb-1.5 block">Exclude Pattern</label>
              <input 
                value={excludePattern}
                onChange={(e) => setExcludePattern(e.target.value)}
                className="w-full bg-[#1A1A2E] border border-[#2A2A3E] rounded-md px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue transition-colors"
              />
            </div>
            
          </div>
        )}
      </div>

      {/* MODULE TYPES LEGEND */}
      <div className="mt-auto pt-6 pb-2">
        <label className="text-xs text-muted font-semibold uppercase tracking-wide mb-3 block">Module Types</label>
        <div className="flex flex-col gap-2">
          
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue shadow-[0_0_6px_rgba(79,142,247,0.5)]"></div>
            <span className="text-xs text-muted">Core Module</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-mint shadow-[0_0_6px_rgba(67,217,173,0.5)]"></div>
            <span className="text-xs text-muted">Utility / Helper</span>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_6px_rgba(245,158,11,0.5)]"></div>
            <span className="text-xs text-muted">API / Service</span>
          </div>
          
          <div className="flex items-center gap-2.5 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-full border border-danger flex items-center justify-center relative">
               <div className="w-1.5 h-1.5 rounded-full bg-danger animate-ping absolute"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-danger"></div>
            </div>
            <span className="text-xs text-muted font-medium">Cyclic Dependency</span>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default ScanSidebar;
