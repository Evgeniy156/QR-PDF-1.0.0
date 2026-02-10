
import React from 'react';

interface ScannerOverlayProps {
  status: 'pending' | 'processing' | 'success' | 'failed';
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ status }) => {
  if (status === 'pending') return null;

  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300`}>
      {status === 'processing' && (
        <div className="relative w-full h-full overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_infinite]"></div>
          <div className="flex items-center justify-center h-full">
            <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
          </div>
        </div>
      )}
      {status === 'success' && (
        <div className="bg-green-500/80 rounded-full p-2">
          <i className="fas fa-check text-white"></i>
        </div>
      )}
      {status === 'failed' && (
        <div className="bg-red-500/80 rounded-full p-2">
          <i className="fas fa-question text-white"></i>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(100px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ScannerOverlay;
