const backLink = document.querySelector('a.back');

if (backLink) {
  const repositoryHome = new URL('../../main-site/', location.href);
  const publishedHome = new URL('../../', location.href);
  const normalizePath = path => path.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const homePaths = new Set([
    normalizePath(repositoryHome.pathname),
    normalizePath(publishedHome.pathname),
  ]);

  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === location.origin
      && homePaths.has(normalizePath(referrer.pathname))
      && history.length > 1) {
      backLink.addEventListener('click', event => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        history.back();
      });
    }
  } catch {
    // Keep the regular homepage link when the applet was opened directly.
  }

  fetch(repositoryHome, { method: 'HEAD' })
    .then(response => {
      if (response.ok) backLink.href = repositoryHome.href;
    })
    .catch(() => {});
}
