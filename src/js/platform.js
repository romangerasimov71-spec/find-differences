/* Платформенный слой для VK и Одноклассников (и обычного браузера).
   Все вызовы VK Bridge — с таймаутом: вне VK/OK игра не зависает.
   Интерфейс window.Platform одинаков для всех сборок (см. platform-playgama.js). */
(function () {
  'use strict';
  var BRIDGE_TIMEOUT = 2500, AD_TIMEOUT = 45000;
  var bridge = window.vkBridge || null;
  var q = new URLSearchParams(location.search);
  var vkPlatform = q.get('vk_platform') || '';
  var isOK = q.get('vk_client') === 'ok' || /_ok$/.test(vkPlatform);
  var inBridge = !!(bridge && (q.has('vk_app_id') || q.has('vk_platform') || q.has('sign')));
  var id = inBridge ? (isOK ? 'ok' : 'vk') : 'web';
  var SAVE_KEY = id === 'ok' ? 'fd_ny_ok_v2' : id === 'vk' ? 'fd_ny_vk_v2' : 'fd_ny_web_v2'; // сохранения VK и OK раздельные

  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var done = false, t = setTimeout(function () { if (!done) { done = true; rej(new Error('timeout')); } }, ms);
      p.then(function (v) { if (!done) { done = true; clearTimeout(t); res(v); } }, function (e) { if (!done) { done = true; clearTimeout(t); rej(e); } });
    });
  }
  function send(method, data, ms) {
    if (!inBridge) return Promise.reject(new Error('no-bridge'));
    try { return withTimeout(bridge.send(method, data || {}), ms || BRIDGE_TIMEOUT); } catch (e) { return Promise.reject(e); }
  }

  /* ---------- Пауза / возврат ---------- */
  var pauseFns = [], resumeFns = [], hidden = false;
  function hide() { if (hidden) return; hidden = true; pauseFns.forEach(function (f) { f('hide'); }); }
  function show() { if (!hidden) return; hidden = false; resumeFns.forEach(function (f) { f('show'); }); }
  document.addEventListener('visibilitychange', function () { if (document.hidden) hide(); else show(); });
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', function () { if (!document.hidden) show(); });
  if (inBridge && !isOK) { // в OK событий ViewHide/Restore нет — там хватает visibilitychange
    bridge.subscribe(function (e) {
      var t = e && e.detail && e.detail.type;
      if (t === 'VKWebAppViewHide') hide(); else if (t === 'VKWebAppViewRestore') show();
    });
  }

  var ready = inBridge ? send('VKWebAppInit', {}).catch(function () {}) : Promise.resolve();

  /* ---------- Сохранения: VK Storage + запасной localStorage ---------- */
  function lsGet() { try { var s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function lsSet(o) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) {} }
  function load() {
    var local = lsGet();
    if (!inBridge) return Promise.resolve([local]);
    return send('VKWebAppStorageGet', { keys: [SAVE_KEY] }).then(function (r) {
      var v = r && r.keys && r.keys[0] && r.keys[0].value, cloud = null;
      if (v) { try { cloud = JSON.parse(v); } catch (e) {} }
      return [local, cloud];
    }).catch(function () { return [local]; });
  }
  var saveTimer = null, pending = null;
  function save(o) {
    lsSet(o);
    if (!inBridge) return;
    pending = o; clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var s = JSON.stringify(pending);
      if (s.length <= 4096) send('VKWebAppStorageSet', { key: SAVE_KEY, value: s }).catch(function () {});
    }, 700);
  }

  /* ---------- Реклама ---------- */
  var adBusy = false;
  function adStart() { pauseFns.forEach(function (f) { f('ad'); }); }
  function adEnd() { resumeFns.forEach(function (f) { f('ad'); }); }
  function preload(fmt) { if (inBridge) send('VKWebAppCheckNativeAds', fmt === 'reward' ? { ad_format: fmt, use_waterfall: true } : { ad_format: fmt }).catch(function () {}); }
  ready.then(function () { setTimeout(function () { preload('interstitial'); preload('reward'); }, 1200); });

  // Заглушка рекламы вне VK/OK: 2 секунды, потом «награда»
  function stubAd() {
    return new Promise(function (res) {
      var el = document.getElementById('ad-stub');
      if (!el) { res(true); return; }
      el.classList.add('show');
      setTimeout(function () { el.classList.remove('show'); res(true); }, 2000);
    });
  }
  function showAd(fmt) {
    if (adBusy) return Promise.resolve(false);
    adBusy = true; adStart();
    var req = fmt === 'reward' ? { ad_format: fmt, use_waterfall: true } : { ad_format: fmt };
    var p = !inBridge ? stubAd() :
      send('VKWebAppCheckNativeAds', req).then(function (r) {
        if (!r || !r.result) return false;
        return send('VKWebAppShowNativeAds', req, AD_TIMEOUT).then(function (x) { return !!(x && x.result); });
      }).catch(function () { return false; });
    return p.then(function (ok) {
      adBusy = false; adEnd();
      setTimeout(function () { preload(fmt); }, 800);
      return ok;
    });
  }

  /* ---------- Рост ---------- */
  var storyUrl = null;
  try { storyUrl = new URL('share/story.png', location.href).href; } catch (e) {}
  var social = {
    invite: function (msg) { return send('VKWebAppShowInviteBox', isOK ? { message: msg } : {}, 60000).then(function () { return true; }, function () { return false; }); },
    // VK: пост на стену; OK: VKWebAppShare (ShowWallPostBox в OK нет)
    share: function (msg) {
      if (isOK) return send('VKWebAppShare', {}, 60000).then(function () { return true; }, function () { return false; });
      return send('VKWebAppShowWallPostBox', { message: msg }, 60000).then(function () { return true; }, function () { return false; });
    },
    // История: только background_type image и url (так работает и в OK)
    story: function () {
      if (!storyUrl || !/^https:/.test(storyUrl)) return Promise.resolve(false);
      return send('VKWebAppShowStoryBox', { background_type: 'image', url: storyUrl }, 60000).then(function () { return true; }, function () { return false; });
    },
    favorites: function () { return send('VKWebAppAddToFavorites', {}, 30000).then(function () { return true; }, function () { return false; }); },
    homeScreen: function () { return send('VKWebAppAddToHomeScreen', {}, 30000).then(function () { return true; }, function () { return false; }); },
    homeScreenSupported: function () {
      if (id !== 'vk' || !/android/.test(vkPlatform)) return Promise.resolve(false);
      return send('VKWebAppAddToHomeScreenInfo', {}).then(function (r) { return !!(r && r.is_feature_supported && !r.is_added_to_home_screen); }, function () { return false; });
    }
  };

  window.Platform = {
    id: id, isOK: isOK, language: 'ru', ready: ready,
    caps: { invite: inBridge, share: inBridge, story: inBridge, favorites: id === 'vk', interstitialManaged: false, rewarded: true },
    load: load, save: save,
    showInterstitial: function () { return showAd('interstitial'); },
    showRewarded: function () { return showAd('reward'); },
    gameReady: function () {},
    audioAllowed: function () { return true; },
    haptic: function (kind) {
      if (inBridge && !isOK) {
        if (kind === 'tap') send('VKWebAppTapticImpactOccurred', { style: 'light' }).catch(function () {});
        else send('VKWebAppTapticNotificationOccurred', { type: kind === 'error' ? 'error' : 'success' }).catch(function () {});
      } else if (navigator.vibrate) { try { navigator.vibrate(kind === 'error' ? 40 : 12); } catch (e) {} }
    },
    onPause: function (f) { pauseFns.push(f); }, onResume: function (f) { resumeFns.push(f); },
    isHidden: function () { return hidden; },
    social: social
  };
})();
