import { useEffect, useMemo, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const dismissKey = 'allexamspyq-install-dismissed-v1';

function readDismissed() {
  try {
    return localStorage.getItem(dismissKey) === 'true';
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(dismissKey, 'true');
  } catch {
    // The prompt can still be dismissed for this React session.
  }
}

function isIOSDevice() {
  const platform = navigator.platform || '';
  const agent = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(agent) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandaloneDisplay() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [standalone, setStandalone] = useState(false);
  const isiOS = useMemo(isIOSDevice, []);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      writeDismissed();
      setDismissed(true);
      setInstallEvent(null);
      setStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (dismissed || standalone || (!installEvent && !isiOS)) return null;

  async function installApp() {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === 'accepted') {
        writeDismissed();
        setDismissed(true);
      }
    } finally {
      setInstallEvent(null);
    }
  }

  function dismiss() {
    writeDismissed();
    setDismissed(true);
  }

  return (
        <div className="fixed left-3 right-3 top-3 z-[110] mx-auto max-w-2xl rounded-lg border border-[var(--primary)]/25 bg-[var(--bg-surface)]/95 p-3 shadow-lg backdrop-blur sm:left-1/2 sm:right-auto sm:w-[min(40rem,calc(100vw-2rem))] sm:-translate-x-1/2">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
          {isiOS ? <Share className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--fg)]">Install allExamsPYQ</p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--fg-muted)]">
            {isiOS
              ? 'On iPhone or iPad, tap Share, then Add to Home Screen.'
              : 'Add this app to your device for faster access and offline shell loading.'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {!isiOS && installEvent && (
            <Button type="button" size="sm" onClick={installApp}>
              Install
            </Button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-surface-hover)] hover:text-[var(--fg)]"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
