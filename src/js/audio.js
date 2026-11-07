/* Звук только из файлов (assets/sfx, assets/music; ogg или mp3 — что поддерживает браузер). Синтеза звука в коде нет.
   Музыка грузится после старта, играет бесшовным циклом (AudioBufferSourceNode.loop) и тише эффектов.
   Sound.restore() — единая функция «восстановить звук»: после любой рекламы и после возврата из свёрнутого состояния. */
(function () {
  'use strict';
  var SFX = ['click', 'found', 'miss', 'win', 'star', 'gift'];
  var MUSIC = 'winter';
  var VOL_SFX = 0.8, VOL_MUSIC = 0.35;
  var ext = (function () { var a = document.createElement('audio'); return a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; })();

  var ctx = null, master, sfxBus, musicBus, buffers = {}, musicSrc = null, musicBuf = null;
  var sfxOn = true, musicOn = true, blocked = 0, unlocked = false, loadStarted = false;
  var fallback = {}; // HTMLAudio, если WebAudio/загрузка недоступны (например, file://)

  function url(dir, name) { return 'assets/' + dir + '/' + name + '.' + ext; }
  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? VOL_SFX : 0; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? VOL_MUSIC : 0; musicBus.connect(master);
    return ctx;
  }
  function fetchBuf(u) {
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (res, rej) { ctx.decodeAudioData(ab, res, rej); }); });
  }
  function loadAll() {
    if (loadStarted || !ensure()) return; loadStarted = true;
    SFX.forEach(function (n) {
      fetchBuf(url('sfx', n)).then(function (b) { buffers[n] = b; }, function () { fallback[n] = new Audio(url('sfx', n)); });
    });
    // музыка — после эффектов, с задержкой, чтобы не мешать старту
    setTimeout(function () {
      fetchBuf(url('music', MUSIC)).then(function (b) { musicBuf = b; startMusic(); }, function () {
        var a = new Audio(url('music', MUSIC)); a.loop = true; a.volume = VOL_MUSIC; fallback.music = a; startMusic();
      });
    }, 1200);
  }

  function play(name) {
    if (!sfxOn || blocked) return;
    if (buffers[name] && ctx) {
      if (ctx.state !== 'running') ctx.resume();
      var s = ctx.createBufferSource(); s.buffer = buffers[name]; s.connect(sfxBus); s.start();
    } else if (fallback[name]) {
      try { var a = fallback[name].cloneNode(); a.volume = VOL_SFX; a.play().catch(function () {}); } catch (e) {}
    }
  }
  function startMusic() {
    if (!musicOn || blocked || !unlocked) return;
    if (musicBuf && ctx && !musicSrc) {
      musicSrc = ctx.createBufferSource(); musicSrc.buffer = musicBuf; musicSrc.loop = true;
      musicSrc.connect(musicBus); musicSrc.start();
    } else if (fallback.music) { fallback.music.play().catch(function () {}); }
  }
  function stopMusic() {
    if (musicSrc) { try { musicSrc.stop(); } catch (e) {} musicSrc.disconnect(); musicSrc = null; }
    if (fallback.music) fallback.music.pause();
  }

  window.Sound = {
    ext: ext,
    play: play,
    unlock: function () { // первое касание
      if (!ensure()) return;
      unlocked = true; loadAll();
      if (!blocked && ctx.state !== 'running') ctx.resume();
      startMusic();
    },
    // тишина: сворачивание, реклама, запрет звука платформой
    suspend: function () {
      blocked++; stopMusic();
      if (ctx && ctx.state === 'running') ctx.suspend();
    },
    restore: function () {
      blocked = Math.max(0, blocked - 1);
      if (blocked) return;
      if (ctx) ctx.resume().then(startMusic, function () {}); else startMusic();
    },
    setSfx: function (on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? VOL_SFX : 0; },
    setMusic: function (on) { musicOn = on; if (musicBus) musicBus.gain.value = on ? VOL_MUSIC : 0; if (on) startMusic(); else stopMusic(); },
    get blocked() { return blocked; }
  };
})();
