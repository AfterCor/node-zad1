const formEl = document.getElementById("planForm");
const listEl = document.getElementById("planList");
const msgEl = document.getElementById("msg");
const statCountEl = document.getElementById("statCount");
const statTotalEl = document.getElementById("statTotal");

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showMsg(text = "", type = "info") {
  msgEl.textContent = text;
  msgEl.className = "plan__messages";
  if (!text) return;
  msgEl.classList.add(`plan__messages--${type}`);
}

async function apiGetPlan() {
  const res = await fetch("/api/plan");
  if (!res.ok) throw new Error("Nie udało się pobrać planu.");
  return res.json();
}

async function apiAddItem(name, durationMinutes) {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, durationMinutes }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Błąd dodawania.");
  return payload;
}

async function apiDeleteItem(id) {
  const res = await fetch(`/api/plan/${encodeURIComponent(id)}`, { method: "DELETE" });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || "Błąd usuwania.");
  return payload;
}

function render(items) {
  const total = items.reduce((sum, it) => sum + Number(it.durationMinutes || 0), 0);

  statCountEl.textContent = String(items.length);
  statTotalEl.textContent = `${total} min`;

  if (!items.length) {
    listEl.innerHTML = `
      <li class="plan__empty">
        Brak przedmiotów — dodaj pierwszy!
      </li>
    `;
    return;
  }

  listEl.innerHTML = items
    .map(
      (it) => `
      <li class="plan__item">
        <div class="plan__item-main">
          <div class="plan__item-name">${escapeHtml(it.name)}</div>
          <div class="plan__item-duration">${Number(it.durationMinutes)} min</div>
        </div>

        <button
          class="plan__btn plan__btn--danger plan__btn--small"
          type="button"
          data-action="delete"
          data-id="${escapeHtml(it.id)}"
          aria-label="Usuń przedmiot"
          title="Usuń (wykonane)"
        >
          Usuń
        </button>
      </li>
    `
    )
    .join("");
}

// event delegation dla przycisków "Usuń"
listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.getAttribute("data-action");
  const id = btn.getAttribute("data-id");

  if (action === "delete" && id) {
    try {
      showMsg("");
      btn.disabled = true;
      await apiDeleteItem(id);
      await init();
      showMsg("Usunięto przedmiot.", "success");
    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      btn.disabled = false;
    }
  }
});

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMsg("");

  const fd = new FormData(formEl);
  const name = String(fd.get("name") || "").trim();
  const durationMinutes = Number(fd.get("durationMinutes"));

  try {
    await apiAddItem(name, durationMinutes);
    formEl.reset();
    document.getElementById("name").focus();
    await init();
    showMsg("Dodano przedmiot.", "success");
  } catch (err) {
    showMsg(err.message, "error");
  }
});

async function init() {
  const items = await apiGetPlan();
  render(items);
}

init().catch((err) => showMsg(err.message, "error"));
