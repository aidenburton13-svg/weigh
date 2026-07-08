/* ============================================
   Weigh — evidence-weighted priority tool
   Plain JavaScript, no framework, no build step.

   The core idea: a priority score is only useful if it's
   honest about two things this tool asks for explicitly:
     1. How strong is the evidence, not just how much of it?
     2. How much does it cost to build, and how sure are we
        of that cost?
   Everything below just renders those two inputs into a
   single transparent number, and shows its math instead of
   hiding it.
   ============================================ */

const STORAGE_KEY = "weigh-ideas-v1";

/** @type {{id:string, name:string, problem:string, cost:number, riskFlag:boolean, evidence:{text:string, strength:number}[]}[]} */
let ideas = [];

// ---------- Persistence ----------

function loadIdeas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    ideas = raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("Could not read saved ideas, starting fresh.", err);
    ideas = [];
  }
}

function saveIdeas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

// ---------- Scoring ----------

/**
 * Evidence score is the sum of each evidence entry's strength weight.
 * More evidence raises the score, but stronger evidence (a direct,
 * unprompted quote) counts more than a weaker inference — the same
 * distinction between "a farmer told me this hurts" and "I think this
 * would help them" that mattered a lot doing this for real.
 */
function evidenceScore(idea) {
  return idea.evidence.reduce((sum, e) => sum + Number(e.strength), 0);
}

/**
 * Priority score is evidence weight per day of build cost — how much
 * validated confidence you get for each day of engineering time.
 * A cheap idea with modest evidence can outrank an expensive idea with
 * strong evidence, on purpose. That trade-off is the whole point.
 */
function priorityScore(idea) {
  const cost = Math.max(Number(idea.cost) || 1, 0.5);
  return evidenceScore(idea) / cost;
}

function rankIdeas() {
  return [...ideas].sort((a, b) => priorityScore(b) - priorityScore(a));
}

// ---------- Rendering ----------

function formatScore(n) {
  return n.toFixed(2);
}

function strengthClass(strength) {
  return `strength-${String(strength).replace(".", "\\.")}`;
}

function strengthLabel(strength) {
  const map = { "3": "Direct quote", "2": "Stated pain, inferred fit", "1.5": "Structural finding", "1": "External benchmark" };
  return map[String(strength)] || "Evidence";
}

