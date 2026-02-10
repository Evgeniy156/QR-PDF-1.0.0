
import jsQR from 'jsqr';

/**
 * Продвинутый сканер QR-кодов.
 * Если стандартное чтение не срабатывает, применяет цепочку фильтров:
 * Контраст -> Бинаризация -> Инверсия -> Поиск по зонам.
 */
export async function scanQrCode(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(null);
      
      canvas.width = img.width;
      canvas.height = img.height;

      const tryScan = (context: CanvasRenderingContext2D, w: number, h: number) => {
        const imageData = context.getImageData(0, 0, w, h);
        return jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert", 
        });
      };

      // --- ЭТАП 1: Оригинал ---
      ctx.drawImage(img, 0, 0);
      let code = tryScan(ctx, canvas.width, canvas.height);
      if (code) return resolve(code.data.trim());

      // --- ЭТАП 2: Фокус на верхней части (увеличиваем зону до 50%) ---
      const topHeight = Math.floor(canvas.height * 0.5);
      const topCanvas = document.createElement('canvas');
      topCanvas.width = canvas.width;
      topCanvas.height = topHeight;
      const topCtx = topCanvas.getContext('2d');
      if (topCtx) {
        topCtx.drawImage(img, 0, 0, canvas.width, topHeight, 0, 0, canvas.width, topHeight);
        code = tryScan(topCtx, topCanvas.width, topCanvas.height);
        if (code) return resolve(code.data.trim());
      }

      // --- ЭТАП 3: Высокий контраст и ЧБ ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = 'contrast(250%) grayscale(100%) brightness(110%)';
      ctx.drawImage(img, 0, 0);
      code = tryScan(ctx, canvas.width, canvas.height);
      if (code) return resolve(code.data.trim());

      // --- ЭТАП 4: Бинаризация (строгий порог) ---
      // Это убирает "грязь" вокруг QR-кода, оставляя только черные и белые пиксели
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const val = avg > 140 ? 255 : 0; // Порог чувствительности
        data[i] = data[i + 1] = data[i + 2] = val;
      }
      ctx.putImageData(imageData, 0, 0);
      code = tryScan(ctx, canvas.width, canvas.height);
      if (code) return resolve(code.data.trim());

      // --- ЭТАП 5: Инверсия (на случай темных сканов или негативов) ---
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
      code = tryScan(ctx, canvas.width, canvas.height);
      if (code) return resolve(code.data.trim());

      // Если ничего не помогло
      resolve(null);
    };
    img.onerror = () => resolve(null);
  });
}
