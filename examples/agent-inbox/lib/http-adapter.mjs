export class HttpAdapter {
  constructor({ baseUrl, token }) {
    if (!baseUrl || !token) throw new Error("COMMENTARY_BASE_URL and COMMENTARY_TOKEN are required for the HTTP adapter.");
    this.baseUrl = baseUrl.replace(/\/$/u, ""); this.token = token;
  }
  async #request(path, { method = "GET", body, headers = {}, signal } = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, { method, signal, headers: { authorization: `Bearer ${this.token}`, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 202) throw new Error(`${response.status} ${payload?.error?.code ?? "request_failed"}: ${payload?.error?.message ?? "Commentary request failed"}`);
    return { payload, response };
  }
  async create(input) { const { idempotencyKey, correlationId, ...body } = input; const { payload } = await this.#request("/api/v1/interactions", { method: "POST", body, headers: { "Idempotency-Key": idempotencyKey, "X-Correlation-Id": correlationId } }); return payload.data; }
  async status(id) { return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}`)).payload.data; }
  async decisionWait(id, { after, waitMs, signal }) { const query = new URLSearchParams({ waitMs: String(waitMs) }); if (after) query.set("after", after); const { payload } = await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}/decisions?${query}`, { signal }); return { data: payload.data ?? null, retryAfterMs: payload.retryAfterMs ?? 2_000 }; }
  async feedback(id) { return ((await this.status(id)).messages ?? []).filter((item) => item.feedbackType); }
  async revise(id, input) { const { expectedVersion, idempotencyKey, ...body } = input; return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}/revisions`, { method: "POST", body, headers: { "If-Match": `"${id}:v${expectedVersion}"`, "Idempotency-Key": idempotencyKey } })).payload.data; }
  async cancel(id, input) { return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}`, { method: "DELETE", headers: { "If-Match": `"${id}:v${input.expectedVersion}"`, "Idempotency-Key": input.idempotencyKey } })).payload.data; }
  async reportFulfillment(id, { idempotencyKey, ...body }) { return (await this.#request(`/api/v1/interactions/${encodeURIComponent(id)}/fulfillment`, { method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } })).payload.data; }
  async executeFixture() { throw new Error("External execution is never available through the HTTP adapter."); }
}
