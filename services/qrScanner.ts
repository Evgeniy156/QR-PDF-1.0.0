
import jsQR from 'jsqr';

/**
 * Расширенный сканер QR-кодов с поддержкой многоэтапной предобработки.
 * Поочередно применяет различные фильтры для улучшения читаемости сканов.
 */
export async function scanQrCode(imageUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(null);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;

      const tryScan = () => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert", // Мы будем инвертировать вручную если нужно
        });
      };

      // 1. Попытка: Оригинал
      ctx.drawImage(img, 0, 0);
      let code = tryScan();
      if (code) return resolve(code.data.trim());

      // 2. Попытка: Фокусировка на верхней части (где обычно QR на документах)
      // Обрезаем до верхних 40% страницы, чтобы уменьшить шум от текста внизу
      const topHeight = Math.floor(canvas.height * 0.4);
      const topCanvas = document.createElement('canvas');
      topCanvas.width = canvas.width;
      topCanvas.height = topHeight;
      const topCtx = topCanvas.getContext('2d');
      if (topCtx) {
        topCtx.drawImage(img, 0, 0, canvas.width, topHeight, 0, 0, canvas.width, topHeight);
        const topImageData = topCtx.getImageData(0, 0, topCanvas.width, topCanvas.height);
        code = jsQR(topImageData.data, topImageData.width, topImageData.height);
        if (code) return resolve(code.data.trim());
      }

      // 3. Попытка: Высокий контраст и ч/б
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = 'contrast(200%) grayscale(100%) brightness(110%)';
      ctx.drawImage(img, 0, 0);
      code = tryScan();
      if (code) return resolve(code.data.trim());

      // 4. Попытка: Бинаризация (порог яркости)
      // Применяем ручную бинаризацию для удаления серых шумов
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        const val = avg > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
      }
      ctx.putImageData(imageData, 0, 0);
      code = tryScan();
      if (code) return resolve(code.data.trim());

      // 5. Попытка: Инверсия (на случай "негатива" или специфичных сканов)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
      code = tryScan();
      if (code) return resolve(code.data.trim());

      // Если ничего не помогло
      resolve(null);
    };
    
    img.onerror = () => resolve(null);
  });
}
