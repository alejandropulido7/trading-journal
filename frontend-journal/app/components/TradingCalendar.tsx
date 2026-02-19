// app/components/TradingCalendar.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameMonth 
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Quitamos Filter
// Si no usas 'cn', elimina el import y usa template strings normales
// import { cn } from "@/lib/utils"; 

// ... (Interfaces DailyStat y CalendarData siguen igual) ...
interface DailyStat {
  date: string;
  profit: number;
  trades_count: number;
  wins: number;
}

interface CalendarData {
  month_total_profit: number;
  month_win_rate: number;
  total_trades: number;
  days: DailyStat[];
}

// NUEVA INTERFACE DE PROPS
interface TradingCalendarProps {
  selectedAccountId: number | "";
}

export default function TradingCalendar({ selectedAccountId }: TradingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "http://localhost:8000";

  // Efecto: Recargar cuando cambia la fecha O la cuenta seleccionada (que viene de props)
  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, selectedAccountId]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      let url = `${API_URL}/calendar-stats?year=${year}&month=${month}`;
      
      // Usamos la prop recibida
      if (selectedAccountId) {
        url += `&account_id=${selectedAccountId}`;
      }

      const res = await axios.get<CalendarData>(url);
      setData(res.data);
    } catch (error) {
      console.error("Error cargando calendario", error);
    }
    setLoading(false);
  };

  // ... (Lógica de fechas sigue igual: monthStart, calendarDays, etc.) ...
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getDayData = (day: Date) => {
    if (!data) return null;
    const dateStr = format(day, "yyyy-MM-dd");
    return data.days.find(d => d.date === dateStr);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      
      {/* HEADER LIMPIO (Sin Dropdown) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        
        {/* Métricas del Mes */}
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-slate-400 text-xs uppercase font-bold">Total Profit</p>
            <p className={`text-xl font-bold ${data?.month_total_profit && data.month_total_profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {data ? `$${data.month_total_profit.toLocaleString()}` : "..."}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-bold">Win Rate</p>
            <p className="text-xl font-bold text-slate-800">
               {data ? `${data.month_win_rate}%` : "..."}
            </p>
          </div>
        </div>

        {/* Solo Navegación de Meses */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-l-lg transition">
                <ChevronLeft size={20} />
            </button>
            <span className="px-4 font-bold text-slate-700 min-w-[140px] text-center capitalize">
                {format(currentDate, "MMMM yyyy", { locale: es })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-r-lg transition">
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* GRID DEL CALENDARIO (IGUAL QUE ANTES) */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="bg-slate-50 p-2 text-center text-xs font-bold text-slate-400 uppercase">
            {day}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          const dayData = getDayData(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isProfit = dayData && dayData.profit >= 0;
          const hasTrades = dayData && dayData.trades_count > 0;

          return (
            <div 
              key={idx} 
              className={`
                min-h-[100px] p-2 flex flex-col justify-between transition-all
                ${!isCurrentMonth ? "bg-slate-50/50 text-slate-300" : "bg-white"}
                ${hasTrades
                    ? (isProfit ? "bg-emerald-300 hover:bg-emerald-100/50" : "bg-red-50/40 hover:bg-red-100/50") 
                    : "hover:bg-slate-100"
                }
              `}
            >
              <div className={`flex justify-between items-start`}>
                  <span className={`text-sm font-medium ${!isCurrentMonth && "opacity-30"}`}>
                    {format(day, "d")}
                  </span>
                  {hasTrades && (
                      <span className="text-[10px] bg-white border border-slate-200 px-1.5 rounded text-slate-500">
                          {dayData.trades_count}t
                      </span>
                  )}
              </div>

              {hasTrades && isCurrentMonth ? (
                <div className="text-right mt-1">
                  <p className={`font-bold text-sm ${isProfit ? "text-emerald-600" : "text-red-600"}`}>
                    {isProfit ? "+" : ""}{dayData.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                  </p>
                </div>
              ) : ( <div className="flex-1"></div> )}
            </div>
          );
        })}
      </div>
    </div>
  );
}