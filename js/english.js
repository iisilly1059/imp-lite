const VALID_THEMES = ["dark","light","matrix","blood","sunset","forest","cyberpunk","midnight","purplehaze","coffee","ocean","aurora","ember","graphite","sakura"];

const storage = {
    get(key, def = null) {
        try { const v = localStorage.getItem(key); return v !== null ? v : def; } catch { return def; }
    },
    set(key, value) {
        try { localStorage.setItem(key, String(value)); } catch {}
    }
};

const body = document.body;

function applyTheme(theme) {
    const safe = VALID_THEMES.includes(theme) ? theme : "dark";
    body.setAttribute("data-theme", safe);
    storage.set("selectedTheme", safe);
    document.getElementById("theme-select").value = safe;
}

const perfDescs = [
    "All animations and effects enabled",
    "Reduced effects for better performance",
    "Minimal effects for best performance"
];
const perfFills = ["0%", "50%", "100%"];

function setPerfMode(i) {
    document.querySelectorAll(".perf-stop").forEach((s, idx) => s.classList.toggle("active", idx === i));
    document.querySelectorAll(".perf-lbl").forEach((l, idx) => l.classList.toggle("active", idx === i));
    document.getElementById("perf-fill").style.width = perfFills[i];
    document.getElementById("perf-desc").textContent = perfDescs[i];
    storage.set("performanceMode", i);
    document.documentElement.setAttribute("data-perf", i);
}

document.getElementById("tab-title-input").addEventListener("input", e => {
    const val = e.target.value.trim();
    if (val) {
        storage.set("tabTitle", val);
        document.title = val;
    } else {
        localStorage.removeItem("tabTitle");
        document.title = "Settings";
    }
});

let panicListening = false;
const panicBadge = document.getElementById("panic-key-badge");

function loadPanicKey() {
    const k = storage.get("panicKey", "Escape");
    panicBadge.textContent = k;
}

panicBadge.addEventListener("click", () => {
    if (panicListening) return;
    panicListening = true;
    panicBadge.textContent = "Press a key…";
    panicBadge.classList.add("listening");

    function onKey(e) {
        e.preventDefault();
        const key = e.key;
        panicBadge.textContent = key;
        panicBadge.classList.remove("listening");
        storage.set("panicKey", key);
        panicListening = false;
        window.removeEventListener("keydown", onKey, true);
    }
    window.addEventListener("keydown", onKey, true);
});

document.getElementById("panic-url").addEventListener("input", e => {
    storage.set("panicUrl", e.target.value.trim());
});

document.getElementById("anti-close-toggle").addEventListener("change", e => {
    storage.set("antiClose", e.target.checked);
});

document.getElementById("aboutblank-btn").addEventListener("click", () => {
    const url = location.origin + '/';
    const iconEl = document.querySelector("link[rel*='icon']");
    const icon = iconEl ? iconEl.href : "";
    const iconTag = icon ? `<link rel="icon" href="${icon}">` : "";
    const html = `<!DOCTYPE html><html><head><title>${document.title.replace(/</g,"&lt;")}</title>${iconTag}<style>*{margin:0;padding:0;height:100%;overflow:hidden}</style></head><body><iframe src="${url}" style="position:fixed;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></body></html>`;
    window.parent.postMessage({ type: 'aboutblank', html }, '*');
});

document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
        const tab = button.dataset.tab;
        document.querySelectorAll(".tab-button").forEach(b => b.classList.toggle("active", b === button));
        document.querySelectorAll(".settings-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === tab));
    });
});

document.getElementById("theme-select").addEventListener("change", e => applyTheme(e.target.value));

document.querySelectorAll(".perf-stop, .perf-lbl").forEach(el => {
    el.addEventListener("click", () => setPerfMode(+el.dataset.i));
});

document.getElementById("export-btn").addEventListener("click", () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); data[k] = localStorage.getItem(k); }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "settings.json"; link.click();
    URL.revokeObjectURL(url);
});

document.getElementById("import-input").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const status = document.getElementById("import-status");
        try {
            const data = JSON.parse(reader.result);
            Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, String(v)));
            status.textContent = "Settings imported successfully.";
            status.style.display = "block";
            setTimeout(() => location.reload(), 700);
        } catch {
            status.textContent = "Invalid settings file.";
            status.style.display = "block";
            status.style.color = "rgba(239,68,68,.9)";
        }
    };
    reader.readAsText(file);
});

document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all settings?")) { localStorage.clear(); location.reload(); }
});

window.addEventListener("storage", e => {
    if (!e.key) return;
    if (e.key === "selectedTheme") applyTheme(storage.get("selectedTheme", "dark"));
    if (e.key === "performanceMode") setPerfMode(parseInt(storage.get("performanceMode", "0")));
});

function loadSettings() {
    applyTheme(storage.get("selectedTheme", "dark"));
    setPerfMode(parseInt(storage.get("performanceMode", "0")));
    loadPanicKey();

    const panicUrl = storage.get("panicUrl", "https://google.com");
    document.getElementById("panic-url").value = panicUrl;

    const tabTitle = storage.get("tabTitle", "");
    document.getElementById("tab-title-input").value = tabTitle;
    if (tabTitle) document.title = tabTitle;

    document.getElementById("anti-close-toggle").checked = storage.get("antiClose") === "true";
}

loadSettings();
