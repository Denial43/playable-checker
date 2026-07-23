// Main application logic: drag & drop, file list, phone preview, checks rendering.
// No frameworks, no build step — plain DOM APIs only.

const MAX_FILES = 10;

// Logical viewport sizes (CSS px) used to size the preview frame realistically.
const DEVICE_SPECS = {
  phone:   { w: 390,  h: 844 },   // iPhone 13/14/15-class viewport
  tablet:  { w: 820,  h: 1180 },  // iPad Air-class viewport
  desktop: { w: 1440, h: 900 }    // common laptop viewport
};
// Largest on-screen box (CSS px) the frame is allowed to render at, per device type.
const DEVICE_MAX_BOX = {
  phone:   { w: 420,  h: 860 },
  tablet:  { w: 640,  h: 900 },
  desktop: { w: 980,  h: 640 }
};

const state = {
  items: [],       // {id, name, size, text, blobUrl, result}
  activeId: null,
  deviceType: "phone",
  landscape: false
};

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileListEl = document.getElementById("fileList");
const previewFrame = document.getElementById("previewFrame");
const emptyState = document.getElementById("emptyState");
const previewFilename = document.getElementById("previewFilename");
const previewNav = document.getElementById("previewNav");
const previewCounter = document.getElementById("previewCounter");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const reloadBtn = document.getElementById("reloadBtn");
const rotateBtn = document.getElementById("rotateBtn");
const phoneDevice = document.getElementById("phoneDevice");
const phoneStage = document.getElementById("phoneStage");
const deviceDims = document.getElementById("deviceDims");
const tbAddress = document.getElementById("tbAddress");
const deviceButtons = {
  phone: document.getElementById("devicePhoneBtn"),
  tablet: document.getElementById("deviceTabletBtn"),
  desktop: document.getElementById("deviceDesktopBtn")
};
const overallBadge = document.getElementById("overallBadge");
const checksEmpty = document.getElementById("checksEmpty");
const checksContent = document.getElementById("checksContent");
const sizeValue = document.getElementById("sizeValue");
const sizeBarFill = document.getElementById("sizeBarFill");
const networkTable = document.getElementById("networkTable");
const checkList = document.getElementById("checkList");
const infoList = document.getElementById("infoList");

let uidCounter = 1;

// ---------- language switch wiring ----------
document.getElementById("langEnBtn").addEventListener("click", () => setLang("en"));
document.getElementById("langRuBtn").addEventListener("click", () => setLang("ru"));
function onLangChanged() {
  renderFileList();
  renderPreviewMeta();
  renderChecks();
}

// ---------- drag & drop ----------
["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragover");
  });
});
["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragover");
  });
});
dropzone.addEventListener("drop", (e) => {
  const files = Array.from(e.dataTransfer.files || []);
  handleFiles(files);
});
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") fileInput.click();
});
fileInput.addEventListener("change", () => {
  handleFiles(Array.from(fileInput.files || []));
  fileInput.value = "";
});

function handleFiles(files) {
  const htmlFiles = [];
  files.forEach((f) => {
    const isHtml = /\.html?$/i.test(f.name);
    if (!isHtml) {
      console.warn(t("notHtmlWarning", { name: f.name }));
      return;
    }
    htmlFiles.push(f);
  });

  const spaceLeft = MAX_FILES - state.items.length;
  const toLoad = htmlFiles.slice(0, Math.max(0, spaceLeft));

  toLoad.forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      addItem(file.name, file.size, reader.result);
    };
    reader.readAsText(file);
  });
}

function addItem(name, size, text) {
  const result = analyzePlayable(text, size);
  const blob = new Blob([text], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  const item = { id: uidCounter++, name, size, text, blobUrl, result };
  state.items.push(item);
  if (state.activeId === null) state.activeId = item.id;
  renderFileList();
  renderPreview();
  renderChecks();
}

function removeItem(id) {
  const idx = state.items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  URL.revokeObjectURL(state.items[idx].blobUrl);
  state.items.splice(idx, 1);
  if (state.activeId === id) {
    state.activeId = state.items.length ? state.items[Math.min(idx, state.items.length - 1)].id : null;
  }
  renderFileList();
  renderPreview();
  renderChecks();
}

function selectItem(id) {
  state.activeId = id;
  renderFileList();
  renderPreview();
  renderChecks();
}

function activeItem() {
  return state.items.find((i) => i.id === state.activeId) || null;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

// ---------- file list ----------
function renderFileList() {
  fileListEl.innerHTML = "";
  state.items.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = "file-chip" + (item.id === state.activeId ? " active" : "");
    chip.addEventListener("click", () => selectItem(item.id));

    const dot = document.createElement("div");
    dot.className = "file-dot " + item.result.overall;

    const meta = document.createElement("div");
    meta.className = "file-meta";
    const nameEl = document.createElement("div");
    nameEl.className = "file-name";
    nameEl.textContent = item.name;
    const sizeEl = document.createElement("div");
    sizeEl.className = "file-size";
    sizeEl.textContent = formatSize(item.size);
    meta.appendChild(nameEl);
    meta.appendChild(sizeEl);

    const removeBtn = document.createElement("button");
    removeBtn.className = "file-remove";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeItem(item.id);
    });

    chip.appendChild(dot);
    chip.appendChild(meta);
    chip.appendChild(removeBtn);
    fileListEl.appendChild(chip);
  });
}

