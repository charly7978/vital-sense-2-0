
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
      videoConstraints={{
        ...videoConstraints,
        advanced: [{
          brightness: 100,         // Aumentar brillo
          contrast: 128,           // Mejorar contraste
          saturation: 128,         // Mejorar saturación
          sharpness: 128,         // Mejorar nitidez
          exposureMode: 'manual',  // Control manual de exposición
          exposureTime: 10000,     // Tiempo de exposición más largo
          exposureCompensation: 2, // Compensación de exposición positiva
          whiteBalance: 'continuous'
        }]
      }}
      className="absolute w-full h-full object-cover z-0"
      screenshotFormat="image/jpeg"
      screenshotQuality={1}
    />
  );
};

export default CameraPreview;
