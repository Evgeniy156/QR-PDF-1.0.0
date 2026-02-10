
import React from 'react';
import { AppStatus } from '../types';

interface StatsProps {
  total: number;
  groups: number;
  unsorted: number;
  status: AppStatus;
  isImporting: boolean;
  onScan: () => void;
  canScan: boolean;
  processedCount: number;
}

export const StatsSidebar: React.FC<StatsProps> = ({ 
  total, 
  groups, 
  unsorted, 
  status, 
  isImporting, 
  onScan, 
  canScan,
  processedCount
}) => {
  const progress = total > 0 ? (processedCount / total) * 100 : 0;
  const isScanning = status === 'scanning';

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 sticky top-28 space-y-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-slate-800 flex items-center text-xs uppercase tracking-[0.15em]">
            <i className="fas fa-chart-simple mr-3 text-indigo-500"></i>
            Мониторинг
          </h3>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {[
            { label: 'Всего страниц', val: total, color: 'bg-indigo-50/50 text-indigo-700 border-indigo-100', icon: 'fa-files' },
            { label: 'Готовых групп', val: groups, color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100', icon: 'fa-check-double' },
            { label: 'Требуют внимания', val: unsorted, color: 'bg-amber-50/50 text-amber-700 border-amber-100', icon: 'fa-hand-pointer' }
          ].map(s => (
            <div key={s.label} className={`flex justify-between items-center ${s.color} px-4 py-3.5 rounded-2xl border transition-all duration-300`}>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-wider opacity-60 mb-0.5">
                  {s.label}
                </span>
                <span className="font-black text-xl tracking-tight leading-none">{s.val}</span>
              </div>
              <div className="opacity-20 text-xl">
                <i className={`fas ${s.icon}`}></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isScanning && (
        <div className="space-y-4 bg-indigo-50/30 p-5 rounded-3xl border border-indigo-100 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between text-[10px] font-black uppercase text-indigo-500 tracking-wider">
            <span className="flex items-center">
              <i className="fas fa-robot mr-2 animate-bounce"></i>
              Машинное зрение...
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-white rounded-full overflow-hidden border border-indigo-100 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-center space-x-2 text-[10px] text-indigo-400 font-bold">
            <span className="bg-white px-2 py-0.5 rounded-md border shadow-sm">{processedCount}</span>
            <span className="opacity-40">/</span>
            <span>{total}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <button 
          disabled={!canScan || isScanning || isImporting}
          onClick={onScan}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all shadow-xl group relative overflow-hidden ${
            isScanning || isImporting 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95'
          }`}
        >
          {isScanning ? (
            <>
              <i className="fas fa-sync fa-spin mr-3"></i>
              Обработка...
            </>
          ) : (
            <>
              <i className="fas fa-bolt-lightning mr-3 group-hover:scale-125 transition-transform"></i>
              Запустить анализ
            </>
          )}
        </button>
        
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start space-x-3">
          <div className="text-indigo-400 mt-0.5">
            <i className="fas fa-circle-info text-xs"></i>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            Нажмите <strong className="text-slate-700">Анализ</strong> для автоматического поиска QR-кодов. Если код поврежден, вы сможете ввести ID вручную в карточке файла.
          </p>
        </div>
      </div>
    </div>
  );
};
