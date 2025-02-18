
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
      videoConstraints={videoConstraints}
      className="absolute w-full h-full object-cover z-0"
      screenshotFormat="image/jpeg"
      screenshotQuality={1}
    />
  );
};

export default CameraPreview;
