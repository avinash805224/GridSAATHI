import { INITIAL_TOPOLOGY } from '../../config/topology';
import { Reading, SupplyStatus } from '../../domain/types';
import { getDemandProfileFactor, getSolarGenerationFactor, getWindGenerationFactor } from './profiles';
import { weatherSim } from './weatherMock';
import { scenarioManager } from './scenarios';
import { computeSupplyStatus } from '../../domain/status';
import { useGridStore } from '../../store/useGridStore';
import { useAlertStore } from '../../store/useAlertStore';
import { useStorageStore } from '../../store/useStorageStore';
import { useOutageStore } from '../../store/useOutageStore';
import { useDemandResponseStore } from '../../store/useDemandResponseStore';
import { THRESHOLDS } from '../../config/thresholds';

class SimulatorEngine {
  private timer: any = null;
  private simTime: number = Date.now();
  private isRunning: boolean = false;
  private tickIntervalMs = 2000;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getCurrentSimTime(): number {
    return this.simTime;
  }

  private tick() {
    const gridStore = useGridStore.getState();
    const speed = gridStore.simSpeed;
    // Step forward in time (2 seconds * speed)
    const deltaMs = this.tickIntervalMs * speed;
    this.simTime += deltaMs;

    weatherSim.step(2 * speed);
    const weather = weatherSim.getSnapshot(this.simTime);

    const d = new Date(this.simTime);
    const hour = d.getHours() + d.getMinutes() / 60;

    // Check scenarios
    const hasCloud = scenarioManager.hasScenario('cloudCover');
    const hasWindLull = scenarioManager.hasScenario('windLull');
    const hasHeatWave = scenarioManager.hasScenario('heatWave');
    const feederFaultScenario = scenarioManager.getScenario('feederFault');

    const effectiveCloud = hasCloud ? 88 : weather.cloudCoverPct;
    const effectiveWind = hasWindLull ? 2.1 : weather.windSpeedMs;
    const tempMult = hasHeatWave ? 1.25 : 1.0;

    // Active demand response savings
    const drEvents = useDemandResponseStore.getState().events;
    const activeDr = drEvents.find((e) => e.status === 'active');
    const drSavingKw = activeDr ? activeDr.actualReductionKw : 0;

    // Compute feeder readings
    const feederReadings: Record<string, Reading> = {};
    const feederStatuses: Record<string, SupplyStatus> = {};
    const colonyReadings: Record<string, Reading> = {};
    const colonyStatuses: Record<string, SupplyStatus> = {};

    let totalDemandKw = 0;
    let totalSolarKw = 0;
    let totalWindKw = 0;
    let totalGridImportKw = 0;
    let totalBatteryKw = 0;

    const outageStore = useOutageStore.getState();
    const storageStore = useStorageStore.getState();

    // Check if feeder fault scenario needs to trigger outage
    if (feederFaultScenario && feederFaultScenario.targetId) {
      const fId = feederFaultScenario.targetId;
      const f = INITIAL_TOPOLOGY.feeders.find((item) => item.id === fId);
      if (f) {
        f.colonyIds.forEach((cId) => {
          if (!outageStore.getOutageForColony(cId)) {
            outageStore.triggerOutage(cId, fId, 'fault', 45);
          }
        });
      }
    }

    // Calculate per feeder
    INITIAL_TOPOLOGY.feeders.forEach((feeder, fIndex) => {
      const demandFactor = getDemandProfileFactor(hour);
      // Base demand for feeder is ~40-60% of capacity
      const baseKw = feeder.capacityKw * 0.52;
      const noise = 1 + (Math.sin(this.simTime / 5000 + fIndex) * 0.04);
      let feederDemand = baseKw * demandFactor * tempMult * noise;

      // Check if any colony has outage
      const anyOutage = feeder.colonyIds.some((cid) => !!outageStore.getOutageForColony(cid));

      if (anyOutage && feederFaultScenario?.targetId === feeder.id) {
        feederDemand = 0;
      }

      // Generation for this feeder
      const solarGen = getSolarGenerationFactor(hour, effectiveCloud);
      const windGen = getWindGenerationFactor(effectiveWind);

      const fSolarKw = anyOutage ? 0 : feeder.capacityKw * 0.35 * solarGen;
      const fWindKw = anyOutage ? 0 : (fIndex % 2 === 1 ? feeder.capacityKw * 0.28 * windGen : 0);
      const fRenewable = fSolarKw + fWindKw;

      // DR reduction allocated
      const fDrCut = activeDr && activeDr.scope.ids.includes(feeder.areaId) ? drSavingKw * 0.25 : 0;
      const effectiveFeederDemand = Math.max(0, feederDemand - fDrCut);

      const gridAllocation = feeder.capacityKw * 0.45;
      const fSupply = Math.min(effectiveFeederDemand, gridAllocation + fRenewable);
      const fShortfall = Math.max(0, effectiveFeederDemand - (gridAllocation + fRenewable));
      const feederHasActiveDr = !!activeDr && (
        activeDr.scope.level === 'powerhouse' ||
        (activeDr.scope.level === 'area' && activeDr.scope.ids.includes(feeder.areaId)) ||
        (activeDr.scope.level === 'feeder' && activeDr.scope.ids.includes(feeder.id)) ||
        (activeDr.scope.level === 'colony' && feeder.colonyIds.some((colonyId) => activeDr.scope.ids.includes(colonyId)))
      );

      const status = computeSupplyStatus({
        shortfallKw: fShortfall,
        capacityKw: feeder.capacityKw,
        currentDemandKw: effectiveFeederDemand,
        hasOutage: anyOutage,
        hasActiveDR: feederHasActiveDr,
      });

      feederReadings[feeder.id] = {
        ts: this.simTime,
        demandKw: Math.round(effectiveFeederDemand * 10) / 10,
        supplyKw: Math.round(fSupply * 10) / 10,
        solarKw: Math.round(fSolarKw * 10) / 10,
        windKw: Math.round(fWindKw * 10) / 10,
        gridImportKw: Math.round(Math.min(effectiveFeederDemand, gridAllocation) * 10) / 10,
        batteryKw: 0,
        voltageV: anyOutage ? 0 : 230 + (Math.sin(this.simTime / 3000) * 1.5),
        frequencyHz: anyOutage ? 0 : 50.0 + (Math.sin(this.simTime / 7000) * 0.04),
      };
      feederStatuses[feeder.id] = status;

      totalDemandKw += effectiveFeederDemand;
      totalSolarKw += fSolarKw;
      totalWindKw += fWindKw;
      totalGridImportKw += Math.min(effectiveFeederDemand, gridAllocation);

      // Distribute to colonies
      feeder.colonyIds.forEach((cId, cIdx) => {
        const hasOutage = !!outageStore.getOutageForColony(cId);
        const colDemand = hasOutage ? 0 : (effectiveFeederDemand / feeder.colonyIds.length) * (cIdx === 0 ? 1.05 : 0.95);
        const colSolar = hasOutage ? 0 : fSolarKw / feeder.colonyIds.length;
        const colWind = hasOutage ? 0 : fWindKw / feeder.colonyIds.length;

        // Battery handling if emergency active
        const battery = storageStore.batteries[cId];
        let batDischargeKw = 0;
        if (hasOutage && battery && battery.mode === 'emergency') {
          batDischargeKw = 24.5;
          storageStore.stepBatteryDischarge(cId, batDischargeKw, 2 * speed);
          totalBatteryKw += batDischargeKw;
        }

        colonyReadings[cId] = {
          ts: this.simTime,
          demandKw: Math.round(colDemand * 10) / 10,
          supplyKw: Math.round((colSolar + colWind + batDischargeKw) * 10) / 10,
          solarKw: Math.round(colSolar * 10) / 10,
          windKw: Math.round(colWind * 10) / 10,
          gridImportKw: 0,
          batteryKw: Math.round(batDischargeKw * 10) / 10,
          voltageV: hasOutage ? (batDischargeKw > 0 ? 228.5 : 0) : 230.1,
          frequencyHz: hasOutage ? (batDischargeKw > 0 ? 50.0 : 0) : 50.01,
        };
        colonyStatuses[cId] = hasOutage ? 'outage' : status;
      });
    });

    const totalShortfall = Math.max(0, totalDemandKw - (totalSolarKw + totalWindKw + totalGridImportKw + totalBatteryKw));
    const powerHouseSupply = totalDemandKw - totalShortfall;

    const overallStatus = computeSupplyStatus({
      shortfallKw: totalShortfall,
      capacityKw: INITIAL_TOPOLOGY.powerHouse.capacityKw,
      currentDemandKw: totalDemandKw,
      hasActiveDR: !!activeDr,
    });

    const powerHouseReading: Reading = {
      ts: this.simTime,
      demandKw: Math.round(totalDemandKw * 10) / 10,
      supplyKw: Math.round(powerHouseSupply * 10) / 10,
      solarKw: Math.round(totalSolarKw * 10) / 10,
      windKw: Math.round(totalWindKw * 10) / 10,
      gridImportKw: Math.round(totalGridImportKw * 10) / 10,
      batteryKw: Math.round(totalBatteryKw * 10) / 10,
      voltageV: 230.4,
      frequencyHz: 50.02,
    };

    gridStore.updateTick({
      simClock: this.simTime,
      powerHouseReading,
      feederReadings,
      colonyReadings,
      overallStatus,
      feederStatuses,
      colonyStatuses,
    });

    // Check Auto-Draft Alerts
    this.evaluateAutoDrafts(weather, effectiveCloud, effectiveWind, feederReadings);
  }

