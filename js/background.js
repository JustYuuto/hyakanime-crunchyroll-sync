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
    const anime = (results).find(anime => anime.title?.includes(name) || anime.titleEN?.includes(name) || anime.titleJP?.includes(name));
    if (anime) {
      return anime.id;
    }
  } catch (e) {
    throw new Error(`Failed to find Hyakanime anime id for ${name}: ${e.message}`);
  }
}

chrome.runtime.onMessage.addListener(async (message) => {
  let [tab] = await chrome.tabs.query({ active: true, url: ['*://www.crunchyroll.com/*'] });
  if (!tab) return;
  const hyakanimeId = await getAnimeId(message.animeName);
  if (!hyakanimeId) {
    throw new Error(`Failed to find Hyakanime anime id for ${name}: anime not found, maybe not available in their library?`);
  }

  setProgressStatus(hyakanimeId, message.currentEpisodeNumber, 1);
});
