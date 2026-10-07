const CONTEXT_MENU_ID = 'ahn-translate-current-page';

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        if (chrome.runtime.lastError) {
            console.error('Could not reset the translation context menu.', chrome.runtime.lastError.message);
            return;
        }

        chrome.contextMenus.create(
            {
                id: CONTEXT_MENU_ID,
                title: '현재 웹페이지 번역',
                contexts: ['page'],
            },
            () => {
                if (chrome.runtime.lastError) {
                    console.error('Could not create the translation context menu.', chrome.runtime.lastError.message);
                }
            },
        );
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_ID || typeof tab.id !== 'number') {
        return;
    }

    startPageTranslation(tab.id).catch((error) => {
        console.error('Could not start page translation from the context menu.', error);
        showPageMessage(tab.id, '페이지 번역을 시작하지 못했습니다.');
    });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === 'ahn:start-active-tab') {
        chrome.tabs
            .query({ active: true, currentWindow: true })
            .then(([tab]) => {
                if (typeof tab?.id !== 'number') {
                    throw new Error('현재 탭을 찾지 못했습니다.');
                }
                return startPageTranslation(tab.id);
            })
            .then(sendResponse)
            .catch((error) => {
                sendResponse({ error: error instanceof Error ? error.message : '번역을 시작하지 못했습니다.' });
            });
        return true;
    }

    if (message?.type === 'ahn:translate-texts' && sender.id === chrome.runtime.id) {
        translateTexts(message.texts)
            .then(sendResponse)
            .catch((error) => {
                sendResponse({ error: error instanceof Error ? error.message : '번역 요청에 실패했습니다.' });
            });
        return true;
    }

    return false;
});

async function startPageTranslation(tabId) {
    const settings = await chrome.storage.local.get(['serverUrl', 'accessToken', 'targetLanguage']);
    if (!settings.serverUrl || !settings.accessToken || !settings.targetLanguage) {
        await showPageMessage(tabId, '먼저 확장 프로그램에서 번역 서버와 접근 토큰을 저장해 주세요.');
        return { error: '먼저 번역 서버와 접근 토큰을 저장해 주세요.' };
    }

    const originPattern = `${new URL(settings.serverUrl).origin}/*`;
    const hasPermission = await chrome.permissions.contains({ origins: [originPattern] });
    if (!hasPermission) {
        await showPageMessage(tabId, '확장 프로그램을 열어 번역 서버 접근 권한을 허용해 주세요.');
        return { error: '번역 서버 접근 권한을 허용해 주세요.' };
    }

    await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
    });
    return chrome.tabs.sendMessage(tabId, {
        type: 'ahn:start',
        targetLanguage: settings.targetLanguage,
    });
}

async function showPageMessage(tabId, error) {
    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
        });
        await chrome.tabs.sendMessage(tabId, { type: 'ahn:error', error });
    } catch (injectionError) {
        console.error('Could not display a page translation message.', injectionError);
    }
}

async function translateTexts(texts) {
    const settings = await chrome.storage.local.get(['serverUrl', 'accessToken', 'targetLanguage']);
    if (!settings.serverUrl || !settings.accessToken || !settings.targetLanguage) {
        return { error: '번역 설정이 없습니다. 확장 프로그램에서 설정을 저장해 주세요.' };
    }

    if (
        !Array.isArray(texts) ||
        texts.length === 0 ||
        texts.length > 50 ||
        !texts.every((text) => typeof text === 'string' && text.trim().length > 0 && text.length <= 2_500)
    ) {
        return { error: '번역할 텍스트 형식이 올바르지 않습니다.' };
    }

    let response;
    try {
        response = await fetch(`${settings.serverUrl}/api/translate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${settings.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                texts,
                targetLanguage: settings.targetLanguage,
            }),
            cache: 'no-store',
        });
    } catch (error) {
        console.error('Could not reach the translation server.', error);
        return { error: '번역 서버에 연결하지 못했습니다. 서버 주소와 네트워크를 확인해 주세요.' };
    }

    let result;
    try {
        result = await response.json();
    } catch (error) {
        console.error('The translation server returned invalid JSON.', error);
        return { error: '번역 서버의 응답을 읽지 못했습니다.' };
    }

    if (!response.ok) {
        return {
            error: typeof result?.error === 'string' ? result.error : `번역 요청에 실패했습니다 (${response.status}).`,
        };
    }

    if (
        !Array.isArray(result?.translations) ||
        result.translations.length !== texts.length ||
        !result.translations.every((translation) => typeof translation === 'string')
    ) {
        return { error: '번역 서버가 예상한 형식으로 응답하지 않았습니다.' };
    }

    return { translations: result.translations };
}
