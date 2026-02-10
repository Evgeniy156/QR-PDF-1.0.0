
import React from 'react';

interface ScannerOverlayProps {
  status: 'pending' | 'processing' | 'success' | 'failed';
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ status }) => {
  if (status === 'pending') return null;

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${
      status === 'processing' ? 'bg-indigo-600/20 backdrop-blur-[2px]' : 
      status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
    }`}>
      {status === 'processing' && (
        <div className="relative w-full h-full">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)] animate-[scan_2.5s_infinite_ease-in-out]"></div>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="bg-white/90 p-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-indigo-100">
              <i className="fas fa-microchip fa-spin text-indigo-600 text-sm"></i>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Анализ...</span>
            </div>
          </div>
        </div>
      )}
      
      {status === 'success' && (
        <div className="bg-white p-2 rounded-full shadow-lg border border-green-100 animate-in zoom-in duration-300">
          <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center shadow-inner">
            <i className="fas fa-check text-white text-xs"></i>
          </div>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="bg-white p-2 rounded-full shadow-lg border border-red-100 animate-in zoom-in duration-300">
          <div className="bg-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-inner">
            <i className="fas fa-question text-white text-xs"></i>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0.2; }
          20% { opacity: 1; }
          50% { transform: translateY(100%); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(0); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default ScannerOverlay;
