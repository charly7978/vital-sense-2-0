
import React from "react";
import Webcam from "react-webcam";
import { MediaTrackConstraintsExtended } from "@/types";

interface CameraPreviewProps {
  webcamRef: React.RefObject<Webcam>;
  videoConstraints: MediaTrackConstraintsExtended;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  webcamRef,
  videoConstraints,
}) => {
  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      screenshotFormat="image/jpeg"
      videoConstraints={{
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: "environment"
      }}
      className="absolute w-full h-full object-cover z-0"
      screenshotQuality={1}
    />
  );
};

export default CameraPreview;
