const baseUrl = 'https://api.hyakanime.fr';

const setProgressStatus = async (id, progress, status) => {
  if (typeof id !== 'number' && typeof id === 'string') id = parseInt(id);
  if (typeof progress !== 'number' && typeof progress === 'string') progress = parseInt(progress);
  if (typeof status !== 'number' && typeof status === 'string') status = parseInt(status);

  try {
    const request = await fetch(`${baseUrl}/progress/write`, {
      method: 'POST',
      body: JSON.stringify({
        id, progression: progress, status
      }),
      headers: {
        Authorization: await getHyakanimeToken(),
        'Content-Type': 'application/json'
      }
    });
    if (request.ok) {
      console.log(`Updated progress`);
    } else {
      throw new Error(`Failed to write progress: ${request.status} ${request.statusText}`);
    }
  } catch (e) {
    throw new Error(`Failed to write progress: ${e.message}`);
  }
}

const getHyakanimeToken = async () => {
  let [tab] = await chrome.tabs.query({ url: ['*://www.hyakanime.fr/*'] });
  if (tab) {
    return (await chrome.scripting.executeScript({
      target: {
        tabId: tab.id
      },
      func: () => localStorage.token,
    }))[0].result;
  } else {
    return undefined;
  }
}

const getAnimeId = async (name) => {
  if (typeof name !== 'string') return;

  try {
    const results = await (await fetch(`${baseUrl}/search/anime/${encodeURIComponent(name)}`)).json();
    const anime = results.find(anime => anime.title === name || anime.titleEN === name || anime.titleJP === name);
    if (anime) {
      return anime.id;
    }
  } catch (e) {
    throw new Error(`Failed to find Hyakanime anime id for ${name}: ${e.message}`);
  }
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'update_progress') {
    let [tab] = await chrome.tabs.query({ active: true, url: ['*://www.crunchyroll.com/*'] });
    if (!tab) return;
    const hyakanimeId = await getAnimeId(message.animeName);
    if (!hyakanimeId) {
      throw new Error(`Failed to find Hyakanime anime id for ${name}: anime not found, maybe not available in their library?`);
    }

    setProgressStatus(hyakanimeId, message.currentEpisodeNumber, 1);
  } else if (message.type === 'start_watchlist_sync') {
    let tabOpened = false, hyakanimeTab;
    if ((await chrome.tabs.query({ url: ['*://www.hyakanime.fr/*'] })).length < 1) {
      tabOpened = true;
      hyakanimeTab = await chrome.tabs.create({ url: 'https://www.hyakanime.fr/', pinned: true, active: false });
      await chrome.scripting.executeScript({
        target: { tabId: hyakanimeTab.id },
        func: () => {
          alert('Veuillez à ne PAS fermer cet onglet pour que la synchronisation puisse s\'effectuer totalement.');
        }
      });
    }
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const animes = (await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const epAndSeason = /S([0-9]+) E([0-9]+)/gi;
        return Array.from(document.querySelectorAll('.watchlist-card-body--ZpYFy')).map(anime => {
          const status = anime.querySelector('h5.text--gq6o-.text--is-m--pqiL-.watchlist-card-subtitle--IROsU').textContent;
          return {
            name: anime.querySelector('a.watchlist-card-title--o1sAO').textContent,
            season: parseInt([...status.matchAll(epAndSeason)][0][1]),
            episode: parseInt([...status.matchAll(epAndSeason)][0][2]),
            continue: !!anime.parentNode.querySelector('.progress-bar--4cDQR.playable-thumbnail__progress-bar--vfMAD')
          };
        });
      }
    }))[0].result;

    for (const anime of animes) {
      const id = await getAnimeId(anime.name);
      try {
        // 1 = en cours | 2 = à voir
        await setProgressStatus(id, anime.continue ? anime.episode : 0, anime.continue ? 1 : 2);
      } catch (e) {
        console.error(`Failed to sync ${anime.name}: ${e.message}`);
      }
    }

    if (tabOpened && hyakanimeTab) await chrome.tabs.remove(hyakanimeTab.id);
  }
});
