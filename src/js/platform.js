/* Платформенный слой: VK Bridge с таймаутами + сохранения + реклама.
   Вне VK (обычный браузер) всё работает через localStorage, реклама «не доступна». */
(function () {
  'use strict';

  var BRIDGE_TIMEOUT = 2500;
  var AD_TIMEOUT = 30000; // показ рекламы может длиться долго — ждём дольше
  var SAVE_KEY = 'fd_ny_progress_v1';

  var bridge = window.vkBridge || null;
  var params = new URLSearchParams(location.search);
  var inVK = !!(bridge && (params.has('vk_app_id') || params.has('vk_platform') || params.has('sign')));
  var isOK = params.get('vk_client') === 'ok' || /_ok$/.test(params.get('vk_platform') || '');

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; reject(new Error('timeout')); } }, ms);
      promise.then(function (v) { if (!done) { done = true; clearTimeout(t); resolve(v); } },
                   function (e) { if (!done) { done = true; clearTimeout(t); reject(e); } });
    });
  }

  function send(method, data, ms) {
    if (!inVK) return Promise.reject(new Error('no-bridge'));
    try {
      return withTimeout(bridge.send(method, data || {}), ms || BRIDGE_TIMEOUT);
    } catch (e) { return Promise.reject(e); }
  }

  /* ---------- События жизненного цикла ---------- */
  var hideHandlers = [], showHandlers = [];
  var hidden = false;
  function emitHide() { if (hidden) return; hidden = true; hideHandlers.forEach(function (f) { f(); }); }
  function emitShow() { if (!hidden) return; hidden = false; showHandlers.forEach(function (f) { f(); }); }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) emitHide(); else emitShow();
  });
  window.addEventListener('pagehide', emitHide);
  window.addEventListener('blur', function () { /* фокус может уходить в окно рекламы — не реагируем */ });

  if (inVK) {
    bridge.subscribe(function (e) {
      var type = e && e.detail && e.detail.type;
      if (type === 'VKWebAppViewHide') emitHide();
      else if (type === 'VKWebAppViewRestore') emitShow();
    });
  }

  /* ---------- Инициализация ---------- */
  var initPromise = inVK ? send('VKWebAppInit', {}).catch(function () {}) : Promise.resolve();

  /* ---------- Сохранения ---------- */
  function localLoad() {
    try { var s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  function localSave(obj) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); } catch (e) {}
  }

  function load() {
    var local = localLoad();
    if (!inVK) return Promise.resolve({ local: local, cloud: null });
    return send('VKWebAppStorageGet', { keys: [SAVE_KEY] }).then(function (r) {
      var v = r && r.keys && r.keys[0] && r.keys[0].value;
      var cloud = null;
      if (v) { try { cloud = JSON.parse(v); } catch (e) {} }
      return { local: local, cloud: cloud };
    }).catch(function () { return { local: local, cloud: null }; });
  }

  var saveTimer = null, pending = null;
  function save(obj) {
    localSave(obj);
    if (!inVK) return;
    pending = obj;
    clearTimeout(saveTimer);
    // склеиваем частые записи, VK Storage ограничен по частоте
    saveTimer = setTimeout(function () {
      var data = JSON.stringify(pending);
      if (data.length > 4096) return; // лимит значения VK Storage
      send('VKWebAppStorageSet', { key: SAVE_KEY, value: data }).catch(function () {});
    }, 800);
  }

  /* ---------- Реклама ---------- */
  var adShowing = false;
  var adStartHandlers = [], adEndHandlers = [];

  function showAd(format) {
    if (!inVK || adShowing) return Promise.resolve(false);
    adShowing = true;
    adStartHandlers.forEach(function (f) { f(); });
    var useWf = format === 'reward' ? { use_waterfall: true } : {};
    var req = Object.assign({ ad_format: format }, useWf);
    return send('VKWebAppCheckNativeAds', req)
      .then(function (r) {
        if (!r || !r.result) return false;
        return send('VKWebAppShowNativeAds', req, AD_TIMEOUT).then(function (res) { return !!(res && res.result); });
      })
      .catch(function () { return false; })
      .then(function (ok) {
        adShowing = false;
        adEndHandlers.forEach(function (f) { f(); });
        return ok;
      });
  }

  function haptic(kind) {
    if (inVK) {
      if (kind === 'success') send('VKWebAppTapticNotificationOccurred', { type: 'success' }).catch(function () {});
      else if (kind === 'error') send('VKWebAppTapticNotificationOccurred', { type: 'error' }).catch(function () {});
      else send('VKWebAppTapticImpactOccurred', { style: 'light' }).catch(function () {});
    } else if (navigator.vibrate) {
      try { navigator.vibrate(kind === 'error' ? 40 : 12); } catch (e) {}
    }
  }

  window.Platform = {
    inVK: inVK,
    isOK: isOK,
    ready: initPromise,
    send: send,
    load: load,
    save: save,
    showInterstitial: function () { return showAd('interstitial'); },
    showRewarded: function () { return showAd('reward'); },
    canShowAds: function () { return inVK; },
    haptic: haptic,
    onHide: function (f) { hideHandlers.push(f); },
    onShow: function (f) { showHandlers.push(f); },
    onAdStart: function (f) { adStartHandlers.push(f); },
    onAdEnd: function (f) { adEndHandlers.push(f); },
    isHidden: function () { return hidden; }
  };
})();
