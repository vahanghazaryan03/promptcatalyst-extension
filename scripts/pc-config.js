// pc-config.js
//
// Everything that names an external service, in one place.
//
// These were hardcoded at thirteen separate fetch sites, which is how the
// extension ended up half-pointed at a host that no longer exists: there was no
// single thing to change. Anything added here must also be reachable, which
// means adding the host to host_permissions in BOTH manifests.

const PC_CONFIG = {
  /**
   * The API. Staging is the same code under a separate process; switch this one
   * value to point the whole extension at it.
   */
  API_BASE: 'https://promptcatalyst.ai/api',
  // API_BASE: 'https://promptcatalyst.ai/apitest',

  /**
   * Supabase issues the tokens the API verifies.
   *
   * The anon key is public by design — it identifies the project and grants
   * nothing on its own. The service_role key must never appear in an extension:
   * everything shipped here is readable by anyone who installs it.
   */
  SUPABASE_URL: 'https://urvfnsimzrfxwhisydpt.supabase.co',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVydmZuc2ltenJmeHdoaXN5ZHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MzQyMjQsImV4cCI6MjEwMzUxMDIyNH0._3PMipX99zsTpz_ie-oPw0jONhMWA_C5Egt1NyR7Cd0',

  /** The web app, for the links the popup opens. */
  SITE: 'https://promptcatalyst.ai',
};

/** Where the session lives. Shared by the popup and the service worker. */
const PC_STORAGE = {
  /** The whole Supabase session: tokens, expiry, user. */
  SESSION: 'pcSession',
  /**
   * The access token, mirrored out of the session.
   *
   * Redundant, and kept deliberately: the popup reads this key in dozens of
   * places. Writing it alongside the session means those call sites keep
   * working, and it is always written and cleared together with the session so
   * the two cannot disagree.
   */
  TOKEN: 'authToken',
};

// The service worker has no window; the popup has no importScripts. Exporting
// onto globalThis is what both can read.
if (typeof globalThis !== 'undefined') {
  globalThis.PC_CONFIG = PC_CONFIG;
  globalThis.PC_STORAGE = PC_STORAGE;
}
