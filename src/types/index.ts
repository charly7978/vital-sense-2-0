
// IMPORTANTE: NO MODIFICAR FUNCIONALIDAD
// Este archivo solo contiene definiciones de tipos
// Cualquier cambio debe mantener compatibilidad total con el código existente

// Re-exportamos todos los tipos organizados
export * from './signal';
export * from './calibration';
export * from './processing';
export * from './wavelet';
export * from './vitals';
export * from './core';

// Tipos básicos
export type Percent = number & { __brand: 'Percent' };
export type BPM = number & { __brand: 'BPM' };
export type Milliseconds = number & { __brand: 'Milliseconds' };

// Niveles de calidad de señal
export enum SignalQualityLevel {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Invalid = 'invalid'
}

// Tipos de medición
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

// Información del dispositivo
export interface DeviceInfo {
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  lightLevel: Percent;
}

// Configuración de la cámara
export interface CameraConfig {
  constraints: MediaStreamConstraints;
  settings: {
    width: number;
    height: number;
    frameRate: number;
    facingMode: 'user' | 'environment';
  };
}

export interface PPGData {
  timestamp: number;
  values: number[];
  quality: number;
  bpm?: number;
}

export interface VitalReading {
  timestamp: number;
  value: number;
  confidence: number;
}

// Helpers para crear tipos branded
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;

// Tipos específicos para la cámara
export interface MediaTrackConstraintsExtended extends MediaStreamConstraints {
  deviceId?: string;
  facingMode?: 'user' | 'environment';
}
