import React, { useState } from 'react';
import { Button } from '@fieldforge/ui';

export const SowBuilder: React.FC = () => {
  const [scope, setScope] = useState('');

  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-2">Scope of Work (SOW) Template Builder</h3>
      <p className="text-sm text-slate-400 mb-4">Define standardized deliverables, required tools, and check-in milestones.</p>
      <textarea
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        placeholder="1. Check in within 100m of store coordinates&#10;2. Take pre-work site photos&#10;3. Replace hardware & capture serial numbers&#10;4. Obtain manager signature"
        rows={5}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <div className="mt-4 flex justify-end">
        <Button variant="primary" size="sm">Save SOW Standard</Button>
      </div>
    </div>
  );
};
