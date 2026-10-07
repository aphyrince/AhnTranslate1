const form = document.querySelector('#settings-form');
const serverInput = document.querySelector('#server-url');
const tokenInput = document.querySelector('#access-token');
const languageSelect = document.querySelector('#target-language');
const saveButton = document.querySelector('#save-settings');
const translateButton = document.querySelector('#translate');
const translateLabel = document.querySelector('#translate-label');
const statusMessage = document.querySelector('#status');

let savedSettings = null;

function showStatus(message, kind = 'info') {
    statusMessage.textContent = message;
    statusMessage.dataset.kind = kind;
}

function normalizeServerUrl(value) {
    let url;
    try {
        url = new URL(value.trim());
    } catch {
        throw new Error('올바른 서버 주소를 입력해 주세요.');
    }

    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (
        (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (url.pathname !== '/' && url.pathname !== '')
    ) {
        throw new Error('HTTPS 서버 주소를 입력해 주세요. 로컬 개발은 localhost만 지원해요.');
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
    const settings = await chrome.storage.local.get(['serverUrl', 'accessToken', 'targetLanguage']);

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
        showStatus('저장된 설정이 있어요. 현재 화면을 번역해 보세요.');
    }
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;

    try {
        const serverUrl = normalizeServerUrl(serverInput.value);
        const accessToken = tokenInput.value.trim();
        if (!accessToken) {
            throw new Error('접근 토큰을 입력해 주세요.');
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
            showStatus('서버 연결 권한이 필요해요. 번역 버튼을 눌러 다시 허용해 주세요.', 'error');
            return;
        }
        showStatus('설정 저장 완료. 현재 화면을 번역해 보세요.', 'success');
    } catch (error) {
        showStatus(error instanceof Error ? error.message : '설정을 저장하지 못했습니다.', 'error');
    } finally {
        saveButton.disabled = false;
    }
});

translateButton.addEventListener('click', async () => {
    if (!savedSettings) {
        return;
    }

    translateButton.disabled = true;
    translateLabel.textContent = '번역기를 시작하는 중...';
    showStatus('현재 페이지의 자동 번역을 시작하고 있어요.');

    try {
        const granted = await ensureServerPermission(savedSettings.serverUrl);
        if (!granted) {
            throw new Error('번역 서버에 연결하려면 사이트 접근 권한을 허용해 주세요.');
        }

        const result = await chrome.runtime.sendMessage({ type: 'ahn:start-active-tab' });
        if (typeof result?.error === 'string') {
            throw new Error(result.error);
        }
        showStatus('자동 번역을 시작했어요. 스크롤하면 새 문장도 번역돼요.', 'success');
    } catch (error) {
        showStatus(error instanceof Error ? error.message : '번역 중 문제가 발생했습니다.', 'error');
    } finally {
        translateButton.disabled = !savedSettings;
        translateLabel.textContent = '현재 웹페이지 번역하기';
    }
});

loadSettings().catch((error) => {
    showStatus(error instanceof Error ? error.message : '저장된 설정을 불러오지 못했습니다.', 'error');
});
