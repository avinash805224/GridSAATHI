import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { PowerHouseShell } from '../components/layout/PowerHouseShell';
import { PublicShell } from '../components/layout/PublicShell';
import { RequireRole } from '../guards/RequireRole';
import { CommandCenterPage } from '../features/powerhouse/command-center/CommandCenterPage';
import { ForecastingPredictorPage } from '../features/powerhouse/forecast/ForecastingPredictorPage';
import { AlertsPage } from '../features/powerhouse/alerts/AlertsPage';
import { LoadManagementPage } from '../features/powerhouse/load-management/LoadManagementPage';
import { SettingsPage } from '../features/powerhouse/settings/SettingsPage';
import { LoadControlPage } from '../features/powerhouse/load-control/LoadControlPage';
import { TechnicalLossPage } from '../features/powerhouse/technical-loss/TechnicalLossPage';

import { PublicHomePage } from '../features/public/home/PublicHomePage';
import { PublicAlertsPage } from '../features/public/alerts/PublicAlertsPage';
import { MessageBoxPage } from '../features/public/alerts/MessageBoxPage';
import { RecommendationsPage } from '../features/public/recommendations/RecommendationsPage';

import { UiKitchenSink } from '../dev/UiKitchenSink';
import { DataDebug } from '../dev/DataDebug';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Portal Selector */}
      <Route path="/" element={<LandingPage />} />

      {/* Power House Portal Routes (Guarded for Operator role) */}
      <Route
        path="/powerhouse"
        element={
          <RequireRole requiredRole="operator">
            <PowerHouseShell />
          </RequireRole>
        }
      >
        <Route index element={<CommandCenterPage />} />
        <Route path="forecast" element={<ForecastingPredictorPage />} />
        <Route path="predictor" element={<Navigate to="/powerhouse/forecast" replace />} />
        <Route path="alerts" element={<Navigate to="/powerhouse/alerts/weather" replace />} />
        <Route path="alerts/:tab" element={<AlertsPage />} />
        <Route path="load" element={<LoadManagementPage />} />
        <Route path="load/:feederId" element={<LoadManagementPage />} />
        <Route path="load-control" element={<LoadControlPage />} />
        <Route path="technical-loss" element={<TechnicalLossPage />} />
        <Route path="demand-response" element={<Navigate to="/powerhouse/alerts/response" replace />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Public / Colony Portal Routes (Home · Alerts · Solutions) */}
      <Route path="/colony" element={<PublicShell />}>
        <Route index element={<PublicHomePage />} />
        <Route path="alerts" element={<PublicAlertsPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="messages" element={<MessageBoxPage />} />

        {/* Removed routes redirected per Phase 2 spec */}
        <Route path="forecast" element={<Navigate to="/colony" replace />} />
        <Route path="storage" element={<Navigate to="/colony/alerts" replace />} />
        <Route path="houses" element={<Navigate to="/colony" replace />} />
        <Route path="houses/:houseId" element={<Navigate to="/colony" replace />} />
      </Route>

      {/* Dev / Debug Routes */}
      <Route path="/dev/ui" element={<UiKitchenSink />} />
      <Route path="/dev/data" element={<DataDebug />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
