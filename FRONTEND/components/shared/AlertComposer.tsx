import React, { useState } from 'react';
import { Alert, AlertChannel, AlertType, Severity, NodeLevel } from '../../domain/types';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { INITIAL_TOPOLOGY } from '../../config/topology';
import { useAlertStore } from '../../store/useAlertStore';
import { useToast } from '../ui/Toast';
import { getSeverityStyle } from '../../domain/status';
import { Send, Eye, MessageSquare, Bell } from 'lucide-react';
import { useSessionStore } from '../../store/useSessionStore';
import { getDictionary } from '../../config/i18n';

interface AlertComposerProps {
  initialType?: AlertType;
  initialTitle?: string;
  initialBody?: string;
  onPublished?: (alert: Alert) => void;
  className?: string;
}

export const AlertComposer: React.FC<AlertComposerProps> = ({
  initialType = 'weather',
  initialTitle = '',
  initialBody = '',
  onPublished,
  className = '',
}) => {
  const { showToast } = useToast();
  const publishAlert = useAlertStore((s) => s.publishAlert);
  const language = useSessionStore((s) => s.language);
  const copy = getDictionary(language);

  const [type, setType] = useState<AlertType>(initialType);
  const [severity, setSeverity] = useState<Severity>('advisory');
  const [scopeLevel, setScopeLevel] = useState<NodeLevel>('powerhouse');
  const [scopeId, setScopeId] = useState<string>('ph-pragati');
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [durationHours, setDurationHours] = useState('3');
  const [channels, setChannels] = useState<AlertChannel[]>(['app', 'sms', 'banner', 'email', 'whatsapp']);

  const toggleChannel = (ch: AlertChannel) => {
    if (channels.includes(ch)) {
      if (channels.length > 1) {
        setChannels(channels.filter((c) => c !== ch));
      }
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast({
        type: 'error',
        title: 'Title and message required',
        message: 'Please provide both title and body text for the alert broadcast.',
      });
      return;
    }

    const durationMs = parseFloat(durationHours) * 60 * 60 * 1000;
    const alert = publishAlert({
      type,
      severity,
      title,
      body,
      scope: { level: scopeLevel, ids: [scopeId] },
      startsAt: Date.now(),
      endsAt: Date.now() + durationMs,
      source: 'operator',
      status: 'active',
      channels,
    });

    showToast({
      type: 'success',
      title: 'Alert Published',
      message: `Broadcasted to affected colonies across ${channels.join(', ')}.`,
    });

    setTitle('');
    setBody('');
    if (onPublished) onPublished(alert);
  };

  const sevStyle = getSeverityStyle(severity);

  return (
    <div className={`bg-white rounded-[12px] border border-[#DDE9E0] p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-[#0C3B2B] mb-1 flex items-center gap-2">
        <Send className="w-4 h-4 text-[#27A163]" /> {language === 'hi' ? 'क्षेत्र में अलर्ट भेजें' : 'Dispatch Alert to Neighborhoods'}
      </h3>
      <p className="text-xs text-[#5B6B62] mb-4">
        {language === 'hi' ? 'चयनित चैनलों पर संचालन सूचनाएं और लोड-कटौती अनुरोध भेजें।' : 'Broadcast operational notifications and load-curtailment requests across selected channels.'}
      </p>

      <form onSubmit={handlePublish} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Alert Type */}
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Alert Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
            >
              <option value="weather">Weather & Intermittency</option>
              <option value="high_load">High Feeder Load</option>
              <option value="system">System Status</option>
              <option value="maintenance">Planned Maintenance</option>
              <option value="demand_response">Demand Response</option>
              <option value="outage">Outage Advisory</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Severity Level</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
            >
              <option value="info">Info</option>
              <option value="advisory">Advisory</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Duration Window */}
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Window Duration</label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
            >
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="3">3 Hours</option>
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24">24 Hours</option>
            </select>
          </div>
        </div>

        {/* Scope Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Scope Hierarchy Level</label>
            <select
              value={scopeLevel}
              onChange={(e) => {
                const lvl = e.target.value as NodeLevel;
                setScopeLevel(lvl);
                if (lvl === 'powerhouse') setScopeId('ph-pragati');
                else if (lvl === 'area') setScopeId('area-north');
                else if (lvl === 'feeder') setScopeId('feeder-shanti');
                else if (lvl === 'colony') setScopeId('colony-shanti-vihar');
              }}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
            >
              <option value="powerhouse">Entire Power House (All Areas)</option>
              <option value="area">Area / Zone</option>
              <option value="feeder">11kV Feeder Line</option>
              <option value="colony">Specific Colony</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#5B6B62] block mb-1">Target Entity</label>
            <select
              value={scopeId}
              onChange={(e) => setScopeId(e.target.value)}
              className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 text-[#16241D]"
            >
              {scopeLevel === 'powerhouse' && (
                <option value="ph-pragati">Pragati Power Substation</option>
              )}
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
        </div>

        {/* Title & Body */}
        <div>
          <label className="text-xs font-medium text-[#5B6B62] block mb-1">Headline Title</label>
          <input
            type="text"
            placeholder="e.g. Solar generation drop predicted: avoid heavy loads"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 focus:outline-none focus:border-[#27A163]"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#5B6B62] block mb-1">Actionable Message Body</label>
          <textarea
            rows={3}
            placeholder="Provide clear instructions for residents (e.g. postpone geysers and pumps between 6:00 pm and 8:30 pm)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full text-xs bg-white border border-[#DDE9E0] rounded-[6px] px-3 py-2 focus:outline-none focus:border-[#27A163]"
          />
        </div>

        {/* Broadcast Channels */}
        <div>
          <label className="text-xs font-medium text-[#5B6B62] block mb-1.5">{copy.broadcastChannels}</label>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: 'app' as const, label: copy.residentApp },
              { id: 'sms' as const, label: copy.sms },
              { id: 'email' as const, label: copy.email },
              { id: 'whatsapp' as const, label: copy.whatsapp },
              { id: 'banner' as const, label: copy.notificationBanner },
            ].map((channel) => (
              <label key={channel.id} className="flex items-center gap-2 text-xs text-[#16241D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.includes(channel.id)}
                  onChange={() => toggleChannel(channel.id)}
                  className="rounded text-[#27A163] focus:ring-0"
                />
                <span>{channel.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* What Residents Will See Live Preview */}
        <div className="p-3.5 bg-[#F5FAF6] rounded-[8px] border border-[#DDE9E0] flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-[#5B6B62] uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> What Residents Will See
          </span>
          <div className={`p-3 bg-white rounded-[8px] border border-[#DDE9E0] ${sevStyle.border}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#0C3B2B]">
                {title || 'Alert Title Preview'}
              </span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded uppercase ${sevStyle.badge}`}>
                {severity}
              </span>
            </div>
            <p className="text-xs text-[#5B6B62]">
              {body || 'Clear plain-language instructions will render here.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" icon={<Send className="w-4 h-4" />}>
            {language === 'hi' ? 'अलर्ट अभी प्रकाशित करें' : 'Publish Alert Now'}
          </Button>
        </div>
      </form>
    </div>
  );
};
