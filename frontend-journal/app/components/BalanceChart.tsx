"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChartDataPoint {
  date: string;
  balance: number;
}

interface BalanceChartProps {
  data: ChartDataPoint[];
}

export default function BalanceChart({ data }: BalanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        No hay datos suficientes para graficar.
      </div>
    );
  }

  // Calculamos mínimo y máximo para que el gráfico no empiece siempre en 0,
  // sino que se adapte al rango del precio (Zoom automático)
  const balances = data.map(d => d.balance);
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  
  // Le damos un poco de aire (buffer) arriba y abajo (2% del valor)
  const buffer = (maxBalance - minBalance) * 0.02;
  const domainMin = minBalance - buffer;
  const domainMax = maxBalance + buffer;

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), 'd MMM', { locale: es })}
            stroke="#94a3b8"
            fontSize={12}
            tickMargin={10}
            minTickGap={30}
          />
          
          <YAxis 
            domain={[domainMin, domainMax]} // Escala dinámica
            stroke="#94a3b8"
            fontSize={12}
            tickFormatter={(val) => `$${val.toLocaleString()}`}
            width={80}
          />
          
          <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Balance']}
                labelFormatter={(label) => format(parseISO(label), 'd MMMM yyyy', { locale: es })}
            />
          
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorBalance)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}