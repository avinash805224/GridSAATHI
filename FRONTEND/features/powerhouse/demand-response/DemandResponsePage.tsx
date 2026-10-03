import React, { useState } from 'react';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { Button } from '../../../components/ui/Button';
import { ResponseCurve } from '../../../components/charts/ResponseCurve';
import { formatPower } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import { AlertChannel, NodeLevel } from '../../../domain/types';
import { Radio, Plus, CheckCircle2, Users } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { useSessionStore } from '../../../store/useSessionStore';
import { getDictionary } from '../../../config/i18n';

type DispatchChannel = Extract<AlertChannel, 'app' | 'sms' | 'banner' | 'email' | 'whatsapp'>;

export const DemandResponsePage: React.FC = () => {
  const { showToast } = useToast();
  const events = useDemandResponseStore((s) => s.events);
  const startEvent = useDemandResponseStore((s) => s.startEvent);
  const endEvent = useDemandResponseStore((s) => s.endEvent);
  const publishAlert = useAlertStore((s) => s.publishAlert);
  const language = useSessionStore((s) => s.language);
  const copy = getDictionary(language);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [scopeLevel, setScopeLevel] = useState<NodeLevel>('area');
  const [scopeId, setScopeId] = useState<string>('area-north');
  const [durationHours, setDurationHours] = useState('2');
  const [severity, setSeverity] = useState<'request' | 'strong_request'>('strong_request');
  const [targetReductionKw, setTargetReductionKw] = useState('400');
  const [message, setMessage] = useState('Evening renewable peak shortfall: please pause ACs, geysers, and pumps for 2 hours.');
  const [channels, setChannels] = useState<DispatchChannel[]>(['app', 'sms', 'banner', 'email', 'whatsapp']);

  const toggleChannel = (channel: DispatchChannel) => {
    setChannels((selected) => {
      if (selected.includes(channel)) {
        return selected.length > 1 ? selected.filter((item) => item !== channel) : selected;
      }
      return [...selected, channel];
    });
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const durationMs = parseFloat(durationHours) * 60 * 60 * 1000;
    const targetKw = parseFloat(targetReductionKw) || 300;

    startEvent({
      scope: { level: scopeLevel, ids: [scopeId] },
      startsAt: Date.now(),
      endsAt: Date.now() + durationMs,
      severity,
      targetReductionKw: targetKw,
      avoidAppliances: ['1.5 Ton Split AC', 'Storage Geyser (25L)', 'Submersible Water Pump', 'Front Load Washing Machine'],
      message,
      status: 'active',
    });

    // Publish the matching notification using the selected dispatch channels.
    publishAlert({
      type: 'demand_response',
      severity: severity === 'strong_request' ? 'warning' : 'advisory',
      title: `Demand Response Active: Shed ${formatPower(targetKw)} Target`,
      body: message,
      scope: { level: scopeLevel, ids: [scopeId] },
      startsAt: Date.now(),
      endsAt: Date.now() + durationMs,
      source: 'operator',
      status: 'active',
      channels,
    });

    showToast({
      type: 'success',
      title: 'Demand Response Event Dispatched',
      message: `Targeting ${formatPower(targetKw)} across selected colonies.`,
    });

    setShowCreateForm(false);
  };

  const handleEndEvent = (id: string) => {
    endEvent(id);
    showToast({
      type: 'info',
      title: 'Demand Response Event Completed',
      message: 'Thank you broadcast posted to participating households.',
    });
  };

  const activeEvents = events.filter((e) => e.status === 'active');
  const pastEvents = events.filter((e) => e.status !== 'active');

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
            {copy.drManagement}
          </h1>
          <p className="text-xs text-[#5B6B62] mt-1">
            {copy.drDescription}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? copy.cancelCreation : copy.initiateDemandResponse}
        </Button>
      </div>

      {/* Creation Form Modal or Inline Expansion */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateEvent}
          className="p-5 bg-white border border-[#27A163] rounded-[12px] shadow-sm flex flex-col gap-4 animate-in fade-in"
        >
          <h2 className="text-sm font-bold text-[#0C3B2B] flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#27A163]" /> {copy.dispatchDemandResponse}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-[#5B6B62] block mb-1">Scope Level</label>
              <select
                value={scopeLevel}
                onChange={(e) => {
                  const lvl = e.target.value as NodeLevel;
                  setScopeLevel(lvl);
                  if (lvl === 'area') setScopeId('area-north');
                  else if (lvl === 'feeder') setScopeId('feeder-shanti');
                  else if (lvl === 'colony') setScopeId('colony-shanti-vihar');
                }}
                className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
              >
                <option value="area">{language === 'hi' ? 'क्षेत्र / ज़ोन' : 'Area / Zone'}</option>
                <option value="feeder">{language === 'hi' ? '11kV फीडर' : '11kV Feeder'}</option>
                <option value="colony">{language === 'hi' ? 'विशिष्ट कॉलोनी' : 'Specific Colony'}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#5B6B62] block mb-1">Target Entity</label>
              <select
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
              >
                {scopeLevel === 'area' &&
                  INITIAL_TOPOLOGY.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                {scopeLevel === 'feeder' &&
                  INITIAL_TOPOLOGY.feeders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                {scopeLevel === 'colony' &&
                  INITIAL_TOPOLOGY.colonies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#5B6B62] block mb-1">Target Reduction (kW)</label>
              <input
                type="number"
                value={targetReductionKw}
                onChange={(e) => setTargetReductionKw(e.target.value)}
                className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
                placeholder="400"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#5B6B62] block mb-1">Duration Window</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
              >
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
                <option value="3">3 Hours</option>
                <option value="4">4 Hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Broadcast Ask Message</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-[#5B6B62]">{copy.broadcastChannels}</legend>
            <div className="flex flex-wrap gap-4">
              {([
                ['app', copy.residentApp],
                ['sms', copy.sms],
                ['email', copy.email],
                ['whatsapp', copy.whatsapp],
                ['banner', copy.notificationBanner],
              ] as const).map(([channel, label]) => (
                <label key={channel} className="flex items-center gap-2 text-xs text-[#16241D] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    className="rounded text-[#27A163] focus:ring-0"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit">
              Dispatch DR Event Now
            </Button>
          </div>
        </form>
      )}

      {/* Active Events with Live Response Curves */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">
          Active Demand Curtailment Events ({activeEvents.length})
        </h2>

        {activeEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B62] bg-white border border-dashed border-[#DDE9E0] rounded-[12px]">
            No demand response events currently active. When intermittency shortfalls are predicted, dispatch an event above.
          </div>
        ) : (
          activeEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-5 shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DDE9E0]/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27A163] animate-pulse" />
                    <h3 className="text-base font-bold text-[#0C3B2B]">{event.message}</h3>
                  </div>
                  <p className="text-xs text-[#5B6B62] mt-1">
                    Active Window: <strong className="text-[#16241D] tabular-nums">{formatTime12h(event.startsAt)} – {formatTime12h(event.endsAt)}</strong> · Scope: <strong className="capitalize text-[#16241D]">{event.scope.level}</strong>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<CheckCircle2 className="w-4 h-4 text-[#27A163]" />}
                  onClick={() => handleEndEvent(event.id)}
                >
                  Conclude & Post Thanks
                </Button>
              </div>

              {/* Live Response Curve */}
              <div>
                <span className="text-xs font-semibold text-[#5B6B62] block mb-2">
                  Live Response Curve (Target vs. Actual Shedding)
                </span>
                <ResponseCurve
                  targetReductionKw={event.targetReductionKw}
                  actualReductionKw={event.actualReductionKw}
                  height={180}
                />
              </div>

              {/* Per-Colony Participation Breakdown */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#DDE9E0]/60">
                <span className="text-xs font-semibold text-[#0C3B2B] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#27A163]" /> Colony Participation Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(event.participation).map(([colonyId, part]) => {
                    const c = INITIAL_TOPOLOGY.colonies.find((item) => item.id === colonyId);
                    const pct = Math.round((part.responded / Math.max(1, part.houses)) * 100);

                    return (
                      <div
                        key={colonyId}
                        className="p-3 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0] flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between text-xs">
                          <strong className="text-[#0C3B2B]">{c?.name || colonyId}</strong>
                          <span className="font-semibold text-[#13724A] tabular-nums">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                          <div className="h-full bg-[#27A163]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-[#5B6B62] tabular-nums">
                          {part.responded} of {part.houses} houses confirmed load delay
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completed Events History */}
      {pastEvents.length > 0 && (
        <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[#0C3B2B]">
            Completed Demand Response History
          </h2>
          <div className="divide-y divide-[#DDE9E0]/60 text-xs">
            {pastEvents.map((pe) => (
              <div key={pe.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#16241D]">{pe.message}</span>
                  <span className="text-[#5B6B62] ml-2 tabular-nums">({formatTime12h(pe.startsAt)})</span>
                </div>
                <span className="font-semibold text-[#13724A] tabular-nums">
                  {formatPower(pe.actualReductionKw)} achieved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
