// Pure, dependency-free analysis of a playable HTML file's raw text.
// Everything here runs client-side only.

const NETWORKS = [
  { id: "applovin",   limitMB: 5, singleFile: true },
  { id: "unity",      limitMB: 5, singleFile: true },
  { id: "mintegral",  limitMB: 5, singleFile: true, strict: true },
  { id: "moloco",     limitMB: 5, singleFile: true, recommendedMB: 3 },
  { id: "google",     limitMB: 5, singleFile: false },
  { id: "ironsource", limitMB: 5, singleFile: true },
  { id: "vungle",     limitMB: 5, singleFile: true }
];

const WHITELIST_DOMAINS = [
  "w3.org"
];

const STORE_DOMAINS = [
  "apps.apple.com",
  "itunes.apple.com",
  "play.google.com",
  "market.android.com"
];

function isWhitelisted(url) {
  return WHITELIST_DOMAINS.some((d) => url.includes(d));
}
function isStoreUrl(url) {
  return STORE_DOMAINS.some((d) => url.includes(d));
}

function extractAttrRefs(text, tagNames, attrName) {
  const refs = [];
  const tagPattern = new RegExp("<(" + tagNames.join("|") + ")\\b[^>]*>", "gi");
  let m;
  while ((m = tagPattern.exec(text)) !== null) {
    const tag = m[0];
    const attrRe = new RegExp(attrName + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)')", "i");
    const am = attrRe.exec(tag);
    if (am) {
      const url = am[2] !== undefined ? am[2] : am[3];
      if (url) refs.push({ tag: m[1].toLowerCase(), url: url });
    }
  }
  return refs;
}

