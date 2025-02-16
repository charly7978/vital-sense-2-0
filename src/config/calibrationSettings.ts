
/**
 * Configuraciones de Calibración del Sistema PPG
 * Estos valores pueden ser ajustados para calibrar el sistema
 */

export const CalibrationConfig = {
  // Configuraciones de Detección de Señal
  signal: {
    // Rango normal: 15-30. Aumentar: más sensible a dedos oscuros. Reducir: menos falsos positivos
    minRedValue: 20,           

    // Rango normal: 60-100. Aumentar: requiere más luz. Reducir: más tolerante a baja iluminación
    minBrightness: 80,         

    // Rango normal: 0.15-0.4. Aumentar: mejor calidad requerida. Reducir: más tolerante a mala colocación
    minValidPixelsRatio: 0.2,  

    // Rango normal: 1.0-2.0. Aumentar: señal más fuerte pero más ruido. Reducir: señal más limpia pero más débil
    signalAmplification: 1.5,  

    // Rango normal: 1.0-1.5. Aumentar: más filtrado pero puede perder picos. Reducir: menos filtrado, más ruido
    noiseReduction: 1.2,       

    // Rango normal: 0.6-1.0. Aumentar: corrección más agresiva. Reducir: mantiene más la señal original
    baselineCorrection: 0.8    
  },

  // Configuraciones de Detección de Picos
  peaks: {
    // Rango normal: 300-600ms. Aumentar: evita dobles detecciones. Reducir: detecta ritmos más rápidos
    minPeakDistance: 400,      

    // Rango normal: 1000-1500ms. Aumentar: permite ritmos más lentos. Reducir: rechaza bradicardias
    maxPeakDistance: 1200,     

    // Rango normal: 0.3-0.6. Aumentar: más selectivo con picos. Reducir: detecta picos más débiles
    peakThreshold: 0.4,        

    // Rango normal: 0.2-0.5. Aumentar: requiere picos más pronunciados. Reducir: acepta picos más sutiles
    minPeakHeight: 0.3,        

    // Rango normal: 150-300ms. Aumentar: más tolerante a picos anchos. Reducir: más estricto con forma de onda
    maxPeakWidth: 200,         

    // Rango normal: 0.15-0.3. Aumentar: requiere picos más distintivos. Reducir: más tolerante a picos planos
    peakProminence: 0.2        
  },

  // Configuraciones de Medición
  measurement: {
    // Rango normal: 20-60s. Aumentar: más preciso pero tarda más. Reducir: más rápido pero menos preciso
    duration: 30,              

    // Rango normal: 20-50. Aumentar: más confiable pero tarda más. Reducir: resultados más rápidos
    minReadingsRequired: 30,   

    // Rango normal: 200-500. Aumentar: más historia pero más memoria. Reducir: menos memoria usada
    maxReadingsStored: 300,    

    // Rango normal: 0.2-0.5. Aumentar: requiere mejor señal. Reducir: más tolerante a señales pobres
    qualityThreshold: 0.3,     

    // Rango normal: 3-10s. Aumentar: más estable pero tarda más. Reducir: comienza antes pero menos estable
    stabilizationTime: 5       
  },

  // Configuraciones de Cálculo de Signos Vitales
  vitals: {
    // Frecuencia Cardíaca (BPM)
    bpm: {
      // Rango normal: 30-50. Aumentar: ignora bradicardias. Reducir: detecta ritmos muy lentos
      min: 40,                 

      // Rango normal: 180-220. Aumentar: detecta taquicardias extremas. Reducir: ignora ritmos muy rápidos
      max: 200,                

      // Rango normal: 3-8s. Aumentar: más estable pero menos reactivo. Reducir: más reactivo pero menos estable
      averagingWindow: 5       
    },
    
    // SpO2
    spo2: {
      // Rango normal: 0.95-1.05. Aumentar: valores más altos. Reducir: valores más bajos
      calibrationFactor: 1.02, 

      // Rango normal: 75-85%. Aumentar: ignora valores bajos. Reducir: detecta hipoxia severa
      minValid: 80,            

      // Rango normal: 98-100%. Aumentar: permite >100%. Reducir: más restrictivo en máximos
      maxValid: 100,           

      // Rango normal: 0.3-0.5. Aumentar: más peso al rojo. Reducir: más peso al infrarrojo
      redIrRatio: 0.4         
    },

    // Presión Arterial
    bloodPressure: {
      // Rango normal: 2.0-3.0. Aumentar: sistólica más alta. Reducir: sistólica más baja
      systolicFactor: 2.5,     

      // Rango normal: 1.5-2.0. Aumentar: diastólica más alta. Reducir: diastólica más baja
      diastolicFactor: 1.8,    

      // Rango normal: 0.8-1.0. Aumentar: presiones más altas. Reducir: presiones más bajas
      pttScaleFactor: 0.9,     

      // Rango normal: 1.0-1.2. Aumentar: valores base más altos. Reducir: valores base más bajos
      baselineAdjustment: 1.1  
    }
  },

  // Configuraciones de Análisis de Señal
  analysis: {
    // Filtros
    filters: {
      // Rango normal: 3-8Hz. Aumentar: más suave pero puede perder detalles. Reducir: más detalle pero más ruido
      lowPassCutoff: 5,        

      // Rango normal: 0.3-1.0Hz. Aumentar: menos deriva pero puede perder señal. Reducir: mantiene más señal
      highPassCutoff: 0.5,     

      // Rango normal: 50/60Hz. Ajustar según frecuencia de red eléctrica local
      notchFrequency: 50,      

      // Rango normal: 2-6. Aumentar: más filtrado pero más distorsión. Reducir: menos distorsión
      filterOrder: 4           
    },

    // Análisis Espectral
    spectral: {
      // Rango normal: 128-512. Aumentar: mejor resolución pero más lento. Reducir: más rápido, menos detalle
      fftWindowSize: 256,      

      // Rango normal: 25-60Hz. Aumentar: más detalle temporal. Reducir: menos carga computacional
      samplingRate: 30,        

      // Rango normal: 0.4-0.8Hz. Aumentar: ignora variaciones lentas. Reducir: incluye más componentes lentos
      minFrequency: 0.5,       

      // Rango normal: 3.0-5.0Hz. Aumentar: incluye armónicos altos. Reducir: se centra en fundamental
      maxFrequency: 4.0        
    },

    // Detección de Arritmias
    arrhythmia: {
      // Rango normal: 0.15-0.3. Aumentar: menos sensible. Reducir: detecta variaciones más sutiles
      rrVariabilityThreshold: 0.2,  

      // Rango normal: 0.1-0.2. Aumentar: menos falsos positivos. Reducir: detecta más latidos prematuros
      prematureBeatsThreshold: 0.15, 

      // Rango normal: 2-5. Aumentar: más confiable pero puede perder eventos. Reducir: más sensible
      minConsecutiveBeats: 3        
    }
  },

  // Configuraciones de Control de Calidad
  quality: {
    // Rango normal: 2.0-4.0. Aumentar: requiere mejor calidad. Reducir: más tolerante a ruido
    signalToNoiseRatio: 3.0,   

    // Rango normal: 0.2-0.5. Aumentar: más tolerante a movimiento. Reducir: más estricto
    motionTolerance: 0.3,      

    // Rango normal: 0.7-0.9. Aumentar: requiere señal más estable. Reducir: más tolerante a inestabilidad
    baselineStability: 0.8,    

    // Rango normal: 0.2-0.4. Aumentar: más tolerante a artefactos. Reducir: más estricto con calidad
    artifactThreshold: 0.25    
  }
};