function renderBoard() {
  const listEl = document.getElementById("rankedList");
  const emptyEl = document.getElementById("emptyState");
  const ranked = rankIdeas();

  listEl.innerHTML = "";

  if (ranked.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  ranked.forEach((idea, index) => {
    const eScore = evidenceScore(idea);
    const pScore = priorityScore(idea);

    const card = document.createElement("article");
    card.className = "idea-card";

    const bar = document.createElement("div");
    bar.className = "weigh-bar";
    idea.evidence.forEach((e) => {
      const seg = document.createElement("div");
      seg.className = `weigh-seg ${strengthClass(e.strength)}`;
      const widthPct = eScore > 0 ? (Number(e.strength) / eScore) * 100 : 0;
      seg.style.width = `${widthPct}%`;
      seg.title = `${strengthLabel(e.strength)} — weight ${e.strength}`;
      bar.appendChild(seg);
    });

    const evidenceDetail = idea.evidence
      .map(
        (e) => `
        <div class="evidence-detail-row">
          <span class="evidence-detail-text">${escapeHtml(e.text || "(no description)")}</span>
          <span class="evidence-detail-strength">${strengthLabel(e.strength)} &middot; ${e.strength}</span>
        </div>`
      )
      .join("");

    card.innerHTML = `
      <div class="idea-card-top">
        <div>
          <span class="idea-rank">#${index + 1}</span>
          <h3 class="idea-name">${escapeHtml(idea.name)}</h3>
          <p class="idea-problem">${escapeHtml(idea.problem)}</p>
        </div>
        <div class="idea-score">
          ${formatScore(pScore)}
          <span class="idea-score-label">evidence / day</span>
        </div>
      </div>
    `;

    card.appendChild(bar);

    const meta = document.createElement("div");
    meta.className = "idea-meta";
    meta.innerHTML = `
      <span class="cost">${idea.cost}&nbsp;day${Number(idea.cost) === 1 ? "" : "s"} build</span>
      <span>evidence score ${formatScore(eScore)}</span>
      ${idea.riskFlag ? `<span class="risk-flag">cost depends on an open question</span>` : ""}
    `;
    card.appendChild(meta);

    if (idea.evidence.length > 0) {
      const detail = document.createElement("div");
      detail.className = "evidence-detail";
      detail.innerHTML = evidenceDetail;
      card.appendChild(detail);
    }

    const removeBtn = document.createElement("button");
    removeBtn.className = "idea-remove";
    removeBtn.type = "button";
    removeBtn.textContent = "Remove idea";
    removeBtn.addEventListener("click", () => {
      ideas = ideas.filter((i) => i.id !== idea.id);
      saveIdeas();
      renderBoard();
    });
    card.appendChild(removeBtn);

    listEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Evidence row management (in the form) ----------

function addEvidenceRow() {
  const template = document.getElementById("evidenceRowTemplate");
  const clone = template.content.cloneNode(true);
  const row = clone.querySelector(".evidence-row");
  row.querySelector(".evidence-remove").addEventListener("click", () => {
    row.remove();
  });
  document.getElementById("evidenceList").appendChild(clone);
}

// ---------- Form submission ----------

function handleFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("ideaName").value.trim();
  const problem = document.getElementById("ideaProblem").value.trim();
  const cost = parseFloat(document.getElementById("ideaCost").value);
  const riskFlag = document.getElementById("ideaRisk").value === "uncertain";

  const evidenceRows = document.querySelectorAll("#evidenceList .evidence-row");
  const evidence = Array.from(evidenceRows)
    .map((row) => ({
      text: row.querySelector(".evidence-text").value.trim(),
      strength: parseFloat(row.querySelector(".evidence-strength").value),
    }))
    .filter((e) => e.text.length > 0);

  if (!name || !problem || !cost) return;

  ideas.push({
    id: `idea-${Date.now()}`,
    name,
    problem,
    cost,
    riskFlag,
    evidence,
  });

  saveIdeas();
  renderBoard();

  event.target.reset();
  document.getElementById("evidenceList").innerHTML = "";
  addEvidenceRow();
}

// ---------- Demo case ----------

function loadDemoCase() {
  const demoIdeas = [
    {
      id: "demo-1",
      name: "Monthly sales summary with tax category mapping",
      problem: "Farmers spend hours each tax season manually sorting sales data for their accountant.",
      cost: 4,
      riskFlag: false,
      evidence: [
        { text: "Cited as the #1 pain point, unprompted, across dozens of independent conversations", strength: 3 },
        { text: "One farmer pays for a worse third-party tool solely because it solves this one problem", strength: 3 },
        { text: "Persists even for farms already paying for general accounting software", strength: 2 },
        { text: "No direct competitor automates this specific mapping today", strength: 1.5 },
      ],
    },
    {
      id: "demo-2",
      name: "Automated monthly customer update",
      problem: "Farmers already have a manual tool to message customers, but rarely use it consistently.",
      cost: 5,
      riskFlag: true,
      evidence: [
        { text: "Marketing time burden cited across a meaningful share of conversations", strength: 2 },
        { text: "One farmer explicitly said she'd want a tool to help retain customers she loses each year", strength: 3 },
        { text: "A comparable platform reports engaged customer lists drive over a third of sales through this channel", strength: 1 },
      ],
    },
    {
      id: "demo-3",
      name: "New signup discovery notification",
      problem: "New sellers often get no orders at all in their first weeks, even with a fully working storefront, purely from lack of local demand.",
      cost: 6,
      riskFlag: true,
      evidence: [
        { text: "Company data: roughly a third of signups remain active long-term", strength: 2 },
        { text: "Four independent conversations confirm the same lack-of-demand pattern with no product complaints", strength: 3 },
        { text: "One seller: fully set up storefront, virtually no orders, no complaints about the product itself", strength: 3 },
      ],
    },
    {
      id: "demo-4",
      name: "Storefront visual customization",
      problem: "Every seller's storefront currently looks identical, with no way to add a banner image or personalize their page.",
      cost: 3,
      riskFlag: false,
      evidence: [
        { text: "Confirmed by internal audit that all storefronts share the same visual template", strength: 1.5 },
        { text: "Comparable platforms in the category already offer basic profile customization", strength: 1 },
      ],
    },
    {
      id: "demo-5",
      name: "Reporting section for the web portal",
      problem: "The desktop web portal has no reporting view at all, unlike the mobile app.",
      cost: 5,
      riskFlag: true,
      evidence: [
        { text: "Confirmed gap via direct product audit, independent of any single conversation", strength: 1.5 },
        { text: "One seller specifically wanted a desktop path to review sales without using the phone app", strength: 2 },
      ],
    },
    {
      id: "demo-6",
      name: "Receipt scanning for expense tracking",
      problem: "A couple of sellers asked for a way to photograph and log expense receipts, not just sales.",
      cost: 8,
      riskFlag: true,
      evidence: [
        { text: "Two separate conversations raised this need directly", strength: 2 },
        { text: "Expense tracking sits outside the platform's current scope, unlike income reporting", strength: 1 },
      ],
    },
  ];

  ideas = demoIdeas;
  saveIdeas();
  renderBoard();
}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", () => {
  loadIdeas();
  renderBoard();
  addEvidenceRow();

  document.getElementById("ideaForm").addEventListener("submit", handleFormSubmit);
  document.getElementById("addEvidenceBtn").addEventListener("click", addEvidenceRow);
  document.getElementById("loadDemoBtn").addEventListener("click", loadDemoCase);
});