function analyzePlayable(text, sizeBytes) {
  const result = {};
  result.sizeBytes = sizeBytes;
  result.sizeMB = sizeBytes / (1024 * 1024);

  // --- doctype / structure ---
  const missing = [];
  if (!/^\s*<!doctype html/i.test(text.trim()) && !/<!doctype html/i.test(text.slice(0, 500))) missing.push("<!DOCTYPE html>");
  if (!/<html[\s>]/i.test(text)) missing.push("<html>");
  if (!/<head[\s>]/i.test(text)) missing.push("<head>");
  if (!/<body[\s>]/i.test(text)) missing.push("<body>");
  result.doctypeOk = missing.length === 0;
  result.missingTags = missing;

  // --- viewport ---
  result.viewportOk = /<meta[^>]+name\s*=\s*["']viewport["'][^>]*>/i.test(text);

  // --- attribute-based external refs (img/script/link/audio/video/source/iframe) ---
  const refSources = [
    ...extractAttrRefs(text, ["img", "script", "audio", "video", "source", "iframe", "embed"], "src"),
    ...extractAttrRefs(text, ["link"], "href")
  ];
  const externalRefs = [];
  const storeUrls = new Set();
  refSources.forEach((r) => {
    const url = r.url.trim();
    if (!url || url.startsWith("data:") || url.startsWith("#") || url.startsWith("javascript:") || url.startsWith("blob:")) return;
    const isHttp = /^https?:\/\//i.test(url) || url.startsWith("//");
    if (!isHttp) return; // relative local paths are not "external" in the browser sense here
    if (isStoreUrl(url)) { storeUrls.add(url); return; }
    if (isWhitelisted(url)) return;
    externalRefs.push({ tag: r.tag, url });
  });

  // also catch bare http(s) links used as click-through variables (STORE_URL = "...", clickTag = "...")
  const bareUrlRe = /https?:\/\/[^\s"'()<>]+/gi;
  let um;
  while ((um = bareUrlRe.exec(text)) !== null) {
    const url = um[0];
    if (isStoreUrl(url)) storeUrls.add(url);
  }

  result.externalRefs = externalRefs;
  result.storeUrls = Array.from(storeUrls);

  // --- external script/link specifically (subset of the above, called out separately) ---
  result.externalScriptOrLink = externalRefs.filter((r) => r.tag === "script" || r.tag === "link").map((r) => r.url);

  // --- base64 asset integrity ---
  const b64Re = /data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g;
  let bm;
  let total = 0, corrupted = [];
  let imageCount = 0, audioCount = 0, videoCount = 0;
  while ((bm = b64Re.exec(text)) !== null) {
    total++;
    const mime = bm[1];
    if (mime.startsWith("image/")) imageCount++;
    else if (mime.startsWith("audio/")) audioCount++;
    else if (mime.startsWith("video/")) videoCount++;
    const payload = bm[2];
    try {
      if (typeof atob === "function") atob(payload);
      else if (payload.length % 4 !== 0) throw new Error("bad padding");
    } catch (e) {
      corrupted.push(mime + " (#" + total + ")");
    }
  }
  result.base64Total = total;
  result.base64Corrupted = corrupted;
  result.imageAssetCount = imageCount;
  result.audioAssetCount = audioCount;
  result.videoAssetCount = videoCount;

  // --- network calls in code (should not exist in an offline playable) ---
  const networkCallPatterns = [
    { re: /\bfetch\s*\(/g, label: "fetch(...)" },
    { re: /new\s+XMLHttpRequest\s*\(/g, label: "XMLHttpRequest" },
    { re: /new\s+WebSocket\s*\(/g, label: "WebSocket" },
    { re: /\baxios\s*\./g, label: "axios" },
    { re: /\$\.ajax\s*\(/g, label: "$.ajax" }
  ];
  const foundCalls = [];
  networkCallPatterns.forEach((p) => { if (p.re.test(text)) foundCalls.push(p.label); });
  result.networkCalls = foundCalls;

  // --- SDK / click-through detection (informational) ---
  result.clickTagFound = /\bclickTag\b/.test(text);
  result.mraidUsage = /\bmraid\.(open|close|expand|useCustomClose|playVideo)\s*\(/.test(text) || /window\.mraid\b/.test(text);
  result.alHooksFound = /\bal_on[A-Za-z]+\s*=/.test(text) || /window\.al_on[A-Za-z]+/.test(text);
  result.gameEndSignalFound = /\b(gameEnd|game_end|mobvistaGameEnd|onGameEnd|al_onPoststitialShow)\b/.test(text);

  // --- checks list (pass/warn/fail) ---
  const checks = [];

  checks.push({
    id: "doctype",
    status: result.doctypeOk ? "pass" : "fail",
    params: { missing: result.missingTags.join(", ") }
  });

  checks.push({
    id: "viewport",
    status: result.viewportOk ? "pass" : "warn",
    params: {}
  });

  let singleFileStatus = "pass";
  if (externalRefs.length > 0) singleFileStatus = "fail";
  checks.push({
    id: "singleFile",
    status: singleFileStatus,
    params: { count: externalRefs.length, list: externalRefs.slice(0, 6).map((r) => r.url).join(", ") }
  });

  let b64Status = "pass";
  let b64Id = "base64Integrity";
  if (total === 0) {
    b64Status = "warn";
  } else if (corrupted.length > 0) {
    b64Status = "fail";
  }
  checks.push({
    id: b64Id,
    status: b64Status,
    params: { count: total, corruptedCount: corrupted.length }
  });

  checks.push({
    id: "networkCalls",
    status: foundCalls.length === 0 ? "pass" : "fail",
    params: { list: foundCalls.join(", ") }
  });

  checks.push({
    id: "inlineScripts",
    status: result.externalScriptOrLink.length === 0 ? "pass" : "fail",
    params: { list: result.externalScriptOrLink.join(", ") }
  });

  result.checks = checks;

  // --- network verdicts ---
  const networkVerdicts = NETWORKS.map((net) => {
    let status = "pass";
    const reasons = [];
    if (result.sizeMB > net.limitMB) {
      status = "fail";
      reasons.push("size");
    } else if (net.recommendedMB && result.sizeMB > net.recommendedMB) {
      status = status === "fail" ? status : "warn";
      reasons.push("size-recommend");
    } else if (result.sizeMB > net.limitMB * 0.9) {
      status = status === "fail" ? status : "warn";
      reasons.push("size-close");
    }
    if (externalRefs.length > 0) {
      if (net.singleFile) {
        status = "fail";
        reasons.push("external-refs");
      } else {
        status = status === "fail" ? status : "warn";
        reasons.push("external-refs-zip-ok");
      }
    }
    if (!result.doctypeOk) { status = "fail"; reasons.push("doctype"); }
    if (foundCalls.length > 0) { status = "fail"; reasons.push("network-calls"); }
    return { id: net.id, status, reasons };
  });
  result.networkVerdicts = networkVerdicts;

  // --- overall ---
  const anyFail = checks.some((c) => c.status === "fail") || result.sizeMB > 5;
  const anyWarn = checks.some((c) => c.status === "warn");
  result.overall = anyFail ? "fail" : (anyWarn ? "warn" : "pass");

  return result;
}
