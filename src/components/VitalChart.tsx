
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '../utils/types';

interface VitalChartProps {
  data: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, color = "#ea384c" }) => {
  const formattedData = useMemo(() => {
    // Mantenemos los últimos 100 puntos para una señal más suave
    const recentData = data.slice(-100);
    
    if (recentData.length === 0) return [];
    
    // Calculamos una media móvil para suavizar la señal
    const smoothedData = recentData.map((reading, index) => {
      const windowSize = 5;
      const start = Math.max(0, index - windowSize);
      const end = index + 1;
      const window = recentData.slice(start, end);
      const avgValue = window.reduce((sum, r) => sum + r.value, 0) / window.length;
      
      return {
        ...reading,
        value: avgValue
      };
    });
    
    // Normalizamos los valores después del suavizado
    const values = smoothedData.map(r => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return smoothedData.map(reading => ({
      timestamp: new Date(reading.timestamp).toISOString().substr(17, 6),
      value: ((reading.value - min) / range) * 100,
      originalValue: reading.value
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
            type="monotoneX"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
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
