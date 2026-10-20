const $ = (id) => document.getElementById(id);
const state = { variables: 4, mode: "minterm", selected: new Set() };
const gray = [[0],[0,1],[0,1,3,2],[0,1,3,2]];

function bits(n, width) { return n.toString(2).padStart(width, "0"); }
function vars() { return ["A","B","C","D"].slice(0, state.variables); }
function allIndices() { return Array.from({length: 2 ** state.variables}, (_, i) => i); }
function isOn(index) {
  return state.mode === "minterm" ? state.selected.has(index) : !state.selected.has(index);
}
function outputIndices() { return allIndices().filter(isOn); }
function termIndices() { return [...state.selected].sort((a,b)=>a-b); }
function selectedLabel() { return state.mode === "minterm" ? "MINTERMS" : "MAXTERMS"; }

function buildKmap() {
  const n = state.variables;
  const rowBits = n === 2 ? 1 : 2;
  const colBits = n - rowBits;
  const rowCount = 2 ** rowBits, colCount = 2 ** colBits;
  const rowGray = rowBits === 1 ? [0,1] : [0,1,3,2];
  const colGray = colBits === 1 ? [0,1] : colBits === 2 ? [0,1,3,2] : [0,1,3,2];
  const v = vars();
  let html = `<table class="kmap-table" aria-label="Karnaugh map"><thead><tr><th class="corner">${n===2 ? 'A' : v.slice(0,rowBits).join('')}</th>`;
  colGray.forEach(c => html += `<th>${bits(c,colBits)}</th>`);
  html += `</tr></thead><tbody>`;
  rowGray.forEach(r => {
    html += `<tr><th>${bits(r,rowBits)}</th>`;
    colGray.forEach(c => {
      const idx = (r << colBits) | c;
      const on = isOn(idx);
      const cls = on ? (state.mode === "maxterm" ? "zero-selected" : "one") : "";
      html += `<td><button type="button" class="kcell ${cls}" data-index="${idx}" aria-label="Minterm ${idx}, value ${on?1:0}" aria-pressed="${on}"><span class="cell-index">${idx}</span><span class="cell-value">${on?1:0}</span></button></td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  $("kmap").innerHTML = html;
  $("kmap").querySelectorAll(".kcell").forEach(btn => btn.addEventListener("click", () => {
    const idx = Number(btn.dataset.index);
    if (state.selected.has(idx)) state.selected.delete(idx); else state.selected.add(idx);
    render();
  }));
}

function combineTerms(a, b) {
  let diff = -1;
  for (let i=0;i<a.length;i++) {
    if (a[i] !== b[i]) {
      if (a[i] === "-" || b[i] === "-") return null;
      if (diff !== -1) return null;
      diff = i;
    }
  }
  if (diff === -1) return null;
  return a.slice(0,diff) + "-" + a.slice(diff+1);
}
function covers(pattern, index) {
  const b = bits(index, pattern.length);
  return pattern.split("").every((ch,i)=>ch==="-" || ch===b[i]);
}
function literalCount(p) { return [...p].filter(x=>x!=="-").length; }
function implicantsFor(minterms) {
  if (!minterms.length) return [];
  let current = [...new Set(minterms)].map(n=>bits(n,state.variables));
  const primes = new Set();
  while (current.length) {
    const used = new Set(), next = new Set();
    for (let i=0;i<current.length;i++) for (let j=i+1;j<current.length;j++) {
      const c = combineTerms(current[i],current[j]);
      if (c !== null) { used.add(current[i]); used.add(current[j]); next.add(c); }
    }
    current.forEach(p=>{if(!used.has(p)) primes.add(p);});
    current = [...next];
  }
  return [...primes].filter(p=>minterms.some(m=>covers(p,m)));
}
function minimize(minterms) {
  const universe = [...new Set(minterms)].sort((a,b)=>a-b);
  if (!universe.length) return [];
  const primes = implicantsFor(universe).sort((a,b)=>literalCount(a)-literalCount(b));
  const coverMap = new Map(universe.map(m=>[m, primes.filter(p=>covers(p,m))]));
  const chosen = new Set();
  // Essential prime implicants first.
  for (const m of universe) {
    const candidates = coverMap.get(m);
    if (candidates.length === 1) chosen.add(candidates[0]);
  }
  const covered = new Set();
  const markCovered = () => { chosen.forEach(p=>universe.forEach(m=>{if(covers(p,m))covered.add(m)})); };
  markCovered();
  // Greedy cover is exact enough for small educational K-maps and favors fewer literals.
  while (universe.some(m=>!covered.has(m))) {
    let best = null, bestScore = -Infinity;
    for (const p of primes) {
      if (chosen.has(p)) continue;
      const gain = universe.filter(m=>!covered.has(m)&&covers(p,m)).length;
      const score = gain * 10 - literalCount(p);
      if (score > bestScore) {bestScore=score;best=p;}
    }
    if (!best || bestScore < 0) break;
    chosen.add(best); universe.forEach(m=>{if(covers(best,m))covered.add(m)});
  }
  return [...chosen];
}
function patternTerm(pattern, pos=false) {
  const v = vars(); const parts=[];
  pattern.split("").forEach((bit,i)=>{
    if(bit==="-") return;
    if(!pos) parts.push(bit==="1" ? v[i] : v[i]+"'"); 
    else parts.push(bit==="0" ? v[i] : v[i]+"'");
  });
  if (!parts.length) return pos ? "(0)" : "1";
  return pos ? `(${parts.join(" + ")})` : parts.join("");
}
function expressionText() {
  const n = state.variables, ones = outputIndices();
  if (ones.length === 0) return "F = 0";
  if (ones.length === 2**n) return "F = 1";
  const wantSop = state.mode === "minterm";
  const target = wantSop ? ones : allIndices().filter(i=>!isOn(i));
  const patterns = minimize(target);
  const expr = patterns.map(p=>patternTerm(p,!wantSop)).join(wantSop ? " + " : "");
  return `F = ${expr || (wantSop ? "0" : "1")}`;
}
function renderTruthTable() {
  const v = vars();
  let html = `<thead><tr>${v.map(x=>`<th>${x}</th>`).join("")}<th>F</th></tr></thead><tbody>`;
  allIndices().forEach(i=>{
    const b=bits(i,state.variables);
    html += `<tr>${[...b].map(x=>`<td>${x}</td>`).join("")}<td class="${isOn(i)?"output-one":"output-zero"}">${isOn(i)?1:0}</td></tr>`;
  });
  $("truthTable").innerHTML=html+"</tbody>";
}
function render() {
  buildKmap(); renderTruthTable();
  const n=2**state.variables, chosen=termIndices();
  $("cellCount").textContent = `${chosen.length} / ${n} selected`;
  $("mapSubtitle").textContent = `${state.variables} variables · ${n} ${state.mode === "minterm" ? "minterms" : "maxterms"}`;
  $("indicesLabel").textContent = selectedLabel();
  $("indicesOutput").textContent = `${state.mode==="minterm"?"Σm":"ΠM"}(${chosen.join(", ")})`;
  $("expressionTypeLabel").textContent = state.mode==="minterm" ? "SUM OF PRODUCTS (SOP)" : "PRODUCT OF SUMS (POS)";
  $("expression").textContent=expressionText();
  $("modeHelp").textContent=state.mode==="minterm" ? "Select the cells where F = 1. The simulator minimizes the Sum of Products (SOP)." : "Select the cells where F = 0. The simulator minimizes the Product of Sums (POS).";
}
function toast(msg) {
  $("toast").textContent=msg; $("toast").classList.add("show");
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>$("toast").classList.remove("show"),1800);
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
  catch { const el=document.createElement("textarea");el.value=text;document.body.appendChild(el);el.select();document.execCommand("copy");el.remove();toast("Copied to clipboard");}
}
document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{
  state.mode=btn.dataset.mode;
  document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b===btn));
  state.selected.clear(); render();
}));
$("variables").addEventListener("change",e=>{state.variables=Number(e.target.value);state.selected.clear();render();});
$("clearBtn").addEventListener("click",()=>{state.selected.clear();render();});
$("randomBtn").addEventListener("click",()=>{state.selected.clear();allIndices().forEach(i=>{if(Math.random()>.5)state.selected.add(i)});render();});
$("resetBtn").addEventListener("click",()=>{state.variables=4;state.mode="minterm";state.selected.clear();$("variables").value="4";document.querySelectorAll(".segment").forEach(b=>b.classList.toggle("active",b.dataset.mode==="minterm"));render();});
$("copyIndices").addEventListener("click",()=>copy($("indicesOutput").textContent));
$("copyExpression").addEventListener("click",()=>copy($("expression").textContent));
$("downloadCsv").addEventListener("click",()=>{
  const v=vars();const rows=[[...v,"F"].join(",")];
  allIndices().forEach(i=>rows.push([...bits(i,state.variables),isOn(i)?1:0].join(",")));
  const blob=new Blob([rows.join("\r\n")],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`kmap-${state.variables}-variable-truth-table.csv`;a.click();URL.revokeObjectURL(url);
});
render();