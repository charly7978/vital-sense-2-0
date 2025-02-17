
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '../utils/types';

interface VitalChartProps {
  data: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, color = "#ea384c" }) => {
  const formattedData = useMemo(() => {
    // Solo mantenemos los últimos 30 puntos para una mejor visualización
    const recentData = data.slice(-30);
    
    if (recentData.length === 0) return [];

    // Suavizamos la señal con una media móvil simple
    const smoothedData = [];
    const windowSize = 3;

    for (let i = 0; i < recentData.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = recentData.slice(start, i + 1);
      const avg = window.reduce((sum, r) => sum + r.value, 0) / window.length;
      
      smoothedData.push({
        timestamp: recentData[i].timestamp,
        value: avg
      });
    }

    // Normalizamos la señal a un rango fijo
    const minValue = -50;
    const maxValue = 50;
    
    return smoothedData.map(point => ({
      timestamp: new Date(point.timestamp).toISOString().substr(17, 6),
      value: point.value
    }));
  }, [data]);

  return (
    <div className="w-full h-[200px] bg-black/30 backdrop-blur-sm rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#ffffff10"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="timestamp"
            hide={true}
          />
          <YAxis
            domain={[-50, 50]}
            hide={true}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
