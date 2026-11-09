/* VRI Sales Hub: clickable design prototype. Nothing is saved; all people and amounts are examples.
   Project unit totals and sold counts are the real figures from vridevelopments.com (3 Nov 2026). */
(function(){
const $=s=>document.querySelector(s);
const eur=n=>"€"+n.toLocaleString("en-GB");
const ini=n=>n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

const TEAM={HA:{name:"Hanane",role:"Sales manager",langs:"EN · SR · DE"},AL:{name:"Alina",role:"Sales, Russian",langs:"RU"},JO:{name:"Joe",role:"Sales, English",langs:"EN"},NI:{name:"Nicole",role:"Sales, Greek",langs:"EL"},AR:{name:"Artak",role:"Sales, Armenian",langs:"HY"}};

const PROJECTS=[
  {k:"V27",name:"Victoria 27",loc:"Livadia, Larnaca",dates:"Dec 2026 to Oct 2028",total:39,sold:30,blocks:["A","B","C"],img:"aerial",stage:1},
  {k:"V28",name:"Victoria 28",loc:"Livadia, Larnaca",dates:"Mar 2027 to Apr 2029",total:37,sold:23,blocks:["A","B"],img:"hero",stage:0},
  {k:"V29",name:"Victoria 29",loc:"Vergina, Larnaca",dates:"Mar 2027 to May 2028",total:8,sold:2,blocks:["A"],img:"v23",stage:0},
  {k:"V30",name:"Victoria 30",loc:"Vergina, Larnaca",dates:"Mar 2027 to May 2028",total:22,sold:4,blocks:["A","B"],img:"v23",stage:0},
  {k:"V31",name:"Victoria 31",loc:"Vergina, Larnaca",dates:"Mar 2027 to May 2028",total:40,sold:6,blocks:["A","B"],img:"aerial",stage:0},
  {k:"V32",name:"Victoria 32",loc:"Livadia, Larnaca",dates:"Dates to be set",total:34,sold:4,blocks:["A","B"],img:"hero",stage:0},
  {k:"V33",name:"Victoria 33",loc:"Paralimni",dates:"Jul 2027 to Sep 2029",total:42,sold:5,blocks:["A","B","C"],img:"aerial",stage:0}
];

// status: new, con (contacted), meet, res (reserved), contract, lost
const LEADS=[
  {n:"Milica Jovanović",l:"SR",c:"Belgrade",p:"Victoria 28",b:180000,ad:"SR | Payment Plan",o:"HA",s:"new",ago:"4 min",wait:true,hot:true,want:"2 bed"},
  {n:"Dimitris Kyriakou",l:"EL",c:"Limassol",p:"Victoria 31",b:160000,ad:"GR | V31 Launch",o:"NI",s:"new",ago:"18 min",wait:true,want:"2 bed"},
  {n:"Olga Petrenko",l:"RU",c:"Limassol",p:"Victoria 27",b:150000,ad:"RU | V28 Alina",o:"AL",s:"con",ago:"22 min",want:"1 bed"},
  {n:"Stefan Nikolić",l:"SR",c:"Novi Sad",p:"Victoria 28",b:140000,ad:"SR | Payment Plan",o:"HA",s:"new",ago:"1 h",wait:true,want:"1 bed"},
  {n:"Anahit Sargsyan",l:"HY",c:"Yerevan",p:"Victoria 28",b:140000,ad:"AM | Artak V28 & V27",o:"AR",s:"con",ago:"1 h",want:"2 bed"},
  {n:"Andreas Georgiou",l:"EL",c:"Larnaca",p:"Victoria 27",b:220000,ad:"GR | V28 Nicole",o:"NI",s:"meet",ago:"3 h",hot:true,want:"3 bed"},
  {n:"Thomas Keller",l:"DE",c:"Munich",p:"Victoria 28",b:250000,ad:"DE | VAT 5%",o:"HA",s:"con",ago:"Yesterday",want:"2 bed"},
  {n:"Mark Ellison",l:"EN",c:"London",p:"Victoria 27",b:130000,ad:"EN | V27 video",o:"JO",s:"con",ago:"Yesterday",cold:true,want:"1 bed",note:"No answer ×3"},
  {n:"Irina Volkova",l:"RU",c:"Paphos",p:"Victoria 33",b:310000,ad:"RU | Sea view",o:"AL",s:"meet",ago:"2 days",hot:true,want:"3 bed"},
  {n:"Dragan Marković",l:"SR",c:"Belgrade",p:"Victoria 30",b:170000,ad:"SR | Investment",o:"HA",s:"meet",ago:"2 days",want:"2 bed"},
  {n:"Gayane Hakobyan",l:"HY",c:"Larnaca",p:"Victoria 29",b:120000,ad:"AM | Artak V28 & V27",o:"AR",s:"con",ago:"3 days",want:"1 bed"},
  {n:"Christos Panayiotou",l:"EL",c:"Nicosia",p:"Victoria 32",b:195000,ad:"GR | Family homes",o:"NI",s:"con",ago:"3 days",cold:true,want:"3 bed",note:"Quiet 6 days"},
  {n:"Elena Vasileva",l:"RU",c:"Limassol",p:"Victoria 27",b:168000,ad:"RU | V28 Alina",o:"AL",s:"res",ago:"1 week",unit:"C-302",want:"2 bed"},
  {n:"Nikos Papadopoulos",l:"EL",c:"Larnaca",p:"Victoria 29",b:139000,ad:"GR | V28 Nicole",o:"NI",s:"res",ago:"1 week",unit:"A-104",want:"1 bed"},
  {n:"Sarah Whitfield",l:"EN",c:"Manchester",p:"Victoria 28",b:214000,ad:"EN | V28 tour",o:"JO",s:"contract",ago:"8 months",unit:"A-401",want:"2 bed"},
  {n:"Lukas Brandt",l:"DE",c:"Hamburg",p:"Victoria 31",b:205000,ad:"DE | VAT 5%",o:"HA",s:"con",ago:"4 days",want:"2 bed"},
  {n:"Ana Petrović",l:"SR",c:"Niš",p:"Victoria 28",b:150000,ad:"SR | Investment",o:"HA",s:"lost",ago:"2 weeks",want:"1 bed",note:"Bought elsewhere"},
  {n:"James O'Connor",l:"EN",c:"Dublin",p:"Victoria 33",b:240000,ad:"EN | Paralimni",o:"JO",s:"new",ago:"2 h",wait:true,want:"2 bed"}
];
const ST={new:["new","New"],con:["con","Contacted"],meet:["meet","Meeting"],res:["res","Reserved"],contract:["ok","Contract"],lost:["lost","Lost"]};
const stTag=l=>`<span class="st ${ST[l.s][0]}">${l.note||ST[l.s][1]}</span>`;
const owner=k=>`<span class="who"><span class="av s">${k}</span>${TEAM[k].name}</span>`;

const NAV=[
  {g:"Sales"},
  {k:"dashboard",t:"Dashboard",i:"◧"},
  {k:"leads",t:"Leads",i:"✉",c:4},
  {k:"pipeline",t:"Pipeline",i:"▤"},
  {k:"clients",t:"Clients",i:"☺"},
  {k:"calendar",t:"Calendar",i:"▦",c:3},
  {g:"Projects"},
  {k:"units",t:"Projects & units",i:"⌂"},
  {k:"construction",t:"Construction updates",i:"⚒"},
  {g:"After the sale"},
  {k:"payments",t:"Buyers & payments",i:"€",c:2},
  {k:"documents",t:"Documents",i:"▣"},
  {g:"Growth"},
  {k:"marketing",t:"Ads to sales",i:"↗"},
  {k:"partners",t:"Partner agents",i:"⇄"},
  {g:"Admin"},
  {k:"team",t:"Team & settings",i:"⚙"}
];

function note(phase,items){
  const tag=phase===1?'<span class="ph1">First version</span>':'<span class="ph2">Later phase</span>';
  return `<div class="note"><div class="nh"><b>What this section does</b>${tag}</div><ul>${items.map(i=>`<li>${i}</li>`).join("")}</ul></div>`;
}
function head(t,sub,acts=""){return `<div class="ph"><div><h1>${t}</h1>${sub?`<p class="sub">${sub}</p>`:""}</div><div class="acts">${acts}</div></div>`}
const img=k=>`img/${k}.jpg`;

const PAGES={};

/* ---------- Dashboard ---------- */
PAGES.dashboard=()=>{
  const left=PROJECTS.reduce((a,p)=>a+p.total-p.sold,0);
  const langs=[["Cyprus EN/GR",192],["Serbian",93],["Russian",32],["German",22],["Armenian",14]];
  const max=192;
  return head("Good morning, Hanane","Thursday 5 November · here is what needs you today")+
  note(1,["The first screen every morning. Management sees the whole office, each salesperson sees their own numbers.","Shows who is waiting for a reply, today's meetings and tasks, and how this month compares to last.","Every number is clickable and opens the list behind it."])+
  `<div class="kpis">
    <div class="kpi y"><span>New leads today</span><b class="num">6</b><i>4 still waiting for a call</i></div>
    <div class="kpi"><span>Meetings this week</span><b class="num">9</b><i class="up">▲ 3 vs last week</i></div>
    <div class="kpi"><span>Reserved this month</span><b class="num">3</b><i class="muted">€521,000 in value</i></div>
    <div class="kpi"><span>Average first reply</span><b class="num">38 min</b><i class="up">▲ faster than October</i></div>
    <div class="kpi"><span>Units available</span><b class="num">${left}</b><i class="muted">across 7 projects</i></div>
  </div>
  <div class="g21">
    <div class="card"><h3>Waiting for a first call <a href="#leads">All leads →</a></h3>
      <div class="scroll"><table class="t"><thead><tr><th>Lead</th><th>Lang</th><th>Project</th><th>Owner</th><th class="r">Waiting</th></tr></thead><tbody>
      ${LEADS.filter(l=>l.wait).map(l=>`<tr class="go" data-go="client/${LEADS.indexOf(l)}"><td><div class="who"><span class="av y">${ini(l.n)}</span><b>${l.n}</b></div></td><td><span class="lang">${l.l}</span></td><td>${l.p}</td><td>${owner(l.o)}</td><td class="r wait">${l.ago}</td></tr>`).join("")}
      </tbody></table></div></div>
    <div class="card"><h3>Today <span>4 tasks</span></h3><div class="list">
      <div class="li"><span class="ck"></span><div class="tx"><b>10:00 · Site visit, Victoria 27</b><div>Andreas Georgiou and family · Nicole</div></div></div>
      <div class="li"><span class="ck"></span><div class="tx"><b>12:30 · Video call</b><div>Irina Volkova · Victoria 33 sea view · Alina</div></div></div>
      <div class="li"><span class="ck"></span><div class="tx"><b>Send contract draft</b><div>Elena Vasileva · V27 C-302</div></div></div>
      <div class="li"><span class="ck"></span><div class="tx"><b>Follow up, quiet 6 days</b><div>Christos Panayiotou · Nicole</div></div></div>
    </div></div>
  </div>
  <div class="g3">
    <div class="card"><h3>Enquiries by language <span>since August</span></h3><div class="bars">
      ${langs.map(([k,v])=>`<div class="bar"><span>${k}</span><span class="tr"><i style="width:${v/max*100}%"></i></span><span class="n">${v}</span></div>`).join("")}
    </div></div>
    <div class="card"><h3>This month's funnel <a href="#marketing">Report →</a></h3><div class="funnel">
      <div class="fr"><span>Enquiries</span><span class="tr"><i style="width:100%"></i></span><span class="n">64</span></div>
      <div class="fr"><span>Reached</span><span class="tr"><i style="width:72%"></i></span><span class="n">46</span></div>
      <div class="fr"><span>Meetings</span><span class="tr"><i style="width:19%"></i></span><span class="n">12</span></div>
      <div class="fr"><span>Reserved</span><span class="tr"><i class="d" style="width:5%"></i></span><span class="n">3</span></div>
    </div></div>
    <div class="card"><h3>Team this week</h3><div class="list">
      ${[["HA",14,4,1],["AL",8,3,1],["NI",9,2,1],["JO",6,0,0],["AR",4,0,0]].map(([k,a,m,r])=>`<div class="li"><span class="av s">${k}</span><div class="tx"><b>${TEAM[k].name}</b><div>${a} leads · ${m} meetings · ${r} reserved</div></div></div>`).join("")}
    </div></div>
  </div>
  <div class="card"><h3>Latest activity</h3><div class="list">
    <div class="li"><span class="dot"></span><div class="tx"><b>Milica Jovanović</b> filled the form on Instagram<div>SR | Payment Plan · auto-reply sent in Serbian · 4 min ago</div></div></div>
    <div class="li"><span class="dot g"></span><div class="tx"><b>Nikos Papadopoulos</b> reserved Victoria 29, A-104<div>Nicole · deposit €5,000 received · 1 week ago</div></div></div>
    <div class="li"><span class="dot b"></span><div class="tx"><b>Construction update</b> sent to 23 buyers of Victoria 27<div>Foundations complete · drone video · opened by 19</div></div></div>
  </div></div>`;
};

/* ---------- Leads ---------- */
let leadF="all";
PAGES.leads=()=>{
  const F=[["all","All"],["wait","Waiting"],["HA","Mine"],["SR","Serbian"],["RU","Russian"],["EL","Greek"],["DE","German"],["HY","Armenian"],["EN","English"]];
  const rows=LEADS.filter(l=>l.s!=="contract").filter(l=>leadF==="all"||(leadF==="wait"&&l.wait)||l.o===leadF||l.l===leadF);
  return head("Leads",`${LEADS.length} open · every Meta, website and WhatsApp enquiry in one list`,'<button class="btn ghost" type="button">Import from sheet</button><button class="btn" type="button">+ New lead</button>')+
  note(1,["Leads arrive straight from your Meta forms in all 5 languages, plus the website form and WhatsApp.","Each lead goes to a salesperson by language: Russian to Alina, Armenian to Artak, Greek to Nicole, English to Joe, Serbian and German to Hanane. The rules are yours to change.","A first WhatsApp goes out in the lead's language with the right brochure, within a minute.","The same person from two ads becomes one client. All 353 enquiries from the current sheet are imported on day one."])+
  `<div class="card"><div class="bar-row" style="margin-bottom:12px"><div class="chips">${F.map(([k,t])=>`<button class="chip" type="button" data-lf="${k}" aria-pressed="${leadF===k}">${t}</button>`).join("")}</div><span class="muted sm">${rows.length} shown</span></div>
  <div class="scroll"><table class="t"><thead><tr><th>Lead</th><th>Lang</th><th>Project</th><th>Looking for</th><th class="r">Budget</th><th>From ad</th><th>Owner</th><th>Status</th><th class="r">Came in</th></tr></thead><tbody>
  ${rows.map(l=>`<tr class="go" data-go="client/${LEADS.indexOf(l)}"><td><div class="who"><span class="av ${l.hot?"y":""}">${ini(l.n)}</span><div><b>${l.n}</b><div class="muted sm">${l.c}</div></div></div></td><td><span class="lang">${l.l}</span></td><td>${l.p}</td><td>${l.want}</td><td class="r num">${eur(l.b)}</td><td class="muted">${l.ad}</td><td>${owner(l.o)}</td><td>${stTag(l)}</td><td class="r ${l.wait?"wait":"muted"}">${l.ago}</td></tr>`).join("")}
  </tbody></table></div></div>`;
};

/* ---------- Pipeline ---------- */
PAGES.pipeline=()=>{
  const cols=[["new","New",12,2140000],["con","Contacted",18,3260000],["meet","Meeting",6,1120000],["res","Reserved",2,307000],["contract","Contract signed",1,214000],["lost","Lost",4,610000]];
  return head("Pipeline","All projects · drag a client to move them",'<div class="chips"><button class="chip" aria-pressed="true" type="button">All</button><button class="chip" type="button" aria-pressed="false">V27</button><button class="chip" type="button" aria-pressed="false">V28</button><button class="chip" type="button" aria-pressed="false">V29 to V33</button></div>')+
  note(1,["Every client in one board, from first enquiry to signed contract.","Each column shows how many people and how much value it holds, so management sees next month's sales without asking.","Clients who go quiet too long turn red before they go cold.","Moving a client to Reserved also reserves the unit on the availability board. Stage names are yours."])+
  `<div class="scroll"><div class="kb">${cols.map(([s,t,n,v])=>{
    const ls=LEADS.filter(l=>l.s===s);
    return `<div class="col"><h4>${t}<span>${n}</span></h4><div class="val">${eur(v)}</div>
    ${ls.map(l=>`<div class="kc ${l.hot?"hot":""} ${l.cold?"cold":""}" data-go="client/${LEADS.indexOf(l)}"><b>${l.n}</b><div class="r"><span>${l.p.replace("Victoria ","V")}${l.unit?" · "+l.unit:" · "+l.want}</span><span class="lang">${l.l}</span></div><div class="r"><span>${TEAM[l.o].name}</span><span class="num">${eur(l.b)}</span></div>${l.note?`<div class="r"><span class="${l.cold?"wait":""}">${l.note}</span></div>`:""}</div>`).join("")}
    ${n>ls.length?`<div class="muted sm" style="padding:2px 4px">+${n-ls.length} more</div>`:""}</div>`}).join("")}</div></div>`;
};

/* ---------- Clients list + client file ---------- */
PAGES.clients=()=>head("Clients","Everyone who has ever enquired, reserved or bought")+
  note(1,["One record per person, with every call, WhatsApp, meeting, document and payment.","Search by name, phone, project or unit. Filter by language, budget, nationality or stage.","Click any client to open their file."])+
  `<div class="card"><div class="scroll"><table class="t"><thead><tr><th>Client</th><th>Country</th><th>Lang</th><th>Interest</th><th>Stage</th><th>Owner</th><th>Last contact</th></tr></thead><tbody>
  ${LEADS.map((l,i)=>`<tr class="go" data-go="client/${i}"><td><div class="who"><span class="av">${ini(l.n)}</span><b>${l.n}</b></div></td><td>${l.c}</td><td><span class="lang">${l.l}</span></td><td>${l.p}${l.unit?" · "+l.unit:""}</td><td>${stTag(l)}</td><td>${owner(l.o)}</td><td class="muted">${l.ago} ago</td></tr>`).join("")}
  </tbody></table></div></div>`;

PAGES.client=(id)=>{
  const l=LEADS[+id]||LEADS[0];
  return `<div class="sm"><a href="#leads" class="muted">← Leads</a></div>`+
  head(l.n,`${l.c} · ${({SR:"Serbian",RU:"Russian",EL:"Greek",DE:"German",HY:"Armenian",EN:"English"})[l.l]} · owner ${TEAM[l.o].name}`,`<button class="btn ghost" type="button">Call</button><button class="btn ghost" type="button">Email</button><button class="btn" type="button">WhatsApp</button>`)+
  note(1,["The whole story of one buyer on one page, so anyone on the team can pick up the conversation.","Every lead has a next step with a date. The owner gets a reminder when it is due.","Brochures, floor plans, price lists and our project videos are ready to send from here, in the client's language."])+
  `<div class="g21">
    <div class="card"><div class="tabs"><span class="on">Timeline</span><span>Notes</span><span>Documents</span><span>Payments</span></div>
      <div class="composer" style="margin-bottom:16px"><span>Write a note or log a call…</span><button class="btn" type="button">Save</button></div>
      <div class="tl">
        <div class="ev"><i class="g"></i><p><b>Video call booked with the sales office</b><span>Thu 14:00 · reminder set for both</span></p></div>
        <div class="ev"><i></i><p><b>Sent the ${l.p} video and floor plan ${l.unit||"B-204"}</b><span>${TEAM[l.o].name} · Mon 10:52</span></p></div>
        <div class="ev"><i class="b"></i><p><b>Call, 7 min.</b> Wants a ${l.want}, payment plan matters most, ready by 2029 is fine.<span>${TEAM[l.o].name} · Mon 10:40</span></p></div>
        <div class="ev"><i></i><p><b>Auto-reply sent on WhatsApp</b> with the ${l.p} brochure<span>Automatic · Mon 09:12</span></p></div>
        <div class="ev"><i class="y"></i><p><b>Filled the form on Instagram</b><span>Ad "${l.ad}" · Mon 09:12</span></p></div>
      </div></div>
    <div style="display:grid;gap:18px;align-content:start">
      <div class="nextbox"><b>Next step · Thu 14:00</b>Video call, walk through ${l.unit||"B-204"} and the payment plan.</div>
      <div class="card"><div class="thumb" style="margin-bottom:12px"><img src="${img("living")}" alt="Victoria interior render"></div>
        <dl class="kv"><dt>Stage</dt><dd>${stTag(l)}</dd><dt>Interested in</dt><dd>${l.p}</dd><dt>Looking for</dt><dd>${l.want}</dd><dt>Budget</dt><dd class="num">${eur(l.b)}</dd><dt>Purpose</dt><dd>Investment</dd><dt>Source</dt><dd>${l.ad}</dd><dt>Phone</dt><dd class="mono">+00 000 000 000</dd></dl></div>
      <div class="card"><h3>Send in one click</h3><div class="acts-row"><button class="btn ghost" type="button">Brochure</button><button class="btn ghost" type="button">Price list</button><button class="btn ghost" type="button">Floor plan</button><button class="btn ghost" type="button">Project video</button></div></div>
    </div>
  </div>`;
};

/* ---------- Calendar ---------- */
PAGES.calendar=()=>{
  const days=["Mon 2","Tue 3","Wed 4","Thu 5","Fri 6","Sat 7"], hrs=["09:00","10:00","11:00","12:00","14:00","16:00","17:00"];
  const ev={"3-1":["v","Site visit V27","Andreas G. · Nicole"],"3-3":["c","Video call","Irina V. · Alina"],"3-4":["c","Video call, B-204","Milica J. · Hanane"],"0-0":["o","Contract signing","Sarah W. · Joe"],"1-2":["v","Office meeting","Dragan M. · Hanane"],"4-1":["v","Site visit V31","Lukas B. · Hanane"],"4-5":["c","Video call","Anahit S. · Artak"],"2-4":["v","Show flat V28","Thomas K. · Hanane"],"5-1":["v","Site visit V33","James O. · Joe"]};
  let g=`<div class="hd"></div>`+days.map((d,i)=>`<div class="hd ${i===3?"today":""}">${d}</div>`).join("");
  hrs.forEach((h,r)=>{g+=`<div class="tm">${h}</div>`+days.map((d,c)=>{const e=ev[c+"-"+r];return `<div class="cell">${e?`<div class="ev-b ${e[0]}"><b>${e[1]}</b>${e[2]}</div>`:""}</div>`}).join("")});
  return head("Calendar","Week of 2 November · whole team",'<div class="chips"><button class="chip" type="button" aria-pressed="false">Day</button><button class="chip" type="button" aria-pressed="true">Week</button><button class="chip" type="button" aria-pressed="false">Month</button></div><button class="btn" type="button">+ Book viewing</button>')+
  note(2,["Office meetings, site visits, show flat viewings and video calls in one shared calendar.","The client gets a reminder in their language the day before and one hour before, with the location pin.","Works with Google or Outlook calendars, so the team keeps using their phones."])+
  `<div class="legend"><span><i style="background:var(--y)"></i>Site visit / office</span><span><i style="background:var(--info)"></i>Video call</span><span><i style="background:var(--ok)"></i>Signing</span></div>
  <div class="scroll"><div class="cal">${g}</div></div>`;
};

/* ---------- Units ---------- */
let curP="V27";
function rnd(seed){let s=seed;return()=>{s=(s*9301+49297)%233280;return s/233280}}
PAGES.units=()=>{
  const p=PROJECTS.find(x=>x.k===curP);
  const left=p.total-p.sold, reserved=Math.min(2,Math.max(0,left-1)), avail=left-reserved;
  const per=Math.ceil(p.total/p.blocks.length), n=Math.min(4,per), units=[];
  p.blocks.forEach((b,bi)=>{const cnt=Math.min(per,p.total-bi*per);for(let i=0;i<cnt;i++){const fl=Math.floor(i/n)+1,pos=i%n+1;units.push({b,fl,id:`${b}-${fl}0${pos}`,s:"a"})}});
  const r=rnd(p.total*7+p.sold), order=units.map((u,i)=>({i,v:r()})).sort((a,b)=>a.v-b.v).map(o=>o.i);
  order.slice(0,p.sold).forEach(i=>units[i].s="s");
  order.slice(p.sold,p.sold+reserved).forEach(i=>units[i].s="r");
  const lab={a:"Available",r:"Reserved",s:"Sold"};
  const blocks=p.blocks.map(b=>{const us=units.filter(u=>u.b===b);if(!us.length)return"";const fls=[...new Set(us.map(u=>u.fl))].sort((a,c)=>c-a);
    return `<div class="blk"><h4>Block ${b}</h4>${fls.map(f=>`<div class="floor" style="--n:${n}"><span>F${f}</span>${us.filter(u=>u.fl===f).map(u=>`<span class="u ${u.s}" title="${u.id} · ${lab[u.s]}">${u.id.split("-")[1]}</span>`).join("")}</div>`).join("")}</div>`}).join("");
  return head("Projects & units","Real totals from your website today · click a project",'<button class="btn ghost" type="button">Export price list</button>')+
  note(1,["One board per project, block by block and floor by floor: available, reserved, sold.","Reserving a unit in the pipeline marks it here, so two salespeople never promise the same apartment.","Prices, sizes, floor plans and views per unit. The \"Apts left\" on your website can update itself from this board.","A new Victoria is a new board, set up in a day."])+
  `<div class="ptabs">${PROJECTS.map(x=>`<button class="ptab" type="button" data-p="${x.k}" aria-pressed="${x.k===curP}">${x.name}</button>`).join("")}</div>
  <div class="card"><div class="uhead"><div class="thumb" style="aspect-ratio:4/3"><img src="${img(p.img)}" alt="${p.name} render"></div>
    <div><h2 style="font-size:22px">${p.name}</h2><div class="muted">${p.loc} · ${p.dates}</div>
    <div class="ustats"><div><b class="num">${p.total}</b><span>Units</span></div><div><b class="num">${p.sold}</b><span>Sold</span></div><div><b class="num" style="color:var(--warn)">${reserved}</b><span>Reserved</span></div><div><b class="num" style="color:var(--ok)">${avail}</b><span>Available</span></div><div><b class="num">${Math.round(p.sold/p.total*100)}%</b><span>Sold so far</span></div></div></div></div></div>
  <div class="card"><div class="blocks">${blocks}</div><div class="legend" style="margin-top:14px"><span><i style="background:var(--ok-soft);border:1px solid var(--ok)"></i>Available</span><span><i style="background:var(--warn-soft);border:1px solid var(--warn)"></i>Reserved</span><span><i style="background:var(--line-2)"></i>Sold</span><span class="muted">Unit positions are illustrative.</span></div></div>`;
};

/* ---------- Construction ---------- */
PAGES.construction=()=>{
  const S=["Permits","Foundations","Frame","Masonry","Finishes","Handover"];
  const rows=[["Victoria 27",2,23,"18 Sep","Drone video"],["Victoria 28",1,23,"2 Oct","Site photos"],["Victoria 29",1,2,"2 Oct","Site photos"],["Victoria 30",0,4,"—",""],["Victoria 31",0,6,"—",""],["Victoria 33",0,5,"—",""]];
  return head("Construction updates","Where each building is, and what buyers have been told")+
  note(2,["Each project's construction stage, updated by your site team from the phone.","When a stage is done, every buyer of that building gets an update in their language, with the drone and site videos we already film.","Finishing a stage can trigger the next instalment request automatically.","You see who opened the update."])+
  rows.map(([n,st,b,last,what])=>`<div class="card"><div class="bar-row" style="margin-bottom:12px"><div><h3 style="margin:0">${n}</h3><div class="muted sm">${b} buyers · last update ${last}${what?" · "+what:""}</div></div><button class="btn ${st>0?"":"ghost"}" type="button">Send update to ${b} buyers</button></div>
    <div class="stages">${S.map((s,i)=>`<div class="stg ${i<st?"d":i===st?"c":""}"><i></i>${s}</div>`).join("")}</div></div>`).join("");
};

/* ---------- Payments ---------- */
PAGES.payments=()=>head("Buyers & payments","Payment plans tied to construction stages",'<button class="btn ghost" type="button">Export for accounts</button>')+
  note(1,["Each buyer's payment plan, tied to the construction stage of their building.","Reminders before each instalment, to the buyer and to your accounts team. Overdue payments show in red.","Accounts and sales look at the same numbers, so nobody chases a buyer who has already paid."])+
  `<div class="kpis">
    <div class="kpi y"><span>Due in the next 30 days</span><b class="num">€186,400</b><i>7 instalments</i></div>
    <div class="kpi"><span>Overdue</span><b class="num dn">€21,400</b><i class="dn">2 buyers</i></div>
    <div class="kpi"><span>Collected this year</span><b class="num">€2.31m</b><i class="muted">example figure</i></div>
  </div>
  <div class="g21">
    <div class="card"><h3>Coming up</h3><div class="scroll"><table class="t"><thead><tr><th>Buyer</th><th>Unit</th><th>Instalment</th><th class="r">Amount</th><th>Due</th><th>Status</th></tr></thead><tbody>
      <tr><td><b>Marios Christou</b></td><td>V27 · B-203</td><td>Frame complete, 20%</td><td class="r num">€33,600</td><td class="dn">28 Oct</td><td><span class="st bad">Overdue 8 days</span></td></tr>
      <tr><td><b>Yulia Orlova</b></td><td>V27 · A-102</td><td>Frame complete, 20%</td><td class="r num">€29,000</td><td>12 Nov</td><td><span class="st meet">Reminder sent</span></td></tr>
      <tr><td><b>Elena Vasileva</b></td><td>V27 · C-302</td><td>Contract signing, 30%</td><td class="r num">€50,400</td><td>20 Nov</td><td><span class="st grey">Scheduled</span></td></tr>
      <tr><td><b>Nikos Papadopoulos</b></td><td>V29 · A-104</td><td>Contract signing, 30%</td><td class="r num">€41,700</td><td>25 Nov</td><td><span class="st grey">Scheduled</span></td></tr>
      <tr><td><b>Sarah Whitfield</b></td><td>V28 · A-401</td><td>Frame complete, 20%</td><td class="r num">€42,800</td><td>15 Jan</td><td><span class="st grey">On stage</span></td></tr>
    </tbody></table></div></div>
    <div class="card"><h3>Sarah Whitfield · V28 A-401</h3>
      <div class="bar-row sm"><span>Paid <b class="num">€85,600</b> of €214,000</span><span class="muted">40%</span></div>
      <div class="prog" style="margin:8px 0 14px"><i style="width:40%"></i></div>
      <div style="display:grid;gap:8px">
        <div class="pm done"><span class="c">✓</span><span>Reservation deposit</span><span class="mono">€5,000</span><span class="muted sm">12 Mar</span></div>
        <div class="pm done"><span class="c">✓</span><span>Contract signing, 30%</span><span class="mono">€59,200</span><span class="muted sm">2 Apr</span></div>
        <div class="pm done"><span class="c">✓</span><span>Foundations, 10%</span><span class="mono">€21,400</span><span class="muted sm">18 Sep</span></div>
        <div class="pm due"><span class="c"></span><span><b>Frame, 20%</b></span><span class="mono">€42,800</span><span class="sm"><b>15 Jan</b></span></div>
        <div class="pm"><span class="c"></span><span>Finishes, 20%</span><span class="mono">€42,800</span><span class="muted sm">On stage</span></div>
        <div class="pm"><span class="c"></span><span>Keys and title deeds, 20%</span><span class="mono">€42,800</span><span class="muted sm">Handover</span></div>
      </div></div>
  </div>`;

/* ---------- Documents ---------- */
PAGES.documents=()=>{
  const d=(k,t)=>`<span class="doc ${k}">${k==="ok"?"✓":k==="w"?"!":"○"} ${t}</span>`;
  const rows=[["Sarah Whitfield","V28 · A-401",["ok","ok","ok","ok"]],["Elena Vasileva","V27 · C-302",["ok","ok","w","no"]],["Nikos Papadopoulos","V29 · A-104",["ok","ok","no","no"]],["Marios Christou","V27 · B-203",["ok","ok","ok","ok"]],["Yulia Orlova","V27 · A-102",["ok","ok","ok","w"]]];
  return head("Documents","Every buyer's paperwork in one place",'<button class="btn" type="button">Upload</button>')+
  note(2,["Reservation forms, passports, contracts, receipts and title deed papers, stored with the buyer, not in someone's inbox.","Shows what is missing before a signing, so nothing holds up a sale.","Contracts and reservation forms can be filled in from the buyer's details in one click."])+
  `<div class="card"><div class="scroll"><table class="t"><thead><tr><th>Buyer</th><th>Unit</th><th>Paperwork</th><th class="r"></th></tr></thead><tbody>
  ${rows.map(([n,u,s])=>`<tr><td><b>${n}</b></td><td>${u}</td><td>${d(s[0],"Passport")}${d(s[1],"Reservation form")}${d(s[2],"Contract")}${d(s[3],"Receipts")}</td><td class="r"><button class="btn ghost" type="button">Open</button></td></tr>`).join("")}
  </tbody></table></div></div>`;
};

/* ---------- Marketing ---------- */
PAGES.marketing=()=>head("Ads to sales","Last 90 days · which ads sell apartments, not only which get forms",'<span class="empty-tag">Example data</span>')+
  note(1,["Cost per enquiry, per meeting and per reservation, for every language, project and video.","The CRM tells Meta who became a meeting or a buyer. Meta then finds more people like them. Your Cyprus campaign already asks for this connection.","Launch lists: when a new project opens, everyone who asked before hears first, filtered by budget and language.","A weekly summary to management by email."])+
  `<div class="kpis">
    <div class="kpi"><span>Ad spend</span><b class="num">€2,480</b></div>
    <div class="kpi"><span>Per enquiry</span><b class="num">€7.10</b></div>
    <div class="kpi"><span>Per meeting</span><b class="num">€62</b></div>
    <div class="kpi y"><span>Per reservation</span><b class="num">€310</b><i>the number that matters</i></div>
  </div>
  <div class="g2">
    <div class="card"><h3>By language</h3><div class="scroll"><table class="t"><thead><tr><th>Campaign</th><th class="r">Enquiries</th><th class="r">Meetings</th><th class="r">Reserved</th><th class="r">Cost / reservation</th></tr></thead><tbody>
      <tr><td>Cyprus EN/GR</td><td class="r num">190</td><td class="r num">22</td><td class="r num">4</td><td class="r num">€290</td></tr>
      <tr><td>Serbian</td><td class="r num">92</td><td class="r num">9</td><td class="r num">2</td><td class="r num up">€260</td></tr>
      <tr><td>Russian</td><td class="r num">32</td><td class="r num">5</td><td class="r num">1</td><td class="r num">€420</td></tr>
      <tr><td>German</td><td class="r num">22</td><td class="r num">4</td><td class="r num">1</td><td class="r num dn">€640</td></tr>
      <tr><td>Armenian</td><td class="r num">14</td><td class="r num">2</td><td class="r num">0</td><td class="r num muted">—</td></tr>
    </tbody></table></div></div>
    <div class="card"><h3>Meta connection</h3><div class="list">
      <div class="src"><span class="ic">f</span><div class="tx" style="flex:1"><b>Leads in from Meta forms</b><div class="muted sm">5 campaigns · last lead 4 min ago</div></div><span class="st ok">Live</span></div>
      <div class="src"><span class="ic">↺</span><div class="tx" style="flex:1"><b>Results back to Meta</b><div class="muted sm">Meeting and Reserved sent as conversions</div></div><span class="st ok">Live</span></div>
      <div class="src"><span class="ic">✉</span><div class="tx" style="flex:1"><b>Weekly email to management</b><div class="muted sm">Mondays 08:00</div></div><span class="toggle"></span></div>
    </div></div>
  </div>
  <div class="card"><h3>Launch lists <span>people who asked before, ready to hear first</span></h3><div class="scroll"><table class="t"><thead><tr><th>List</th><th class="r">People</th><th>Languages</th><th>Budget</th><th class="r"></th></tr></thead><tbody>
    <tr><td><b>Victoria 33, Paralimni</b></td><td class="r num">214</td><td>EN · RU · SR · EL</td><td>€150k+</td><td class="r"><button class="btn" type="button">Send launch message</button></td></tr>
    <tr><td><b>Sea view, any project</b></td><td class="r num">96</td><td>RU · EN · DE</td><td>€250k+</td><td class="r"><button class="btn ghost" type="button">Open</button></td></tr>
    <tr><td><b>Investors, 1 bed</b></td><td class="r num">132</td><td>All</td><td>up to €150k</td><td class="r"><button class="btn ghost" type="button">Open</button></td></tr>
  </tbody></table></div></div>`;

/* ---------- Partners ---------- */
PAGES.partners=()=>head("Partner agents","Agents and agencies that bring you buyers",'<button class="btn" type="button">+ Invite agent</button>')+
  note(2,["Agents abroad get their own login: they see what is available, submit clients and follow their progress.","Each client is locked to the agent who brought them, so there are no disputes over who introduced whom.","Commission is calculated on each sale and shown to the agent and to your accounts team."])+
  `<div class="card"><div class="scroll"><table class="t"><thead><tr><th>Agent</th><th>Country</th><th class="r">Clients sent</th><th class="r">Meetings</th><th class="r">Sold</th><th class="r">Commission due</th><th>Last active</th></tr></thead><tbody>
    <tr><td><div class="who"><span class="av">BP</span><b>Belgrade Property Partners</b></div></td><td>Serbia</td><td class="r num">24</td><td class="r num">7</td><td class="r num">2</td><td class="r num">€9,800</td><td class="muted">Today</td></tr>
    <tr><td><div class="who"><span class="av">YH</span><b>Yerevan Homes Abroad</b></div></td><td>Armenia</td><td class="r num">11</td><td class="r num">3</td><td class="r num">1</td><td class="r num">€4,200</td><td class="muted">2 days ago</td></tr>
    <tr><td><div class="who"><span class="av">MI</span><b>Munich Invest Group</b></div></td><td>Germany</td><td class="r num">6</td><td class="r num">2</td><td class="r num">0</td><td class="r num muted">—</td><td class="muted">1 week ago</td></tr>
    <tr><td><div class="who"><span class="av">LR</span><b>Larnaca Realty</b></div></td><td>Cyprus</td><td class="r num">9</td><td class="r num">4</td><td class="r num">1</td><td class="r num">€3,900</td><td class="muted">3 days ago</td></tr>
  </tbody></table></div><p class="muted sm" style="margin-top:10px">Agency names are examples.</p></div>`;

/* ---------- Team & settings ---------- */
PAGES.team=()=>head("Team & settings","Who sees what, and where leads go")+
  note(1,["Each salesperson sees their own clients. Management sees everything. Accounts see payments only.","Lead routing rules by language, project or campaign, changed here without calling us.","Works on the phone, so the team can log a call right after it ends."])+
  `<div class="g2">
    <div class="card"><h3>Team</h3><div class="list">${Object.entries(TEAM).map(([k,t])=>`<div class="li"><span class="av ${k==="HA"?"y":""}">${k}</span><div class="tx"><b>${t.name}</b><div>${t.role} · ${t.langs}</div></div><span class="st ${k==="HA"?"new":"grey"}">${k==="HA"?"Manager":"Sales"}</span></div>`).join("")}
      <div class="li"><span class="av">AC</span><div class="tx"><b>Accounts</b><div>Payments and documents only</div></div><span class="st grey">Accounts</span></div></div></div>
    <div class="card"><h3>Lead routing</h3>
      ${[["Russian","AL"],["Armenian","AR"],["Greek","NI"],["English","JO"],["Serbian","HA"],["German","HA"]].map(([l,k])=>`<div class="rule"><span>Lead in <b>${l}</b></span><span class="arrow">→</span><span>${owner(k)}</span><span class="toggle"></span></div>`).join("")}
      <div class="rule"><span>No reply in <b>1 hour</b></span><span class="arrow">→</span><span>Alert Hanane</span><span class="toggle"></span></div>
    </div>
  </div>
  <div class="card"><h3>Lead sources</h3>
    <div class="src"><span class="ic">f</span><div style="flex:1"><b>Meta lead forms</b><div class="muted sm">Cyprus, Serbian, Russian, German, Armenian</div></div><span class="st ok">Connected</span></div>
    <div class="src"><span class="ic">www</span><div style="flex:1"><b>vridevelopments.com contact form</b><div class="muted sm">Website enquiries</div></div><span class="st ok">Connected</span></div>
    <div class="src"><span class="ic">W</span><div style="flex:1"><b>WhatsApp Business</b><div class="muted sm">Messages and auto-replies</div></div><span class="st meet">Setup in first version</span></div>
    <div class="src"><span class="ic">⇄</span><div style="flex:1"><b>Current lead sheet</b><div class="muted sm">353 enquiries to import</div></div><span class="st new">Ready to import</span></div>
  </div>`;

/* ---------- router ---------- */
function nav(cur){
  $("#nav").innerHTML=NAV.map(n=>n.g?`<div class="grp">${n.g}</div>`:`<a href="#${n.k}" class="${cur===n.k||(cur==="client"&&n.k==="leads")?"on":""}"><span class="ic">${n.i}</span>${n.t}${n.c?`<em>${n.c}</em>`:""}</a>`).join("");
}
function route(){
  const [k,arg]=(location.hash.slice(1)||"dashboard").split("/");
  const fn=PAGES[k]||PAGES.dashboard;
  nav(PAGES[k]?k:"dashboard");
  $("#page").innerHTML=fn(arg)+`<p class="foot">VRI Sales Hub · design prototype by Pheme Growth · project unit totals are real, every person and amount is an example.</p>`;
  $("#side").classList.remove("open");
  window.scrollTo(0,0);
}
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]"); if(g){location.hash=g.dataset.go;return}
  const lf=e.target.closest("[data-lf]"); if(lf){leadF=lf.dataset.lf;route();return}
  const p=e.target.closest("[data-p]"); if(p){curP=p.dataset.p;const y=window.scrollY;route();window.scrollTo(0,y);return}
  if(e.target.closest("#menu")){$("#side").classList.toggle("open")}
});
$("#notesSw").addEventListener("change",e=>document.body.classList.toggle("notes-on",e.target.checked));
window.addEventListener("hashchange",route);
route();
})();
