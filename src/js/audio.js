/* Звук: всё синтезируется WebAudio (без внешних файлов).
   Эффекты: верный тап, промах, подсказка, победа, клик. Музыка: тихая «музыкальная шкатулка» собственного сочинения. */
(function () {
  'use strict';
  var ctx = null, master = null, sfxBus = null, musicBus = null;
  var sfxOn = true, musicOn = true, suspendedBySystem = false;
  var musicTimer = null, nextNoteTime = 0, step = 0;

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.7 : 0; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? 0.16 : 0; musicBus.connect(master);
    return ctx;
  }

  function freq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  // колокольчик: основной тон + обертоны с быстрым затуханием
  function bell(bus, midi, t, dur, vol) {
    var f = freq(midi);
    [[1, 1], [2.01, 0.35], [3.98, 0.12]].forEach(function (h) {
      var o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * h[0];
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol * h[1], t + 0.008);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur / (h[0] > 1 ? 1.8 : 1));
      o.connect(gn); gn.connect(bus); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function soft(bus, midi, t, dur, vol, type) {
    var o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq(midi);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); gn.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }

  var SFX = {
    found: function (t) { bell(sfxBus, 88, t, 0.6, 0.35); bell(sfxBus, 95, t + 0.08, 0.7, 0.28); },
    miss: function (t) {
      var o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.18);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.35, t + 0.015); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(gn); gn.connect(sfxBus); o.start(t); o.stop(t + 0.25);
    },
    hint: function (t) { [84, 88, 91, 96].forEach(function (n, i) { bell(sfxBus, n, t + i * 0.07, 0.5, 0.18); }); },
    click: function (t) { soft(sfxBus, 84, t, 0.08, 0.15, 'sine'); },
    win: function (t) {
      [72, 76, 79, 84, 79, 84, 88].forEach(function (n, i) { bell(sfxBus, n, t + i * 0.11, 0.8, 0.26); });
      soft(sfxBus, 48, t, 1.2, 0.18); soft(sfxBus, 55, t + 0.44, 1.2, 0.14);
    },
    star: function (t) { bell(sfxBus, 93, t, 0.5, 0.25); }
  };

  function play(name) {
    if (!sfxOn || suspendedBySystem) return;
    if (!ensure()) return;
    if (ctx.state !== 'running') ctx.resume();
    SFX[name] && SFX[name](ctx.currentTime + 0.01);
  }

  /* ---------- Музыка: вальс-шкатулка, 3/4, 16 тактов, собственная мелодия ---------- */
  // 0 — пауза; каждая клетка = восьмая (6 на такт)
  var MEL = [
    76, 0, 79, 0, 81, 0,   79, 0, 76, 0, 74, 0,   72, 0, 74, 0, 76, 0,   74, 0, 0, 0, 0, 0,
    76, 0, 79, 0, 84, 0,   83, 0, 81, 0, 79, 0,   81, 0, 79, 0, 76, 0,   79, 0, 0, 0, 0, 0,
    81, 0, 84, 0, 86, 0,   84, 0, 81, 0, 79, 0,   76, 0, 79, 0, 81, 0,   79, 0, 76, 0, 74, 0,
    72, 0, 76, 0, 79, 0,   81, 0, 79, 0, 74, 0,   76, 0, 74, 0, 72, 0,   72, 0, 0, 0, 0, 0
  ];
  var CH = [48, 43, 45, 43, 48, 52, 53, 48, 53, 48, 52, 43, 45, 43, 48, 48]; // бас — по такту
  var EIGHTH = 0.24;

  function scheduler() {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + 0.3) {
      var i = step % MEL.length;
      if (MEL[i]) bell(musicBus, MEL[i], nextNoteTime, 1.1, 0.5);
      if (i % 6 === 0) {
        var bar = (i / 6) | 0;
        soft(musicBus, CH[bar], nextNoteTime, 1.4, 0.35, 'sine');
      } else if (i % 6 === 2 || i % 6 === 4) {
        var b2 = (i / 6) | 0;
        soft(musicBus, CH[b2] + 12 + (i % 6 === 2 ? 4 : 7), nextNoteTime, 0.5, 0.12, 'sine');
      }
      nextNoteTime += EIGHTH; step++;
    }
  }
  function startMusic() {
    if (!musicOn || musicTimer || suspendedBySystem) return;
    if (!ensure()) return;
    nextNoteTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(scheduler, 100);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  /* ---------- Общие функции ---------- */
  function unlock() { // вызывается на первом касании
    if (!ensure()) return;
    if (ctx.state !== 'running' && !suspendedBySystem) ctx.resume();
    startMusic();
  }
  // Тишина при сворачивании и на время рекламы
  function suspend() {
    suspendedBySystem = true; stopMusic();
    if (ctx && ctx.state === 'running') ctx.suspend();
  }
  // Единая функция «восстановить звук»: после рекламы и после возврата из свёрнутого состояния
  function restore() {
    suspendedBySystem = false;
    if (!ctx) return;
    ctx.resume().then(function () { startMusic(); }, function () {});
  }

  window.Sound = {
    play: play, unlock: unlock, suspend: suspend, restore: restore,
    setSfx: function (on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 0.7 : 0; },
    setMusic: function (on) {
      musicOn = on; if (musicBus) musicBus.gain.value = on ? 0.16 : 0;
      if (on) { if (ctx) startMusic(); } else stopMusic();
    },
    get sfx() { return sfxOn; }, get music() { return musicOn; }
  };
})();
