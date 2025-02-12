
export interface ValidatedVitals {
  bpm: number;
  systolic: number;
  diastolic: number;
}

export class VitalsValidator {
  private lastValidBpm: number = 0;
  private lastValidSystolic: number = 120;
  private lastValidDiastolic: number = 80;

  validateVitalSigns(bpm: number, systolic: number, diastolic: number): ValidatedVitals {
    const validBpm = bpm >= 40 && bpm <= 200 ? bpm : this.lastValidBpm || 0;
    const validSystolic = systolic >= 90 && systolic <= 180 ? systolic : this.lastValidSystolic;
    const validDiastolic = diastolic >= 60 && diastolic <= 120 ? diastolic : this.lastValidDiastolic;
    
    if (validSystolic <= validDiastolic) {
      return {
        bpm: validBpm,
        systolic: this.lastValidSystolic,
        diastolic: this.lastValidDiastolic
      };
    }

    this.lastValidBpm = validBpm;
    this.lastValidSystolic = validSystolic;
    this.lastValidDiastolic = validDiastolic;

    return {
      bpm: validBpm,
      systolic: validSystolic,
      diastolic: validDiastolic
    };
  }
}
