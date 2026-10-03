import React from 'react';
import { Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { AlertType, NodeLevel } from '../../domain/types';
import { getDictionary } from '../../config/i18n';
import { useAlertStore } from '../../store/useAlertStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useToast } from '../ui/Toast';

interface IssueResponseActionsProps {
  title: string;
  body: string;
  type: AlertType;
  severity: 'warning' | 'critical';
  scope: { level: NodeLevel; ids: string[] };
}

export const IssueResponseActions: React.FC<IssueResponseActionsProps> = ({
  title,
  body,
  type,
  severity,
  scope,
}) => {
  const publishAlert = useAlertStore((state) => state.publishAlert);
  const language = useSessionStore((state) => state.language);
  const copy = getDictionary(language);
  const { showToast } = useToast();

  const sendAlert = () => {
    publishAlert({
      type,
      severity,
      title,
      body,
      bodyHi: `${title}: ${body}`,
      scope,
      startsAt: Date.now(),
      endsAt: Date.now() + 60 * 60 * 1000,
      source: 'operator',
      status: 'active',
      channels: ['app', 'sms', 'email', 'whatsapp', 'banner'],
    });
    showToast({
      type: 'success',
      title: copy.alertDispatched,
      message: language === 'hi'
        ? `${title} के लिए प्रभावित क्षेत्र में सूचना जोड़ी गई।`
        : `${title} was added to the affected area's alert feed and SMS inbox.`,
    });
  };

  const emailContact = () => {
    const email = window.prompt(copy.enterEmailAddress)?.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast({ type: 'error', title: copy.emailContact, message: copy.invalidEmailAddress });
      return;
    }

    const subject = encodeURIComponent(title);
    const message = encodeURIComponent(`${title}\n\n${body}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${message}`;
  };

  const whatsappContact = () => {
    const enteredNumber = window.prompt(copy.enterWhatsAppNumber);
    if (!enteredNumber) return;

    const phoneNumber = enteredNumber.replace(/\D/g, '');
    if (!/^\d{8,15}$/.test(phoneNumber)) {
      showToast({ type: 'error', title: copy.whatsappContact, message: copy.invalidWhatsAppNumber });
      return;
    }

    const message = encodeURIComponent(`${title}\n\n${body}`);
    window.location.href = `https://wa.me/${phoneNumber}?text=${message}`;
  };

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DDE9E0]/60">
      <Button
        size="sm"
        variant="outline"
        icon={<MessageSquare className="w-3.5 h-3.5" />}
        onClick={sendAlert}
      >
        {copy.sendIssueAlert}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<Mail className="w-3.5 h-3.5" />}
        onClick={emailContact}
      >
        {copy.emailContact}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<MessageCircle className="w-3.5 h-3.5" />}
        onClick={whatsappContact}
      >
        {copy.whatsappContact}
      </Button>
    </div>
  );
};