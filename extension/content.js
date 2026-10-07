(() => {
    const stateKey = '__ahnTranslatePageAgent';
    const existingAgent = globalThis[stateKey];

    if (existingAgent) {
        return;
    }

    const ignoredParents =
        "script, style, noscript, svg, canvas, template, input, textarea, select, option, button, [contenteditable='true'], [aria-hidden='true'], [translate='no'], [data-ahn-translate-ui]";
    const pendingNodes = new WeakSet();
    const translatedNodes = new WeakSet();
    let active = false;
    let targetLanguage = '한국어';
    let isProcessing = false;
    let scanTimer;
    let observer;
    let translatedCount = 0;
    let host;
    let statusElement;
    let messageElement;

    function ensureStatus() {
        if (host?.isConnected) {
            return;
        }

        host = document.createElement('div');
        host.dataset.ahnTranslateUi = 'true';
        host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483647;';
        const shadow = host.attachShadow({ mode: 'closed' });
        const style = document.createElement('style');
        style.textContent =
            ':host{all:initial} .status{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid #315d48;border-radius:8px;background:#194b3c;color:#fff;font:12px/1.4 Arial,sans-serif;box-shadow:0 4px 18px #0003} .stop{padding:5px 8px;border:0;border-radius:5px;background:#d9f179;color:#193c2d;font:700 11px Arial,sans-serif;cursor:pointer}';
        const container = document.createElement('div');
        container.className = 'status';
        statusElement = container;
        messageElement = document.createElement('span');
        const stopButton = document.createElement('button');
        stopButton.className = 'stop';
        stopButton.type = 'button';
        stopButton.textContent = '중지';
        stopButton.addEventListener('click', stop);
        container.append(messageElement, stopButton);
        shadow.append(style, container);
        document.documentElement.append(host);
    }

    function setStatus(message, isError = false) {
        ensureStatus();
        messageElement.textContent = message;
        statusElement.style.background = isError ? '#8d3029' : '#194b3c';
    }

    function stop() {
        active = false;
        window.removeEventListener('scroll', scheduleScan, true);
        observer?.disconnect();
        clearTimeout(scanTimer);
        host?.remove();
        host = undefined;
        statusElement = undefined;
        messageElement = undefined;
    }

    function isVisible(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(ignoredParents)) {
            return false;
        }

        const style = getComputedStyle(parent);
        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.visibility === 'collapse' ||
            Number(style.opacity) === 0
        ) {
            return false;
        }

        const range = document.createRange();
        range.selectNodeContents(node);
        const visible = Array.from(range.getClientRects()).some(
            (rect) =>
                rect.width > 0 &&
                rect.height > 0 &&
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < window.innerHeight &&
                rect.left < window.innerWidth,
        );
        range.detach();
        return visible;
    }

    function collectVisibleEntries() {
        const entries = [];
        let totalLength = 0;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;

        while (entries.length < 50 && (node = walker.nextNode())) {
            const text = node.nodeValue ?? '';
            if (
                !text.trim() ||
                text.length > 2_500 ||
                pendingNodes.has(node) ||
                translatedNodes.has(node) ||
                totalLength + text.length > 12_000 ||
                !isVisible(node)
            ) {
                continue;
            }

            entries.push({ node, source: text });
            totalLength += text.length;
        }

        return entries;
    }

    async function processVisibleText() {
        if (!active || isProcessing || !document.body) {
            return;
        }

        isProcessing = true;
        try {
            while (active) {
                const entries = collectVisibleEntries();
                if (entries.length === 0) {
                    break;
                }
                entries.forEach(({ node }) => pendingNodes.add(node));

                let result;
                try {
                    result = await chrome.runtime.sendMessage({
                        type: 'ahn:translate-texts',
                        texts: entries.map(({ source }) => source),
                    });
                } catch (error) {
                    console.error('Could not request page text translations.', error);
                    entries.forEach(({ node }) => pendingNodes.delete(node));
                    if (active) {
                        setStatus('번역 서버와 통신하지 못했습니다. 다시 스크롤해 재시도해 주세요.', true);
                    }
                    break;
                }

                if (!active) {
                    entries.forEach(({ node }) => pendingNodes.delete(node));
                    break;
                }

                if (typeof result?.error === 'string') {
                    entries.forEach(({ node }) => pendingNodes.delete(node));
                    setStatus(result.error, true);
                    break;
                }

                if (
                    !Array.isArray(result?.translations) ||
                    result.translations.length !== entries.length ||
                    !result.translations.every((translation) => typeof translation === 'string')
                ) {
                    entries.forEach(({ node }) => pendingNodes.delete(node));
                    setStatus('번역 서버가 예상한 형식으로 응답하지 않았습니다.', true);
                    break;
                }

                entries.forEach(({ node, source }, index) => {
                    const translation = result.translations[index];
                    pendingNodes.delete(node);
                    if (node.isConnected && node.nodeValue === source && translation.trim()) {
                        translatedNodes.add(node);
                        node.nodeValue = translation;
                        translatedCount += 1;
                    }
                });
                setStatus(`자동 번역 중 · ${translatedCount}개 문장`);
            }
        } finally {
            isProcessing = false;
        }
    }

    function scheduleScan() {
        if (!active) {
            return;
        }
        clearTimeout(scanTimer);
        scanTimer = setTimeout(() => {
            processVisibleText().catch((error) => {
                console.error('Could not translate visible page text.', error);
                setStatus('번역 중 오류가 발생했습니다. 다시 스크롤해 재시도해 주세요.', true);
            });
        }, 120);
    }

    function start(language) {
        targetLanguage = language || '한국어';
        active = true;
        ensureStatus();
        setStatus('화면에 보이는 문장을 찾는 중...');
        window.removeEventListener('scroll', scheduleScan, true);
        window.addEventListener('scroll', scheduleScan, { capture: true, passive: true });
        observer?.disconnect();
        observer = new MutationObserver(scheduleScan);
        if (document.documentElement) {
            observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
        }
        scheduleScan();
        return { started: true, targetLanguage };
    }

    function onMessage(message, _sender, sendResponse) {
        if (message?.type === 'ahn:start') {
            sendResponse(start(message.targetLanguage));
            return false;
        }
        if (message?.type === 'ahn:error') {
            setStatus(message.error || '페이지 번역을 시작하지 못했습니다.', true);
            return false;
        }
        if (message?.type === 'ahn:stop') {
            stop();
            sendResponse({ stopped: true });
            return false;
        }
        return false;
    }

    globalThis[stateKey] = { onMessage };
    chrome.runtime.onMessage.addListener(onMessage);
})();
