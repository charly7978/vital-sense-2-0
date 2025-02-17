import React, { createContext, useContext, useState } from "react";

const VitalContext = createContext(null);

export const VitalProvider = ({ children }) => {
  const [bpm, setBpm] = useState(0);
  const [spo2, setSpo2] = useState(98);
  const [signalQuality, setSignalQuality] = useState(0);

  return (
    <VitalContext.Provider value={{ bpm, setBpm, spo2, setSpo2, signalQuality, setSignalQuality }}>
      {children}
    </VitalContext.Provider>
  );
};

export const useVitals = () => useContext(VitalContext);
