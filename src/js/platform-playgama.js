/* Платформенный слой для Playgama Bridge SDK (отдельная сборка).
   Сохранения — только bridge.storage, пауза и звук — по событиям платформы, реклама — через Bridge. */
(function () {
  'use strict';
  var b = window.bridge;
  var pauseFns = [], resumeFns = [], paused = false, audioOn = true;
  function setPaused(v, why) {
    if (v === paused) return; paused = v;
    (v ? pauseFns : resumeFns).forEach(function (f) { f(why); });
  }

  var ready = b.initialize().then(function () {
    var lang = (b.platform.language || 'en').toLowerCase();
    P.language = lang.indexOf('ru') === 0 ? 'ru' : 'en';
    audioOn = b.platform.isAudioEnabled !== false;
    b.platform.on(b.EVENT_NAME.PAUSE_STATE_CHANGED, function (isPaused) { setPaused(!!isPaused, 'platform'); });
    b.platform.on(b.EVENT_NAME.AUDIO_STATE_CHANGED, function (on) { audioOn = !!on; (on ? resumeFns : pauseFns).forEach(function (f) { f('audio'); }); });
    P.caps.rewarded = !!b.advertisement.isRewardedSupported;
    if (b.advertisement.interstitialState === 'opened') setPaused(true, 'ad');
  }).catch(function () {});

  var KEY = 'progress';
  function load() {
    return b.storage.get([KEY]).then(function (data) {
      var v = data && data[0], obj = null;
      if (v) { try { obj = typeof v === 'string' ? JSON.parse(v) : v; } catch (e) {} }
      return [obj];
    }).catch(function () { return [null]; });
  }
  var timer = null, pend = null;
  function save(o) { // запись только при значимых изменениях, склеиваем частые вызовы
    pend = o; clearTimeout(timer);
    timer = setTimeout(function () { b.storage.set([KEY], [JSON.stringify(pend)]).catch(function () {}); }, 600);
  }

  function showRewarded() {
    if (!b.advertisement.isRewardedSupported) return Promise.resolve(false);
    return new Promise(function (res) {
      var granted = false, done = false;
      function on(state) {
        if (state === 'opened') setPaused(true, 'ad');
        if (state === 'rewarded') granted = true; // награда — только в состоянии rewarded
        if (state === 'closed' || state === 'failed') {
          if (done) return; done = true;
          b.advertisement.off && b.advertisement.off(b.EVENT_NAME.REWARDED_STATE_CHANGED, on);
          setPaused(false, 'ad'); res(granted);
        }
      }
      b.advertisement.on(b.EVENT_NAME.REWARDED_STATE_CHANGED, on);
      try { b.advertisement.showRewarded(); } catch (e) { done = true; res(false); }
    });
  }
  function showInterstitial() {
    return new Promise(function (res) {
      var done = false, t;
      function fin() { if (done) return; done = true; clearTimeout(t); b.advertisement.off && b.advertisement.off(b.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, on); setPaused(false, 'ad'); res(true); }
      function on(state) {
        if (state === 'opened') { clearTimeout(t); setPaused(true, 'ad'); }
        if (state === 'closed' || state === 'failed') fin();
      }
      b.advertisement.on(b.EVENT_NAME.INTERSTITIAL_STATE_CHANGED, on);
      try { b.advertisement.showInterstitial(); } catch (e) { fin(); }
      t = setTimeout(fin, 1500); // Bridge сам решает, показывать ли — если реклама не открылась, идём дальше
    });
  }

  var P = window.Platform = {
    id: 'playgama', isOK: false, language: 'en', ready: ready,
    caps: { invite: false, share: false, story: false, favorites: false, interstitialManaged: true, rewarded: true },
    load: load, save: save,
    showInterstitial: showInterstitial, showRewarded: showRewarded,
    gameReady: function () { try { b.platform.sendMessage('game_ready'); } catch (e) {} },
    levelEvent: function (msg, n) { try { b.platform.sendMessage(msg, { level: String(n) }); } catch (e) {} },
    audioAllowed: function () { return audioOn; },
    haptic: function (kind) { if (navigator.vibrate) { try { navigator.vibrate(kind === 'error' ? 40 : 12); } catch (e) {} } },
    onPause: function (f) { pauseFns.push(f); }, onResume: function (f) { resumeFns.push(f); },
    isHidden: function () { return paused || !audioOn; },
    social: {}
  };
})();
