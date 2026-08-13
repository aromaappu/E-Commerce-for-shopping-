/* ============================================================
 * Trend Mart - Chat Support Widget
 * Embed anywhere with:
 *
 *   <script src="chat-widget.js" data-function-url="https://YOURPROJECT.supabase.co/functions/v1/chat-support"></script>
 *
 * Or configure after load:
 *   window.TMChatConfig = { functionUrl: "..." };
 * ============================================================ */
(function () {
    "use strict";

    function getFunctionUrl() {
        if (window.TMChatConfig && window.TMChatConfig.functionUrl) return window.TMChatConfig.functionUrl;
        const s = document.querySelector('script[src*="chat-widget"]');
        const attr = s && s.getAttribute('data-function-url');
        if (attr) return attr;
        return "";
    }

    function getApiKey() {
        if (window.TM_CONFIG && window.TM_CONFIG.SUPABASE_ANON_KEY) return window.TM_CONFIG.SUPABASE_ANON_KEY;
        const s = document.querySelector('script[src*="chat-widget"]');
        const attr = s && s.getAttribute('data-apikey');
        if (attr) return attr;
        return "";
    }

    let sessionId = null;
    function getSessionId() {
        if (sessionId) return sessionId;
        try {
            sessionId = localStorage.getItem('tm_chat_session');
            if (!sessionId) {
                sessionId = 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
                localStorage.setItem('tm_chat_session', sessionId);
            }
        } catch (e) {
            sessionId = 'c_' + Date.now();
        }
        return sessionId;
    }

    function injectCss() {
        if (document.getElementById('tm-chat-css')) return;
        const css = document.createElement('style');
        css.id = 'tm-chat-css';
        css.textContent =
            '#tm-chat-fab{position:fixed;bottom:22px;right:22px;width:58px;height:58px;border-radius:50%;background:#25D366;color:#fff;border:none;cursor:pointer;z-index:99998;box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:26px;}' +
            '#tm-chat-fab:hover{transform:scale(1.06);}' +
            '#tm-chat-panel{position:fixed;bottom:90px;right:22px;width:360px;max-width:calc(100vw - 24px);height:520px;max-height:calc(100vh - 130px);background:#fff;border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,.3);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:Arial,sans-serif;}' +
            '#tm-chat-panel.open{display:flex;}' +
            '#tm-chat-header{background:#1a1a1a;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}' +
            '#tm-chat-header .dot{width:9px;height:9px;border-radius:50%;background:#25D366;}' +
            '#tm-chat-header b{font-size:15px;}' +
            '#tm-chat-header .close{margin-left:auto;background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1;}' +
            '#tm-chat-body{flex:1;overflow-y:auto;padding:14px;background:#f5f6f7;display:flex;flex-direction:column;gap:8px;}' +
            '.tm-msg{max-width:85%;padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-break:break-word;}' +
            '.tm-msg.bot{background:#fff;color:#222;align-self:flex-start;border-top-left-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,.08);}' +
            '.tm-msg.user{background:#25D366;color:#fff;align-self:flex-end;border-bottom-right-radius:3px;}' +
            '.tm-msg.typing{color:#999;font-style:italic;}' +
            '#tm-chat-input{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e5e5;background:#fff;}' +
            '#tm-chat-input input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 14px;font-size:14px;outline:none;}' +
            '#tm-chat-input input:focus{border-color:#25D366;}' +
            '#tm-chat-send{background:#25D366;color:#fff;border:none;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer;flex:none;}';
        document.head.appendChild(css);
    }

    function injectUi() {
        if (document.getElementById('tm-chat-panel')) return;
        const fab = document.createElement('button');
        fab.id = 'tm-chat-fab';
        fab.title = 'Chat with us';
        fab.innerHTML = '&#128172;';
        fab.addEventListener('click', function () {
            const p = document.getElementById('tm-chat-panel');
            const open = p.classList.toggle('open');
            if (open) {
                fab.style.display = 'none';
                if (p.querySelectorAll('.tm-msg').length === 0) addBotMsg("Hi! I'm the Trend Mart assistant. Ask me about your orders, products or sales. Type 'help' to see examples.");
            }
        });
        document.body.appendChild(fab);

        const panel = document.createElement('div');
        panel.id = 'tm-chat-panel';
        panel.innerHTML =
            '<div id="tm-chat-header">' +
            '<span class="dot"></span><b>Trend Mart Support</b>' +
            '<button class="close" id="tm-chat-close">&times;</button>' +
            '</div>' +
            '<div id="tm-chat-body"></div>' +
            '<div id="tm-chat-input">' +
            '<input id="tm-chat-text" type="text" placeholder="Ask about orders, products..." autocomplete="off">' +
            '<button id="tm-chat-send" title="Send">&#10148;</button>' +
            '</div>';
        document.body.appendChild(panel);

        document.getElementById('tm-chat-close').addEventListener('click', function () {
            panel.classList.remove('open');
            fab.style.display = 'flex';
        });
        document.getElementById('tm-chat-send').addEventListener('click', sendMessage);
        document.getElementById('tm-chat-text').addEventListener('keydown', function (e) {
            if (e.key === 'Enter') sendMessage();
        });
    }

    function addBotMsg(text) {
        const body = document.getElementById('tm-chat-body');
        const el = document.createElement('div');
        el.className = 'tm-msg bot';
        el.textContent = text;
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
        return el;
    }

    function addUserMsg(text) {
        const body = document.getElementById('tm-chat-body');
        const el = document.createElement('div');
        el.className = 'tm-msg user';
        el.textContent = text;
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
    }

    function sendMessage() {
        const input = document.getElementById('tm-chat-text');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        addUserMsg(text);

        const url = getFunctionUrl();
        if (!url) {
            addBotMsg("Chat is not configured yet. Set the data-function-url attribute on the chat-widget.js script tag.");
            return;
        }

        const typing = addBotMsg('…');
        typing.classList.add('typing');

        const apiKey = getApiKey();
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) {
            headers['Authorization'] = 'Bearer ' + apiKey;
            headers['apikey'] = apiKey;
        }

        fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ message: text, session_id: getSessionId() })
        }).then(function (r) { return r.json(); }).then(function (res) {
            typing.remove();
            addBotMsg(res.reply || 'Sorry, I could not answer that.');
        }).catch(function () {
            typing.remove();
            addBotMsg('Network error. Please try again.');
        });
    }

    function init() {
        injectCss();
        injectUi();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
