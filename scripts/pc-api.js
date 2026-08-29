// pc-api.js
//
// Calling the API, and classifying what comes back.
//
// Every request the extension makes goes through here so that three things are
// decided in one place rather than thirteen: which host is called, whether an
// Authorization header is attached, and what a refusal means.

(function (global) {
  const { API_BASE } = global.PC_CONFIG;

  /**
   * Refused for want of credit, rather than because anything went wrong.
   *
   * The distinction is not cosmetic. Out of credits should offer a way forward —
   * sign in, or upgrade — while a genuine failure should offer a retry. Treating
   * the first as the second produces a retry loop against an endpoint that can
   * only keep refusing, which is exactly the bug that shipped on the website.
   */
  const CREDIT_LIMIT_CODES = new Set([
    'anonymous_limit_reached',
    'insufficient_credits',
    'usage_limit_reached',
  ]);

  /** Needing a paid plan, regardless of credit. */
  const PREMIUM_CODES = new Set(['premium_required', 'video_requires_pro']);

  const pcApi = {
    url(path) {
      return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
    },

    /**
     * Headers for an API call, with a fresh token when there is a session.
     *
     * Signed out is not an error: most of the API serves anonymous callers on a
     * daily allowance, so the header is simply omitted.
     */
    async headers(extra) {
      const headers = { 'Content-Type': 'application/json', ...(extra || {}) };
      const token = await global.pcAuth.ensureFreshToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return headers;
    },

    /** As above, for multipart bodies, where the browser must set the type. */
    async authOnlyHeaders() {
      const headers = {};
      const token = await global.pcAuth.ensureFreshToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return headers;
    },

    /**
     * Out of credits.
     *
     * The code is the API's own answer and is checked first. 402 is the status
     * that accompanies it — the previous API used 429 for this, which is why
     * the extension checked for 429 everywhere and now checks here instead.
     *
     * 429 is deliberately NOT treated as a credit limit, which is where this
     * parts company with the web client's apiErrors.js. On this API a 429 is
     * `provider_rate_limited`: the generation service is briefly busy. That
     * clears on its own, and answering it with "you are out of credits, please
     * upgrade" would be a lie told to a paying customer.
     */
    isCreditLimit(response, data) {
      const code = data && data.code;
      if (code && CREDIT_LIMIT_CODES.has(code)) return true;
      return response && response.status === 402;
    },

    /** The feature itself needs a paid plan. */
    isPremiumRequired(response, data) {
      const code = data && data.code;
      if (code && PREMIUM_CODES.has(code)) return true;
      if (response && response.status === 403) return true;
      // The API words these refusals with "premium", and the popup keyed off
      // that long before there were error codes.
      return typeof data?.error === 'string' && data.error.includes('premium');
    },

    /** Repeating the request cannot change the answer. */
    isTerminal(response, data) {
      return pcApi.isCreditLimit(response, data) || pcApi.isPremiumRequired(response, data);
    },

    /**
     * The session is over.
     *
     * Clears it, so the next call goes out anonymous instead of re-sending a
     * token the API has already rejected.
     */
    async isSessionExpired(response) {
      if (!response || response.status !== 401) return false;
      await global.pcAuth.clearSession();
      return true;
    },

    /** The message the API sent, if it sent one. */
    errorMessage(data, fallback = 'An error occurred. Please try again.') {
      const message = data && data.error;
      return typeof message === 'string' && message ? message : fallback;
    },

    /**
     * One request, with headers attached and the body parsed.
     *
     * Returns the response alongside the parsed body rather than throwing,
     * because every caller needs to tell a credit refusal from a failure and
     * that decision reads better at the call site than in a catch block.
     */
    async request(path, options = {}) {
      const { body, multipart, ...rest } = options;
      const headers = multipart
        ? { ...(await pcApi.authOnlyHeaders()), ...(rest.headers || {}) }
        : { ...(await pcApi.headers()), ...(rest.headers || {}) };

      const response = await fetch(pcApi.url(path), {
        ...rest,
        headers,
        ...(body === undefined ? {} : { body: multipart ? body : JSON.stringify(body) }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // Not every response has a body, and a parse failure should surface as
        // the status it came with rather than as a thrown SyntaxError.
        data = null;
      }

      return { response, data, ok: response.ok };
    },
  };

  global.pcApi = pcApi;
})(globalThis);
