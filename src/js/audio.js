/* Звук только из файлов (assets/sfx, assets/music; ogg или mp3 — что поддерживает браузер). Синтеза звука в коде нет.
   Музыка грузится после старта, играет бесшовным циклом (AudioBufferSourceNode.loop с точными границами петли)
   и тише эффектов.
   Тишина — по «причинам» (hide, ad, platform, audio): Sound.suspend(why) / Sound.restore(why). Повтор одной и той же
   причины не накапливается, поэтому лишнее событие платформы не оставит игру без звука. Когда причин не осталось,
   музыка продолжает с того же места. Сторож (касание, возврат на вкладку, раз в 1,5 с) поднимает звук,
   если браузер или реклама остановили его сами — частый случай на iOS и в WebView. */
(function () {
  'use strict';
  var SFX = ['click', 'found', 'miss', 'win', 'star', 'gift'];
  var MUSIC = 'winter', MUSIC_LOOP = 80; // длина петли в секундах (tools/make-audio.py)
  var VOL_SFX = 0.8, VOL_MUSIC = 0.4, FADE_IN = 1.2;
  var ext = (function () { var a = document.createElement('audio'); return a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; })();

  var ctx = null, sfxBus, musicBus, musicFade, buffers = {}, musicSrc = null, musicBuf = null, loopA = 0, loopB = 0;
  var musicT0 = 0, musicPos = 0; // позиция внутри петли, чтобы продолжать с того же места
  var sfxOn = true, musicOn = true, reasons = {}, unlocked = false, loadStarted = false;
  var fallback = {}; // HTMLAudio, если WebAudio/загрузка недоступны (например, file://)

  function quiet(p) { if (p && p.then) p.then(null, function () {}); return p; }
  function blocked() { for (var k in reasons) if (reasons[k]) return true; return false; }
  function url(dir, name) { return 'assets/' + dir + '/' + name + '.' + ext; }
  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? VOL_SFX : 0; sfxBus.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? VOL_MUSIC : 0; musicBus.connect(ctx.destination);
    musicFade = ctx.createGain(); musicFade.gain.value = 0; musicFade.connect(musicBus);
    return ctx;
  }
  function fetchBuf(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); });
  }
  // Границы петли: файл начинается в плотном месте музыки, поэтому тишина в начале буфера — это задержка
  // кодировщика mp3 (её оставляют не все декодеры). Петля — ровно MUSIC_LOOP секунд от первого звучащего отсчёта.
  function findLoop(b) {
    var d = b.getChannelData(0), lim = Math.min(d.length, Math.floor(b.sampleRate * 0.3)), i = 0;
    while (i < lim && Math.abs(d[i]) < 1e-3) i++;
    if (i >= lim) i = 0;
    loopA = i / b.sampleRate;
    loopB = Math.min(b.duration, loopA + MUSIC_LOOP);
  }
  function loadAll() {
    if (loadStarted || !ensure()) return; loadStarted = true;
    SFX.forEach(function (n) {
      fetchBuf(url('sfx', n)).then(function (b) { buffers[n] = b; }, function () { fallback[n] = new Audio(url('sfx', n)); });
    });
    // музыка — после эффектов, с задержкой, чтобы не мешать старту
    setTimeout(function () {
      fetchBuf(url('music', MUSIC)).then(function (b) { musicBuf = b; findLoop(b); startMusic(); }, function () {
        var a = new Audio(url('music', MUSIC)); a.loop = true; a.volume = VOL_MUSIC; fallback.music = a; startMusic();
      });
    }, 1200);
  }

  function play(name, rate) {
    if (!sfxOn || blocked()) return;
    if (buffers[name] && ctx) {
      if (ctx.state !== 'running') quiet(ctx.resume());
      var s = ctx.createBufferSource(); s.buffer = buffers[name];
      if (rate) s.playbackRate.value = rate;
      s.connect(sfxBus); s.start();
    } else if (fallback[name]) {
      try { var a = fallback[name].cloneNode(); a.volume = VOL_SFX; if (rate) a.playbackRate = rate; a.play().catch(function () {}); } catch (e) {}
    }
  }
  function fadeIn() {
    var g = musicFade.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(0, t); g.linearRampToValueAtTime(1, t + FADE_IN);
  }
  function startMusic() {
    if (!musicOn || blocked() || !unlocked) return;
    if (musicBuf && ctx) {
      if (musicSrc) return; // уже играет (на паузе контекста — продолжит сам)
      var len = loopB - loopA;
      musicSrc = ctx.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
      musicSrc.loopStart = loopA; musicSrc.loopEnd = loopB;
      musicSrc.connect(musicFade);
      musicSrc.start(0, loopA + (musicPos % len));
      musicT0 = ctx.currentTime - (musicPos % len);
      fadeIn();
    } else if (fallback.music && fallback.music.paused) { fallback.music.play().catch(function () {}); }
  }
  function stopMusic() { // только при выключении музыки; на паузах источник остаётся, стоит вместе с контекстом
    if (musicSrc) {
      musicPos = Math.max(0, ctx.currentTime - musicT0);
      try { musicSrc.stop(); } catch (e) {}
      musicSrc.disconnect(); musicSrc = null;
    }
    if (fallback.music) fallback.music.pause();
  }

  function apply() {
    if (!ctx && !fallback.music) return;
    if (blocked()) {
      if (ctx && ctx.state !== 'closed') quiet(ctx.suspend()); // и если resume ещё не завершился
      if (fallback.music) fallback.music.pause();
      return;
    }
    if (!unlocked) return;
    if (ctx && ctx.state !== 'running') {
      var r = ctx.resume();
      if (r && r.then) r.then(function () {
        if (blocked()) { quiet(ctx.suspend()); return; } // пока поднимали, снова началась пауза
        if (musicSrc) fadeIn(); startMusic();
      }, function () {}); else startMusic();
    } else startMusic();
  }
  // Сторож: браузер мог остановить звук сам (iOS после рекламы/сворачивания, звонок, другое приложение)
  function kick() { if (unlocked && !blocked()) apply(); }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (t) { document.addEventListener(t, kick, { capture: true, passive: true }); });
  window.addEventListener('focus', kick);
  window.addEventListener('pageshow', kick);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Sound.suspend('vis'); else Sound.restore('vis');
  });
  setInterval(function () {
    if (!unlocked || blocked() || document.hidden) return;
    if ((ctx && ctx.state !== 'running') || (musicOn && musicBuf && !musicSrc)) apply();
  }, 1500);

  var Sound = window.Sound = {
    ext: ext,
    play: play,
    unlock: function () { // первое касание
      if (!ensure()) return;
      unlocked = true; loadAll(); apply();
    },
    // тишина: сворачивание, реклама, запрет звука платформой
    suspend: function (why) { reasons[why || 'misc'] = true; apply(); },
    // единая функция «восстановить звук»: после любой рекламы и после возврата из свёрнутого состояния
    restore: function (why) { delete reasons[why || 'misc']; apply(); },
    setSfx: function (on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? VOL_SFX : 0; },
    setMusic: function (on) {
      musicOn = on; if (musicBus) musicBus.gain.value = on ? VOL_MUSIC : 0;
      if (on) startMusic(); else stopMusic();
    },
    get blocked() { return blocked(); },
    get state() { // для тестов
      return { ctx: ctx ? ctx.state : 'none', music: !!musicSrc || !!(fallback.music && !fallback.music.paused),
        reasons: Object.keys(reasons), loop: [loopA, loopB], t: ctx ? ctx.currentTime : 0 };
    }
  };
})();
