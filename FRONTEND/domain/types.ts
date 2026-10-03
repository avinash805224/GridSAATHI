export type Severity = 'info' | 'advisory' | 'warning' | 'critical';
export type SupplyStatus = 'stable' | 'watch' | 'constrained' | 'outage';
export type AlertType = 'weather' | 'high_load' | 'system' | 'maintenance' | 'demand_response' | 'storage' | 'outage';
export type AlertChannel = 'app' | 'sms' | 'banner' | 'email' | 'whatsapp';
export type NodeLevel = 'powerhouse' | 'area' | 'feeder' | 'colony' | 'house';

export interface Area {
  id: string;
  name: string;
  feederIds: string[];
}

export interface Feeder {
  id: string;
  name: string;
  areaId: string;
  capacityKw: number;
  colonyIds: string[];
}

export interface Colony {
  id: string;
  name: string;
  areaId: string;
  feederId: string;
  houseCount: number;
  batteryId?: string;
  autoConsentBackup: boolean;
}

export interface Appliance {
  id: string;
  name: string;
  category: 'cooling' | 'heating' | 'lighting' | 'cooking' | 'water' | 'entertainment' | 'cold_chain' | 'other';
  ratedKw: number;
  heavy: boolean;
  deferrable: boolean;
}

export interface House {
  id: string;
  colonyId: string;
  label: string;
  occupants: number;
  sanctionedLoadKw: number;
  appliances: Appliance[];
}

export interface Reading {
  ts: number;                 // epoch ms
  demandKw: number;
  supplyKw: number;           // grid import + local renewables + battery
  solarKw: number;
  windKw: number;
  gridImportKw: number;
  batteryKw: number;          // + discharging, - charging
  voltageV: number;           // nominal 230 single-phase
  frequencyHz: number;        // nominal 50
}

export interface ForecastPoint {
  ts: number;
  demandKw: number;
  demandP10: number;
  demandP90: number;
  solarKw: number;
  windKw: number;
  renewableKw: number;
  availableSupplyKw: number;
  shortfallKw: number;        // max(0, demand - availableSupply)
  status: SupplyStatus;
  confidence: number;         // 0..1
}

export interface ShortfallWindow {
  id: string;
  scopeLevel: NodeLevel;
  scopeId: string;
  start: number;
  end: number;
  peakShortfallKw: number;
  cause: 'low_solar' | 'low_wind' | 'evening_peak' | 'heat_demand' | 'maintenance' | 'combined';
  confidence: number;
  affectedColonyIds: string[];
}

export interface WeatherSnapshot {
  ts: number;
  cloudCoverPct: number;
  windSpeedMs: number;
  tempC: number;
  rainMm: number;
  uvIndex: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: Severity;
  title: string;
  body: string;
  bodyHi?: string;
  scope: { level: NodeLevel; ids: string[] };
  startsAt: number;
  endsAt?: number;
  source: 'auto' | 'operator';
  status: 'draft' | 'scheduled' | 'active' | 'resolved';
  channels: AlertChannel[];
  createdAt: number;
  publishedAt?: number;
}

export interface Message {
  id: string;
  alertId?: string;
  colonyId: string;
  text: string;
  ts: number;
  read: boolean;
  channel: 'sms' | 'app';
}

export interface DemandResponseEvent {
  id: string;
  scope: { level: NodeLevel; ids: string[] };
  startsAt: number;
  endsAt: number;
  severity: 'request' | 'strong_request';
  targetReductionKw: number;
  avoidAppliances: string[];
  message: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  actualReductionKw: number;
  participation: Record<string /* colonyId */, { houses: number; responded: number }>;
}

export interface Battery {
  id: string;
  colonyId: string;
  capacityKwh: number;
  socPct: number;
  healthPct: number;
  mode: 'idle' | 'charging' | 'discharging' | 'emergency';
  maxDischargeKw: number;
  circuits: string[];     // e.g. ['Emergency lighting', 'Water pumps', 'Community clinic fridge']
}

