
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '../utils/types';

interface VitalChartProps {
  data: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, color = "#ea384c" }) => {
  const formattedData = useMemo(() => {
    // Mantenemos solo los últimos 50 puntos para una visualización más fluida
    const recentData = data.slice(-50);
    
    // Normalizamos los valores para que siempre estén en un rango visible
    if (recentData.length === 0) return [];
    
    const values = recentData.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return recentData.map(reading => ({
      timestamp: new Date(reading.timestamp).toISOString().substr(17, 6),
      value: ((reading.value - min) / range) * 100 // Normalizado a un rango de 0-100
    }));
  }, [data]);

  return (
    <div className="w-full h-[200px] bg-black/30 backdrop-blur-sm rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
            domain={[0, 100]}
            hide={true}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
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
