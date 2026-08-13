#!/usr/bin/env node
/**
 * Classify every {raw, fmt} wrapper the provider returns, so the
 * placeholder-zero discriminator in src/lib/research/yahoo.ts stays
 * empirically grounded rather than assumed.
 *
 *   node scripts/audit-placeholders.mjs
 *
 * A field printed under "placeholder" with real:0 is one the provider
 * strips. A field under "genuine zeros" carries a formatted value and
 * must survive. If a field ever appears in both columns, the fmt===null
 * rule is no longer safe for it and needs revisiting.
 */
const UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";
const r0=await fetch("https://fc.yahoo.com/",{headers:{"User-Agent":UA},redirect:"manual"});
const cookie=(r0.headers.getSetCookie()||[]).map(c=>c.split(";")[0]).join("; ");
const crumb=(await (await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb",{headers:{"User-Agent":UA,Cookie:cookie}})).text()).trim();

const MODS="price,summaryDetail,defaultKeyStatistics,financialData,assetProfile,incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory,calendarEvents,majorHoldersBreakdown";
const SYMS=["NVDA","MSFT","BHP.AX","CBA.AX","INTC","PLTR","IVV.AX","VAS.AX","SPY","QQQ","BRK-B","XYX.AX"];

// Walk every {raw,fmt} wrapper and classify it
const findings = new Map(); // "module.field" -> {zeroNullFmt:0, realZero:0, real:0, empty:0}
function walk(obj, path, out) {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) { obj.forEach((v)=>walk(v, path, out)); return; }
  const keys = Object.keys(obj);
  const isWrapper = keys.includes("raw") || (keys.length===0);
  if (isWrapper) {
    const k = path;
    if (!out.has(k)) out.set(k, {zeroNullFmt:0, realZero:0, real:0, empty:0});
    const s = out.get(k);
    if (keys.length === 0) s.empty++;
    else if (obj.raw === 0 && obj.fmt === null) s.zeroNullFmt++;
    else if (obj.raw === 0) s.realZero++;
    else s.real++;
    return;
  }
  for (const key of keys) walk(obj[key], path ? `${path}.${key}` : key, out);
}

for (const sym of SYMS) {
  try {
    const r = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=${MODS}&crumb=${encodeURIComponent(crumb)}`,{headers:{"User-Agent":UA,Cookie:cookie}});
    if (!r.ok) { console.log(`${sym}: HTTP ${r.status}`); continue; }
    const j = await r.json();
    const res = j?.quoteSummary?.result?.[0];
    if (!res) { console.log(`${sym}: no result`); continue; }
    for (const [mod, val] of Object.entries(res)) walk(val, mod, findings);
  } catch(e){ console.log(`${sym}: ERR ${e.message.slice(0,40)}`); }
}

const rows=[...findings.entries()].filter(([,s])=>s.zeroNullFmt>0).sort((a,b)=>b[1].zeroNullFmt-a[1].zeroNullFmt);
console.log(`\n### FIELDS THAT RETURN {raw:0, fmt:null} — a placeholder, not a zero (${rows.length} fields)\n`);
for (const [k,s] of rows.slice(0,45)) {
  console.log(`  ${k.padEnd(52)} placeholder:${String(s.zeroNullFmt).padStart(3)}  real:${String(s.real).padStart(3)}  trueZero:${s.realZero}  empty:${s.empty}`);
}
const trueZeros=[...findings.entries()].filter(([,s])=>s.realZero>0);
console.log(`\n### fields with raw:0 AND a formatted value (genuine zeros): ${trueZeros.length}`);
for (const [k,s] of trueZeros.slice(0,12)) console.log(`  ${k.padEnd(52)} trueZero:${s.realZero}`);