// ---------- preview ----------
function renderPreview() {
  const item = activeItem();
  if (!item) {
    previewFrame.removeAttribute("src");
    previewFrame.style.visibility = "hidden";
    emptyState.style.display = "flex";
  } else {
    previewFrame.src = item.blobUrl;
    previewFrame.style.visibility = "visible";
    emptyState.style.display = "none";
  }
  renderPreviewMeta();
}

function renderPreviewMeta() {
  const item = activeItem();
  previewFilename.textContent = item ? item.name : " ";
  const count = state.items.length;
  if (count > 1) {
    previewNav.hidden = false;
    const idx = state.items.findIndex((i) => i.id === state.activeId);
    previewCounter.textContent = (idx + 1) + " / " + count;
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= count - 1;
  } else {
    previewNav.hidden = true;
  }
  if (typeof fitDeviceFrame === "function") fitDeviceFrame();
}

prevBtn.addEventListener("click", () => {
  const idx = state.items.findIndex((i) => i.id === state.activeId);
  if (idx > 0) selectItem(state.items[idx - 1].id);
});
nextBtn.addEventListener("click", () => {
  const idx = state.items.findIndex((i) => i.id === state.activeId);
  if (idx < state.items.length - 1) selectItem(state.items[idx + 1].id);
});
reloadBtn.addEventListener("click", () => {
  const item = activeItem();
  if (!item) return;
  previewFrame.src = "about:blank";
  requestAnimationFrame(() => { previewFrame.src = item.blobUrl; });
});
rotateBtn.addEventListener("click", () => {
  state.landscape = !state.landscape;
  phoneDevice.classList.toggle("landscape", state.landscape);
  fitDeviceFrame();
});

// ---------- device type switch (phone / tablet / desktop) ----------
Object.keys(deviceButtons).forEach((key) => {
  deviceButtons[key].addEventListener("click", () => {
    state.deviceType = key;
    Object.keys(deviceButtons).forEach((k) => deviceButtons[k].classList.toggle("active", k === key));
    phoneDevice.classList.remove("type-tablet", "type-desktop");
    if (key === "tablet") phoneDevice.classList.add("type-tablet");
    if (key === "desktop") phoneDevice.classList.add("type-desktop");
    // desktop is inherently landscape-only; drop any forced portrait rotation state for it
    rotateBtn.style.display = key === "desktop" ? "none" : "";
    if (key === "desktop") {
      state.landscape = false;
      phoneDevice.classList.remove("landscape");
    }
    fitDeviceFrame();
  });
});

// Chrome (bezel/titlebar) added around the actual content viewport, per device type.
// Phone/tablet: 12px padding on every side (see .phone-device{padding:12px}).
// Desktop: no padding, but a 34px titlebar sits above the screen.
const DEVICE_CHROME = {
  phone:   { extraW: 24, extraH: 24 },
  tablet:  { extraW: 24, extraH: 24 },
  desktop: { extraW: 0,  extraH: 34 }
};

// IMPORTANT: the iframe is always kept at its true, native logical size (e.g. 390x844
// for "phone") so that fixed-pixel layouts inside the playable render exactly as they
// would on a real device — nothing inside the ad ever gets squeezed or reflowed.
// To fit small screens we instead shrink the *whole device frame visually* with a
// single CSS transform: scale(), which scales every pixel uniformly (bezel included)
// instead of changing the iframe's actual rendered viewport.
function fitDeviceFrame() {
  const item = activeItem();
  const spec = DEVICE_SPECS[state.deviceType];
  let logicalW = spec.w, logicalH = spec.h;
  if (state.deviceType !== "desktop" && state.landscape) {
    logicalW = spec.h; logicalH = spec.w;
  }

  const chrome = DEVICE_CHROME[state.deviceType];
  let extraW = chrome.extraW, extraH = chrome.extraH;
  if (state.deviceType !== "desktop" && state.landscape) {
    // padding is symmetric so it doesn't actually swap, kept for clarity/future chrome tweaks
    extraW = chrome.extraW; extraH = chrome.extraH;
  }

  const nativeW = logicalW + extraW;
  const nativeH = logicalH + extraH;

  // Native (unscaled) box size — this is the frame's real layout size.
  phoneDevice.style.width = nativeW + "px";
  phoneDevice.style.height = nativeH + "px";

  const stageBox = phoneStage.getBoundingClientRect();
  const maxBox = DEVICE_MAX_BOX[state.deviceType];
  const availW = Math.max(60, Math.min(stageBox.width - 24, maxBox.w));
  const availH = Math.max(60, Math.min(stageBox.height - 24, maxBox.h));

  const scale = Math.min(availW / nativeW, availH / nativeH);
  phoneDevice.style.transform = "scale(" + scale.toFixed(4) + ")";

  deviceDims.textContent = logicalW + " × " + logicalH + " pt  ·  " + Math.round(scale * 100) + "%";
  if (tbAddress) tbAddress.textContent = item ? item.name : "playable.html";
}

