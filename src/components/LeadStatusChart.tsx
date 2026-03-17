import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AgentLead } from '../types';

interface LeadStatusChartProps {
  leads: AgentLead[];
}

const STATUS_COLORS = {
  new: '#64748b',      // slate-500
  contacted: '#3b82f6', // blue-500
  replied: '#8b5cf6',   // violet-500
  booked: '#10b981',    // emerald-500
  rejected: '#ef4444',  // red-500
};

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  replied: 'Replied',
  booked: 'Booked',
  rejected: 'Rejected',
};

export const LeadStatusChart: React.FC<LeadStatusChartProps> = ({ leads }) => {
  const data = Object.keys(STATUS_LABELS).map((status) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    value: leads.filter((l) => l.status === status).length,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  })).filter(item => item.value > 0);

  if (leads.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
        No Data Available
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
