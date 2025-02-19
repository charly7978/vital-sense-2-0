
export interface MediaTrackConstraintsExtended {
  video?: {
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number };
    facingMode: string | { ideal: string };
  };
}

export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}
