import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Bell,
  Gauge,
  Settings,
  SlidersHorizontal,
  Zap,
  Activity,
  Wrench,
  Eye,
  Globe,
  Satellite,
  Radio,
  BatteryMedium,
} from 'lucide-react';
import { LastUpdated } from '../shared/LastUpdated';
import { LiveGpsTracker } from '../shared/LiveGpsTracker';
import { ScopePicker, ScopeValue } from '../shared/ScopePicker';
import { useAlertStore } from '../../store/useAlertStore';
import { useLocationStore } from '../../store/useLocationStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useTranslation } from '../../hooks/useTranslation';
import { LocationChip } from '../geo/LocationChip';
import { LocationModal } from '../geo/LocationModal';
import { VoiceAssistantWidget } from '../ai/VoiceAssistantWidget';
import { ScenarioLab } from '../../dev/ScenarioLab';

export const PowerHouseShell: React.FC = () => {
  const navigate = useNavigate();
  const alerts = useAlertStore((s) => s.alerts);
  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;
  const setPreviewMode = useSessionStore((s) => s.setPreviewMode);
  const currentArea = useLocationStore((s) => s.currentArea);

  const { t, language, toggleLanguage } = useTranslation();
  const [scope, setScope] = useState<ScopeValue>({
    level: 'powerhouse',
    id: currentArea.legacyAreaId || 'ph-pragati',
  });
  const [isLabOpen, setIsLabOpen] = useState(false);

  const navLinks = [
    { to: '/powerhouse', label: t('commandCenter'), icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/powerhouse/predictor', label: t('predictor'), icon: <Satellite className="w-4 h-4" /> },
    { to: '/powerhouse/forecast', label: t('forecasting'), icon: <TrendingUp className="w-4 h-4" /> },
  { to: '/powerhouse/alerts/weather', label: t('alertsResponseCenter'), icon: <Bell className="w-4 h-4" />, badge: activeAlertsCount },
    { to: '/powerhouse/load', label: t('smartLoad'), icon: <Gauge className="w-4 h-4" /> },
    { to: '/powerhouse/load-control', label: t('loadControl'), icon: <Activity className="w-4 h-4" /> },
    { to: '/powerhouse/technical-loss', label: t('technicalLoss'), icon: <Wrench className="w-4 h-4" /> },
    { to: '/powerhouse/demand-response', label: t('demandResponse'), icon: <Radio className="w-4 h-4" /> },
    { to: '/powerhouse/storage', label: t('sharedStorage'), icon: <BatteryMedium className="w-4 h-4" /> },
    { to: '/powerhouse/settings', label: t('settings'), icon: <Settings className="w-4 h-4" /> },
  ];

  const handleOpenPreview = () => {
    setPreviewMode(true);
    navigate('/colony');
  };

  return (
    <div className="min-h-screen flex bg-[#F5FAF6] text-[#16241D]">
      {/* 232px Sidebar */}
      <aside className="w-[232px] shrink-0 bg-white border-r border-[#DDE9E0] flex flex-col justify-between hidden md:flex sticky top-0 h-screen select-none z-20">
        <div>
          {/* Logo & Brand Zone */}
          <div className="h-16 flex items-center px-5 border-b border-[#DDE9E0]">
            <a href="/powerhouse" className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[8px] bg-[#EAF7EE] text-[#13724A] flex items-center justify-center font-bold">
                <Zap className="w-5 h-5 text-[#27A163]" />
              </span>
              <div className="flex flex-col">
                <span className="text-base font-bold font-heading text-[#0C3B2B] tracking-tight">
                  {t('appName')}
                </span>
                <span className="text-[10px] text-[#5B6B62] leading-none">
                  {language === 'hi' ? 'पावर हाउस कंट्रोल कंसोल' : 'Power House Console'}
                </span>
              </div>
            </a>
          </div>

          {/* Nav links */}
          <nav className="p-3 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/powerhouse'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EAF7EE] text-[#0C3B2B] font-semibold border-l-3 border-[#27A163]'
                      : 'text-[#5B6B62] hover:text-[#16241D] hover:bg-[#F5FAF6]'
                  }`
                }
              >
                <div className="flex items-center gap-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="text-[10px] bg-[#FCEEED] text-[#9E2824] px-1.5 py-0.2 rounded-full font-bold tabular-nums">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer actions: Portal switch & Scenario Lab */}
        <div className="p-3 border-t border-[#DDE9E0] flex flex-col gap-2">
          <button
            onClick={() => setIsLabOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#0C3B2B] bg-[#EAF7EE] hover:bg-[#D6EFDD] rounded-[6px] cursor-pointer transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('scenarioLab')}</span>
          </button>

          <button
            onClick={handleOpenPreview}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-[#0C3B2B] bg-[#F5FAF6] hover:bg-[#EAF7EE] border border-[#DDE9E0] rounded-[6px] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#27A163]" />
            <span>{t('viewAsPublic')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar: Area chip, Scope selector, Language Toggle, View as Public */}
        <header className="h-16 px-6 bg-white border-b border-[#DDE9E0] flex items-center justify-between sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-3">
            {/* Geolocation Area Chip */}
            <LocationChip />

            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-[#5B6B62] font-medium">{t('scope')}:</span>
              <ScopePicker value={scope} onChange={setScope} />
            </div>
            <LiveGpsTracker />
          </div>

          <div className="flex items-center gap-3">
            <LastUpdated />

            {/* Language Toggle Button (Hindi / English) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0C3B2B] bg-[#EAF7EE] hover:bg-[#D6EFDD] border border-[#DDE9E0] rounded-[6px] transition-colors cursor-pointer"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-[#27A163]" />
              <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
            </button>

            {/* View as Public Action */}
            <button
              onClick={handleOpenPreview}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F5FAF6] hover:bg-[#EAF7EE] text-[#0C3B2B] border border-[#DDE9E0] rounded-[6px] text-xs font-semibold transition-colors cursor-pointer"
              title="Preview how current alerts & status look to residents"
            >
              <Eye className="w-3.5 h-3.5 text-[#27A163]" />
              <span>{t('viewAsPublic')}</span>
            </button>

            <button
              onClick={() => navigate('/powerhouse/alerts/weather')}
              className="relative p-2 rounded-[6px] text-[#5B6B62] hover:text-[#16241D] hover:bg-[#F5FAF6] transition-colors cursor-pointer"
              aria-label="Active Alerts"
            >
              <Bell className="w-5 h-5" strokeWidth={1.75} />
              {activeAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C73E3A]" />
              )}
            </button>

            <button
              onClick={() => setIsLabOpen(true)}
              className="md:hidden p-2 rounded-[6px] text-[#0C3B2B] bg-[#EAF7EE] cursor-pointer"
              aria-label="Open Scenario Lab"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <LocationModal />
      <VoiceAssistantWidget />
      <ScenarioLab isOpen={isLabOpen} onClose={() => setIsLabOpen(false)} />
    </div>
  );
};
