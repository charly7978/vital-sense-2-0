
import { supabase } from '@/integrations/supabase/client';

export class SignalExtractor {
  private calibrationParams: {
    minRedIntensity: number;
    maxRedIntensity: number;
    minValidPixels: number;
    redDominanceThreshold: number;
    pixelStep: number;
    roiScale: number;
  } = {
    minRedIntensity: 120,
    maxRedIntensity: 255,
    minValidPixels: 100,
    redDominanceThreshold: 1.2,
    pixelStep: 4,
    roiScale: 0.2
  };

  async loadCalibration() {
    try {
      const { data, error } = await supabase
        .from('ppg_calibration')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        this.calibrationParams = {
          minRedIntensity: data.min_red_intensity,
          maxRedIntensity: data.max_red_intensity,
          minValidPixels: data.min_valid_pixels,
          redDominanceThreshold: data.red_dominance_threshold,
          pixelStep: data.pixel_step,
          roiScale: data.roi_scale
        };
        
        console.log('Parámetros de calibración cargados:', this.calibrationParams);
      }
    } catch (error) {
      console.error('Error al cargar calibración:', error);
    }
  }

  extractChannels(imageData: ImageData): { 
    red: number; 
    ir: number; 
    quality: number; 
    perfusionIndex: number;
    fingerPresent: boolean;
    diagnostics: {
      redMean: number;
      validPixels: number;
      redDominance: number;
      coverage: number;
    };
  } {
    const { width, height, data } = imageData;
    
    // 1. Reducir el área de análisis a un área más pequeña en el centro
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.1); // Reducido a 10% del tamaño

    let validPixelCount = 0;
    let totalRedValue = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    let maxRedValue = 0;
    let minRedValue = 255;
    let sampledPixels = 0;
    let redValues: number[] = [];

    // 2. Analizar píxeles con más precisión
    for (let y = centerY - regionSize; y < centerY + regionSize; y += 2) { // Incremento reducido a 2
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += 2) {
        if (x < 0 || x >= width) continue;
        
        sampledPixels++;
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        // Actualizar valores min/max
        maxRedValue = Math.max(maxRedValue, red);
        minRedValue = Math.min(minRedValue, red);
        
        // 3. Mejorar la detección de dominancia de rojo
        const redDominance = red / (Math.max(green, blue, 1));
        
        // 4. Criterios más estrictos para píxeles válidos
        if (red > 100 && red < 250 && // Evitar saturación
            redDominance > 1.1 && // Menos restrictivo en dominancia
            green < red && blue < red) { // Asegurar que rojo es dominante
          
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;
          redValues.push(red);
        }
      }
    }

    // 5. Calcular estadísticas más robustas
    const coverage = validPixelCount / sampledPixels;
    
    // Calcular la mediana en lugar de la media para el valor de rojo
    redValues.sort((a, b) => a - b);
    const redMedian = redValues.length > 0 
      ? redValues[Math.floor(redValues.length / 2)]
      : 0;

    // 6. Criterios más estrictos para detección de dedo
    const fingerPresent = validPixelCount >= 50 && // Reducido el mínimo de píxeles válidos
                         coverage >= 0.15 && // Aumentado el requisito de cobertura
                         redMedian >= 100 && // Usando mediana en lugar de media
                         (maxRedValue - minRedValue) > 20; // Asegurar variación en valores

    // Log detallado para debugging
    console.log('Análisis de imagen:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      redMedian: Math.round(redMedian),
      minRed: minRedValue,
      maxRed: maxRedValue,
      variacionRojo: maxRedValue - minRedValue,
      pixelesValidos: validPixelCount,
      pixelesMuestreados: sampledPixels,
      cobertura: Math.round(coverage * 100) + '%'
    });

    return {
      red: redMedian,
      ir: totalGreenValue / (validPixelCount || 1),
      quality: coverage,
      perfusionIndex: (maxRedValue - minRedValue) / (maxRedValue || 1),
      fingerPresent,
      diagnostics: {
        redMean: redMedian,
        validPixels: validPixelCount,
        redDominance: maxRedValue / (Math.max(totalGreenValue, totalBlueValue, 1) / (validPixelCount || 1)),
        coverage
      }
    };
  }
}
