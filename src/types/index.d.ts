
declare interface MediaTrackCapabilities {
  torch?: boolean;
}

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  advanced?: {
    torch?: boolean;
  }[];
}
