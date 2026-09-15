export class HttpError extends Error {
  constructor(response, payload, retryAfterMs) {
    super(payload?.error?.message ?? "Commentary request failed.");
    this.name = "HttpError";
    this.status = response.status;
    this.code = payload?.error?.code ?? "request_failed";
    this.retryable = payload?.error?.retryable ?? response.status >= 500;
    this.correlationId = payload?.error?.correlationId ?? response.headers.get("x-correlation-id");
    this.retryAfterMs = retryAfterMs;
  }
}

function retryHint(response, payload) {
  if (Number.isFinite(payload.polling?.retryAfterMs)) return payload.polling.retryAfterMs;
  const header = response.headers.get("retry-after");
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : Math.max(0, Date.parse(header) - Date.now());
}

export class HttpAdapter {
  #approvalCapability;
  constructor({ baseUrl, token, fetchImpl = fetch }) {
    if (!baseUrl || !token) throw new Error("COMMENTARY_BASE_URL and COMMENTARY_TOKEN are required for the HTTP adapter.");
    this.baseUrl = baseUrl.replace(/\/$/u, "");
    this.token = token;
    this.fetch = fetchImpl;
  }
  async #request(path, { method = "GET", body, headers = {}, signal } = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method, signal, headers: {
        authorization: `Bearer ${this.token}`, accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {}), ...headers,
      }, ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let payload;
    try { payload = await response.json(); }
    catch { throw new HttpError(response, { error: { code: "invalid_response", message: "Commentary returned a non-JSON response; check the configured server and advertised API." } }); }
    const retryAfterMs = retryHint(response, payload);
    if (!response.ok) throw new HttpError(response, payload, retryAfterMs);
    return { payload, response, retryAfterMs };
  }
  async create(input) {
    const { idempotencyKey, correlationId, signal, ...body } = input;
    const { payload } = await this.#request("/api/v1/interactions", {
      method: "POST", body, signal, headers: { "Idempotency-Key": idempotencyKey, "X-Correlation-Id": correlationId },
    });
    if (!payload.data?.id) throw new Error("Create response is missing the durable Interaction handle.");
    return payload.data;
  }
  async status(id, options = {}) {
    const { payload, response } = await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}`, options);
    if (!payload.data?.id || !Number.isInteger(payload.data.version)) throw new Error("Invalid Interaction status response.");
    return { ...payload.data, etag: response.headers.get("etag") };
  }
  async decisionWait(id, { after, waitMs, signal, approval = false, decisionId }) {
    if (approval) {
      if (!this.#approvalCapability) {
        this.#approvalCapability = this.#request("/openapi.json", { signal }).then(({ payload }) =>
          payload.paths?.["/api/v1/interactions/{interactionId}/decisions"]?.get?.parameters?.some((parameter) =>
            parameter.in === "query" && parameter.name === "approval") === true);
      }
      if (!await this.#approvalCapability) return { data: null, polling: { approval: { state: "unavailable" } } };
    }
    const query = new URLSearchParams({ waitMs: String(waitMs) });
    if (after) query.set("after", after);
    if (approval) query.set("approval", "true");
    if (decisionId) query.set("decisionId", decisionId);
    const { payload, retryAfterMs } = await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}/decisions?${query}`, { signal });
    return { data: payload.data ?? null, polling: payload.polling, retryAfterMs };
  }
  async feedback(id, options) {
    return ((await this.status(id, options)).messages ?? []).filter((item) => item.feedbackType);
  }
  async revise(id, input) {
    const { expectedVersion, etag, idempotencyKey, signal, ...body } = input;
    if (!etag) throw new Error("Refetch the exact server ETag before revision.");
    return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}/revisions`, {
      method: "POST", body, signal, headers: { "If-Match": etag, "Idempotency-Key": idempotencyKey },
    })).payload.data;
  }
  async cancel(id, { etag, idempotencyKey }) {
    if (!etag) throw new Error("Refetch the exact server ETag before cancellation.");
    return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}`, {
      method: "DELETE", headers: { "If-Match": etag, "Idempotency-Key": idempotencyKey },
    })).payload.data;
  }
  async reportFulfillment(id, { idempotencyKey, signal, ...body }) {
    return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}/fulfillment`, {
      method: "POST", body, signal, headers: { "Idempotency-Key": idempotencyKey },
    })).payload.data;
  }
}
