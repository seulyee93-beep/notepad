function getApiUrl() {
  const url = process.env.TURSO_URL;
  if (!url) throw new Error('TURSO_URL is not set');
  const host = url.replace(/^(libsql|https):\/\//, '');
  return `https://${host}/v2/pipeline`;
}

function toArg(val) {
  if (val === null || val === undefined) return { type: 'null' };
  if (typeof val === 'boolean') return { type: 'integer', value: val ? '1' : '0' };
  if (typeof val === 'number') return { type: 'integer', value: String(val) };
  return { type: 'text', value: String(val) };
}

function fromVal(val) {
  if (!val || val.type === 'null') return null;
  if (val.type === 'integer') return parseInt(val.value, 10);
  if (val.type === 'float') return parseFloat(val.value);
  return val.value;
}

async function execute({ sql, args = [] }) {
  const res = await fetch(getApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TURSO_TOKEN || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: args.map(toArg) } },
        { type: 'close' },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();
  const result = data.results[0];

  if (result.type === 'error') {
    throw new Error(`SQL error: ${result.error.message}`);
  }

  const { cols, rows } = result.response.result;
  const colNames = cols.map(c => c.name);

  return {
    rows: rows.map(row => {
      const obj = {};
      row.forEach((val, i) => { obj[colNames[i]] = fromVal(val); });
      return obj;
    }),
  };
}

module.exports = { execute };
