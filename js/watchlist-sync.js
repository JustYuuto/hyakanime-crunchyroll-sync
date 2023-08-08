function getAnimesNames() {
  return Array.from(document
    .querySelectorAll('.text--gq6o-.text--is-semibold--AHOYN.text--is-l--iccTo.watchlist-card-title__text--chGlt'))
    .map(name => name.textContent);
}
