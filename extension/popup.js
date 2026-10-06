const form = document.querySelector("#settings-form");
const serverInput = document.querySelector("#server-url");
const tokenInput = document.querySelector("#access-token");
const languageSelect = document.querySelector("#target-language");
const saveButton = document.querySelector("#save-settings");
const translateButton = document.querySelector("#translate");
const translateLabel = document.querySelector("#translate-label");
const statusMessage = document.querySelector("#status");

let savedSettings = null;

function showStatus(message, kind = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.kind = kind;
}

function normalizeServerUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("올바른 서버 주소를 입력해 주세요.");
  }

  const isLocal =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1";

  if (
    (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error("HTTPS 서버 주소를 입력해 주세요. 로컬 개발은 localhost만 지원해요.");
  }

  return url.origin;
}

function ensureServerPermission(serverUrl) {
  const originPattern = `${new URL(serverUrl).origin}/*`;
  const permission = { origins: [originPattern] };
  return chrome.permissions.request(permission);
}

function updateTranslateButton() {
  translateButton.disabled = !savedSettings;
}

async function loadSettings() {
  const settings = await chrome.storage.local.get([
    "serverUrl",
    "accessToken",
    "targetLanguage",
  ]);

  if (settings.serverUrl) {
    serverInput.value = settings.serverUrl;
  }
  if (settings.accessToken) {
    tokenInput.value = settings.accessToken;
  }
  if (settings.targetLanguage) {
    languageSelect.value = settings.targetLanguage;
  }

  if (settings.serverUrl && settings.accessToken) {
    savedSettings = settings;
    updateTranslateButton();
    showStatus("저장된 설정이 있어요. 현재 화면을 번역해 보세요.");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;

  try {
    const serverUrl = normalizeServerUrl(serverInput.value);
    const accessToken = tokenInput.value.trim();
    if (!accessToken) {
      throw new Error("접근 토큰을 입력해 주세요.");
    }

    const settings = {
      serverUrl,
      accessToken,
      targetLanguage: languageSelect.value,
    };
    await chrome.storage.local.set(settings);
    savedSettings = settings;
    updateTranslateButton();

    const granted = await ensureServerPermission(serverUrl);
    if (!granted) {
      showStatus("서버 연결 권한이 필요해요. 번역 버튼을 눌러 다시 허용해 주세요.", "error");
      return;
    }
    showStatus("설정 저장 완료. 현재 화면을 번역해 보세요.", "success");
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : "설정을 저장하지 못했습니다.",
      "error",
    );
  } finally {
    saveButton.disabled = false;
  }
});

translateButton.addEventListener("click", async () => {
  if (!savedSettings) {
    return;
  }

  translateButton.disabled = true;
  translateLabel.textContent = "화면을 살펴보는 중...";
  showStatus("현재 화면에서 보이는 문장을 찾고 있어요.");

  try {
    const granted = await ensureServerPermission(savedSettings.serverUrl);
    if (!granted) {
      throw new Error("번역 서버에 연결하려면 사이트 접근 권한을 허용해 주세요.");
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) {
      throw new Error("현재 탭을 찾지 못했습니다.");
    }

    const [extraction] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectVisibleText,
    });
    const entries = extraction?.result;
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error("화면에서 번역할 문장을 찾지 못했어요.");
    }

    translateLabel.textContent = `${entries.length}개 문장 번역 중...`;
    showStatus("문장을 번역하고 있어요. 잠시만 기다려 주세요.");
    const response = await fetch(`${savedSettings.serverUrl}/api/translate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${savedSettings.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: entries.map((entry) => entry.text),
        targetLanguage: savedSettings.targetLanguage,
      }),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("번역 서버의 응답을 읽지 못했습니다.");
    }

    if (!response.ok) {
      const message =
        typeof result?.error === "string"
          ? result.error
          : `번역 요청에 실패했습니다 (${response.status}).`;
      throw new Error(message);
    }

    if (
      !Array.isArray(result?.translations) ||
      result.translations.length !== entries.length ||
      !result.translations.every((translation) => typeof translation === "string")
    ) {
      throw new Error("번역 서버가 예상한 형식으로 응답하지 않았습니다.");
    }

    const [replacement] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: replaceVisibleText,
      args: [
        entries.map((entry, index) => ({
          source: entry.text,
          translation: result.translations[index],
        })),
      ],
    });

    const translatedCount = replacement?.result ?? 0;
    if (translatedCount === 0) {
      showStatus("페이지 내용이 바뀌어 번역문을 적용하지 못했어요. 다시 시도해 주세요.", "error");
    } else {
      showStatus(`${translatedCount}개 문장을 번역했어요.`, "success");
    }
  } catch (error) {
    showStatus(
      error instanceof Error ? error.message : "번역 중 문제가 발생했습니다.",
      "error",
    );
  } finally {
    translateButton.disabled = !savedSettings;
    translateLabel.textContent = "현재 화면 번역하기";
  }
});

function collectVisibleText() {
  const ignoredParents =
    "script, style, noscript, svg, canvas, template, input, textarea, select, option, button, [contenteditable='true'], [aria-hidden='true'], [translate='no']";
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  const entries = [];
  let totalLength = 0;
  let node;

  while (entries.length < 50 && (node = walker.nextNode())) {
    const parent = node.parentElement;
    const text = node.nodeValue ?? "";
    if (
      !parent ||
      !text.trim() ||
      text.length > 2_500 ||
      parent.closest(ignoredParents)
    ) {
      continue;
    }

    const style = getComputedStyle(parent);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }

    const range = document.createRange();
    range.selectNodeContents(node);
    const isInViewport = Array.from(range.getClientRects()).some(
      (rect) =>
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth,
    );
    range.detach();

    if (!isInViewport || totalLength + text.length > 12_000) {
      continue;
    }

    entries.push({ text });
    totalLength += text.length;
  }

  return entries;
}

function replaceVisibleText(replacements) {
  const ignoredParents =
    "script, style, noscript, svg, canvas, template, input, textarea, select, option, button, [contenteditable='true'], [aria-hidden='true'], [translate='no']";
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );
  const nodes = [];
  let node;

  while (nodes.length < 50 && (node = walker.nextNode())) {
    const parent = node.parentElement;
    const text = node.nodeValue ?? "";
    if (
      !parent ||
      !text.trim() ||
      text.length > 2_500 ||
      parent.closest(ignoredParents)
    ) {
      continue;
    }

    const style = getComputedStyle(parent);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.visibility === "collapse" ||
      Number(style.opacity) === 0
    ) {
      continue;
    }

    const range = document.createRange();
    range.selectNodeContents(node);
    const isInViewport = Array.from(range.getClientRects()).some(
      (rect) =>
        rect.width > 0 &&
        rect.height > 0 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth,
    );
    range.detach();
    if (isInViewport) {
      nodes.push(node);
    }
  }

  let replacedCount = 0;
  for (let index = 0; index < replacements.length; index += 1) {
    const candidate = nodes[index];
    const replacement = replacements[index];
    if (
      candidate &&
      candidate.nodeValue === replacement.source &&
      replacement.translation.trim()
    ) {
      candidate.nodeValue = replacement.translation;
      replacedCount += 1;
    }
  }

  return replacedCount;
}

loadSettings().catch((error) => {
  showStatus(
    error instanceof Error ? error.message : "저장된 설정을 불러오지 못했습니다.",
    "error",
  );
});
