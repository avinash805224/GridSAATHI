import React, { useState } from 'react';
import { GridAsset, AssetType } from '../../../domain/types';
import { Button } from '../../../components/ui/Button';
import { StatusPill } from '../../../components/ui/StatusPill';
import { formatPower } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import { useToast } from '../../../components/ui/Toast';
import {
  Wrench,
  AlertOctagon,
  Flame,
  Activity,
  Layers,
  CheckCircle2,
  Calendar,
  Cable,
  Zap,
  TrendingDown,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

const INITIAL_ASSETS: GridAsset[] = [
  {
    id: 'tx-shanti-01',
    name: 'Distribution Transformer DT-01 (Shanti Vihar)',
    type: 'transformer',
    areaId: 'area-north',
    feederId: 'feeder-shanti',
    colonyId: 'colony-shanti-vihar',
    installedYear: 2018,
    designLifeYears: 25,
    remainingUsefulLifeYears: 4.8,
    healthIndexPct: 42,
    status: 'critical',
    ratedCapacityKva: 630,
    diagnostics: {
      coreTemperatureC: 93.8,
      ambientTemperatureC: 32.5,
      insulationResistanceMegaOhms: 12.4,
      dissolvedGasHydrogenPpm: 210,
      dissolvedGasAcetylenePpm: 142,
      neutralCurrentAmps: 18.2,
      infraredHotspotTempC: 98.4,
      lossPct: 4.8,
    },
    lastInspectedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    nextScheduledMaintenanceAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    criticalIssue: 'Internal winding thermal hotspot (93.8°C) & high Acetylene trace in oil (142 ppm). Winding insulation degradation detected. Immediate oil filtration & cooling radiator check required.',
  },
  {
    id: 'cable-kisan-02',
    name: '11kV Feeder Cable Segment K-02 (Kisan Nagar)',
    type: 'underground_cable',
    areaId: 'area-north',
    feederId: 'feeder-kisan',
    colonyId: 'colony-kisan-4',
    installedYear: 2012,
    designLifeYears: 30,
    remainingUsefulLifeYears: 2.1,
    healthIndexPct: 38,
    status: 'critical',
    cableLengthMeters: 850,
    cableSpec: '3C × 300 sq.mm XLPE Insulated Aluminum Armoured',
    diagnostics: {
      ambientTemperatureC: 31.0,
      insulationResistanceMegaOhms: 1.7,
      infraredHotspotTempC: 78.5,
      lossPct: 5.6,
    },
    lastInspectedAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    nextScheduledMaintenanceAt: Date.now() + 5 * 24 * 60 * 60 * 1000,
    criticalIssue: 'Insulation Resistance degraded to 1.7 MΩ (Critical limit < 5 MΩ). Moisture ingress at joint #3 causing high dielectric leakage loss. Cable splice replacement required.',
  },
  {
    id: 'tx-mayur-02',
    name: 'Distribution Transformer DT-02 (Mayur Vihar A)',
    type: 'transformer',
    areaId: 'area-central',
    feederId: 'feeder-mayur',
    colonyId: 'colony-mayur-a',
    installedYear: 2021,
    designLifeYears: 25,
    remainingUsefulLifeYears: 19.5,
    healthIndexPct: 88,
    status: 'optimal',
    ratedCapacityKva: 800,
    diagnostics: {
      coreTemperatureC: 68.2,
      ambientTemperatureC: 32.0,
      insulationResistanceMegaOhms: 84.0,
      dissolvedGasHydrogenPpm: 18,
      dissolvedGasAcetylenePpm: 0,
      neutralCurrentAmps: 4.1,
      infraredHotspotTempC: 71.0,
      lossPct: 1.8,
    },
    lastInspectedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    nextScheduledMaintenanceAt: Date.now() + 120 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tx-nehru-03',
    name: 'Substation Transformer DT-03 (Nehru Enclave)',
    type: 'transformer',
    areaId: 'area-central',
    feederId: 'feeder-nehru',
    colonyId: 'colony-nehru-east',
    installedYear: 2016,
    designLifeYears: 25,
    remainingUsefulLifeYears: 11.2,
    healthIndexPct: 69,
    status: 'monitoring',
    ratedCapacityKva: 630,
    diagnostics: {
      coreTemperatureC: 81.4,
      ambientTemperatureC: 32.5,
      insulationResistanceMegaOhms: 32.0,
      dissolvedGasHydrogenPpm: 68,
      dissolvedGasAcetylenePpm: 4,
      neutralCurrentAmps: 9.8,
      infraredHotspotTempC: 84.0,
      lossPct: 2.9,
    },
    lastInspectedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    nextScheduledMaintenanceAt: Date.now() + 25 * 24 * 60 * 60 * 1000,
    criticalIssue: 'Moderate neutral current unbalance (9.8A). Recommended phase rebalancing during upcoming maintenance cycle.',
  },
  {
    id: 'cable-surya-01',
    name: 'Overhead Conductor Span S-01 (Surya Nagar Solar Link)',
    type: 'overhead_conductor',
    areaId: 'area-east',
    feederId: 'feeder-surya',
    colonyId: 'colony-surya-c',
    installedYear: 2019,
    designLifeYears: 30,
    remainingUsefulLifeYears: 22.0,
    healthIndexPct: 91,
    status: 'optimal',
    cableLengthMeters: 1200,
    cableSpec: 'ACSR 100 sq.mm Dog Conductor',
    diagnostics: {
      ambientTemperatureC: 33.0,
      infraredHotspotTempC: 56.0,
      lossPct: 1.4,
    },
    lastInspectedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    nextScheduledMaintenanceAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'tx-rajiv-04',
    name: 'Distribution Transformer DT-04 (Rajiv Awas)',
    type: 'transformer',
    areaId: 'area-periurban',
    feederId: 'feeder-rajiv',
    colonyId: 'colony-rajiv-awas',
    installedYear: 2015,
    designLifeYears: 25,
    remainingUsefulLifeYears: 7.4,
    healthIndexPct: 58,
    status: 'monitoring',
    ratedCapacityKva: 500,
    diagnostics: {
      coreTemperatureC: 84.1,
      ambientTemperatureC: 33.5,
      insulationResistanceMegaOhms: 24.5,
      dissolvedGasHydrogenPpm: 84,
      dissolvedGasAcetylenePpm: 6,
      neutralCurrentAmps: 11.2,
      infraredHotspotTempC: 87.2,
      lossPct: 3.4,
    },
    lastInspectedAt: Date.now() - 40 * 24 * 60 * 60 * 1000,
    nextScheduledMaintenanceAt: Date.now() + 18 * 24 * 60 * 60 * 1000,
    criticalIssue: 'Silica gel breather saturated; moisture level in oil rising. Replace breather desiccant and test breakdown voltage (BDV).',
  },
];

export const TechnicalLossPage: React.FC = () => {
  const { showToast } = useToast();
  const [assets, setAssets] = useState<GridAsset[]>(INITIAL_ASSETS);
  const [filterType, setFilterType] = useState<string>('all');

  // Overall Technical Loss Calculation
  const totalLossPct = parseFloat(
    (assets.reduce((sum, a) => sum + a.diagnostics.lossPct, 0) / assets.length).toFixed(1)
  );

  const criticalAssets = assets.filter((a) => a.status === 'critical');
  const monitoringAssets = assets.filter((a) => a.status === 'monitoring');

  const handleScheduleMaintenance = (asset: GridAsset) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === asset.id
          ? {
              ...a,
              status: 'monitoring',
              healthIndexPct: Math.min(95, a.healthIndexPct + 35),
              remainingUsefulLifeYears: parseFloat((a.remainingUsefulLifeYears + 6.5).toFixed(1)),
              diagnostics: {
                ...a.diagnostics,
                coreTemperatureC: 69.5,
                insulationResistanceMegaOhms: 55.0,
                infraredHotspotTempC: 68.0,
                lossPct: parseFloat((a.diagnostics.lossPct * 0.45).toFixed(1)),
              },
              criticalIssue: undefined,
              lastInspectedAt: Date.now(),
            }
          : a
      )
    );

    showToast({
      type: 'success',
      title: 'Work Order Dispatched & Asset Serviced',
      message: `${asset.name} has been refreshed. Technical loss reduced by 55%.`,
    });
  };

  const handleResetAssets = () => {
    setAssets(INITIAL_ASSETS);
    showToast({
      type: 'info',
      title: 'Asset Diagnostics Reset',
      message: 'Original thermal and insulation baseline restored.',
    });
  };

  const filteredAssets = filterType === 'all'
    ? assets
    : assets.filter((a) => a.type === filterType);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[6px] bg-[#EAF7EE] text-[#13724A]">
              <Wrench className="w-5 h-5 text-[#27A163]" />
            </span>
            <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
              Technical Loss & Asset Health Management
            </h1>
          </div>
          <p className="text-xs text-[#5B6B62] mt-1">
            Predictive transformer & cable maintenance, thermal degradation sensors, remaining useful life (RUL), and technical loss mitigation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={handleResetAssets}>
            Reset Diagnostic Baseline
          </Button>
        </div>
      </div>

      {/* Technical Loss KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#0C3B2B]" /> System Technical Loss
          </span>
          <div className="my-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {totalLossPct}%
            </span>
            <span className="text-xs font-semibold text-[#13724A]">
              (DISCOM Target: &lt;7%)
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            Down from 11.2% before predictive maintenance
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-[#C73E3A]" /> Critical Failure Risk
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#9E2824] tabular-nums">
              {criticalAssets.length} Assets
            </span>
          </div>
          <span className="text-[11px] text-[#C73E3A] font-medium">
            Overheating or degraded insulation detected
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-[#27A163]" /> Monthly Technical Loss Cost
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#13724A] tabular-nums">
              ₹7.8 Lakhs
            </span>
            <span className="text-xs text-[#5B6B62] ml-1">/ month</span>
          </div>
          <span className="text-[11px] text-[#27A163] font-medium">
            ₹2.4 Lakhs saved via loss mitigation
          </span>
        </div>

        <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex flex-col justify-between">
          <span className="text-xs text-[#5B6B62] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#27A163]" /> Fleet Average Health Index
          </span>
          <div className="my-1">
            <span className="text-3xl font-bold font-heading text-[#0C3B2B] tabular-nums">
              {Math.round(assets.reduce((sum, a) => sum + a.healthIndexPct, 0) / assets.length)}%
            </span>
          </div>
          <span className="text-[11px] text-[#5B6B62]">
            Across {assets.length} core transformers and 11kV spans
          </span>
        </div>
      </div>

      {/* Critical Maintenance Alerts (Transformer & Wiring Cables flagged for repair/replacement) */}
      {criticalAssets.length > 0 && (
        <div className="p-5 bg-[#FCEEED] border border-[#ECA3A0] rounded-[16px] flex flex-col gap-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#9E2824] uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#C73E3A]" /> Urgent Replacement & Overhaul Warnings ({criticalAssets.length} Assets Degraded)
            </h2>
            <span className="text-[11px] text-[#9E2824] font-medium">
              High risk of thermal breakdown, transformer tripping, or cable fault
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {criticalAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-4 bg-white border border-[#ECA3A0] rounded-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-[#0C3B2B]">{asset.name}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FCEEED] text-[#9E2824]">
                      HEALTH INDEX: {asset.healthIndexPct}%
                    </span>
                    <span className="text-xs text-[#5B6B62]">
                      (RUL: {asset.remainingUsefulLifeYears} Years Remaining)
                    </span>
                  </div>

                  <p className="text-xs text-[#9E2824] mt-1.5 leading-relaxed font-medium">
                    ⚠️ {asset.criticalIssue}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#5B6B62] mt-2 pt-2 border-t border-[#DDE9E0]/60">
                    {asset.diagnostics.coreTemperatureC && (
                      <span>Core Temp: <strong className="text-[#C73E3A] tabular-nums">{asset.diagnostics.coreTemperatureC}°C</strong> (Max: 85°C)</span>
                    )}
                    {asset.diagnostics.insulationResistanceMegaOhms && (
                      <span>Cable IR: <strong className="text-[#C73E3A] tabular-nums">{asset.diagnostics.insulationResistanceMegaOhms} MΩ</strong> (Min: 5 MΩ)</span>
                    )}
                    {asset.diagnostics.dissolvedGasAcetylenePpm !== undefined && (
                      <span>Oil Acetylene DGA: <strong className="text-[#C73E3A] tabular-nums">{asset.diagnostics.dissolvedGasAcetylenePpm} ppm</strong></span>
                    )}
                    <span>Line Loss on Element: <strong className="text-[#0C3B2B] tabular-nums">{asset.diagnostics.lossPct}%</strong></span>
                  </div>
                </div>

                <div className="self-end sm:self-center shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Wrench className="w-3.5 h-3.5" />}
                    onClick={() => handleScheduleMaintenance(asset)}
                  >
                    Execute Servicing / Reconductor
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset Health Registry Table */}
      <div className="bg-white rounded-[16px] border border-[#DDE9E0] p-6 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0C3B2B]">
              Grid Asset Lifeline & Diagnostic Sensor Registry
            </h2>
            <p className="text-xs text-[#5B6B62]">
              Real-time monitoring of distribution transformers (DTs), 11kV underground cables, and overhead conductors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5B6B62]">Filter Asset Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Asset Types</option>
              <option value="transformer">Transformers (DTs)</option>
              <option value="underground_cable">Underground Cables</option>
              <option value="overhead_conductor">Overhead Conductors</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#DDE9E0] text-[#5B6B62]">
              <tr>
                <th className="py-3 font-medium">Asset Name & Type</th>
                <th className="py-3 font-medium">Operating Age</th>
                <th className="py-3 font-medium text-center w-32">Health Index</th>
                <th className="py-3 font-medium text-right">Core / Hotspot Temp</th>
                <th className="py-3 font-medium text-right">Insulation / DGA</th>
                <th className="py-3 font-medium text-right">Technical Loss</th>
                <th className="py-3 font-medium text-right">Maintenance Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE9E0]/60">
              {filteredAssets.map((asset) => {
                const ageYears = 2026 - asset.installedYear;
                return (
                  <tr key={asset.id} className="hover:bg-[#F5FAF6] transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-[#0C3B2B]">{asset.name}</div>
                      <div className="text-[10px] text-[#5B6B62]">
                        {asset.ratedCapacityKva ? `${asset.ratedCapacityKva} kVA Transformer` : asset.cableSpec}
                      </div>
                    </td>
                    <td className="py-3 text-[#5B6B62] tabular-nums">
                      {ageYears} yrs ({asset.installedYear})
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#EAF7EE] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              asset.healthIndexPct < 45
                                ? 'bg-[#C73E3A]'
                                : asset.healthIndexPct < 70
                                ? 'bg-[#E9A820]'
                                : 'bg-[#27A163]'
                            }`}
                            style={{ width: `${asset.healthIndexPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold tabular-nums w-8 text-right text-[#0C3B2B]">
                          {asset.healthIndexPct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums font-medium">
                      <span
                        className={
                          (asset.diagnostics.coreTemperatureC || 0) > 88 || (asset.diagnostics.infraredHotspotTempC || 0) > 88
                            ? 'text-[#C73E3A] font-bold'
                            : 'text-[#0C3B2B]'
                        }
                      >
                        {asset.diagnostics.coreTemperatureC ? `${asset.diagnostics.coreTemperatureC}°C` : `${asset.diagnostics.infraredHotspotTempC}°C`}
                      </span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-[#5B6B62]">
                      {asset.diagnostics.insulationResistanceMegaOhms ? (
                        <span className={asset.diagnostics.insulationResistanceMegaOhms < 5 ? 'text-[#C73E3A] font-bold' : ''}>
                          {asset.diagnostics.insulationResistanceMegaOhms} MΩ
                        </span>
                      ) : (
                        <span>{asset.diagnostics.dissolvedGasHydrogenPpm} ppm H₂</span>
                      )}
                    </td>
                    <td className="py-3 text-right tabular-nums font-bold text-[#0C3B2B]">
                      {asset.diagnostics.lossPct}%
                    </td>
                    <td className="py-3 text-right">
                      {asset.status === 'critical' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleScheduleMaintenance(asset)}
                        >
                          Service Now
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleScheduleMaintenance(asset)}
                        >
                          Inspection Log
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
