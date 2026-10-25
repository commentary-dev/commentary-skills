export async function readRenderer(client) {
  const capabilities = await client.ready;
  if (capabilities.protocol !== 'commentary-tracker-v1' || !['getPermissions', 'getSchema', 'queryRecords'].every(op => capabilities.operations.includes(op))) {
    client.destroy();
    return { fallback: true, code: 'capability_unsupported' };
  }
  try {
    const permissions = await client.getPermissions();
    const schema = await client.getSchema();
    const records = await client.queryRecords({ query: { limit: 25, archived: false } });
    return { permissions, schema, records, fallback: false };
  } finally { client.destroy(); }
}

export async function editRendererRecord(client, { recordId, values, key }, signal) {
  const caps = await client.ready;
  if (caps.protocol !== 'commentary-tracker-v1' || !['getRecord', 'patchRecord'].every(op => caps.operations.includes(op))) return { fallback: true, code: 'capability_unsupported' };
  const current = await client.getRecord({ recordId }, { signal });
  if (!current.etag || !key) throw new Error('Current ETag and exact-intent key required.');
  try {
    return await client.patchRecord({ recordId, schemaRevisionId: current.data.schemaRevisionId, patch: { values } }, { etag: current.etag, idempotencyKey: key, signal });
  } catch (error) {
    return { code: error.code, diagnostics: error.details ?? [], draft: { recordId, values, key, etag: current.etag }, refetchRequired: error.code === 'version_conflict' };
  }
}
export function watchRenderer(client, { signal, reload, onError, budgetMs = 10000 }) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > 60000) throw new Error('Use a finite foreground budget.');
  const stopChanges = client.watchChanges({ signal, onError, onChange: async change => {
    if (change.gap || change.reconciliationRequired) await reload();
  } });
  const stop = () => { clearTimeout(timer); signal?.removeEventListener('abort', stop); stopChanges(); };
  const timer = setTimeout(stop, budgetMs);
  signal?.addEventListener('abort', stop, { once: true });
  if (signal?.aborted) stop();
  return stop;
}
