
import React, { useState } from 'react';
import { GimoVoiceInterface } from './components/GimoVoiceInterface';
import { Language, SUPPORTED_LANGUAGES } from './types';

const App: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<Language>(SUPPORTED_LANGUAGES[0]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-2xl font-bold text-white">G</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Gimo AI</h1>
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Language Practice Robot</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedLang.code === lang.code
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </header>

      {/* Main Interactive Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
        <GimoVoiceInterface selectedLanguage={selectedLang} />
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-4xl mt-12 pb-4 text-center border-t border-slate-800 pt-8">
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-400 text-sm">
            Gimo AI - Developed by <span className="text-blue-400 font-semibold">Moussa Byukusenge</span> (2025)
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Born in Rwanda 🇷🇼</span>
            <span>•</span>
            <span>Supporting native-level fluency</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
