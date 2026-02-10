
import React, { useState, useCallback, useMemo } from 'react';
import { ScannedFile, AppStatus } from './types';
import { scanQrCode } from './services/qr.service';
import { extractPdfPages, createPdf } from './services/pdf.service';
import { Header } from './components/Header';
import { StatsSidebar } from './components/StatsSidebar';
import ScannerOverlay from './components/ScannerOverlay';

const App: React.FC = () => {
  const [files, setFiles] = useState<ScannedFile[]>([]);
  const [status, setStatus] = useState<AppStatus>('idle');
  const [isImporting, setIsImporting] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const onFilesAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsImporting(true);
    const incoming = Array.from(e.target.files).sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
    const newItems: ScannedFile[] = [];

    for (const f of incoming) {
      if (f.type === 'application/pdf') {
        try {
          const pages = await extractPdfPages(f);
          pages.forEach((p, i) => newItems.push({ 
            id: Math.random().toString(36).substr(2, 9), 
            file: f, 
            previewUrl: p, 
            qrData: null, 
            status: 'pending', 
            timestamp: Date.now() + i 
          }));
        } catch (err) {
          console.error("PDF Error:", err);
        }
      } else {
        newItems.push({ 
          id: Math.random().toString(36).substr(2, 9), 
          file: f, 
          previewUrl: URL.createObjectURL(f), 
          qrData: null, 
          status: 'pending', 
          timestamp: Date.now() 
        });
      }
    }
    setFiles(prev => [...prev, ...newItems]);
    setStatus('ready');
    setIsImporting(false);
    setProcessedCount(0);
  };

  const handleScan = async () => {
    setStatus('scanning');
    setProcessedCount(0);
    
    const filesToScan = [...files];
    let completed = 0;

    for (const f of filesToScan) {
      if (f.status === 'success') {
        completed++;
        setProcessedCount(completed);
        continue;
      }

      setFiles(prev => prev.map(item => item.id === f.id ? { ...item, status: 'processing' } : item));
      const res = await scanQrCode(f.previewUrl);
      setFiles(prev => prev.map(item => item.id === f.id ? { ...item, qrData: res, status: res ? 'success' : 'failed' } : item));
      
      completed++;
      setProcessedCount(completed);
    }
    setStatus('ready');
  };

  const setManualId = (fileId: string) => {
    const manualId = prompt("Введите ID документа вручную:");
    if (manualId && manualId.trim()) {
      setFiles(prev => prev.map(item => item.id === fileId ? { 
        ...item, 
        qrData: manualId.trim(), 
        status: 'success' 
      } : item));
    }
  };

  const reScanSingleFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    setFiles(prev => prev.map(item => item.id === fileId ? { ...item, status: 'processing' } : item));
    const res = await scanQrCode(file.previewUrl);
    setFiles(prev => prev.map(item => item.id === fileId ? { ...item, qrData: res, status: res ? 'success' : 'failed' } : item));
  };

  const groupsData = useMemo(() => {
    const grouped: Record<string, ScannedFile[]> = {};
    const unsorted: ScannedFile[] = [];
    
    files.forEach(f => {
      if (f.qrData) {
        if (!grouped[f.qrData]) grouped[f.qrData] = [];
        grouped[f.qrData].push(f);
      } else if (f.status !== 'pending') {
        unsorted.push(f);
      }
    });

    return { 
      grouped: Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0])),
      unsorted: unsorted.sort((a,b) => a.file.name.localeCompare(b.file.name, undefined, {numeric: true})),
      pending: files.filter(f => f.status === 'pending')
    };
  }, [files]);

  const handleDownloadAll = async () => {
    if (groupsData.grouped.length === 0) return;
    // Последовательно скачиваем каждую группу
    for (const [id, groupFiles] of groupsData.grouped) {
      await createPdf(groupFiles, id);
    }
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setStatus('idle');
    setProcessedCount(0);
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col font-sans selection:bg-indigo-100">
      <Header 
        isImporting={isImporting} 
        onFilesAdd={onFilesAdd} 
        onClear={clearAll} 
        hasFiles={files.length > 0} 
        onDownloadAll={handleDownloadAll}
        canDownloadAll={groupsData.grouped.length > 0}
      />
      
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-10">
        {files.length === 0 ? (
          <div className="mt-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 flex flex-col items-center justify-center shadow-sm">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-10 rounded-full mb-8 text-white text-7xl shadow-2xl shadow-indigo-200">
              <i className="fas fa-file-import"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight text-center">Готов к обработке документов</h2>
            <p className="text-slate-500 text-center max-w-md font-medium leading-relaxed">
              Загрузите отсканированные бюллетени или документы. Система автоматически сгруппирует страницы по QR-кодам.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <aside className="lg:col-span-3">
              <StatsSidebar 
                total={files.length} 
                groups={groupsData.grouped.length} 
                unsorted={groupsData.unsorted.length} 
                status={status} 
                isImporting={isImporting} 
                onScan={handleScan}
                processedCount={processedCount}
                canScan={files.some(f => f.status === 'pending' || f.status === 'failed')}
              />
            </aside>

            <section className="lg:col-span-9 space-y-12">
              {groupsData.grouped.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-[0.2em] flex items-center">
                      <i className="fas fa-layer-group mr-3 text-indigo-500"></i>
                      Сформированные документы ({groupsData.grouped.length})
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {groupsData.grouped.map(([id, groupFiles]) => (
                      <div key={id} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full group/card">
                        <div className="p-6 border-b border-slate-50 flex flex-col space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3 truncate">
                              <div className="bg-red-50 w-10 h-10 rounded-xl text-red-500 flex items-center justify-center shrink-0 shadow-inner">
                                <i className="fas fa-file-pdf"></i>
                              </div>
                              <div className="truncate">
                                <h4 className="font-black text-slate-800 text-sm truncate" title={id}>{id}</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{groupFiles.length} стр.</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => createPdf(groupFiles, id)}
                              className="bg-slate-900 text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors shadow-md active:scale-90"
                              title="Скачать PDF"
                            >
                              <i className="fas fa-download text-xs"></i>
                            </button>
                          </div>
                        </div>
                        <div className="p-6 flex-1 bg-slate-50/20 overflow-y-auto max-h-[240px] custom-scrollbar">
                          <div className="grid grid-cols-4 gap-3">
                            {groupFiles.map((f, idx) => (
                              <div key={f.id} className="relative group/thumb cursor-zoom-in" onClick={() => setSelectedImage(f.previewUrl)}>
                                <div className="aspect-[3/4] rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-all group-hover/thumb:border-indigo-400 group-hover/thumb:scale-[1.05]">
                                  <img src={f.previewUrl} className="w-full h-full object-cover" alt="page" />
                                  <div className="absolute top-1 right-1 bg-black/50 text-white text-[8px] font-black px-1 rounded backdrop-blur-[2px]">
                                    #{idx+1}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="px-6 py-3 bg-slate-50 text-[8px] text-slate-400 font-mono flex items-center justify-between rounded-b-[2rem]">
                          <span className="truncate max-w-[150px]">Src: {groupFiles[0].file.name}</span>
                          <i className="fas fa-shield-check text-green-500"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(groupsData.unsorted.length > 0 || groupsData.pending.length > 0) && (
                <div className="space-y-6">
                  <h4 className="font-black text-slate-400 text-xs uppercase tracking-[0.2em] px-2 flex items-center">
                    <i className="fas fa-triangle-exclamation mr-3 text-orange-400"></i>
                    Внимание требуется ({groupsData.unsorted.length + groupsData.pending.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {[...groupsData.pending, ...groupsData.unsorted].map(f => (
                      <div key={f.id} className="bg-white p-3 rounded-[1.5rem] border border-slate-200 shadow-sm transition-all hover:border-indigo-300 group/item relative">
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-slate-100 border border-slate-200 cursor-zoom-in" onClick={() => setSelectedImage(f.previewUrl)}>
                          <img src={f.previewUrl} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity" />
                          <ScannerOverlay status={f.status} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] text-slate-400 truncate font-mono" title={f.file.name}>{f.file.name}</p>
                          {f.status === 'failed' && (
                             <div className="flex flex-col gap-2">
                               <div className="flex items-center text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-lg">
                                 <i className="fas fa-eye-slash mr-1.5"></i> QR не найден
                               </div>
                               <div className="flex gap-1">
                                 <button 
                                   onClick={() => setManualId(f.id)}
                                   className="flex-1 py-2 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg hover:bg-indigo-700 transition-all active:scale-95"
                                   title="Присвоить ID вручную"
                                 >
                                   <i className="fas fa-keyboard"></i>
                                 </button>
                                 <button 
                                   onClick={() => reScanSingleFile(f.id)}
                                   className="flex-1 py-2 bg-slate-100 text-slate-600 text-[8px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all active:scale-95"
                                   title="Попробовать еще раз"
                                 >
                                   <i className="fas fa-rotate"></i>
                                 </button>
                               </div>
                             </div>
                          )}
                          {f.status === 'pending' && (
                             <div className="flex items-center text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                               <i className="fas fa-clock mr-1.5"></i> В очереди
                             </div>
                          )}
                          {f.status === 'processing' && (
                             <div className="flex items-center text-[8px] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                               <i className="fas fa-spinner fa-spin mr-1.5"></i> Анализ...
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* МОДАЛЬНОЕ ОКНО ПРОСМОТРА */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-10 animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
           <button className="absolute top-10 right-10 text-white text-4xl hover:scale-110 transition-transform">
             <i className="fas fa-times"></i>
           </button>
           <img src={selectedImage} className="max-h-full max-w-full rounded-lg shadow-2xl border border-white/10 shadow-indigo-500/10 object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 py-10 px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               Система активна
             </div>
             <div className="h-4 w-[1px] bg-slate-200"></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
               Обработка на стороне клиента • Ваши файлы не покидают компьютер
             </p>
          </div>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            QR-Doc Automator v3.0 • Desktop Professional Edition
          </p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
