// pc-auth.js
//
// Supabase authentication for the extension.
//
// The web client uses @supabase/supabase-js. This does not: there is no build
// step here, and the SDK stores its session in localStorage, which the service
// worker cannot read. So the four GoTrue endpoints actually needed are called
// directly, and the session is kept in chrome.storage.local — the one store the
// popup and the service worker share.
//
// Losing the SDK also means losing its refresh timer, so refreshing is done
// here, on demand, before a token is handed out. See ensureFreshToken.

(function (global) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = global.PC_CONFIG;
  const STORAGE = global.PC_STORAGE;

  const AUTH_BASE = `${SUPABASE_URL}/auth/v1`;

  /**
   * Refresh this long before the token actually expires.
   *
   * Long enough to cover a slow request that starts just under the wire, since
   * the API checks expiry at the moment it verifies, not at the moment we send.
   */
  const EXPIRY_SKEW_SECONDS = 60;

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  function storageGet(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result || {}));
    });
  }

  function storageSet(items) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, resolve);
    });
  }

  function storageRemove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }

  /**
   * Normalises what GoTrue returns into what gets stored.
   *
   * `expires_in` is relative to now, so it is resolved to an absolute
   * `expires_at` here — a relative value stored and read minutes later is
   * meaningless.
   */
  function toSession(payload) {
    if (!payload || !payload.access_token) return null;
    const expiresAt =
      typeof payload.expires_at === 'number'
        ? payload.expires_at
        : Math.floor(Date.now() / 1000) + (Number(payload.expires_in) || 3600);

    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || null,
      expires_at: expiresAt,
      user: payload.user || null,
    };
  }

  function displayNameOf(user) {
    if (!user) return 'User';
    const meta = user.user_metadata || {};
    return meta.display_name || meta.full_name || meta.name || user.email || 'User';
  }

  async function readSession() {
    const stored = await storageGet([STORAGE.SESSION]);
    const session = stored[STORAGE.SESSION];
    return session && session.access_token ? session : null;
  }

  /** Writes the session and the mirrored token together, never one alone. */
  async function writeSession(session) {
    await storageSet({
      [STORAGE.SESSION]: session,
      [STORAGE.TOKEN]: session.access_token,
      username: displayNameOf(session.user),
    });
    return session;
  }

  async function clearSession() {
    await storageRemove([STORAGE.SESSION, STORAGE.TOKEN, 'isPremiumUser', 'username']);
  }

  function isExpired(session) {
    if (!session || typeof session.expires_at !== 'number') return false;
    return session.expires_at - Math.floor(Date.now() / 1000) <= EXPIRY_SKEW_SECONDS;
  }

  // ---------------------------------------------------------------------------
  // Talking to GoTrue
  // ---------------------------------------------------------------------------

  /**
   * Errors are raised as Error with a `code`, matching the web client's
   * authService so the two describe the same failure the same way.
   */
  function describe(payload, status) {
    const code = payload?.error_code || payload?.code || '';
    const message = payload?.msg || payload?.error_description || payload?.message || '';

    if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
      // Deliberately one message for two causes: a wrong password, and an
      // account that has none set. Supabase reports them identically, and
      // separating them would mean an endpoint that reveals who has an account.
      const err = new Error(
        'That email and password did not match. If your account has no password set, use "Forgot password" to choose one.',
      );
      err.code = 'invalid_credentials';
      err.offerPasswordSetup = true;
      return err;
    }

    if (/email not confirmed/i.test(message)) {
      const err = new Error('Please confirm your email address first, then sign in.');
      err.code = 'email_not_confirmed';
      return err;
    }

    if (code === 'user_already_exists' || /already registered/i.test(message)) {
      const err = new Error('An account already exists for that email.');
      err.code = 'user_already_exists';
      return err;
    }

    if (status === 429 || /rate limit|too many/i.test(message)) {
      const err = new Error('Too many attempts. Please wait a moment and try again.');
      err.code = 'rate_limited';
      return err;
    }

    const err = new Error(message || 'Something went wrong. Please try again.');
    err.code = code || 'auth_error';
    return err;
  }

  async function authFetch(path, { method = 'POST', body, token } = {}) {
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };
    // GoTrue wants a bearer even when it is only the anon key.
    headers['Authorization'] = `Bearer ${token || SUPABASE_ANON_KEY}`;

    const response = await fetch(`${AUTH_BASE}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) throw describe(payload, response.status);
    return payload;
  }

  // ---------------------------------------------------------------------------
  // Refreshing
  // ---------------------------------------------------------------------------

  /**
   * The in-flight refresh, if there is one.
   *
   * Refresh tokens rotate: using one twice invalidates the pair and signs the
   * user out. Several parts of the popup ask for a token at once — the credit
   * poller and a generate click can land in the same tick — so concurrent
   * callers share one refresh rather than each spending the token.
   */
  let refreshInFlight = null;

  async function performRefresh(refreshToken) {
    try {
      const payload = await authFetch('/token?grant_type=refresh_token', {
        body: { refresh_token: refreshToken },
      });
      const session = toSession(payload);
      if (!session) throw new Error('Refresh returned no session');
      return writeSession(session);
    } catch (error) {
      // A refresh that fails is a session that is over. Clearing here means the
      // next call sees an anonymous user rather than retrying a dead token.
      await clearSession();
      throw error;
    }
  }

  function refreshSession(refreshToken) {
    if (!refreshInFlight) {
      refreshInFlight = performRefresh(refreshToken).finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  // ---------------------------------------------------------------------------
  // Google
  // ---------------------------------------------------------------------------

  function base64Url(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async function pkcePair() {
    const verifierBytes = crypto.getRandomValues(new Uint8Array(64));
    const verifier = base64Url(verifierBytes);
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return { verifier, challenge: base64Url(new Uint8Array(digest)) };
  }

  function launchWebAuthFlow(url) {
    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow({ url, interactive: true }, (redirectUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message || 'Sign-in was cancelled.'));
          return;
        }
        if (!redirectUrl) {
          reject(new Error('Sign-in was cancelled.'));
          return;
        }
        resolve(redirectUrl);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // The API this module exposes
  // ---------------------------------------------------------------------------

  const pcAuth = {
    readSession,
    clearSession,

    async isSignedIn() {
      return (await readSession()) !== null;
    },

    /**
     * Drops a token left behind by the previous provider.
     *
     * Anyone updating from an earlier build still has a WordPress JWT under
     * `authToken` and no session beside it. Nothing can refresh it and the API
     * will not accept it, so it is retired here rather than left to make the
     * extension look signed in while every call goes out anonymous.
     *
     * Returns true when something was cleared.
     */
    async retireLegacySession() {
      const stored = await storageGet([STORAGE.SESSION, STORAGE.TOKEN]);
      if (stored[STORAGE.SESSION] || !stored[STORAGE.TOKEN]) return false;

      console.info('Clearing a sign-in from the previous backend; please sign in again.');
      await clearSession();
      return true;
    },

    /**
     * The token to send, refreshed if it is close to expiring.
     *
     * Returns null for a signed-out user rather than throwing: most of the API
     * is usable anonymously, and the callers treat a missing token as "send no
     * Authorization header".
     */
    async ensureFreshToken() {
      const session = await readSession();
      if (!session) return null;
      if (!isExpired(session)) return session.access_token;
      if (!session.refresh_token) {
        await clearSession();
        return null;
      }

      try {
        const refreshed = await refreshSession(session.refresh_token);
        return refreshed.access_token;
      } catch {
        return null;
      }
    },

    async signIn(email, password) {
      const payload = await authFetch('/token?grant_type=password', {
        body: { email, password },
      });
      const session = toSession(payload);
      if (!session) throw new Error('Sign-in returned no session.');
      return writeSession(session);
    },

    /**
     * Signs up, and signs in when the project allows it.
     *
     * Email confirmation is on for this project, so there is normally no
     * session yet — the caller is told to go and confirm rather than being left
     * looking at a form that appeared to do nothing.
     */
    async signUp(email, password, displayName) {
      const payload = await authFetch('/signup', {
        body: {
          email,
          password,
          data: displayName ? { display_name: displayName } : {},
        },
      });

      const session = toSession(payload);
      if (session) {
        await writeSession(session);
        return { session, needsConfirmation: false };
      }
      return { session: null, needsConfirmation: true };
    },

    /**
     * Google sign-in, through Supabase rather than Google directly.
     *
     * Supabase's /authorize is what Google already has a registered redirect
     * for, so this needs no Google Cloud change — only the extension's redirect
     * URL on Supabase's allow-list.
     *
     * PKCE by preference. Implicit is handled too because /authorize falls back
     * to returning tokens in the fragment, and a sign-in that half-works is
     * worse than one that handles both shapes.
     */
    async signInWithGoogle() {
      const redirectUri = chrome.identity.getRedirectURL();
      const { verifier, challenge } = await pkcePair();

      const authUrl =
        `${AUTH_BASE}/authorize?provider=google` +
        `&redirect_to=${encodeURIComponent(redirectUri)}` +
        `&code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=s256`;

      const redirectUrl = await launchWebAuthFlow(authUrl);
      const url = new URL(redirectUrl);
      const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));

      const errorDescription =
        url.searchParams.get('error_description') || fragment.get('error_description');
      if (errorDescription) throw new Error(errorDescription);

      let session = toSession({
        access_token: fragment.get('access_token'),
        refresh_token: fragment.get('refresh_token'),
        expires_in: fragment.get('expires_in'),
      });

      if (!session) {
        const code = url.searchParams.get('code') || fragment.get('code');
        if (!code) throw new Error('Google sign-in did not return a session.');
        session = toSession(
          await authFetch('/token?grant_type=pkce', { body: { auth_code: code, code_verifier: verifier } }),
        );
        if (!session) throw new Error('Google sign-in did not return a session.');
      }

      // The implicit path carries no user object, and the greeting needs a name.
      if (!session.user) {
        try {
          session.user = await authFetch('/user', { method: 'GET', token: session.access_token });
        } catch {
          // A missing display name is not worth failing a sign-in over.
        }
      }

      return writeSession(session);
    },

    /** Sends the email that lets someone set a password. */
    async requestPasswordReset(email) {
      await authFetch('/recover', { body: { email } });
      return { sent: true };
    },

    /**
     * Signs out locally, and tells Supabase if it can.
     *
     * The local clear is what matters and happens either way: a network failure
     * must not leave someone looking at a signed-in extension after they asked
     * to leave.
     */
    async signOut() {
      const session = await readSession();
      await clearSession();
      if (!session) return;
      try {
        await authFetch('/logout', { token: session.access_token });
      } catch {
        // Already-invalid tokens 401 here. Nothing to do: it is gone locally.
      }
    },

    displayNameOf,
  };

  global.pcAuth = pcAuth;
})(globalThis);
