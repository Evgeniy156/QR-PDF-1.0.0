
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

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-28 space-y-6">
      <div>
        <h3 className="font-black text-slate-800 mb-4 flex items-center text-xs uppercase tracking-wider">
          <i className="fas fa-chart-pie mr-2 text-indigo-500"></i>
          Статистика сессии
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Всего страниц', val: total, color: 'bg-indigo-50 text-indigo-600', icon: 'fa-copy' },
            { label: 'Групп найдено', val: groups, color: 'bg-green-50 text-green-600', icon: 'fa-folder-tree' },
            { label: 'Без QR-кода', val: unsorted, color: 'bg-orange-50 text-orange-500', icon: 'fa-triangle-exclamation' }
          ].map(s => (
            <div key={s.label} className={`flex justify-between items-center ${s.color} p-3 rounded-xl border border-white/50 shadow-sm`}>
              <span className="text-[10px] font-bold uppercase flex items-center">
                <i className={`fas ${s.icon} mr-2 opacity-50`}></i>
                {s.label}
              </span>
              <span className="font-black text-lg">{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {status === 'scanning' && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
            <span>Обработка...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-slate-400 italic text-center">
            Страница {processedCount} из {total}
          </p>
        </div>
      )}

      <button 
        disabled={!canScan || status === 'scanning' || isImporting}
        onClick={onScan}
        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center transition-all shadow-lg ${
          status === 'scanning' || isImporting 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 active:scale-95'
        }`}
      >
        <i className={`fas ${status === 'scanning' ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'} mr-3`}></i>
        {status === 'scanning' ? 'Идет анализ' : 'Начать анализ'}
      </button>

      <div className="pt-4 border-t border-slate-50">
        <h4 className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-2">Подсказка</h4>
        <p className="text-[10px] text-slate-400 leading-relaxed italic">
          Используйте кнопку выше, чтобы запустить алгоритм распознавания QR-кодов на загруженных страницах.
        </p>
      </div>
    </div>
  );
};
