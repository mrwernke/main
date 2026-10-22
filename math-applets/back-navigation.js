import './site-tracker.js';

// Source of truth for the nearby-applet links in every applet header.
// Register new applets here in unit order; each applet page loads this module.
const unitApplets = [
  {
    name: 'Unit 2: Functions & Transformations',
    applets: [
      { code: 'FT3', title: 'Domain & Range', path: '/math-applets/domain-range-helper/' },
      { code: 'FT4A', title: 'Function Transformations', path: '/math-applets/function-transformations/' },
      { code: 'FT9', title: 'Absolute Value Graphing', path: '/math-applets/absolute-value-graphing/' },
      { code: 'FT10', title: 'Absolute Value Features', path: '/math-applets/absolute-value-features/' },
      { code: 'FT12', title: 'Absolute Value Transformations', path: '/math-applets/absolute-value-transformations/' },
      { code: 'FT13', title: 'Absolute Value Equations', path: '/math-applets/absolute-value-equations/' },
    ],
  },
  {
    name: 'Unit 3: Quadratic Functions',
    applets: [
      { code: 'Q1', title: 'Quadratic Graphing: Standard Form', path: '/math-applets/quadratic-graphing/', form: 'standard' },
      { code: 'Q2', title: 'Quadratic Graphing: Factored Form', path: '/math-applets/quadratic-graphing/', form: 'factored' },
      { code: 'Q3', title: 'Quadratic Graphing: Vertex Form', path: '/math-applets/quadratic-graphing/', form: 'vertex' },
      { code: 'Q4', title: 'Quadratic Features', path: '/math-applets/quadratic-features/' },
      { code: 'Q5', title: 'Quadratic Transformations', path: '/math-applets/quadratic-transformations/' },
      { code: 'Q6', title: 'Quadratic from a Graph', path: '/math-applets/quadratic-from-graph/' },
      { code: 'Q7', title: 'Quadratic Conversion', path: '/math-applets/quadratic-convert/' },
      { code: 'Q8', title: 'Sketch from a Story', path: '/math-applets/quadratic-story-sketch/' },
      { code: 'Q9', title: 'Quadratic Extrema', path: '/math-applets/quadratic-extrema/' },
      { code: 'Q10', title: 'Quadratic Solutions in Context', path: '/math-applets/quadratic-real-world-solutions/' },
      { code: 'Q11', title: 'Solutions from a Graph', path: '/math-applets/quadratic-graph-solutions/' },
      { code: 'Q12', title: 'Discriminant', path: '/math-applets/quadratic-discriminant/' },
      { code: 'Q13', title: 'Choose a Solving Method', path: '/math-applets/quadratic-method-choice/' },
      { code: 'Q14', title: 'Quadratic Formula', path: '/math-applets/quadratic-formula/' },
      { code: 'Q15', title: 'Factoring', path: '/math-applets/quadratic-factoring/' },
      { code: 'Q16', title: 'Square Root Method', path: '/math-applets/quadratic-square-root/' },
      { code: 'Q17', title: 'Complete the Square', path: '/math-applets/quadratic-completing-square/' },
      { code: 'Q18', title: 'Quadratic Modeling', path: '/math-applets/quadratic-modeling/?v=20261019a' },
      { code: 'Q19', title: 'Solving Systems', path: '/math-applets/quadratic-systems/' },
    ],
  },
];

const normalizePath = path => path.replace(/index\.html$/, '').replace(/\/?$/, '/');
const appletsPathIndex = location.pathname.indexOf('/math-applets/');
const sitePrefix = appletsPathIndex >= 0 ? location.pathname.slice(0, appletsPathIndex) : '';

function appletUrl(applet) {
  const url = new URL(`${sitePrefix}${applet.path}`, location.origin);
  if (applet.form) url.searchParams.set('form', applet.form);
  return url;
}

function currentAppletIndex(applets) {
  const currentPath = normalizePath(location.pathname);
  const currentForm = new URLSearchParams(location.search).get('form') || 'standard';
  return applets.findIndex(applet => {
    if (normalizePath(appletUrl(applet).pathname) !== currentPath) return false;
    return !applet.form || applet.form === currentForm;
  });
}

function findCurrentApplet() {
  for (const unit of unitApplets) {
    const index = currentAppletIndex(unit.applets);
    if (index >= 0) return { unit, appletIndex: index, applet: unit.applets[index] };
  }
  return null;
}

function addNearbyApplets(topbar, unit, appletIndex) {
  const nav = document.createElement('nav');
  nav.className = 'site-applet-nav';
  nav.setAttribute('aria-label', `Nearby applets in ${unit.name}`);

  const list = document.createElement('ol');
  list.className = 'site-applet-nav-list';
  const firstIndex = Math.max(0, appletIndex - 2);
  const lastIndex = Math.min(unit.applets.length, appletIndex + 3);

  unit.applets.slice(firstIndex, lastIndex).forEach((applet, relativeIndex) => {
    const absoluteIndex = firstIndex + relativeIndex;
    const item = document.createElement('li');
    if (absoluteIndex === appletIndex) {
      const current = document.createElement('span');
      current.className = 'site-applet-nav-current';
      current.textContent = applet.code;
      current.title = `${applet.code}: ${applet.title} (current applet)`;
      current.setAttribute('aria-current', 'page');
      item.append(current);
    } else {
      const link = document.createElement('a');
      link.className = 'site-applet-nav-link';
      link.href = appletUrl(applet).href;
      link.textContent = applet.code;
      link.title = `${applet.code}: ${applet.title}`;
      link.setAttribute('aria-label', `${applet.code}: ${applet.title}`);
      item.append(link);
    }
    list.append(item);
  });

  nav.append(list);
  topbar.append(nav);
}

function addFeedbackFooter(main, current) {
  const footer = document.createElement('footer');
  footer.className = 'applet-feedback-footer';
  const prompt = document.createElement('span');
  prompt.textContent = 'Found a correction, error, or mistake? Email me: ';
  const email = document.createElement('a');
  email.textContent = 'mwernke@ccs.k12.in.us';
  const examplePicker = main.querySelector('.card-head select, .picker-label select');
  const updateEmail = () => {
    const appletLabel = current ? `${current.applet.code}: ${current.applet.title}` : document.title;
    const example = examplePicker?.selectedOptions[0]?.textContent.trim() || 'Not selected';
    const subject = `Applet feedback: ${appletLabel}`;
    const body = [
      `Applet: ${appletLabel}`,
      `Example: ${example}`,
      `Page: ${location.href}`,
      '',
      'Please describe the correction, error, or mistake:',
    ].join('\n');
    email.href = `mailto:mwernke@ccs.k12.in.us?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  updateEmail();
  email.addEventListener('click', updateEmail);
  examplePicker?.addEventListener('change', updateEmail);
  footer.append(prompt, email);
  main.append(footer);
}

const sharedStyles = document.createElement('link');
sharedStyles.rel = 'stylesheet';
sharedStyles.href = new URL('./site-chrome.css', import.meta.url).href;
document.head.append(sharedStyles);

const current = findCurrentApplet();
const topbar = document.querySelector('.topbar');
if (topbar && !topbar.querySelector('.site-applet-nav')) {
  if (current) addNearbyApplets(topbar, current.unit, current.appletIndex);
}

const main = document.querySelector('main');
if (main && !main.querySelector('.applet-feedback-footer')) addFeedbackFooter(main, current);

const backLink = document.querySelector('a.back');
if (backLink) {
  const repositoryHome = new URL('../../main-site/', location.href);
  const publishedHome = new URL('../../', location.href);
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
