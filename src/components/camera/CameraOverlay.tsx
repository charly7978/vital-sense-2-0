
import React from "react";
import { cn } from "@/lib/utils";

interface CameraOverlayProps {
  frameCount: number;
  isInitializing: boolean;
  hasError: boolean;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({
  frameCount,
  isInitializing,
  hasError,
}) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="relative w-32 h-32">
        <div
          className={cn(
            "absolute inset-0 border-2 rounded-full transition-all duration-300",
            frameCount > 0 ? "border-white/30" : "border-white/10"
          )}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-[1px] bg-white/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[1px] h-full bg-white/20" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
          <span className="text-white/60 text-xs text-center">
            {isInitializing
              ? "Iniciando cámara..."
              : hasError
              ? "Error de cámara"
              : "Coloque su dedo"}
          </span>
          {!isInitializing && !hasError && (
            <span className="text-white/40 text-[10px] text-center mt-1">
              Cubra el círculo
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraOverlay;
