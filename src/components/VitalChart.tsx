
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { VitalReading } from '@/types';

interface VitalChartProps {
  data?: VitalReading[];
  color?: string;
}

const VitalChart: React.FC<VitalChartProps> = ({ 
  data = [], 
  color = "#9b87f5" 
}) => {
  // Asegurarnos que data es un array y tiene elementos
  const safeData = Array.isArray(data) ? data : [];
  
  const formattedData = safeData.map(reading => ({
    timestamp: new Date(reading?.timestamp || Date.now()).toISOString().substr(17, 6),
    value: reading?.value || 0
  }));

  // Si no hay datos, mostrar un mensaje
  if (formattedData.length === 0) {
    return (
      <div className="w-full h-[200px] bg-black/70 backdrop-blur-sm rounded-xl p-4 flex items-center justify-center">
        <p className="text-gray-400">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[200px] bg-black/70 backdrop-blur-sm rounded-xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#ffffff10" 
          />
          <XAxis 
            dataKey="timestamp" 
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
          />
          <YAxis 
            stroke="#ffffff60"
            tick={{ fill: '#ffffff60' }}
            domain={['auto', 'auto']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VitalChart;