window.addEventListener("resize", () => {
  clearTimeout(window.__fitTimer);
  window.__fitTimer = setTimeout(fitDeviceFrame, 80);
});

// ---------- checks panel ----------
function renderChecks() {
  const item = activeItem();
  if (!item) {
    checksEmpty.hidden = false;
    checksContent.hidden = true;
    overallBadge.textContent = "—";
    overallBadge.className = "overall-badge";
    return;
  }
  checksEmpty.hidden = true;
  checksContent.hidden = false;

  const r = item.result;

  overallBadge.textContent = t("overall." + r.overall);
  overallBadge.className = "overall-badge " + r.overall;

  // size block
  sizeValue.textContent = formatSize(r.sizeBytes) + "  (" + r.sizeMB.toFixed(2) + " MB)";
  const pct = Math.min(100, (r.sizeMB / 5) * 100);
  sizeBarFill.style.width = pct + "%";
  sizeBarFill.className = "size-bar-fill " + (r.sizeMB > 5 ? "fail" : (r.sizeMB > 4.5 ? "warn" : ""));

  // network table
  networkTable.innerHTML = "";
  NETWORKS.forEach((net) => {
    const verdict = r.networkVerdicts.find((v) => v.id === net.id);
    const row = document.createElement("div");
    row.className = "network-row";

    const name = document.createElement("div");
    name.className = "network-name";
    name.textContent = t("networks." + net.id);

    const limit = document.createElement("div");
    limit.className = "network-limit";
    limit.textContent = "≤" + net.limitMB + "MB" + (net.singleFile ? "" : " (zip)");

    const badge = document.createElement("div");
    badge.className = "network-verdict " + verdict.status;
    badge.textContent = t("verdict." + verdict.status);

    row.appendChild(name);
    row.appendChild(limit);
    row.appendChild(badge);
    networkTable.appendChild(row);

    if (net.id === "google") {
      const note = document.createElement("div");
      note.style.cssText = "font-size:10.5px;color:var(--text-faint);padding:0 10px 4px;margin-top:-4px;line-height:1.4;";
      note.textContent = t("networkNote.google");
      networkTable.appendChild(note);
    }
  });

  // integrity checks
  checkList.innerHTML = "";
  r.checks.forEach((c) => {
    const item2 = document.createElement("div");
    item2.className = "check-item";

    const icon = document.createElement("div");
    icon.className = "check-icon " + c.status;
    icon.textContent = c.status === "pass" ? "✓" : (c.status === "warn" ? "!" : "✕");

    const body = document.createElement("div");
    body.className = "check-body";
    const title = document.createElement("div");
    title.className = "check-title";
    title.textContent = t("checks." + c.id + ".title");
    const detail = document.createElement("div");
    detail.className = "check-detail";

    let detailKey = c.status;
    if (c.id === "base64Integrity") {
      if (c.params.count === 0) detailKey = "none";
      else if (c.status === "fail") detailKey = "fail";
      else detailKey = "pass";
    }
    detail.textContent = t("checks." + c.id + "." + detailKey, c.params);

    body.appendChild(title);
    body.appendChild(detail);
    item2.appendChild(icon);
    item2.appendChild(body);
    checkList.appendChild(item2);
  });

  // detected info
  infoList.innerHTML = "";
  const infoRows = [
    [t("info.storeUrl"), r.storeUrls.length ? r.storeUrls[0] : t("info.notFound")],
    [t("info.clickTag"), r.clickTagFound ? t("info.yes") : t("info.no")],
    [t("info.mraid"), r.mraidUsage ? t("info.yes") : t("info.no")],
    [t("info.alHooks"), r.alHooksFound ? t("info.yes") : t("info.no")],
    [t("info.gameEndSignal"), r.gameEndSignalFound ? t("info.yes") : t("info.no")],
    [t("info.imageAssets"), String(r.imageAssetCount)],
    [t("info.audioAssets"), String(r.audioAssetCount)]
  ];
  infoRows.forEach(([k, v]) => {
    const row = document.createElement("div");
    row.className = "info-row";
    const key = document.createElement("div");
    key.className = "info-key";
    key.textContent = k;
    const val = document.createElement("div");
    val.className = "info-val";
    val.textContent = v;
    row.appendChild(key);
    row.appendChild(val);
    infoList.appendChild(row);
  });
}

// ---------- init ----------
applyStaticI18n();
renderFileList();
renderPreview();
renderChecks();
fitDeviceFrame();
