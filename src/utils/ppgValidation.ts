
export const validateVitalSigns = (
  bpm: number,
  systolic: number,
  diastolic: number,
  lastValidBpm: number,
  lastValidSystolic: number,
  lastValidDiastolic: number
): {
  bpm: number;
  systolic: number;
  diastolic: number;
} => {
  const validBpm = bpm >= 40 && bpm <= 200 ? bpm : lastValidBpm || 0;
  const validSystolic = systolic >= 90 && systolic <= 180 ? 
    systolic : lastValidSystolic;
  const validDiastolic = diastolic >= 60 && diastolic <= 120 ? 
    diastolic : lastValidDiastolic;
  
  if (validSystolic <= validDiastolic) {
    return {
      bpm: validBpm,
      systolic: lastValidSystolic,
      diastolic: lastValidDiastolic
    };
  }

  return {
    bpm: validBpm,
    systolic: validSystolic,
    diastolic: validDiastolic
  };
};

export const validateSignalQuality = (
  quality: number,
  red: number,
  qualityThreshold: number,
  minRedValue: number
): boolean => {
  return quality >= qualityThreshold && red >= minRedValue;
};
