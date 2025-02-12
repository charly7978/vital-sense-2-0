
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
      // Mantenemos los valores por defecto si hay error
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
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * this.calibrationParams.roiScale);

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    let sampledPixels = 0;

    // Análisis de ROI (Region of Interest) central
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.calibrationParams.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.calibrationParams.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        sampledPixels++;
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Cálculo de dominancia de rojo mejorado
        const redDominance = red / (Math.max(green, blue) + 1);
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        if (red >= this.calibrationParams.minRedIntensity && 
            red <= this.calibrationParams.maxRedIntensity && 
            redDominance >= this.calibrationParams.redDominanceThreshold) {
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;
        }
      }
    }

    const coverage = validPixelCount / sampledPixels;
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    
    // Detección de dedo más precisa
    const fingerPresent = validPixelCount >= this.calibrationParams.minValidPixels && 
                         coverage >= 0.1 && 
                         redMean >= this.calibrationParams.minRedIntensity;

    // Log detallado para debugging
    console.log('Detección de dedo:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      redMean: Math.round(redMean),
      pixelesValidos: validPixelCount,
      pixelesMuestreados: sampledPixels,
      cobertura: Math.round(coverage * 100) + '%',
      redDominance: maxRedDominance.toFixed(2)
    });

    return {
      red: redMean,
      ir: totalGreenValue / (validPixelCount || 1),
      quality: coverage,
      perfusionIndex: maxRedDominance,
      fingerPresent,
      diagnostics: {
        redMean,
        validPixels: validPixelCount,
        redDominance: maxRedDominance,
        coverage
      }
    };
  }
}
