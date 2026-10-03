import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
} from 'recharts';
import { ScopePicker, ScopeValue } from '../../../components/shared/ScopePicker';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Button } from '../../../components/ui/Button';
import { StatusPill } from '../../../components/ui/StatusPill';
import { forecastProvider } from '../../../data/mock/forecastMock';
import { ForecastPoint, ShortfallWindow } from '../../../domain/types';
import { formatPower } from '../../../lib/format';
import { formatTime12h } from '../../../lib/time';
import { useNow } from '../../../hooks/useNow';
import { Bell, Radio, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ForecastingPage: React.FC = () => {
  const navigate = useNavigate();
  const { now } = useNow();

  const [scope, setScope] = useState<ScopeValue>({
    level: 'powerhouse',
    id: 'ph-pragati',
  });
  const [horizon, setHorizon] = useState<'6' | '24' | '168'>('24');
  const [points, setPoints] = useState<ForecastPoint[]>([]);
  const [shortfalls, setShortfalls] = useState<ShortfallWindow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      const hHours = parseInt(horizon, 10);
      const [pts, sfs] = await Promise.all([
        forecastProvider.demand(scope, hHours, now),
        forecastProvider.shortfalls(scope, hHours, now),
      ]);

      if (mounted) {
        setPoints(pts);
        setShortfalls(sfs);
        setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [scope, horizon, now]);

  const chartData = points.map((p) => ({
    ...p,
    timeLabel: formatTime12h(p.ts),
    confidenceBand: [p.demandP10, p.demandP90],
  }));

  // Plain language summary
  let plainSummary = 'Supply is predicted to comfortably match demand across all feeders.';
  if (shortfalls.length > 0) {
    const worst = [...shortfalls].sort((a, b) => b.peakShortfallKw - a.peakShortfallKw)[0];
    const startStr = formatTime12h(worst.start);
    const endStr = formatTime12h(worst.end);
    const causeText =
      worst.cause === 'low_solar'
        ? 'cloud-induced solar suppression'
        : worst.cause === 'evening_peak'
        ? 'evening residential peak with zero solar'
        : 'combined low renewable generation';
    plainSummary = `Expect a ${formatPower(worst.peakShortfallKw)} shortfall between ${startStr} and ${endStr} due to ${causeText}. Consider initiating demand response for affected colonies.`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
            Predictive Load & Renewable Generation Forecasting
          </h1>
          <p className="text-xs text-[#5B6B62] mt-1">
            Simulated multi-horizon ML predictions with p10–p90 confidence bands and automated intermittency shortfall detection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ScopePicker value={scope} onChange={setScope} />
          <SegmentedControl
            options={[
              { value: '6', label: '6 Hours' },
              { value: '24', label: '24 Hours' },
              { value: '168', label: '7 Days' },
            ]}
            value={horizon}
            onChange={(val) => setHorizon(val as any)}
            size="sm"
          />
        </div>
      </div>

      {/* Plain Language Summary Banner */}
      <div className="p-4 bg-white border border-[#DDE9E0] rounded-[12px] flex items-start gap-3.5 shadow-sm">
        {shortfalls.length > 0 ? (
          <AlertTriangle className="w-5 h-5 text-[#E2702B] shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-[#27A163] shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <h2 className="text-xs font-semibold text-[#0C3B2B] uppercase tracking-wide">
            Automated Forecasting Summary
          </h2>
          <p className="text-xs text-[#16241D] mt-1 leading-relaxed">{plainSummary}</p>
        </div>
      </div>

      {/* Chart 1: Demand Forecast with p10–p90 Confidence Band */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#0C3B2B]">
              Demand Forecast & Uncertainty Band (p10 – p90)
            </h3>
            <p className="text-xs text-[#5B6B62]">
              Expected load curve with expanding confidence interval over the {horizon}-hour horizon
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#5B6B62]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0C3B2B]" /> Expected Demand
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-[#0C3B2B]/15" /> p10–p90 Confidence
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="pBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0C3B2B" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#0C3B2B" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timeLabel" tickLine={false} tick={{ fill: '#5B6B62', fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#5B6B62', fontSize: 11 }}
                tickFormatter={(v) => formatPower(v, 0)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as ForecastPoint;
                    return (
                      <div className="bg-white border border-[#DDE9E0] p-3 rounded-[8px] shadow-floating text-xs">
                        <div className="font-semibold text-[#0C3B2B] mb-1">{formatTime12h(pt.ts)}</div>
                        <div className="flex flex-col gap-0.5 tabular-nums">
                          <div>Expected: <strong>{formatPower(pt.demandKw)}</strong></div>
                          <div className="text-[#5B6B62]">p10 (Lower): {formatPower(pt.demandP10)}</div>
                          <div className="text-[#5B6B62]">p90 (Upper): {formatPower(pt.demandP90)}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="demandP90"
                stroke="none"
                fill="url(#pBand)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="demandKw"
                stroke="#0C3B2B"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Renewable Generation (Solar + Wind) with Demand Overlay */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#0C3B2B]">
              Solar & Wind Generation vs. Demand Overlay
            </h3>
            <p className="text-xs text-[#5B6B62]">
              The gap between renewable supply and total demand highlights the intermittency risk
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#5B6B62]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E9A820]" /> Solar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B93A1]" /> Wind
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0C3B2B]" /> Demand
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="solarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E9A820" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#E9A820" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B93A1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1B93A1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timeLabel" tickLine={false} tick={{ fill: '#5B6B62', fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#5B6B62', fontSize: 11 }}
                tickFormatter={(v) => formatPower(v, 0)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pt = payload[0].payload as ForecastPoint;
                    return (
                      <div className="bg-white border border-[#DDE9E0] p-3 rounded-[8px] shadow-floating text-xs">
                        <div className="font-semibold text-[#0C3B2B] mb-1">{formatTime12h(pt.ts)}</div>
                        <div className="flex flex-col gap-0.5 tabular-nums">
                          <div className="text-[#E9A820] font-medium">Solar: {formatPower(pt.solarKw)}</div>
                          <div className="text-[#1B93A1] font-medium">Wind: {formatPower(pt.windKw)}</div>
                          <div className="text-[#27A163] font-semibold">Total Green: {formatPower(pt.renewableKw)}</div>
                          <div className="text-[#0C3B2B] font-semibold pt-1 border-t border-[#DDE9E0]">Demand: {formatPower(pt.demandKw)}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="solarKw"
                stroke="#E9A820"
                strokeWidth={1.5}
                fill="url(#solarFill)"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="windKw"
                stroke="#1B93A1"
                strokeWidth={1.5}
                fill="url(#windFill)"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="demandKw"
                stroke="#0C3B2B"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shortfall Windows List & Direct Action Triggers */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0C3B2B]">
            Predicted Renewable Shortfall Windows
          </h3>
          <p className="text-xs text-[#5B6B62]">
            Windows where total generation is insufficient to maintain buffer margins
          </p>
        </div>

        {shortfalls.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5B6B62] border border-dashed border-[#DDE9E0] rounded-[8px]">
            No critical shortfall windows identified for this horizon and scope.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shortfalls.map((sf) => (
              <div
                key={sf.id}
                className="p-4 rounded-[8px] border border-[#F5AC7B] bg-[#FDF1E9]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0C3B2B] tabular-nums">
                      {formatTime12h(sf.start)} – {formatTime12h(sf.end)}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#FCD8C1] text-[#7A320A] uppercase">
                      {sf.cause.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#5B6B62]">
                      ({Math.round(sf.confidence * 100)}% Confidence)
                    </span>
                  </div>
                  <p className="text-xs text-[#16241D]">
                    Projected Peak Shortfall: <strong className="text-[#9E2824] tabular-nums">{formatPower(sf.peakShortfallKw)}</strong> · Affects {sf.affectedColonyIds.length} colonies
                  </p>
                </div>

                {/* Deep-link Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Bell className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/powerhouse/alerts/weather')}
                  >
                    Create Alert
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Radio className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/powerhouse/demand-response')}
                  >
                    Plan DR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
