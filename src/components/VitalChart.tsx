
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '../utils/types';

interface VitalChartProps {
  data: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ data, color = "#ea384c" }) => {
  const formattedData = useMemo(() => {
    // Reducido a 150 puntos para mejor rendimiento
    const recentData = data.slice(-150);
    return recentData.map(reading => ({
      timestamp: new Date(reading.timestamp).toISOString().substr(17, 6),
      value: reading.value
    }));
  }, [data]);

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
            interval={25}
            minTickGap={30}
          />
          <YAxis 
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60', fontSize: 10 }}
            domain={['auto', 'auto']}
            scale="linear"
            interval={1}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
