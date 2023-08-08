function waitForElement(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

let oldUrl = location.pathname;
function onUrlChange(callback) {
  const observer = new MutationObserver(() => {
    let _ = oldUrl;
    oldUrl = location.pathname;
    if (_ === location.pathname) return;
    callback(_, location.pathname);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function initProgress() {
  waitForElement('h1.heading--nKNOf.heading--is-xs--UyvXH.heading--is-family-type-one--GqBzU.title').then(async () => {
    const animeName = document.querySelector('h4.text--gq6o-.text--is-fixed-size--5i4oU.text--is-semibold--AHOYN.text--is-l--iccTo').textContent;
    const episodeName = document.querySelector('h1.heading--nKNOf.heading--is-xs--UyvXH.heading--is-family-type-one--GqBzU.title').textContent;
    const currentEpisodeNumber = parseInt(episodeName.split('-')[0].trim().replaceAll('E', ''));

    await chrome.runtime.sendMessage({
      type: 'update_progress', animeName, episodeName, currentEpisodeNumber
    });
  });
}

async function initWatchlistSyncButton() {
  /**
   * @type {HTMLElement}
   */
  const buttons = await waitForElement('.watchlist-header ul.erc-watchlist-controls');

  const syncWatchlistBtn = document.createElement('li');
  syncWatchlistBtn.classList.add('controls-item');

  const content = document.createElement('div');
  content.classList.add('erc-watchlist-sync');

  const content_ = document.createElement('div');
  content_.classList.add('dropdown--cacSP');

  const button = document.createElement('div');
  button.setAttribute('role', 'button');
  button.setAttribute('tabindex', '0');
  button.setAttribute('data-t', 'sync-button');
  button.classList.add('dropdown-trigger--P--FX');

  const svg = document.createElement('svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewbox', '0 0 24 24');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('data-t', 'sync-svg');
  svg.classList.add('dropdown-trigger__icon--yrLaj');

  const svgPath = document.createElement('path');
  svgPath.setAttribute('d', 'M12 2c-5.177 0-9.446 3.954-9.949 9H0l3 3 3-3H4.069C4.564 7.06 7.928 4 12 4c4.411 0 8 3.589 8 8s-3.589 8-8 8a7.986 7.986 0 0 1-5.333-2.037 1 1 0 1 0-1.334 1.49A9.977 9.977 0 0 0 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2');
  svgPath.setAttribute('fill-rule', 'evenodd');
  svg.append(svgPath);

  const label = document.createElement('span');
  label.classList.add('call-to-action--PEidl', 'call-to-action--is-m--RVdkI', 'dropdown-trigger__title--TryWn');
  label.innerText = 'Sync avec Hyakanime';

  button.append(svg);
  button.append(label);
  content_.append(button);
  content.append(content_);
  syncWatchlistBtn.append(content);
  buttons.insertBefore(syncWatchlistBtn, document.querySelector('.watchlist-header ul.erc-watchlist-controls li.controls-item'));

  syncWatchlistBtn.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({
      type: 'start_watchlist_sync',
    });
  });
}

initProgress();
initWatchlistSyncButton();

onUrlChange(async (oldUrl, newUrl) => {
  const watchRegex = /\/([a-z]{2}\/)?watch\/([A-Z0-9]+)\/([a-z-]+)/g;
  const watchlistRegex = /\/([a-z]{2}\/)?watchlist/g;

  if (newUrl.match(watchlistRegex)) await initWatchlistSyncButton();

  const watchingEpisode = newUrl.match(watchRegex);
  if (watchingEpisode && watchingEpisode.length >= 1) setTimeout(() => initProgress(), 500);
});
