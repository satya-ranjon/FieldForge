import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@fieldforge/ui';

export const SlaAuditView: React.FC = () => {
  const metrics = [
    {
      label: 'API Availability (Non-5xx)',
      value: '99.98%',
      target: '≥ 99.9%',
      status: 'OPTIMAL',
      spec: 'FR-OBS-002'
    },
    {
      label: 'p95 API Read Latency',
      value: '42ms',
      target: '< 100ms',
      status: 'OPTIMAL',
      spec: 'NFR-PERF-001'
    },
    {
      label: 'p95 API Write Latency',
      value: '118ms',
      target: '< 200ms',
      status: 'OPTIMAL',
      spec: 'NFR-PERF-001'
    },
    {
      label: 'Dispatch Queue Latency',
      value: '0.45s',
      target: '< 1.5s',
      status: 'OPTIMAL',
      spec: 'FR-OBS-002'
    }
  ];

  const auditEvents = [
    {
      id: 'evt-01',
      time: '10 mins ago',
      correlationId: 'c-982103-f92a',
      service: 'dispatch-matching-service',
      event: 'work_order.published',
      details: 'Redis GEOSTREAM broadcasted 5 eligible technicians within 10mi radius'
    },
    {
      id: 'evt-02',
      time: '24 mins ago',
      correlationId: 'c-883190-b14c',
      service: 'work-order-service',
      event: 'work_order.geofence_verified',
      details: 'Tech Marcus Vance checked in at coordinates (37.7712, -122.3921), 28m on-site'
    },
    {
      id: 'evt-03',
      time: '1 hour ago',
      correlationId: 'c-772184-e39d',
      service: 'billing-service',
      event: 'escrow.pre_authorized',
      details:
        'Locked $450.00 in Escrow Vault for work order wo-101 with idempotency key idemp-wo-101-auth'
    },
    {
      id: 'evt-04',
      time: '2 hours ago',
      correlationId: 'c-661099-a88f',
      service: 'notification-service',
      event: 'amqp.push_dispatch_batch',
      details: 'RabbitMQ topic exchange dispatched AMQP batch notifications to mobile workers'
    }
  ];

  return (
    <div className="space-y-6">
      {/* SLA Metrics Header */}
      <Card variant="glass" className="p-4 border-slate-800">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">
            SLA Compliance & Observability Telemetry
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            FR-OBS-001 / 002
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Real-time service-level indicator (SLI) telemetry and distributed trace audit trail
        </p>
      </Card>

      {/* Observability Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label} variant="default" className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{m.label}</span>
              <span className="text-[10px] font-mono text-slate-500">{m.spec}</span>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">{m.value}</div>
            <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Target: {m.target}</span>
              <span className="text-emerald-400 font-semibold font-mono">PASS</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Distributed Audit Log & Correlation ID Trail */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">
              Microservices Event Trail & Correlation Logs
            </CardTitle>
            <CardDescription>
              Structured JSON event propagation across AMQP and HTTP boundaries (FR-OBS-001)
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Correlation ID</th>
                  <th className="px-5 py-3">Service Context</th>
                  <th className="px-5 py-3">Event Topic</th>
                  <th className="px-5 py-3">Telemetry Payload Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-850/50 transition">
                    <td className="px-5 py-3 text-slate-400 font-mono">{evt.time}</td>
                    <td className="px-5 py-3 font-mono text-blue-400 font-semibold">
                      {evt.correlationId}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-mono text-[11px]">
                        {evt.service}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-emerald-400 font-medium">
                      {evt.event}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{evt.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
