
export interface WaveletCoefficients {
  approximation: Float64Array;
  details: Float64Array[];
}

export interface SubbandFeatures {
  energy: number[];
  entropy: number[];
  variance: number[];
}

export interface WaveletTransform extends WaveletCoefficients {
  features: SubbandFeatures;
}

export interface WaveletBasis {
  name: string;
  coefficients: Float64Array;
}

export interface WaveletPacket {
  coefficients: WaveletCoefficients;
  features: SubbandFeatures;
}

export interface ScaleSpace {
  scales: Float64Array[];
  frequencies: number[];
}

export interface OptimizedDWT {
  transform: (signal: Float64Array) => WaveletTransform;
  inverse: (coeffs: WaveletCoefficients) => Float64Array;
}
