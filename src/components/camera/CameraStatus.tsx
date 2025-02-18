
import React from "react";

interface CameraStatusProps {
  isInitializing: boolean;
  hasError: boolean;
}

const CameraStatus: React.FC<CameraStatusProps> = ({ isInitializing, hasError }) => {
  if (!isInitializing && !hasError) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <span className={`text-sm ${hasError ? "text-red-400/60" : "text-white/60"}`}>
        {hasError ? "Error al iniciar la cámara" : "Iniciando cámara..."}
      </span>
    </div>
  );
};

export default CameraStatus;
