
export function validateVitalSigns(
  calculatedBpm: number,
  systolic: number,
  diastolic: number,
  lastValidBpm: number,
  lastValidSystolic: number,
  lastValidDiastolic: number
) {
  return {
    bpm: isValidBpm(calculatedBpm) ? calculatedBpm : lastValidBpm,
    systolic: isValidSystolic(systolic) ? systolic : lastValidSystolic,
    diastolic: isValidDiastolic(diastolic) ? diastolic : lastValidDiastolic
  };
}

export function validateSignalQuality(
  quality: number,
  redValue: number,
  qualityThreshold: number,
  minRedValue: number
): boolean {
  return quality >= qualityThreshold && redValue >= minRedValue;
}

function isValidBpm(bpm: number): boolean {
  return bpm >= 40 && bpm <= 200;
}

function isValidSystolic(systolic: number): boolean {
  return systolic >= 80 && systolic <= 200;
}

function isValidDiastolic(diastolic: number): boolean {
  return diastolic >= 40 && diastolic <= 130;
}
