
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '../utils/types';

interface VitalChartProps {
  data: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, color = "#ea384c" }) => {
  const formattedData = useMemo(() => {
    // Mostramos los últimos 100 puntos para mejor visualización de la actividad cardíaca
    const recentData = data.slice(-100);
    return recentData.map(reading => ({
      timestamp: new Date(reading.timestamp).toISOString().substr(17, 6),
      value: reading.value * 2 // Amplificamos la señal para mejor visibilidad
    }));
  }, [data]);

  // Calculamos el rango dinámico para el eje Y
  const yDomain = useMemo(() => {
    if (formattedData.length === 0) return [-1, 1];
    const values = formattedData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.2;
    return [min - padding, max + padding];
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
            interval={10}
            minTickGap={20}
          />
          <YAxis 
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60', fontSize: 10 }}
            domain={yDomain}
            scale="linear"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={true}
            animationDuration={200}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
