
export interface WaveletBasis {
  filters: {
    decomposition: {
      lowPass: Float64Array;
      highPass: Float64Array;
    };
    reconstruction: {
      lowPass: Float64Array;
      highPass: Float64Array;
    };
  };
  support: number;
  vanishingMoments: number;
}

export interface WaveletCoefficients {
  approximation: Float64Array;
  details: Float64Array[];
}

export interface SubbandFeatures {
  energy: number;
  entropy: number;
  variance: number;
  mean: number;
  level: number;
  type: string;
}
