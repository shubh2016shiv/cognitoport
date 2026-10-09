const STAGES = [
  { slug: 'intake', number: '01', label: 'Clinical Source', title: 'Preferred Drug List', kind: 'Data lookup' },
  { slug: 'normalize', number: '02', label: 'Drug Data Extraction', title: 'Drug Name & Class Identification', kind: 'AI decision' },
  { slug: 'condense', number: '03', label: 'Data Standardization', title: 'Group By Primary Drug Name and Class', kind: 'Fixed logic' },
  { slug: 'retrieve', number: '04', label: 'Retrieval-Augmented Matching', title: 'Semantic Search by Drug Name and Class', kind: 'Service call' },
  { slug: 'validate', number: '05', label: 'AI Clinical Validation', title: 'Verify by Active Ingredient', kind: 'AI decision' },
  { slug: 'assign', number: '06', label: 'Review & Formulary Sync', title: 'Preferred Status Sync', kind: 'Fixed logic' }
];

const $ = (id) => document.getElementById(id);
const rail = $('rail');
const storyView = $('storyView');
const flowView = $('flowView');
let activeStage = -1;
let lastTrigger = null;

function element(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function renderRail() {
  const landing = [
    ['Clinical Source', 'Preferred Drug List', '1,355 source entries', 'source'],
    ['Drug Data Extraction', 'Drug Name & Class Identification', 'Name + precise class', 'reason'],
    ['Data Standardization', 'Group By Primary Drug Name and Class', '720 distinct groups', 'system'],
    ['Retrieval-Augmented Matching', 'Semantic Search by Drug Name and Class', '7 plan formularies', 'retrieval'],
    ['AI Clinical Validation', 'Verify by Active Ingredient', 'Ingredient first', 'reason'],
    ['Review & Formulary Sync', 'Preferred Status Sync', 'MongoDB flags', 'output']
  ];
  STAGES.forEach((stage, index) => {
    const [label, title, short, tone] = landing[index];
    const card = element('button', `stage ${tone}`);
    card.type = 'button';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Explore stage ${stage.number}: ${stage.title}`);
    const top = element('span', 'stageTop');
    top.append(element('b', '', stage.number), element('small', '', label));
    const copy = element('span', 'stageCopy');
    copy.append(element('strong', '', title), element('small', 'stat', short));
    card.append(top, element('span', `stageArt art-${stage.slug}`), copy, element('span', 'stageKind', stage.kind));
    card.addEventListener('click', () => openStage(index));
    rail.append(card);
    if (index < STAGES.length - 1) {
      const arrow = element('span', 'railArrow');
      arrow.setAttribute('aria-hidden', 'true');
      const mark = element('i', '', '›');
      mark.style.animationDelay = `${index * 0.22}s`;
      arrow.append(mark);
      rail.append(arrow);
    }
  });
}

function renderImpact() {
  const svgNs = 'http://www.w3.org/2000/svg';
  const clutter = [[28,40],[28,62],[28,88],[28,110],[64,52],[64,75],[64,98],[100,52],[100,75],[100,98],[136,63],[136,87],[170,63],[170,87]];
  const kept = [66,84].flatMap((y) => [258,280,302,324].map((x) => [x,y]));
  for (const [target, points, width, height, fill, opacity] of [
    [$('clutterMarks'), clutter, 9, 3.6, 'var(--amber)', '.6'],
    [$('keptMarks'), kept, 10, 4, 'var(--green-deep)', '1']
  ]) {
    points.forEach(([x,y]) => {
      const mark = document.createElementNS(svgNs, 'rect');
      Object.entries({ x: x-width/2, y: y-height/2, width, height, rx: height/2, fill, opacity, transform: `rotate(-45 ${x} ${y})` }).forEach(([key,value]) => mark.setAttribute(key, String(value)));
      target.append(mark);
    });
  }
  for (let i = 0; i < 10; i++) {
    const tick = element('i', i === 0 ? 'on' : '');
    tick.style.animationDelay = `${1.6 + (9-i)*0.11}s`;
    $('listTicks').append(tick);
  }
}

function setUrl(value) {
  const url = new URL(location.href);
  url.searchParams.delete('stage');
  url.searchParams.delete('flow');
  if (value === 'flow') url.searchParams.set('flow', '1');
  else if (value) url.searchParams.set('stage', value);
  history.pushState({}, '', url);
}

function toggleOverlay(view, open) {
  view.hidden = !open;
  view.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', !storyView.hidden || !flowView.hidden);
}

function closeViews(updateHistory = true) {
  toggleOverlay(storyView, false);
  toggleOverlay(flowView, false);
  activeStage = -1;
  if (updateHistory) setUrl(null);
  lastTrigger?.focus?.();
}

function openStage(index, updateHistory = true) {
  if (index < 0 || index >= STAGES.length) return;
  if (storyView.hidden) lastTrigger = document.activeElement;
  activeStage = index;
  const stage = STAGES[index];
  toggleOverlay(flowView, false);
  toggleOverlay(storyView, true);
  if (updateHistory) setUrl(stage.slug);
  import('./story-entry.js')
    .then(({ mountStory }) => mountStory(
      stage,
      STAGES[(index - 1 + STAGES.length) % STAGES.length],
      STAGES[(index + 1) % STAGES.length],
      () => closeViews(),
      () => openStage((index - 1 + STAGES.length) % STAGES.length),
      () => openStage((index + 1) % STAGES.length),
      () => activeStage === index && !storyView.hidden
    ))
    .catch((error) => {
      console.error(`${stage.title} diagram could not load`, error);
      if (activeStage === index && !storyView.hidden) $('storyMount').textContent = 'The interactive canvas could not load. Check the network connection and try again.';
    });
}

function openFlow(updateHistory = true) {
  lastTrigger = document.activeElement;
  activeStage = -1;
  toggleOverlay(storyView, false);
  toggleOverlay(flowView, true);
  if (updateHistory) setUrl('flow');
  $('flowTitle').focus();
  import('./full-flow-entry.js')
    .then(({ mountFullFlow }) => mountFullFlow())
    .catch((error) => {
      console.error('Full architecture could not load', error);
      $('fullFlowMount').textContent = 'The interactive canvas could not load. Check the network connection and try again.';
    });
}

function syncUrl() {
  const params = new URLSearchParams(location.search);
  const index = STAGES.findIndex((stage) => stage.slug === params.get('stage'));
  if (index >= 0) openStage(index, false);
  else if (params.has('flow')) openFlow(false);
  else closeViews(false);
}

renderRail();
renderImpact();
$('flowBtn').addEventListener('click', () => openFlow());
$('closeFlow').addEventListener('click', () => closeViews());
$('presentBtn').addEventListener('click', () => document.documentElement.requestFullscreen?.());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && (!storyView.hidden || !flowView.hidden)) closeViews();
  else if (!flowView.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  else if (event.key === 'ArrowRight') { event.preventDefault(); openStage(activeStage < 0 ? 0 : (activeStage + 1) % STAGES.length); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); openStage(activeStage < 0 ? STAGES.length - 1 : (activeStage - 1 + STAGES.length) % STAGES.length); }
});
window.addEventListener('popstate', syncUrl);
syncUrl();
