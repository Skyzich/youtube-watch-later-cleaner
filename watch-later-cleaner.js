/**
 * Skyzich — YouTube Watch Later Cleaner
 * Version: 1.1.0
 * License: MIT
 *
 * Bulk-removes videos from YouTube's Watch Later playlist by using
 * YouTube's own visible UI controls. The script itself does not use
 * fetch(), XMLHttpRequest, WebSocket, sendBeacon, cookies, or storage.
 *
 * IMPORTANT:
 * - Removal is permanent from Watch Later.
 * - YouTube can change its DOM/UI at any time.
 * - This is an unofficial project and is not affiliated with Google/YouTube.
 * - Intended for personal management of your own Watch Later playlist.
 * - Use of automation may be subject to YouTube's Terms of Service.
 */

(async () => {
  'use strict';

  const META = Object.freeze({
    name: 'Skyzich — YouTube Watch Later Cleaner',
    version: '1.1.0',
    author: 'Skyzich',
    mode: 'Fast Adaptive',
  });

  const CONFIG = Object.freeze({
    menuTimeoutMs: 2600,
    removeTimeoutMs: 6500,
    initialInterItemDelayMs: 260,
    minInterItemDelayMs: 120,
    maxInterItemDelayMs: 2200,
    successSpeedupMs: 20,
    failureBackoffMultiplier: 1.75,
    failureBackoffExtraMs: 350,
    maxConsecutiveFailures: 5,
    cooldownEvery: 150,
    cooldownMs: 3500,
    initialLoadTimeoutMs: 7000,
    pollMs: 60,
  });

  const COLORS = Object.freeze({
    title: 'background:#0f0f0f;color:#ff3158;font-size:17px;font-weight:800;padding:7px 10px;border-radius:7px;',
    subtitle: 'color:#aaa;font-size:12px;',
    info: 'color:#3ea6ff;font-weight:700;',
    ok: 'color:#2ba640;font-weight:700;',
    warn: 'color:#f5b400;font-weight:700;',
    error: 'color:#ff4e45;font-weight:800;',
    label: 'color:#ddd;font-weight:700;',
  });

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const normalize = (value = '') =>
    String(value)
      .normalize('NFKC')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleLowerCase()
      .replace(/ё/g, 'е');

  const isVisible = (element) => {
    if (!(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const logger = Object.freeze({
    info: (...args) => console.log('%c[Skyzich WL]', COLORS.info, ...args),
    ok: (...args) => console.log('%c[Skyzich WL]', COLORS.ok, ...args),
    warn: (...args) => console.warn('%c[Skyzich WL]', COLORS.warn, ...args),
    error: (...args) => console.error('%c[Skyzich WL]', COLORS.error, ...args),
  });

  console.clear();
  console.log(`%c ${META.name} `, COLORS.title);
  console.log(`%cv${META.version} • Author: ${META.author} • ${META.mode}`, COLORS.subtitle);
  console.log('');
  console.log('%cPRIVACY', COLORS.label);
  console.log('✓ No external servers used by this script');
  console.log('✓ No telemetry or analytics');
  console.log('✓ No password, cookie, token, localStorage or sessionStorage access');
  console.log('✓ No fetch / XHR / WebSocket / sendBeacon calls');
  console.log('  Note: YouTube itself will naturally send requests when its own Remove command is clicked.');
  console.log('');
  console.log('%cWARNING', COLORS.warn);
  console.log('• Removing videos from Watch Later is permanent.');
  console.log('• YouTube may change its interface at any time and break this script.');
  console.log('• This project is unofficial and is not affiliated with Google or YouTube.');
  console.log('• Intended only for managing your own Watch Later playlist.');
  console.log("• Automated use of YouTube may be restricted by YouTube's Terms of Service.");
  console.log('• This script does not bypass login, CAPTCHA, access controls, or rate limits.');
  console.log('• Review code before running anything in DevTools.');
  console.log('');

  // Prevent accidental duplicate runs.
  if (window.SKYZICH_WL?.running) {
    logger.error('Another Skyzich Watch Later Cleaner session is already running.');
    console.log('Use SKYZICH_WL.status() or SKYZICH_WL.stop().');
    return;
  }

  // Validate page.
  const url = new URL(location.href);
  const validHost = /(^|\.)youtube\.com$/i.test(url.hostname);
  const isWatchLater = url.pathname.startsWith('/playlist') && url.searchParams.get('list') === 'WL';

  if (!validHost || !isWatchLater) {
    logger.error('Wrong page. Open the desktop Watch Later playlist first:');
    console.log('https://www.youtube.com/playlist?list=WL');
    return;
  }

  const state = {
    running: false,
    stopRequested: false,
    target: 0,
    removeAll: false,
    removed: 0,
    failures: 0,
    currentDelayMs: CONFIG.initialInterItemDelayMs,
    startedAt: 0,
    lastTitle: null,
  };

  const api = {
    version: META.version,
    get running() { return state.running; },
    stop() {
      state.stopRequested = true;
      logger.warn('Stop requested. The cleaner will stop after the current UI operation.');
    },
    status() {
      const elapsed = state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : 0;
      const snapshot = {
        running: state.running,
        stopRequested: state.stopRequested,
        target: state.removeAll ? 'ALL' : state.target,
        removed: state.removed,
        consecutiveFailures: state.failures,
        adaptiveDelayMs: Math.round(state.currentDelayMs),
        elapsedSeconds: elapsed,
        lastVideo: state.lastTitle,
      };
      console.table(snapshot);
      return snapshot;
    },
  };
  window.SKYZICH_WL = api;

  // Strict multilingual detection: a menu item must contain BOTH
  // a removal concept and a Watch Later concept from the same language rule.
  const LANGUAGE_RULES = [
    { lang: 'English', remove: ['remove'], watch: ['watch later'] },
    { lang: 'Russian', remove: ['удалить', 'убрать'], watch: ['смотреть позже'] },
    { lang: 'Ukrainian', remove: ['видалити', 'прибрати'], watch: ['переглянути пізніше'] },
    { lang: 'Belarusian', remove: ['выдаліць', 'прыбраць'], watch: ['паглядзець пазней'] },
    { lang: 'German', remove: ['entfernen'], watch: ['später ansehen', 'spaeter ansehen'] },
    { lang: 'French', remove: ['supprimer', 'retirer'], watch: ['à regarder plus tard', 'a regarder plus tard'] },
    { lang: 'Spanish', remove: ['quitar', 'eliminar'], watch: ['ver más tarde', 'ver mas tarde'] },
    { lang: 'Portuguese', remove: ['remover'], watch: ['assistir mais tarde', 'ver mais tarde'] },
    { lang: 'Italian', remove: ['rimuovi', 'rimuovere'], watch: ['guarda più tardi', 'guarda piu tardi'] },
    { lang: 'Dutch', remove: ['verwijderen'], watch: ['later bekijken'] },
    { lang: 'Polish', remove: ['usuń', 'usun'], watch: ['do obejrzenia', 'obejrzyj później', 'obejrzyj pozniej'] },
    { lang: 'Czech', remove: ['odebrat', 'odstranit'], watch: ['přehrát později', 'prehrat pozdeji'] },
    { lang: 'Slovak', remove: ['odstrániť', 'odstranit'], watch: ['pozrieť neskôr', 'pozriet neskor'] },
    { lang: 'Slovenian', remove: ['odstrani'], watch: ['ogled pozneje'] },
    { lang: 'Croatian', remove: ['ukloni'], watch: ['gledaj kasnije'] },
    { lang: 'Serbian', remove: ['уклони', 'ukloni'], watch: ['гледај касније', 'gledaj kasnije'] },
    { lang: 'Bosnian', remove: ['ukloni'], watch: ['gledaj kasnije'] },
    { lang: 'Bulgarian', remove: ['премахване', 'премахни'], watch: ['гледане по-късно', 'гледане по късно'] },
    { lang: 'Romanian', remove: ['elimină', 'elimina'], watch: ['vizionează mai târziu', 'vizioneaza mai tarziu'] },
    { lang: 'Hungarian', remove: ['eltávolítás', 'eltavolitas', 'eltávolítás innen'], watch: ['megnézendő', 'megnezendo', 'megnézés később'] },
    { lang: 'Greek', remove: ['κατάργηση', 'αφαίρεση'], watch: ['παρακολούθηση αργότερα'] },
    { lang: 'Turkish', remove: ['kaldır', 'kaldir'], watch: ['daha sonra izle'] },
    { lang: 'Swedish', remove: ['ta bort'], watch: ['titta senare'] },
    { lang: 'Norwegian', remove: ['fjern'], watch: ['se senere'] },
    { lang: 'Danish', remove: ['fjern'], watch: ['se senere'] },
    { lang: 'Finnish', remove: ['poista'], watch: ['katso myöhemmin', 'katso myohemmin'] },
    { lang: 'Estonian', remove: ['eemalda'], watch: ['vaata hiljem'] },
    { lang: 'Latvian', remove: ['noņemt', 'nonemt'], watch: ['skatīties vēlāk', 'skatities velak'] },
    { lang: 'Lithuanian', remove: ['pašalinti', 'pasalinti'], watch: ['žiūrėti vėliau', 'ziureti veliau'] },
    { lang: 'Indonesian', remove: ['hapus'], watch: ['tonton nanti'] },
    { lang: 'Malay', remove: ['alih keluar', 'buang'], watch: ['tonton kemudian'] },
    { lang: 'Vietnamese', remove: ['xóa', 'xoá'], watch: ['xem sau'] },
    { lang: 'Filipino', remove: ['alisin'], watch: ['panoorin sa ibang pagkakataon'] },
    { lang: 'Japanese', remove: ['削除'], watch: ['後で見る'] },
    { lang: 'Korean', remove: ['삭제'], watch: ['나중에 볼 동영상', '나중에 보기'] },
    { lang: 'Chinese Simplified', remove: ['移除', '删除'], watch: ['稍后观看'] },
    { lang: 'Chinese Traditional', remove: ['移除', '刪除'], watch: ['稍後觀看'] },
    { lang: 'Hindi', remove: ['हटाएं', 'हटाएँ'], watch: ['बाद में देखें'] },
    { lang: 'Arabic', remove: ['إزالة', 'حذف'], watch: ['المشاهدة لاحقًا', 'المشاهدة لاحقا'] },
    { lang: 'Hebrew', remove: ['הסרה', 'הסר'], watch: ['לצפייה בהמשך'] },
    { lang: 'Thai', remove: ['นำออก', 'ลบ'], watch: ['ดูภายหลัง'] },
  ];

  const detectRemovalRule = (text) => {
    const value = normalize(text);
    for (const rule of LANGUAGE_RULES) {
      const hasRemove = rule.remove.some((token) => value.includes(normalize(token)));
      const hasWatch = rule.watch.some((token) => value.includes(normalize(token)));
      if (hasRemove && hasWatch) return rule;
    }
    return null;
  };

  const waitFor = async (getter, timeoutMs, pollMs = CONFIG.pollMs) => {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      const result = getter();
      if (result) return result;
      await sleep(pollMs);
    }
    return null;
  };

  const waitUntilDetached = (element, timeoutMs) =>
    new Promise((resolve) => {
      if (!element?.isConnected) {
        resolve(true);
        return;
      }

      let finished = false;
      const finish = (value) => {
        if (finished) return;
        finished = true;
        observer.disconnect();
        clearTimeout(timer);
        resolve(value);
      };

      const observer = new MutationObserver(() => {
        if (!element.isConnected) finish(true);
      });

      observer.observe(document.documentElement, { childList: true, subtree: true });
      const timer = setTimeout(() => finish(!element.isConnected), timeoutMs);
    });

  const getFirstRow = () => {
    const candidates = [
      ...document.querySelectorAll('ytd-playlist-video-renderer'),
      ...document.querySelectorAll('ytd-playlist-video-list-renderer ytd-playlist-video-renderer'),
    ];
    return candidates.find(isVisible) || null;
  };

  const getTitle = (row) => {
    const title = row?.querySelector('#video-title, a#video-title');
    return (
      title?.getAttribute('title') ||
      title?.textContent?.trim() ||
      row?.querySelector('h3')?.textContent?.trim() ||
      'Unknown title'
    );
  };

  const findMenuButton = (row) => {
    if (!row) return null;

    const directSelectors = [
      'ytd-menu-renderer yt-icon-button button',
      'ytd-menu-renderer button',
      '#menu yt-icon-button button',
      '#menu button',
      'yt-icon-button#button button',
    ];

    for (const selector of directSelectors) {
      const button = [...row.querySelectorAll(selector)].find(isVisible);
      if (button) return button;
    }

    // Fallback for UI variants: choose a visible button whose accessibility text
    // resembles a generic "more/actions/menu" control in common languages.
    const menuWords = [
      'action menu', 'more actions', 'more', 'menu',
      'действия', 'ещё', 'еще', 'меню',
      'weitere', 'mehr', 'plus', 'más', 'mas', 'mais',
      'altro', 'meer', 'więcej', 'wiecej', 'další', 'dalsi',
      'daha fazla', 'mer', 'flere', 'lisää', 'lisaa',
      'その他', '더보기', '更多', 'เมนู', 'المزيد', 'עוד',
    ].map(normalize);

    const buttons = [...row.querySelectorAll('button')].filter(isVisible);
    return (
      buttons.find((button) => {
        const text = normalize([
          button.getAttribute('aria-label'),
          button.getAttribute('title'),
          button.textContent,
        ].filter(Boolean).join(' '));
        return menuWords.some((word) => text.includes(word));
      }) || null
    );
  };

  const getVisibleMenuItems = () => {
    const selectors = [
      'ytd-popup-container ytd-menu-service-item-renderer',
      'ytd-popup-container tp-yt-paper-item',
      'ytd-popup-container yt-list-item-view-model',
      'tp-yt-iron-dropdown ytd-menu-service-item-renderer',
      'tp-yt-iron-dropdown tp-yt-paper-item',
      'tp-yt-iron-dropdown yt-list-item-view-model',
    ];

    return [...document.querySelectorAll(selectors.join(','))].filter(isVisible);
  };

  const findRemoveItem = () => {
    for (const item of getVisibleMenuItems()) {
      const text = [
        item.textContent || '',
        item.getAttribute('aria-label') || '',
        item.getAttribute('title') || '',
      ].join(' ');
      const rule = detectRemovalRule(text);
      if (rule) return { item, rule, text: normalize(text) };
    }
    return null;
  };

  const closeOpenMenu = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      which: 27,
      bubbles: true,
    }));
  };

  // Ask the user how much to remove.
  const amountRaw = prompt(
    [
      `${META.name} v${META.version}`,
      '',
      'How many videos do you want to remove?',
      '',
      'Enter a positive whole number (example: 607)',
      'or enter ALL to empty Watch Later.',
      '',
      'The action is permanent.',
    ].join('\n'),
    '100'
  );

  if (amountRaw === null) {
    logger.warn('Cancelled by user. Nothing was changed.');
    return;
  }

  const normalizedAmount = normalize(amountRaw);
  const removeAll = normalizedAmount === 'all';
  const target = removeAll ? Number.POSITIVE_INFINITY : Number(amountRaw.trim());

  if (!removeAll && (!Number.isSafeInteger(target) || target <= 0 || target > 100000)) {
    logger.error('Invalid amount. Enter a whole number from 1 to 100000, or ALL.');
    return;
  }

  const displayTarget = removeAll ? 'ALL videos' : `${target} video${target === 1 ? '' : 's'}`;
  const confirmed = confirm([
    'FINAL CONFIRMATION',
    '',
    `You are about to remove ${displayTarget} from Watch Later.`,
    '',
    'This action is permanent and cannot be automatically undone.',
    '',
    'Use this only on your own Watch Later playlist.',
    "Automated use may be subject to YouTube's Terms of Service.",
    '',
    'Press OK to confirm that you understand and start.',
  ].join('\n'));

  if (!confirmed) {
    logger.warn('Cancelled before execution. Nothing was changed.');
    return;
  }

  state.target = target;
  state.removeAll = removeAll;
  state.running = true;
  state.startedAt = Date.now();

  console.log('');
  console.log('%cSESSION STARTED', COLORS.ok);
  console.log(`Target: ${displayTarget}`);
  console.log(`Mode: ${META.mode}`);
  console.log('Stop: SKYZICH_WL.stop()');
  console.log('Status: SKYZICH_WL.status()');
  console.log('');

  // Let the playlist finish its initial render if needed.
  let row = await waitFor(getFirstRow, CONFIG.initialLoadTimeoutMs, 100);
  if (!row) {
    logger.ok('No visible playlist rows were found. Watch Later may already be empty.');
    state.running = false;
    return;
  }

  let detectedLanguage = null;

  while (!state.stopRequested && (state.removeAll || state.removed < state.target)) {
    row = getFirstRow();

    if (!row) {
      // Brief grace period because YouTube can re-render the list between removals.
      row = await waitFor(getFirstRow, 1800, 80);
      if (!row) {
        logger.ok('No more videos found. Watch Later appears to be empty.');
        break;
      }
    }

    const title = getTitle(row);
    state.lastTitle = title;

    const menuButton = findMenuButton(row);
    if (!menuButton) {
      state.failures += 1;
      state.currentDelayMs = clamp(
        state.currentDelayMs * CONFIG.failureBackoffMultiplier + CONFIG.failureBackoffExtraMs,
        CONFIG.minInterItemDelayMs,
        CONFIG.maxInterItemDelayMs
      );
      logger.warn(`Menu button not found (${state.failures}/${CONFIG.maxConsecutiveFailures}).`);
      if (state.failures >= CONFIG.maxConsecutiveFailures) {
        logger.error('Too many consecutive failures. Stopping to avoid unintended clicks.');
        break;
      }
      await sleep(state.currentDelayMs);
      continue;
    }

    menuButton.click();

    const removeMatch = await waitFor(findRemoveItem, CONFIG.menuTimeoutMs, CONFIG.pollMs);
    if (!removeMatch) {
      closeOpenMenu();
      state.failures += 1;
      state.currentDelayMs = clamp(
        state.currentDelayMs * CONFIG.failureBackoffMultiplier + CONFIG.failureBackoffExtraMs,
        CONFIG.minInterItemDelayMs,
        CONFIG.maxInterItemDelayMs
      );
      logger.warn(`Remove-from-Watch-Later command not detected (${state.failures}/${CONFIG.maxConsecutiveFailures}).`);
      if (state.failures >= CONFIG.maxConsecutiveFailures) {
        logger.error('Stopping for safety. Your current YouTube UI/language may not be recognized.');
        break;
      }
      await sleep(state.currentDelayMs);
      continue;
    }

    if (!detectedLanguage) {
      detectedLanguage = removeMatch.rule.lang;
      logger.info(`Removal command detected. UI language match: ${detectedLanguage}.`);
    }

    removeMatch.item.click();

    const detached = await waitUntilDetached(row, CONFIG.removeTimeoutMs);
    if (!detached) {
      closeOpenMenu();
      state.failures += 1;
      state.currentDelayMs = clamp(
        state.currentDelayMs * CONFIG.failureBackoffMultiplier + CONFIG.failureBackoffExtraMs,
        CONFIG.minInterItemDelayMs,
        CONFIG.maxInterItemDelayMs
      );
      logger.warn(`YouTube did not confirm removal in time (${state.failures}/${CONFIG.maxConsecutiveFailures}). Backing off...`);
      if (state.failures >= CONFIG.maxConsecutiveFailures) {
        logger.error('Too many consecutive failures. Stopping.');
        break;
      }
      await sleep(Math.max(1200, state.currentDelayMs));
      continue;
    }

    state.removed += 1;
    state.failures = 0;
    state.currentDelayMs = clamp(
      state.currentDelayMs - CONFIG.successSpeedupMs,
      CONFIG.minInterItemDelayMs,
      CONFIG.maxInterItemDelayMs
    );

    const targetLabel = state.removeAll ? 'ALL' : state.target;
    const percent = state.removeAll ? '' : ` (${((state.removed / state.target) * 100).toFixed(1)}%)`;
    logger.ok(`${state.removed}/${targetLabel}${percent} — ${title}`);

    if (
      CONFIG.cooldownEvery > 0 &&
      state.removed % CONFIG.cooldownEvery === 0 &&
      (state.removeAll || state.removed < state.target)
    ) {
      logger.info(`Short anti-throttle cooldown: ${CONFIG.cooldownMs / 1000}s after ${state.removed} removals.`);
      await sleep(CONFIG.cooldownMs);
    } else {
      await sleep(state.currentDelayMs);
    }
  }

  state.running = false;
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000));
  const avg = state.removed ? (elapsedSeconds / state.removed).toFixed(2) : '—';

  console.log('');
  console.log('%cFINAL REPORT', COLORS.title);
  console.table({
    Requested: state.removeAll ? 'ALL' : state.target,
    Removed: state.removed,
    'Elapsed (s)': elapsedSeconds,
    'Average sec/video': avg,
    'Detected UI language': detectedLanguage || 'Unknown',
    'Stopped by user': state.stopRequested ? 'Yes' : 'No',
  });

  if (state.stopRequested) {
    logger.warn('Stopped by user request.');
  } else if (!getFirstRow()) {
    logger.ok('Watch Later appears to be empty. Refresh the page to verify the final count.');
  } else if (!state.removeAll && state.removed >= state.target) {
    logger.ok('Requested amount completed. Refresh the page to verify the playlist count.');
  } else {
    logger.warn('The session ended before reaching the requested amount. Check the messages above, refresh, and retry if needed.');
  }
})();
