
export interface BPCalibrationData {
  systolic_reference: number;
  diastolic_reference: number;
  age: number;
  weight: number;
  height: number;
  notes: string;
  environmental_conditions: {
    timestamp: string;
    device_type: string;
  };
}
