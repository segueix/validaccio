// Funció 010 — Tallafoc de privacitat.
// Política pura i comprovable que classifica cada petició de xarxa i decideix si
// es permet. Per defecte només es deixa passar el mateix origen i els recursos
// locals (data:/blob:); qualsevol destinació externa queda bloquejada tret que
// l'usuari hi hagi donat consentiment explícit i no s'estigui en mode sense
// xarxa. El guard embolcalla `fetch` per fer complir aquesta política i deixar
// constància de qualsevol intent de sortida de dades.

export const PRIVACY_OFFLINE_METADATA_KEY = "privacyOffline";

// Política de seguretat aplicada també pel navegador. Complementa el guard de
// fetch i cobreix la resta de canals habituals (XHR, beacon, WebSocket,
// formularis, imatges, mitjans, workers i objectes incrustats).
export const LOCAL_FIRST_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self'",
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-src 'none'",
  "img-src 'self' blob: data:",
  "manifest-src 'self'",
  "media-src 'self' blob:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "worker-src 'self' blob:",
].join("; ");


export type InventoryEntry = {
  id: string;
  label: string;
  destination: "local" | "extern";
  carriesUserData: boolean;
  detail: string;
};

// Inventari declarat de peticions de xarxa del nucli local-first: només mateix
// origen, cap dada de recerca. Serveix de referència visible i auditable.
export const NETWORK_INVENTORY: readonly InventoryEntry[] = [
  {
    id: "app-assets",
    label: "Recursos de l’aplicació",
    destination: "local",
    carriesUserData: false,
    detail:
      "Codi, estils i tipografies servits pel mateix origen. No contenen manuscrits ni fonts.",
  },
  {
    id: "service-worker",
    label: "Service worker (offline)",
    destination: "local",
    carriesUserData: false,
    detail:
      "Registre de /sw.js al mateix origen perquè l’aplicació arrenqui sense xarxa.",
  },
];

export type RequestCategory = "local" | "data" | "blob" | "external" | "invalid";

export type FirewallDecision = {
  allowed: boolean;
  category: RequestCategory;
  host: string | null;
  reason: string;
};

export class FirewallBlockedError extends Error {
  readonly url: string;

  constructor(reason: string, url: string) {
    super(reason);
    this.name = "FirewallBlockedError";
    this.url = url;
  }
}

function hostOf(url: string, appOrigin: string): string | null {
  try {
    return new URL(url, appOrigin).host;
  } catch {
    return null;
  }
}

export function classifyDestination(
  url: string,
  appOrigin: string,
): RequestCategory {
  if (url.startsWith("data:")) return "data";
  if (url.startsWith("blob:")) return "blob";
  try {
    return new URL(url, appOrigin).origin === appOrigin ? "local" : "external";
  } catch {
    return "invalid";
  }
}

export function evaluateRequest(input: {
  url: string;
  appOrigin: string;
  offline: boolean;
  consentedHosts?: readonly string[];
}): FirewallDecision {
  const category = classifyDestination(input.url, input.appOrigin);
  const host = category === "external" ? hostOf(input.url, input.appOrigin) : null;

  if (category === "invalid") {
    return { allowed: false, category, host, reason: "Adreça de petició no vàlida." };
  }
  if (category !== "external") {
    return {
      allowed: true,
      category,
      host,
      reason: "Recurs local del dispositiu.",
    };
  }

  if (input.offline) {
    return {
      allowed: false,
      category,
      host,
      reason: "Mode sense xarxa actiu: cap petició externa.",
    };
  }
  if (host && input.consentedHosts?.includes(host)) {
    return {
      allowed: true,
      category,
      host,
      reason: `Consentiment previ concedit per a ${host}.`,
    };
  }
  return {
    allowed: false,
    category,
    host,
    reason: "Petició externa bloquejada: cal consentiment explícit.",
  };
}

export type FirewallLogEntry = {
  url: string;
  host: string | null;
  category: RequestCategory;
  allowed: boolean;
  reason: string;
  at: string;
};

export type PrivacyFirewall = {
  fetch: typeof fetch;
  isOffline(): boolean;
  setOffline(offline: boolean): void;
  allowHost(host: string): void;
  revokeHost(host: string): void;
  getConsentedHosts(): string[];
  getLog(): FirewallLogEntry[];
  clearLog(): void;
};

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function createPrivacyFirewall(options: {
  appOrigin: string;
  baseFetch: typeof fetch;
  offline?: boolean;
  consentedHosts?: readonly string[];
  now?: () => string;
  onEvent?: (entry: FirewallLogEntry) => void;
}): PrivacyFirewall {
  const now = options.now ?? (() => new Date().toISOString());
  const consented = new Set(options.consentedHosts ?? []);
  const log: FirewallLogEntry[] = [];
  let offline = options.offline ?? false;

  const guardedFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const decision = evaluateRequest({
      url,
      appOrigin: options.appOrigin,
      offline,
      consentedHosts: [...consented],
    });

    // Només es registren les peticions externes: són les úniques que podrien
    // fer sortir dades del dispositiu.
    if (decision.category === "external") {
      const entry: FirewallLogEntry = {
        url,
        host: decision.host,
        category: decision.category,
        allowed: decision.allowed,
        reason: decision.reason,
        at: now(),
      };
      log.push(entry);
      options.onEvent?.(entry);
    }

    if (!decision.allowed) {
      return Promise.reject(new FirewallBlockedError(decision.reason, url));
    }
    return options.baseFetch(input, init);
  }) as typeof fetch;

  return {
    fetch: guardedFetch,
    isOffline: () => offline,
    setOffline: (value) => {
      offline = value;
    },
    allowHost: (host) => {
      if (host) consented.add(host);
    },
    revokeHost: (host) => {
      consented.delete(host);
    },
    getConsentedHosts: () => [...consented],
    getLog: () => log.map((entry) => ({ ...entry })),
    clearLog: () => {
      log.length = 0;
    },
  };
}
