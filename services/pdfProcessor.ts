
import * as pdfjsLib from 'pdfjs-dist';

// Set worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * Извлекает страницы из PDF как изображения.
 * Используем высокий коэффициент масштабирования для улучшения распознавания мелких QR-кодов.
 */
export async function extractPagesFromPdf(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pagePreviews: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // Увеличиваем масштаб до 3.0 для четкости мелких элементов
    const viewport = page.getViewport({ scale: 3.0 }); 
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Fix: Cast to any to bypass rigid type checks on RenderParameters which may differ across environments
    await (page as any).render({
      canvasContext: context,
      viewport: viewport,
    } as any).promise;

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (blob) {
      pagePreviews.push(URL.createObjectURL(blob));
    }
  }

  return pagePreviews;
}
