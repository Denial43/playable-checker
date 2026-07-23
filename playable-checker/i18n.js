// Simple i18n dictionary + helper. No build step, no dependencies.
const I18N = {
  en: {
    appTitle: "Playable Preview & QA",
    appSubtitle: "Drag, preview, and validate your playable ads",
    dropTitle: "Drop up to 10 playable .html files here",
    dropSub: "or click to browse your computer",
    privacyNote: "Everything runs in your browser. Files are never uploaded anywhere.",
    reload: "Reload",
    rotate: "Rotate",
    devicePhone: "Phone",
    deviceTablet: "Tablet",
    deviceDesktop: "Desktop",
    emptyTitle: "No playable loaded",
    emptySub: "Drop an HTML file on the left to preview it here",
    checksTitle: "Quality checks",
    checksEmpty: "Load a playable to see its file size, network compliance and integrity checks.",
    fileSize: "File size",
    sizeCap: "5 MB is the common limit across major ad networks",
    networkCompliance: "Ad network compliance",
    integrityChecks: "Integrity & structure checks",
    detectedInfo: "Detected info",
    footerNote: "Playable Preview & QA — a local, static, client-side tool. No files leave your browser.",
    maxFilesWarning: "You can load up to 10 files at once. Extra files were ignored.",
    notHtmlWarning: "Skipped \"{name}\" — only .html/.htm files are supported.",
    overall: { pass: "Looks good", warn: "Needs review", fail: "Issues found" },
    verdict: { pass: "OK", warn: "Check", fail: "Fail" },
    networks: {
      applovin: "AppLovin MAX",
      unity: "Unity Ads",
      mintegral: "Mintegral",
      moloco: "Moloco",
      google: "Google Ads (AdMob / UAC)",
      ironsource: "ironSource / Liftoff",
      vungle: "Vungle / Digital Turbine"
    },
    networkNote: {
      google: "Google also accepts a multi-file ZIP bundle (index.html + assets, 5 MB total) — external refs are fine in that format."
    },
    checks: {
      doctype: {
        title: "Valid HTML document",
        pass: "DOCTYPE, <html>, <head> and <body> are all present.",
        fail: "Missing: {missing}. Some ad SDKs render this file in a strict WebView and may fail on malformed documents."
      },
      viewport: {
        title: "Mobile viewport meta tag",
        pass: "A viewport meta tag was found — the layout should scale correctly on device.",
        fail: "No <meta name=\"viewport\"> tag found. Without it the creative may render at the wrong scale on some devices."
      },
      singleFile: {
        title: "Fully self-contained (no external resources)",
        pass: "No external resource references found — every asset appears to be embedded.",
        warn: "Found {count} external reference(s). This is only acceptable for networks that support multi-file ZIP delivery (e.g. Google).",
        fail: "Found {count} external reference(s): {list}. Most networks require every asset to be embedded (base64) in a single file."
      },
      base64Integrity: {
        title: "Embedded asset integrity",
        pass: "All {count} embedded asset(s) decoded successfully — no corrupted data found.",
        none: "No embedded (base64) assets were found in this file.",
        fail: "{count} embedded asset(s) failed to decode — the file may be truncated or corrupted."
      },
      networkCalls: {
        title: "No live network calls in code",
        pass: "No fetch/XMLHttpRequest/WebSocket calls detected in the script.",
        fail: "Found possible network call(s): {list}. Playables must work fully offline — remove any runtime network requests."
      },
      inlineScripts: {
        title: "Inline scripts & styles only",
        pass: "All <script> and <style> blocks are inline — nothing loads externally.",
        fail: "Found external <script src> or <link href>: {list}."
      }
    },
    info: {
      clickTag: "clickTag variable",
      storeUrl: "Click-through / store URL",
      mraid: "MRAID API usage",
      alHooks: "AppLovin-specific hooks (al_*)",
      gameEndSignal: "Game-end signal (Mintegral-style)",
      imageAssets: "Embedded images",
      audioAssets: "Embedded audio clips",
      totalTags: "Script size",
      yes: "Detected",
      no: "Not detected",
      notFound: "Not found"
    }
  },
  ru: {
    appTitle: "Проверка и превью плейблов",
    appSubtitle: "Загружай, смотри и проверяй плейблы перед отправкой в сеть",
    dropTitle: "Перетащи сюда до 10 HTML-плейблов",
    dropSub: "или кликни, чтобы выбрать файлы",
    privacyNote: "Всё считается прямо в браузере. Файлы никуда не загружаются.",
    reload: "Обновить",
    rotate: "Повернуть",
    devicePhone: "Телефон",
    deviceTablet: "Планшет",
    deviceDesktop: "Десктоп",
    emptyTitle: "Плейбл не загружен",
    emptySub: "Перетащи HTML-файл слева, чтобы увидеть превью",
    checksTitle: "Проверки качества",
    checksEmpty: "Загрузи плейбл, чтобы увидеть вес файла, совместимость с сетями и проверки целостности.",
    fileSize: "Вес файла",
    sizeCap: "5 МБ — стандартный лимит большинства рекламных сетей",
    networkCompliance: "Совместимость с рекламными сетями",
    integrityChecks: "Проверки целостности и структуры",
    detectedInfo: "Обнаруженная информация",
    footerNote: "Проверка и превью плейблов — локальный статический инструмент. Файлы не покидают браузер.",
    maxFilesWarning: "Можно загрузить не более 10 файлов за раз. Остальные проигнорированы.",
    notHtmlWarning: "Пропущен файл «{name}» — поддерживаются только .html/.htm.",
    overall: { pass: "Всё хорошо", warn: "Нужна проверка", fail: "Есть проблемы" },
    verdict: { pass: "OK", warn: "Проверить", fail: "Не пройдёт" },
    networks: {
      applovin: "AppLovin MAX",
      unity: "Unity Ads",
      mintegral: "Mintegral",
      moloco: "Moloco",
      google: "Google Ads (AdMob / UAC)",
      ironsource: "ironSource / Liftoff",
      vungle: "Vungle / Digital Turbine"
    },
    networkNote: {
      google: "Google также принимает ZIP-пакет из нескольких файлов (index.html + ассеты, суммарно до 5 МБ) — в этом случае внешние ссылки внутри архива допустимы."
    },
    checks: {
      doctype: {
        title: "Валидный HTML-документ",
        pass: "DOCTYPE, <html>, <head> и <body> присутствуют.",
        fail: "Отсутствует: {missing}. Некоторые SDK рендерят файл в строгом WebView и могут не открыть невалидный документ."
      },
      viewport: {
        title: "Мета-тег viewport",
        pass: "Тег viewport найден — вёрстка должна корректно масштабироваться на устройстве.",
        fail: "Тег <meta name=\"viewport\"> не найден. Без него креатив может отрендериться с неверным масштабом на части устройств."
      },
      singleFile: {
        title: "Полностью самодостаточный файл (без внешних ресурсов)",
        pass: "Внешних ссылок на ресурсы не найдено — все ассеты зашиты в файл.",
        warn: "Найдено внешних ссылок: {count}. Это допустимо только для сетей с ZIP-доставкой нескольких файлов (например, Google).",
        fail: "Найдено внешних ссылок: {count}: {list}. Большинство сетей требуют, чтобы все ассеты были зашиты (base64) в один файл."
      },
      base64Integrity: {
        title: "Целостность зашитых ассетов",
        pass: "Все {count} зашитых ассета(ов) успешно декодированы — повреждений не найдено.",
        none: "Зашитых (base64) ассетов в файле не найдено.",
        fail: "{count} зашитых ассета(ов) не удалось декодировать — файл может быть обрезан или повреждён."
      },
      networkCalls: {
        title: "Нет живых сетевых запросов в коде",
        pass: "Вызовов fetch/XMLHttpRequest/WebSocket в коде не найдено.",
        fail: "Найдены возможные сетевые вызовы: {list}. Плейбл должен полностью работать оффлайн — уберите любые сетевые запросы во время работы."
      },
      inlineScripts: {
        title: "Только инлайн-скрипты и стили",
        pass: "Все блоки <script> и <style> — инлайновые, ничего не подгружается извне.",
        fail: "Найден внешний <script src> или <link href>: {list}."
      }
    },
    info: {
      clickTag: "Переменная clickTag",
      storeUrl: "Ссылка перехода / стор",
      mraid: "Использование MRAID API",
      alHooks: "Хуки AppLovin (al_*)",
      gameEndSignal: "Сигнал завершения игры (в духе Mintegral)",
      imageAssets: "Зашитых изображений",
      audioAssets: "Зашитых аудио-клипов",
      totalTags: "Размер скрипта",
      yes: "Обнаружено",
      no: "Не обнаружено",
      notFound: "Не найдено"
    }
  }
};

let currentLang = "en";

function t(path, params) {
  const parts = path.split(".");
  let node = I18N[currentLang];
  for (const p of parts) {
    if (node == null) break;
    node = node[p];
  }
  if (node == null) return path;
  if (typeof node === "string" && params) {
    return node.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : ""));
  }
  return node;
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = t(key);
    if (typeof val === "string") el.textContent = val;
  });
  document.getElementById("htmlRoot").setAttribute("lang", currentLang);
}

function setLang(lang) {
  currentLang = lang;
  document.getElementById("langEnBtn").classList.toggle("active", lang === "en");
  document.getElementById("langRuBtn").classList.toggle("active", lang === "ru");
  applyStaticI18n();
  if (typeof onLangChanged === "function") onLangChanged();
}
