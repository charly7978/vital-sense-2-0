
export class SignalExtractor {
  private readonly minIntensity = 15;
  private readonly maxIntensity = 245;
  private readonly pixelStep = 2;
  private frameCount = 0;

  extractChannels(imageData: ImageData): { red: number; quality: number } {
    try {
      this.frameCount++;
      const { width, height, data } = imageData;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const regionSize = Math.floor(Math.min(width, height) * 0.4);

      let totalRed = 0;
      let pixelCount = 0;
      let maxRed = 0;

      // Solo procesar el centro de la imagen donde debería estar el dedo
      for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
        if (y < 0 || y >= height) continue;
        
        for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
          if (x < 0 || x >= width) continue;
          
          const i = (y * width + x) * 4;
          const red = data[i];
          
          if (red > this.minIntensity && red < this.maxIntensity) {
            totalRed += red;
            pixelCount++;
            maxRed = Math.max(maxRed, red);
          }
        }
      }

      // Si no hay suficientes píxeles válidos, probablemente no hay dedo
      if (pixelCount < 10) {
        console.log('No se detecta el dedo');
        return { red: 0, quality: 0 };
      }

      const avgRed = totalRed / pixelCount;
      const quality = pixelCount > 100 ? 1 : pixelCount / 100;

      if (this.frameCount % 30 === 0) {
        console.log('Valores:', {
          promedioRojo: avgRed,
          calidadSenal: quality,
          pixelesValidos: pixelCount
        });
      }

      return { red: avgRed, quality };
    } catch (error) {
      console.error('Error en extractChannels:', error);
      return { red: 0, quality: 0 };
    }
  }
}
