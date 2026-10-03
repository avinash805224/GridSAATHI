import React, { useState } from 'react';
import { THRESHOLDS } from '../../../config/thresholds';
import { ALERT_TEMPLATES } from '../../../config/alertTemplates';
import { Button } from '../../../components/ui/Button';
import { useSessionStore } from '../../../store/useSessionStore';
import { useAlertStore } from '../../../store/useAlertStore';
import { useToast } from '../../../components/ui/Toast';
import { Settings, Shield, Sliders, Languages, Volume2, VolumeX } from 'lucide-react';
import { getDictionary } from '../../../config/i18n';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const language = useSessionStore((s) => s.language);
  const setLanguage = useSessionStore((s) => s.setLanguage);
  const alerts = useAlertStore((s) => s.alerts);
  const copy = getDictionary(language);

  const [cloudCoverThresh, setCloudCoverThresh] = useState(THRESHOLDS.weather.highCloudCoverPct.toString());
  const [windLullThresh, setWindLullThresh] = useState(THRESHOLDS.weather.lowWindSpeedMs.toString());
  const [feederConstrainedThresh, setFeederConstrainedThresh] = useState(THRESHOLDS.load.feederConstrainedPct.toString());
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeakAlerts = () => {
    if (!('speechSynthesis' in window)) {
      showToast({ type: 'error', title: copy.voiceAssistant, message: copy.speechUnsupported });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const activeAlerts = alerts.filter((alert) => alert.status === 'active').slice(0, 5);
    const hindiType: Record<string, string> = {
      weather: 'मौसम',
      high_load: 'अधिक लोड',
      system: 'सिस्टम',
      maintenance: 'रखरखाव',
      demand_response: 'मांग प्रतिक्रिया',
      storage: 'ऊर्जा भंडारण',
      outage: 'बिजली कटौती',
    };
    const message = activeAlerts.length === 0
      ? copy.noActiveGridAlerts
      : language === 'hi'
      ? `${copy.activeGridAlerts}: ${activeAlerts.map((alert) => alert.bodyHi || `${hindiType[alert.type]}: ${alert.title}`).join('. ')}`
      : `${copy.activeGridAlerts}: ${activeAlerts.map((alert) => `${alert.title}. ${alert.body}`).join('. ')}`;

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveThresholds = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Thresholds Updated',
      message: 'Autonomous auto-draft trigger criteria saved.',
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0C3B2B] tracking-tight">
          {copy.settingsTitle}
        </h1>
        <p className="text-xs text-[#5B6B62] mt-1">
          {copy.settingsDescription}
        </p>
      </div>

      {/* Threshold Configuration Form */}
      <form onSubmit={handleSaveThresholds} className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#27A163]" /> {copy.thresholdTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">
              {copy.cloudCoverTrigger}
            </label>
            <input
              type="number"
              value={cloudCoverThresh}
              onChange={(e) => setCloudCoverThresh(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
            <span className="text-[11px] text-[#5B6B62] mt-1 block">{copy.defaultValue}: 65%</span>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">
              {copy.windLullTrigger}
            </label>
            <input
              type="number"
              step="0.1"
              value={windLullThresh}
              onChange={(e) => setWindLullThresh(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
            <span className="text-[11px] text-[#5B6B62] mt-1 block">{copy.defaultValue}: 3.5 m/s</span>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">
              {copy.feederOverloadTrigger}
            </label>
            <input
              type="number"
              value={feederConstrainedThresh}
              onChange={(e) => setFeederConstrainedThresh(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2"
            />
            <span className="text-[11px] text-[#5B6B62] mt-1 block">{copy.defaultValue}: 90%</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" variant="primary" type="submit">
            {copy.saveThresholdSettings}
          </Button>
        </div>
      </form>

      {/* Language Preference */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <Languages className="w-4 h-4 text-[#27A163]" /> {copy.regionalLanguageInterface}
        </h2>
        <p className="text-xs text-[#5B6B62]">
          {copy.languageDescription}
        </p>

        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer ${
              language === 'en'
                ? 'bg-[#27A163] text-white border-[#27A163]'
                : 'bg-white text-[#16241D] border-[#DDE9E0] hover:bg-[#F5FAF6]'
            }`}
          >
            {copy.english}
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-4 py-2 text-xs font-semibold rounded-[6px] border transition-colors cursor-pointer ${
              language === 'hi'
                ? 'bg-[#27A163] text-white border-[#27A163]'
                : 'bg-white text-[#16241D] border-[#DDE9E0] hover:bg-[#F5FAF6]'
            }`}
          >
            {copy.hindi}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#27A163]" /> {copy.voiceAssistant}
          </h2>
          <p className="text-xs text-[#5B6B62] mt-1">
            {language === 'hi' ? 'चयनित भाषा में अधिकतम पांच सक्रिय ग्रिड अलर्ट सुनें।' : 'Listen to up to five active grid alerts in the selected language.'}
          </p>
        </div>
        <Button
          size="sm"
          variant={isSpeaking ? 'outline' : 'primary'}
          icon={isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          onClick={handleSpeakAlerts}
        >
          {isSpeaking ? copy.stopSpeaking : copy.speakCurrentAlerts}
        </Button>
      </div>

      {/* Standard Notification Templates */}
      <div className="bg-white rounded-[12px] border border-[#DDE9E0] p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-[#0C3B2B] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#27A163]" /> {copy.standardTemplates} ({ALERT_TEMPLATES.length})
        </h2>
        <div className="divide-y divide-[#DDE9E0]/60 text-xs">
          {ALERT_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="py-3 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <strong className="text-[#0C3B2B]">{tpl.titleEn}</strong>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-[#F5FAF6] rounded text-[#5B6B62]">
                  {tpl.type}
                </span>
              </div>
              <p className="text-[#5B6B62] leading-relaxed">{tpl.bodyEn}</p>
              <p className="text-[#13724A] text-[11px] font-hindi">{tpl.bodyHi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
