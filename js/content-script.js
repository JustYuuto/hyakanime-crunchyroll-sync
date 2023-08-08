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

const crunchyrollWatchRegex = /\/([a-z]{2}\/)?watch\/([A-Z0-9]+)\/([a-z-]+)/g;

function init() {
  console.log('watching episode');
  waitForElement('h1.heading--nKNOf.heading--is-xs--UyvXH.heading--is-family-type-one--GqBzU.title').then(async () => {
    const animeName = document.querySelector('h4.text--gq6o-.text--is-fixed-size--5i4oU.text--is-semibold--AHOYN.text--is-l--iccTo').textContent;
    const episodeName = document.querySelector('h1.heading--nKNOf.heading--is-xs--UyvXH.heading--is-family-type-one--GqBzU.title').textContent;
    const currentEpisodeNumber = parseInt(episodeName.split('-')[0].trim().replaceAll('E', ''));

    await chrome.runtime.sendMessage({
      animeName, episodeName, currentEpisodeNumber
    });
  });
}

init();

onUrlChange((oldUrl, newUrl) => {
  const watchingEpisode = newUrl.match(crunchyrollWatchRegex);
  if (watchingEpisode && watchingEpisode.length >= 1) setTimeout(() => init(), 500);
});
