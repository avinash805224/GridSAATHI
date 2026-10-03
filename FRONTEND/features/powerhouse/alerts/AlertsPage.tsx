import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { AlertComposer } from '../../../components/shared/AlertComposer';
import { AlertCard } from '../../../components/shared/AlertCard';
import { useAlertStore } from '../../../store/useAlertStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { weatherSim } from '../../../data/mock/weatherMock';
import { useGridStore } from '../../../store/useGridStore';
import { useDemandResponseStore } from '../../../store/useDemandResponseStore';
import { INITIAL_TOPOLOGY } from '../../../config/topology';
import { formatPower } from '../../../lib/format';
import { Cloud, Wind, Sun, Droplets, Zap, Wrench, Check, Sparkles, Send } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { RecommendationsFeed } from '../../ph/RecommendationsFeed';
import { DispatchLogTable } from '../../ph/DispatchLogTable';
import { DemandResponsePage } from '../demand-response/DemandResponsePage';
import { IssueResponseActions } from '../../../components/shared/IssueResponseActions';
import { AlertType } from '../../../domain/types';
import { getDictionary } from '../../../config/i18n';

type RiskLevel = 'red' | 'yellow' | 'green';

const riskStyles: Record<RiskLevel, { dot: string; text: string; label: string }> = {
  red: { dot: 'bg-[#C73E3A]', text: 'text-[#9E2824]', label: 'critical' },
  yellow: { dot: 'bg-[#E9A820]', text: 'text-[#785103]', label: 'watchStatus' },
  green: { dot: 'bg-[#27A163]', text: 'text-[#13724A]', label: 'normalStatus' },
};

