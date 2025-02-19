
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: { ideal: number };
  advanced?: MediaTrackConstraintSet[];
}
