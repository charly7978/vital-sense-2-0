import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import { Slider } from "@/components/ui/slider";

const CalibrationPanel = ({ settings, onSettingChange }) => {
  const [data, setData] = useState<{ red: number; ir: number }[]>([]);

  return (
    <div className="p-4 bg-black/30 rounded-lg">
      <h2 className="text-white">Calibración en Tiempo Real</h2>
      <Line
        data={{
          labels: data.map((_, i) => i),
          datasets: [
            { label: "Red", data: data.map((d) => d.red), borderColor: "red" },
            { label: "IR", data: data.map((d) => d.ir), borderColor: "blue" }
          ]
        }}
      />
      {Object.entries(settings).map(([key, setting]) => (
        <div key={key}>
          <label>{key}: {setting.value}</label>
          <Slider
            min={setting.min}
            max={setting.max}
            value={[setting.value]}
            onValueChange={(value) => onSettingChange(key, value[0])}
          />
        </div>
      ))}
    </div>
  );
};

export default CalibrationPanel;