export const AlertsPage: React.FC = () => {
  const { tab = 'weather' } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const alerts = useAlertStore((s) => s.alerts);
  const drafts = useAlertStore((s) => s.drafts);
  const publishAlert = useAlertStore((s) => s.publishAlert);
  const deleteDraft = useAlertStore((s) => s.deleteDraft);
  const feederReadings = useGridStore((s) => s.feederReadings);
  const feederStatuses = useGridStore((s) => s.feederStatuses);
  const simClock = useGridStore((s) => s.simClock);
  const events = useDemandResponseStore((s) => s.events);
  const language = useSessionStore((s) => s.language);
  const copy = getDictionary(language);

  const weather = weatherSim.getSnapshot(simClock);
  const activeResponseCount = events.filter((event) => event.status === 'active').length;
  const feederStatus = INITIAL_TOPOLOGY.feeders.map((feeder) => {
    const reading = feederReadings[feeder.id];
    const loadKw = reading ? reading.demandKw : feeder.capacityKw * 0.5;
    const loadPct = Math.round((loadKw / feeder.capacityKw) * 100);
    const liveStatus = feederStatuses[feeder.id] || 'stable';
    const status: RiskLevel =
      liveStatus === 'outage' || liveStatus === 'constrained' || loadPct >= 90
        ? 'red'
        : liveStatus === 'watch' || loadPct >= 80
        ? 'yellow'
        : 'green';
    const alertType: AlertType = liveStatus === 'outage'
      ? 'outage'
      : loadPct >= 80
      ? 'high_load'
      : liveStatus === 'constrained'
      ? 'demand_response'
      : 'high_load';
    const alertTitle = liveStatus === 'outage'
      ? `${feeder.name} Outage`
      : alertType === 'demand_response'
      ? `Demand Response Active: ${feeder.name}`
      : `${feeder.name} Overload Risk (${loadPct}%)`;
    const alertBody = liveStatus === 'outage'
      ? `A live outage is affecting ${feeder.name}. Dispatch a restoration update to its colonies.`
      : alertType === 'demand_response'
      ? `A scoped demand-response event is active for ${feeder.name}.`
      : `Live feeder load is ${formatPower(loadKw)} of ${formatPower(feeder.capacityKw)} capacity.`;
    return { ...feeder, loadKw, loadPct, status, alertType, alertTitle, alertBody };
  });
  const peakFeederPct = Math.max(...feederStatus.map((feeder) => feeder.loadPct));
  const peakFeeder = feederStatus.reduce((peak, feeder) => feeder.loadPct > peak.loadPct ? feeder : peak);
  const electricalRisk: RiskLevel = peakFeederPct >= 90 ? 'red' : peakFeederPct >= 80 ? 'yellow' : 'green';
  const weatherRisk: RiskLevel =
    weather.cloudCoverPct >= 80 || weather.windSpeedMs < 2.5
      ? 'red'
      : weather.cloudCoverPct >= 65 || weather.windSpeedMs < 3.5
      ? 'yellow'
      : 'green';
  const maintenanceAlerts = alerts.filter(
    (alert) => alert.status === 'active' && ['maintenance', 'system', 'outage'].includes(alert.type)
  );
  const maintenanceRisk: RiskLevel = maintenanceAlerts.some((alert) => alert.severity === 'critical')
    ? 'red'
    : maintenanceAlerts.length > 0
    ? 'yellow'
    : 'green';
  const riskLabel = (risk: RiskLevel) => copy[riskStyles[risk].label as keyof typeof copy];

  const tabList = [
    {
      id: 'weather',
      label: copy.weatherIntermittency,
      count: drafts.filter((d) => d.type === 'weather').length,
    },
    {
      id: 'high-load',
      label: copy.highLoadOverload,
      count: drafts.filter((d) => d.type === 'high_load').length,
    },
    {
      id: 'recommendations',
      label: language === 'hi' ? 'एमएल अनुशंसाएं' : 'ML Recommendations',
    },
    {
      id: 'dispatch',
      label: language === 'hi' ? 'फोन डिलीवरी लॉग' : 'Phone Dispatch Log',
    },
    { id: 'response', label: copy.responseTab, count: activeResponseCount },
    {
      id: 'system',
      label: copy.systemAndMaintenance,
      count: drafts.filter((d) => d.type === 'maintenance' || d.type === 'system').length,
    },
  ];

  const handleTabChange = (t: string) => {
    navigate(`/powerhouse/alerts/${t}`);
  };

  const handlePublishDraft = (draft: any) => {
    publishAlert(draft);
    deleteDraft(draft.id);
    showToast({
      type: 'success',
      title: 'Draft Published',
      message: `${draft.title} is now active across public feeds and SMS.`,
    });
  };

  // Filter published alerts by active tab category
  const filteredAlerts = alerts.filter((a) => {
    if (tab === 'weather') return a.type === 'weather';
    if (tab === 'high-load') return a.type === 'high_load' || a.type === 'demand_response';
    if (tab === 'response') return a.type === 'demand_response';
    return a.type === 'maintenance' || a.type === 'system' || a.type === 'outage';
  });

  // Filter drafts by tab
  const tabDrafts = drafts.filter((d) => {
    if (tab === 'weather') return d.type === 'weather';
    if (tab === 'high-load') return d.type === 'high_load';
    if (tab === 'response') return d.type === 'demand_response';
    return d.type === 'maintenance' || d.type === 'system';
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          {copy.alertCenterTitle}
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          {copy.alertCenterDescription}
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabList} activeTab={tab} onChange={handleTabChange} />

      {/* Tab: ML Recommendations */}
      {tab === 'recommendations' && <RecommendationsFeed />}

      {/* Tab: Phone Dispatch Log */}
      {tab === 'dispatch' && <DispatchLogTable />}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">{copy.affectedAreaStatus}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {feederStatus.map((feeder) => {
            const style = riskStyles[feeder.status];
            return (
              <div key={feeder.id} className="p-3 bg-white border border-[#DDE9E0] rounded-[8px] flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#0C3B2B] truncate">{feeder.name}</p>
                    <p className="text-[11px] text-[#5B6B62] tabular-nums">{formatPower(feeder.loadKw)} / {formatPower(feeder.capacityKw)}</p>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1.5 text-[11px] font-semibold ${style.text}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot} animate-pulse`} />
                    {feeder.loadPct}%
                  </span>
                </div>
                {feeder.status !== 'green' && (
                  <IssueResponseActions
                    title={feeder.alertTitle}
                    body={feeder.alertBody}
                    type={feeder.alertType}
                    severity={feeder.status === 'red' ? 'critical' : 'warning'}
                    scope={{ level: 'feeder', ids: [feeder.id] }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B]">{copy.triggerReasons}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              label: copy.electricalOverload,
              detail: language === 'hi' ? `अधिकतम फीडर लोड ${peakFeederPct}%` : `Peak feeder load ${peakFeederPct}%`,
              risk: electricalRisk,
              type: 'high_load' as const,
              scope: { level: 'feeder' as const, ids: [peakFeeder.id] },
              alertTitle: `${peakFeeder.name} Overload Risk (${peakFeederPct}%)`,
              alertBody: `Peak feeder load reached ${peakFeederPct}% of rated capacity.`,
              icon: <Zap className="w-4 h-4" />,
            },
            {
              label: copy.weatherStatus,
              detail: language === 'hi'
                ? `बादल ${Math.round(weather.cloudCoverPct)}% · हवा ${weather.windSpeedMs.toFixed(1)} m/s`
                : `Cloud ${Math.round(weather.cloudCoverPct)}% · wind ${weather.windSpeedMs.toFixed(1)} m/s`,
              risk: weatherRisk,
              type: 'weather' as const,
              scope: { level: 'powerhouse' as const, ids: ['ph-pragati'] },
              alertTitle: 'Weather Trigger Risk',
              alertBody: `Cloud cover is ${Math.round(weather.cloudCoverPct)}%; wind speed is ${weather.windSpeedMs.toFixed(1)} m/s.`,
              icon: <Cloud className="w-4 h-4" />,
            },
            {
              label: copy.systemMaintenance,
              detail: language === 'hi'
                ? `${maintenanceAlerts.length} सक्रिय सिस्टम अलर्ट`
                : `${maintenanceAlerts.length} active system alerts`,
              risk: maintenanceRisk,
              type: 'maintenance' as const,
              scope: maintenanceAlerts[0]?.scope || { level: 'powerhouse' as const, ids: ['ph-pragati'] },
              alertTitle: 'System Maintenance Alert',
              alertBody: maintenanceAlerts[0]?.body || 'Review system maintenance and outage conditions.',
              icon: <Wrench className="w-4 h-4" />,
            },
          ].map((reason) => {
            const style = riskStyles[reason.risk];
            return (
              <div key={reason.label} className="p-3.5 bg-white border border-[#DDE9E0] rounded-[8px] flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-semibold text-[#0C3B2B] flex items-center gap-1.5">{reason.icon}{reason.label}</h3>
                    <p className="text-[11px] text-[#5B6B62] mt-1">{reason.detail}</p>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase ${style.text}`}>
                    <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />{riskLabel(reason.risk)}
                  </span>
                </div>
                {reason.risk !== 'green' && (
                  <IssueResponseActions
                    title={reason.alertTitle}
                    body={reason.alertBody}
                    type={reason.type}
                    severity={reason.risk === 'red' ? 'critical' : 'warning'}
                    scope={reason.scope}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Tab 1: Weather & Intermittency Snapshot */}
      {tab === 'weather' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#FEF7E6] text-[#B07B0E]">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Cloud Cover</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {Math.round(weather.cloudCoverPct)}%
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#F2F7FD] text-[#1B93A1]">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Wind Speed</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {weather.windSpeedMs.toFixed(1)} <span className="text-xs font-normal">m/s</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#FEFAF2] text-[#E9A820]">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Solar UV Index</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {weather.uvIndex}
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#EAF7EE] text-[#13724A]">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-[#5B6B62]">Temperature</span>
              <p className="text-xl font-bold font-heading text-[#0C3B2B] tabular-nums">
                {weather.tempC.toFixed(1)}°C
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: High Load Snapshot */}
      {tab === 'high-load' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {INITIAL_TOPOLOGY.feeders.slice(0, 4).map((f) => {
            const r = feederReadings[f.id];
            const loadKw = r ? r.demandKw : f.capacityKw * 0.5;
            const pct = Math.round((loadKw / f.capacityKw) * 100);

            return (
              <div key={f.id} className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0C3B2B] truncate">{f.name}</span>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      pct > 90 ? 'text-[#C73E3A]' : pct >= 80 ? 'text-[#E9A820]' : 'text-[#27A163]'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#EAF7EE] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      pct > 90 ? 'bg-[#C73E3A]' : pct >= 80 ? 'bg-[#E9A820]' : 'bg-[#27A163]'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#5B6B62]">
                  <span>Load: {formatPower(loadKw)}</span>
                  <span>Cap: {formatPower(f.capacityKw)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-Drafted Alerts Section */}
      {tab !== 'response' && tabDrafts.length > 0 && (
        <div className="bg-[#FEFAF2] border border-[#F8D288] rounded-[12px] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#785103] uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#E9A820]" /> {copy.draftAlerts} ({tabDrafts.length})
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {tabDrafts.map((draft) => (
              <div
                key={draft.id}
                className="p-3.5 bg-white border border-[#F8D288] rounded-[8px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <h4 className="text-xs font-bold text-[#0C3B2B]">{draft.title}</h4>
                  <p className="text-xs text-[#5B6B62] mt-0.5">{draft.body}</p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Check className="w-3.5 h-3.5" />}
                    onClick={() => handlePublishDraft(draft)}
                  >
                    {copy.approvePublish}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteDraft(draft.id)}
                  >
                    {copy.dismiss}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert Composer */}
      {tab === 'response' ? (
        <DemandResponsePage />
      ) : (
        <AlertComposer
          initialType={tab === 'weather' ? 'weather' : tab === 'high-load' ? 'high_load' : 'maintenance'}
        />
      )}

      {/* Published Alerts Feed */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-[#0C3B2B]">
          {copy.activePublishedAnnouncements} ({filteredAlerts.length})
        </h3>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B62] bg-white rounded-[12px] border border-dashed border-[#DDE9E0]">
            {language === 'hi'
              ? copy.noPublishedAlerts
              : `${copy.noPublishedAlerts} Weather and load triggers will appear here when thresholds are crossed.`}
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
};