export interface BackupRequest {
  id: string;
  colonyId: string;
  requestedAt: number;
  reason: 'blackout' | 'pre_cut' | 'other';
  status: 'pending' | 'approved' | 'denied' | 'active' | 'ended';
  approvedBy?: string;
  maxMinutes?: number;
  endedAt?: number;
}

export interface PreCutNotice {
  id: string;
  colonyId: string;
  cutAt: number;
  expectedMinutes: number;
  reason: string;
  consent: 'waiting' | 'auto_consented' | 'consented' | 'declined';
  backupActivated: boolean;
}

export interface Outage {
  id: string;
  colonyId: string;
  feederId: string;
  startedAt: number;
  restoredAt?: number;
  etaAt?: number;
  cause: 'fault' | 'planned' | 'load_shedding' | 'weather' | 'unknown';
}

export interface Topology {
  powerHouse: {
    id: string;
    name: string;
    capacityKw: number;
  };
  areas: Area[];
  feeders: Feeder[];
  colonies: Colony[];
}

export type UserRole = 'operator' | 'public';

// Atmospheric & Satellite ML Predictor
export interface SatelliteAtmosphericData {
  ts: number;
  windSpeed10m: number;      // m/s
  windSpeed50m: number;      // hub-height m/s
  windSpeed100m: number;     // upper boundary m/s
  windDirectionDeg: number;   // 0-360 degrees azimuth
  windGustMs: number;
  cloudOpacityPct: number;    // 0-100% from GOES/INSAT satellite optical depth
  cloudMotionVector: { speedKmH: number; azimuthDeg: number };
  directNormalIrradianceDni: number; // W/m²
  globalHorizontalIrradianceGhi: number; // W/m²
  surfaceTempC: number;
  relativeHumidityPct: number;
  barometricPressureHpa: number;
  dewPointC: number;
}

export interface PredictorHorizonForecast {
  horizon: '15m' | '1h' | '3h' | '6h';
  predictedWindKw: number;
  predictedSolarKw: number;
  totalRenewableKw: number;
  confidenceScore: number;
  weatherCondition: string;
  rampRateRisk: 'nominal' | 'rapid_ramp_up' | 'rapid_ramp_down';
}

// Load Control & Wastage Prevention
export interface ColonyBenchmark {
  colonyId: string;
  colonyName: string;
  houseCount: number;
  baselineDailyUnitsKwh: number; // e.g. 380 units/day
  baselineHourlyUnitsKwh: number; // e.g. 15.8 units/hr
  currentDrawKw: number;
  expectedDrawKw: number;
  deviationPct: number; // e.g. +24.5%
  isWasting: boolean;
  wasteDiagnosis?: string;
  softCapKw: number;
}

export interface WastageIncident {
  id: string;
  colonyId: string;
  colonyName: string;
  detectedAt: number;
  excessDrawKw: number;
  excessUnitsPerHour: number;
  estimatedCostLossPerHourInr: number;
  suspectedCause: string;
  status: 'active' | 'throttled' | 'resolved';
}

// Technical Loss & Asset Health Management
export type AssetType = 'transformer' | 'underground_cable' | 'overhead_conductor' | 'switchgear';

export interface GridAsset {
  id: string;
  name: string;
  type: AssetType;
  areaId: string;
  feederId: string;
  colonyId?: string;
  installedYear: number;
  designLifeYears: number;
  remainingUsefulLifeYears: number;
  healthIndexPct: number; // 0-100%
  status: 'optimal' | 'monitoring' | 'degraded' | 'critical';
  ratedCapacityKva?: number;
  cableLengthMeters?: number;
  cableSpec?: string;
  diagnostics: {
    coreTemperatureC?: number;
    ambientTemperatureC: number;
    insulationResistanceMegaOhms?: number; // Cable IR MΩ
    dissolvedGasHydrogenPpm?: number;      // DGA ppm
    dissolvedGasAcetylenePpm?: number;
    neutralCurrentAmps?: number;
    infraredHotspotTempC?: number;
    lossPct: number; // calculated technical loss on this element
  };
  lastInspectedAt: number;
  nextScheduledMaintenanceAt: number;
  criticalIssue?: string;
}
