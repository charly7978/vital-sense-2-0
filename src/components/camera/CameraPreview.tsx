
import React from "react";
import Webcam from "react-webcam";
import type { MediaTrackConstraints } from "types";

interface CameraPreviewProps {
  webcamRef: React.RefObject<Webcam>;
  videoConstraints: MediaTrackConstraints;
}

const CameraPreview: React.FC<CameraPreviewProps> = ({
  webcamRef,
  videoConstraints,
}) => {
  return (
    <Webcam
      ref={webcamRef}
      audio={false}
      videoConstraints={videoConstraints}
      className="absolute w-full h-full object-cover z-0"
      screenshotFormat="image/jpeg"
      screenshotQuality={1}
    />
  );
};

export default CameraPreview;