  private evaluateAutoDrafts(
    weather: any,
    cloudCover: number,
    windSpeed: number,
    feeders: Record<string, Reading>
  ) {
    const alertStore = useAlertStore.getState();
    const drafts = alertStore.drafts;
    const alerts = alertStore.alerts;

    // Check Cloud Cover draft
    if (cloudCover >= THRESHOLDS.weather.highCloudCoverPct) {
      const exists = [...drafts, ...alerts].some((a) => a.title.includes('Cloud Cover') || a.title.includes('Solar'));
      if (!exists) {
        alertStore.createDraft({
          type: 'weather',
          severity: 'advisory',
          title: 'Cloud Cover Threshold Crossed (Auto-Draft)',
          body: `Solar irradiance is suppressed due to ${Math.round(cloudCover)}% cloud cover. Consider initiating demand response for peak hours.`,
          bodyHi: `घने बादलों (${Math.round(cloudCover)}%) के कारण सौर ऊर्जा में कमी।`,
          scope: { level: 'powerhouse', ids: ['ph-pragati'] },
          startsAt: this.simTime,
          endsAt: this.simTime + 120 * 60 * 1000,
          source: 'auto',
          status: 'draft',
          channels: ['app', 'sms', 'banner'],
        });
      }
    }

    // Check Wind Lull draft
    if (windSpeed < THRESHOLDS.weather.lowWindSpeedMs) {
      const exists = [...drafts, ...alerts].some((a) => a.title.includes('Wind Lull'));
      if (!exists) {
        alertStore.createDraft({
          type: 'weather',
          severity: 'warning',
          title: 'Wind Generation Lull Detected (Auto-Draft)',
          body: `Surface wind speed dropped to ${windSpeed.toFixed(1)} m/s. Wind feeder output has dropped below 15% rated capacity.`,
          bodyHi: `हवा की गति ${windSpeed.toFixed(1)} m/s गिरने से पवन उत्पादन में भारी कमी।`,
          scope: { level: 'area', ids: ['area-periurban'] },
          startsAt: this.simTime,
          endsAt: this.simTime + 180 * 60 * 1000,
          source: 'auto',
          status: 'draft',
          channels: ['app', 'sms'],
        });
      }
    }

    // Check Feeder overload draft
    Object.entries(feeders).forEach(([fId, reading]) => {
      const feederConfig = INITIAL_TOPOLOGY.feeders.find((f) => f.id === fId);
      if (feederConfig) {
        const pct = (reading.demandKw / feederConfig.capacityKw) * 100;
        if (pct >= THRESHOLDS.load.feederConstrainedPct) {
          const exists = [...drafts, ...alerts].some((a) => a.title.includes(feederConfig.name));
          if (!exists) {
            alertStore.createDraft({
              type: 'high_load',
              severity: 'warning',
              title: `${feederConfig.name} at ${Math.round(pct)}% Capacity (Auto-Draft)`,
              body: `Feeder load has reached ${Math.round(reading.demandKw)} kW of ${feederConfig.capacityKw} kW rated capacity. Initiate demand-side reduction.`,
              bodyHi: `${feederConfig.name} पर लोड ${Math.round(pct)}% पहुंच चुका है।`,
              scope: { level: 'feeder', ids: [fId] },
              startsAt: this.simTime,
              endsAt: this.simTime + 90 * 60 * 1000,
              source: 'auto',
              status: 'draft',
              channels: ['app', 'sms', 'banner'],
            });
          }
        }
      }
    });
  }
}

export const simulator = new SimulatorEngine();
