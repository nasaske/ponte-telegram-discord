/**
 * state.gs — storage via Script Properties + Env (config centralizada)
 * Configure as Script Properties em: Project Settings → Script props
 */
const Store = (() => {
  const P = PropertiesService.getScriptProperties();
  const getStore = () => P;

  const stateKey = (ns, appId) => `${ns}__${appId}`;
  const readState = (ns, appId) => {
    const raw = getStore().getProperty(stateKey(ns, appId));
    return raw ? JSON.parse(raw) : null;
  };
  const writeState = (ns, appId, obj) => {
    getStore().setProperty(stateKey(ns, appId), JSON.stringify(obj));
  };
  const listKeys = (ns) => Object.keys(getStore().getProperties())
    .filter(k => k.startsWith(ns + '__'));
  const readRawByKey = (k) => {
    const raw = getStore().getProperty(k);
    return raw ? JSON.parse(raw) : null;
  };

  return { getStore, stateKey, readState, writeState, listKeys, readRawByKey };
})();

/**
 * Env — leitura segura das Script Properties + validação
 */
const Env = (() => {
  const P = PropertiesService.getScriptProperties();

  const str  = (k, d='') => {
    const v = P.getProperty(k);
    return (v === null || v === undefined) ? d : String(v);
  };
  const num  = (k, d) => {
    const n = Number(P.getProperty(k));
    return Number.isFinite(n) ? n : d;
  };
  const bool = (k, d=false) => {
    const v = String(P.getProperty(k) ?? '').trim().toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0' || v === '') return false;
    return d;
  };
  const json = (k, d) => {
    const raw = P.getProperty(k);
    if (!raw) return d;
    try { return JSON.parse(raw); } catch { return d; }
  };

  function config() {
    return {
      SECRET:               str('SECRET'),
      HEARTBEAT_TTL_SEC:    num('HEARTBEAT_TTL_SEC', 90),
      ALERT_COOLDOWN_MIN:   num('ALERT_COOLDOWN_MIN', 10),
      BOT_USERNAME:         str('BOT_USERNAME', 'ChatApp Status Bot'),
      BOT_AVATAR_URL:       str('BOT_AVATAR_URL', ''),
      STORE_NS:             str('STORE_NS', 'CHATAPP_HEARTBEATS'),

      WEBHOOK_MAP:          json('WEBHOOK_MAP', {}),

      TG_ENABLED:           bool('TG_ENABLED', true),
      TG_BOT_TOKEN:         str('TG_BOT_TOKEN', ''),
      TG_FORWARD_TO_APP_ID: str('TG_FORWARD_TO_APP_ID', ''),
      TG_CHAT_WHITELIST:    json('TG_CHAT_WHITELIST', []),
      TG_IGNORE_SERVICE_MSGS: bool('TG_IGNORE_SERVICE_MSGS', true),
    };
  }

  function assertRequired(keys, cfg) {
    const c = cfg || config();
    const missing = keys.filter(k => {
      const v = c[k];
      return v === '' || v === null || v === undefined ||
             (typeof v === 'object' && v && !Object.keys(v).length);
    });
    if (missing.length) throw new Error('Config faltando: ' + missing.join(', '));
  }

  return { config, assertRequired };
})();
