/* Тексты RU/EN. Язык выбирает платформенный слой (VK/OK — всегда русский, Playgama — по platform.language). */
(function () {
  'use strict';
  var D = {
    ru: {
      title1: 'Найди отличия', title2: 'Новый год', slogan: 'Уютные отличия к празднику',
      loading: 'Загрузка…', play: 'Играть', levels: 'Уровни', level: 'Уровень {n}', levelOf: 'Уровень {n} из {total}',
      found: 'Найдено {a}/{b}', hint: 'Подсказка', next: 'Дальше', menu: 'Меню', resume: 'Продолжить', restart: 'Заново',
      pause: 'Пауза', sound: 'Звук', music: 'Музыка', sfx: 'Звуки', done: 'Готово', off: 'выкл.',
      winTitle: 'Отлично!', win3: 'Ни одной ошибки — вот это глаз!', win2: 'Все отличия найдены!', win1: 'Готово! Попробуйте без промахов.',
      winLast: 'Вы прошли все 100 уровней! С Новым годом!', festive: 'Праздничный уровень',
      loseTitle: 'Ой!', loseText: 'Сердечки закончились. Продолжить с тремя сердечками?', continueAd: 'Продолжить',
      tut: 'Найдите {n} {w} — нажмите на них на любой картинке', zoomTip: 'Раздвиньте двумя пальцами, чтобы приблизить',
      adNo: 'Реклама недоступна, попробуйте позже', adStub: 'Реклама', adStubSub: 'Здесь будет реклама',
      hintsPlus: '+{n} {w}', giftTitle: 'Подарок дня', giftDay: 'День {n}', giftTake: 'Забрать', giftTakeX2: 'Забрать ×2',
      giftText: 'Заходите каждый день — подарки растут!', giftGot: 'Подарок: +{n} {w}',
      invite: 'Пригласить друзей', inviteMsg: 'Играю в «Найди отличия: Новый год» — присоединяйся!', inviteReward: 'Спасибо! +3 подсказки',
      share: 'Поделиться', shareWall: 'На стену', shareStory: 'В историю', shareMsg: 'Я прошёл уровень {n} в «Найди отличия: Новый год» на {s}★! Сможешь лучше?',
      favTitle: 'Нравится игра?', favText: 'Добавьте её, чтобы быстро возвращаться.', favAdd: 'В избранное', homeAdd: 'На главный экран', later: 'Позже',
      locked: 'Сначала пройдите уровень {n}', close: 'Закрыть', stars: 'Звёзды', back: 'Назад', zoomReset: 'Сбросить приближение'
    },
    en: {
      title1: 'Spot the Difference', title2: 'New Year', slogan: 'Cozy puzzles for the holidays',
      loading: 'Loading…', play: 'Play', levels: 'Levels', level: 'Level {n}', levelOf: 'Level {n} of {total}',
      found: 'Found {a}/{b}', hint: 'Hint', next: 'Next', menu: 'Menu', resume: 'Resume', restart: 'Restart',
      pause: 'Paused', sound: 'Sound', music: 'Music', sfx: 'Sound effects', done: 'Done', off: 'off',
      winTitle: 'Great!', win3: 'Not a single miss — sharp eyes!', win2: 'All differences found!', win1: 'Done! Try it with no misses.',
      winLast: 'You finished all 100 levels! Happy New Year!', festive: 'Holiday level',
      loseTitle: 'Oops!', loseText: 'Out of hearts. Continue with three hearts?', continueAd: 'Continue',
      tut: 'Find {n} {w} — tap them on either picture', zoomTip: 'Pinch with two fingers to zoom in',
      adNo: 'Ad not available, try again later', adStub: 'Ad', adStubSub: 'An ad would play here',
      hintsPlus: '+{n} {w}', giftTitle: 'Daily gift', giftDay: 'Day {n}', giftTake: 'Claim', giftTakeX2: 'Claim ×2',
      giftText: 'Come back every day — gifts get bigger!', giftGot: 'Gift: +{n} {w}',
      invite: 'Invite friends', inviteMsg: 'Play Spot the Difference: New Year with me!', inviteReward: 'Thanks! +3 hints',
      share: 'Share', shareWall: 'Post', shareStory: 'Story', shareMsg: 'I beat level {n} in Spot the Difference: New Year with {s}★!',
      favTitle: 'Enjoying the game?', favText: 'Add it to come back faster.', favAdd: 'Add to favorites', homeAdd: 'Add to home screen', later: 'Later',
      locked: 'Finish level {n} first', close: 'Close', stars: 'Stars', back: 'Back', zoomReset: 'Reset zoom'
    }
  };
  var lang = 'ru';
  function t(key, p) {
    var s = (D[lang] && D[lang][key]) || D.ru[key] || key;
    if (p) for (var k in p) s = s.split('{' + k + '}').join(p[k]);
    return s;
  }
  // склонение: ru — [1, 2–4, 5+], en — [1, many]
  var WORDS = { diff: { ru: ['отличие', 'отличия', 'отличий'], en: ['difference', 'differences'] }, hint: { ru: ['подсказка', 'подсказки', 'подсказок'], en: ['hint', 'hints'] } };
  function word(key, n) {
    var f = WORDS[key][lang] || WORDS[key].en;
    if (lang !== 'ru') return n === 1 ? f[0] : f[1];
    var a = n % 100, b = n % 10;
    return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b >= 2 && b <= 4 ? f[1] : f[2];
  }
  window.I18N = {
    t: t, word: word,
    setLang: function (l) { lang = D[l] ? l : 'en'; document.documentElement.lang = lang; },
    get lang() { return lang; },
    apply: function (root) {
      (root || document).querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
      (root || document).querySelectorAll('[data-t-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-t-aria'))); });
    }
  };
})();
