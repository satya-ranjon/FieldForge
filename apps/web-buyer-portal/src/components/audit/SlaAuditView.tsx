import React from 'react';
import { Clock, CheckCircle2, Activity, Cpu, Server, Terminal, Radio } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@fieldforge/ui';

export const SlaAuditView: React.FC = () => {
  const metrics = [
    {
      label: 'API Availability (Non-5xx)',
      value: '99.98%',
      target: '≥ 99.9%',
      status: 'OPTIMAL',
      spec: 'FR-OBS-002',
      icon: Server
    },
    {
      label: 'p95 API Read Latency',
      value: '42ms',
      target: '< 100ms',
      status: 'OPTIMAL',
      spec: 'NFR-PERF-001',
      icon: Cpu
    },
    {
      label: 'p95 API Write Latency',
      value: '118ms',
      target: '< 200ms',
      status: 'OPTIMAL',
      spec: 'NFR-PERF-001',
      icon: Activity
    },
    {
      label: 'Dispatch Queue Latency',
      value: '0.45s',
      target: '< 1.5s',
      status: 'OPTIMAL',
      spec: 'FR-OBS-002',
      icon: Radio
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
    <div className="space-y-5 sm:space-y-6">
      {/* SLA Metrics Header */}
      <Card variant="glass" className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                SLA Compliance & Observability Telemetry
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/80 font-semibold">
                FR-OBS-001 / 002
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time service-level indicator (SLI) telemetry and distributed trace audit trail
              across bounded contexts
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-[#090d16]/90 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Cluster Status:</span>
            <span className="text-emerald-400 font-bold">HEALTHY</span>
          </div>
        </div>
      </Card>

      {/* Observability Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.label}
              variant="glass"
              className="p-4 sm:p-5 group hover:border-slate-700/80 transition"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium truncate max-w-[170px]">{m.label}</span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {m.spec}
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                  {m.value}
                </span>
                <Icon className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Target: {m.target}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  PASS
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Distributed Audit Log & Correlation ID Trail */}
      <Card variant="elevated" className="border-slate-700/80">
        <CardHeader className="bg-[#090d16]/50">
          <div>
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-sm sm:text-base">
                Microservices Event Trail & Correlation Logs
              </CardTitle>
            </div>
            <CardDescription>
              Structured JSON event propagation across AMQP and HTTP boundaries (FR-OBS-001)
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090d16]/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Correlation ID</th>
                  <th className="px-5 py-3">Service Context</th>
                  <th className="px-5 py-3">Event Topic</th>
                  <th className="px-5 py-3">Telemetry Payload Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[#090d16]/50 transition">
                    <td className="px-5 py-3.5 text-slate-400 font-mono whitespace-nowrap">
                      {evt.time}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-blue-400 font-bold whitespace-nowrap">
                      {evt.correlationId}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#090d16] text-slate-300 border border-slate-700 font-mono text-[10px]">
                        {evt.service}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                      {evt.event}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 leading-relaxed">{evt.details}</td>
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
