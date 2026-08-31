import React from 'react';
import { StatusBadge } from '@fieldforge/ui';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export const LiveDispatchBoard: React.FC = () => {
  const workOrders = useSelector((state: RootState) => state.workOrders.items);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Live Dispatch & FSM Board</h2>
          <p className="text-xs text-slate-400">Real-time technician tracking & state machine watcher</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-xs font-semibold text-emerald-400">Redis GEOSTREAM Active</span>
        </div>
      </div>
      <div className="divide-y divide-slate-700/50">
        {workOrders.map((wo) => (
          <div key={wo.id} className="p-4 hover:bg-slate-750 transition flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="font-semibold text-white">{wo.title}</span>
                <StatusBadge status={wo.status} />
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">{wo.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400">${Number(wo.budgetAmount).toFixed(2)}</div>
              <div className="text-xs text-slate-400">{new Date(wo.scheduledStartTime).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
