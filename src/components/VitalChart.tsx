
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '../utils/types';

interface VitalChartProps {
  data: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, color = "#ea384c" }) => {
  const formattedData = useMemo(() => {
    // Mantenemos más puntos para una visualización más fluida
    const recentData = data.slice(-200);
    return recentData.map(reading => ({
      timestamp: new Date(reading.timestamp).toISOString().substr(17, 6),
      // Normalizamos y amplificamos la señal para que se vea mejor
      value: reading.value * 3
    }));
  }, [data]);

  // Calculamos el rango dinámico para el eje Y con más espacio para la señal
  const yDomain = useMemo(() => {
    if (formattedData.length === 0) return [-1, 1];
    const values = formattedData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    // Añadimos más padding para ver mejor los picos
    return [min - range * 0.3, max + range * 0.3];
  }, [formattedData]);

  return (
    <div className="w-full h-[200px] bg-black/30 backdrop-blur-sm rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={formattedData}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis 
            dataKey="timestamp" 
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60', fontSize: 10 }}
            interval={15}
            minTickGap={30}
            hide // Ocultamos el eje X para que se vea más como un ECG
          />
          <YAxis 
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60', fontSize: 10 }}
            domain={yDomain}
            scale="linear"
            hide // Ocultamos el eje Y para que se vea más como un ECG
          />
          <Line
            type="basis" // Cambiamos a "basis" para una curva más suave
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false} // Desactivamos la animación para mayor fluidez
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
