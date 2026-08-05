const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchDevice = window.matchMedia('(pointer: coarse)').matches;

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

// Header, progress, and mobile navigation
const header = qs('#siteHeader');
const pageProgress = qs('#pageProgress');
const menuButton = qs('#menuButton');
const mobileMenu = qs('#mobileMenu');

function updatePageUI() {
  const y = window.scrollY;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  header?.classList.toggle('scrolled', y > 28);
  if (pageProgress) pageProgress.style.width = `${scrollable > 0 ? (y / scrollable) * 100 : 0}%`;
}
window.addEventListener('scroll', updatePageUI, { passive: true });
updatePageUI();

menuButton?.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('open');
  mobileMenu.classList.toggle('open', open);
  menuButton.classList.toggle('active', open);
  menuButton.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open);
});
qsa('a', mobileMenu).forEach(link => link.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  menuButton.classList.remove('active');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

// Reveal animation
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });
qsa('.reveal').forEach(el => revealObserver.observe(el));

// Ambient particle field
const canvas = qs('#ambientCanvas');
if (canvas && !reduceMotion) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let particles = [];
  let mouse = { x: -1000, y: -1000 };

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(90, Math.max(34, Math.floor(width / 20)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.1 + 0.35
    }));
  }

  function drawField() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 140 && distance > 0) {
        p.x += (dx / distance) * 0.25;
        p.y += (dy / distance) * 0.25;
      }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(217,255,67,.28)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d < 105) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255,255,255,${(1 - d / 105) * 0.045})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(drawField);
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', event => { mouse = { x: event.clientX, y: event.clientY }; }, { passive: true });
  resizeCanvas();
  drawField();
}

// Hero 3D response
const heroLab = qs('#heroLab');
const coreScene = qs('#coreScene');
if (heroLab && coreScene && !reduceMotion && !touchDevice) {
  heroLab.addEventListener('pointermove', event => {
    const rect = heroLab.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    coreScene.style.transform = `rotateX(${y * -7}deg) rotateY(${x * 9}deg) translate3d(${x * 8}px,${y * 8}px,0)`;
  });
  heroLab.addEventListener('pointerleave', () => { coreScene.style.transform = ''; });
}

// Sticky system story
const systemSteps = qsa('.system-step');
const systemNodes = qsa('.system-node');
const flowPaths = qsa('.flow-path');
const systemPhase = qs('#systemPhase');
const systemLog = qs('#systemLog');
const phaseData = [
  { title: '01 / INTAKE', log: 'Lead received. Required fields validated.', paths: 1 },
  { title: '02 / CONTEXT', log: 'Intent, urgency, and business fit extracted.', paths: 2 },
  { title: '03 / DECISION', log: 'Confidence threshold passed. Correct branch selected.', paths: 3 },
  { title: '04 / ACTION', log: 'Customer action complete. CRM and audit log updated.', paths: 5 }
];
function setSystemPhase(index) {
  systemSteps.forEach((step, i) => step.classList.toggle('active', i === index));
  systemNodes.forEach(node => node.classList.toggle('active', Number(node.dataset.node) <= index));
  flowPaths.forEach((path, i) => path.classList.toggle('active', i < phaseData[index].paths));
  if (systemPhase) systemPhase.textContent = phaseData[index].title;
  if (systemLog) systemLog.innerHTML = `<i></i><span>${phaseData[index].log}</span><time>ACTIVE</time>`;
}
const systemObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) setSystemPhase(Number(entry.target.dataset.phase));
  });
}, { threshold: 0.55, rootMargin: '-12% 0px -28%' });
systemSteps.forEach(step => systemObserver.observe(step));
setSystemPhase(0);

// Static, directly editable project archive
const projectGrid = qs('#projectGrid');
const platformTabs = qsa('.platform-tab');
const workSection = qs('#work');
const activePlatformName = qs('#activePlatformName');
const activePlatformLine = qs('#activePlatformLine');
const workGhost = qs('#workGhost');

const featuredGhlProject = qs('.project-card[data-platform="ghl"]', projectGrid);
if (featuredGhlProject) {
  featuredGhlProject.classList.remove('is-placeholder');
  featuredGhlProject.dataset.featuredProject = 'real-estate-ai-voice';
  featuredGhlProject.setAttribute('aria-label', 'Open project: Real Estate AI Voice Automation System');
  featuredGhlProject.innerHTML = `
    <div class="project-media project-media-triptych">
      <div class="project-triptych-primary"><img alt="Real Estate AI Voice Automation lead intake workflow" loading="lazy" src="assets/builds/real-estate-ai-intake.png"/></div>
      <div class="project-triptych-stack">
        <img alt="Real Estate AI Voice Automation calendar availability workflow" loading="lazy" src="assets/builds/real-estate-ai-availability.png"/>
        <img alt="Real Estate AI Voice Automation appointment booking workflow" loading="lazy" src="assets/builds/real-estate-ai-booking.png"/>
      </div>
      <div class="media-overlay"></div>
      <span class="project-code">GHL / 01</span>
      <span class="project-state">FEATURED SYSTEM</span>
      <span class="project-open">↗</span>
      <span class="project-shot-count">03 WORKFLOWS</span>
    </div>
    <div class="project-body">
      <div class="project-meta"><span class="project-platform">GoHighLevel · Real estate teams</span><b class="project-status">End-to-end build</b></div>
      <h3>Real Estate AI Voice Automation System</h3>
      <p class="project-summary">An AI voice and CRM system that captures real estate leads, logs call intelligence, checks calendar availability, and books appointments automatically.</p>
      <div class="project-tags"><span>GoHighLevel</span><span>Retell AI</span><span>n8n</span><span>Webhooks</span><span>Calendar API</span></div>
    </div>
    <div class="project-details" hidden>
      <p class="project-problem">Real estate teams can lose qualified callers when lead details, notes, opportunities, availability checks, and booking steps are handled manually across separate tools.</p>
      <p class="project-solution">I connected Retell AI, n8n, and GoHighLevel into one system: analyzed calls create or update CRM contacts, store call notes, create opportunities, return live free slots, and confirm appointments through dedicated booking workflows.</p>
      <div class="project-flow"><span>AI call</span><span>Lead qualification</span><span>CRM upsert</span><span>Availability check</span><span>Appointment booked</span></div>
    </div>
    <div class="project-gallery-data" hidden>
      <img src="assets/builds/real-estate-ai-intake.png"
           alt="Real Estate Retell intake workflow"
           data-title="Lead Intake & CRM Sync"
           data-caption="Processes analyzed Retell calls, normalizes lead data, upserts the GoHighLevel contact, adds the call note, and creates or updates the opportunity."/>
      <img src="assets/builds/real-estate-ai-availability.png"
           alt="Retell calendar availability workflow"
           data-title="Calendar Availability Tool"
           data-caption="Receives an availability request, retrieves free GoHighLevel calendar slots, formats the options, and returns them to the voice agent."/>
      <img src="assets/builds/real-estate-ai-booking.png"
           alt="Retell appointment booking workflow"
           data-title="Automated Appointment Booking"
           data-caption="Prepares booking data, upserts the contact, creates the GoHighLevel appointment, and returns a structured confirmation response."/>
    </div>
  `;
}

function filterProjects(platform, keepGridInView = true) {
  const selectedTab = platformTabs.find(tab => tab.dataset.platform === platform);
  const cards = qsa('.project-card', projectGrid);

  cards.forEach(card => card.classList.add('switching'));
  window.setTimeout(() => {
    let visibleIndex = 0;
    cards.forEach(card => {
      const visible = card.dataset.platform === platform;
      card.hidden = !visible;
      if (visible) {
        card.style.transitionDelay = `${Math.min(visibleIndex * 42, 260)}ms`;
        visibleIndex += 1;
        requestAnimationFrame(() => card.classList.remove('switching'));
      }
    });
  }, reduceMotion ? 0 : 180);

  platformTabs.forEach(tab => {
    const active = tab.dataset.platform === platform;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (workSection) workSection.dataset.activePlatform = platform;
  if (selectedTab) {
    if (activePlatformName) activePlatformName.textContent = selectedTab.dataset.label;
    if (activePlatformLine) activePlatformLine.textContent = selectedTab.dataset.line;
    if (workGhost) workGhost.textContent = selectedTab.dataset.label.toUpperCase();
  }
  if (keepGridInView && projectGrid) {
    const target = projectGrid.getBoundingClientRect().top + window.scrollY - 165;
    window.scrollTo({ top: Math.max(0, target), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
platformTabs.forEach(tab => tab.addEventListener('click', () => filterProjects(tab.dataset.platform)));
filterProjects('n8n', false);

// Project case-study dialog reads content directly from each HTML card.
const dialog = qs('#caseDialog');
const dialogClose = qs('#dialogClose');
const dialogCta = qs('#dialogCta');
let lockedPageY = 0;
let lastOpenedProjectCard = null;

function lockPagePosition() {
  lockedPageY = window.scrollY || window.pageYOffset || 0;
  document.documentElement.classList.add('modal-open');
  document.body.classList.add('modal-open');
}

function unlockPagePosition() {
  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');
}


let activeDialogGallery = [];
let activeDialogGalleryIndex = 0;

function setDialogGalleryIndex(index) {
  if (!dialogVisual || !activeDialogGallery.length) return;
  activeDialogGalleryIndex = (index + activeDialogGallery.length) % activeDialogGallery.length;
  const item = activeDialogGallery[activeDialogGalleryIndex];
  const mainImage = qs('.dialog-gallery-main', dialogVisual);
  const title = qs('.dialog-gallery-copy strong', dialogVisual);
  const caption = qs('.dialog-gallery-copy p', dialogVisual);
  const counter = qs('.dialog-gallery-counter', dialogVisual);
  const thumbs = qsa('.dialog-gallery-thumb', dialogVisual);

  if (mainImage) {
    mainImage.src = item.src;
    mainImage.alt = item.alt;
  }
  if (title) title.textContent = item.title;
  if (caption) caption.textContent = item.caption;
  if (counter) counter.textContent = `${String(activeDialogGalleryIndex + 1).padStart(2, '0')} / ${String(activeDialogGallery.length).padStart(2, '0')}`;
  thumbs.forEach((thumb, thumbIndex) => {
    const active = thumbIndex === activeDialogGalleryIndex;
    thumb.classList.toggle('active', active);
    thumb.setAttribute('aria-current', active ? 'true' : 'false');
  });
}

function renderDialogVisual(card, fallbackImage) {
  if (!dialogVisual) return;
  const galleryImages = qsa('.project-gallery-data img', card);
  activeDialogGallery = galleryImages.map(img => ({
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    title: img.dataset.title || 'Workflow preview',
    caption: img.dataset.caption || ''
  })).filter(item => item.src);
  activeDialogGalleryIndex = 0;

  if (activeDialogGallery.length > 1) {
    const first = activeDialogGallery[0];
    dialogVisual.innerHTML = `
      <div class="dialog-gallery">
        <div class="dialog-gallery-stage">
          <img class="dialog-gallery-main" src="${first.src}" alt="${first.alt}">
          <button class="dialog-gallery-nav dialog-gallery-prev" type="button" aria-label="Previous workflow">←</button>
          <button class="dialog-gallery-nav dialog-gallery-next" type="button" aria-label="Next workflow">→</button>
          <div class="dialog-gallery-copy">
            <span class="dialog-gallery-counter">01 / ${String(activeDialogGallery.length).padStart(2, '0')}</span>
            <strong>${first.title}</strong>
            <p>${first.caption}</p>
          </div>
        </div>
        <div class="dialog-gallery-thumbs" aria-label="Project workflow screenshots">
          ${activeDialogGallery.map((item, index) => `
            <button class="dialog-gallery-thumb${index === 0 ? ' active' : ''}" type="button" data-gallery-index="${index}" aria-label="View ${item.title}" aria-current="${index === 0 ? 'true' : 'false'}">
              <img src="${item.src}" alt="">
              <span>${String(index + 1).padStart(2, '0')}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    return;
  }

  activeDialogGallery = [];
  dialogVisual.innerHTML = fallbackImage
    ? `<img src="${fallbackImage.getAttribute('src')}" alt="${fallbackImage.getAttribute('alt') || ''}">`
    : '';
}

function openProject(card) {
  if (!card || !dialog || dialog.hasAttribute('open')) return;
  lastOpenedProjectCard = card;
  const image = qs('.project-media img', card);
  const flow = qsa('.project-flow span', card);
  const tags = qsa('.project-tags span', card);
  qs('#dialogPlatform').textContent = `${qs('.project-code', card)?.textContent || ''} · ${qs('.project-platform', card)?.textContent || ''}`;
  qs('#dialogStatus').textContent = qs('.project-status', card)?.textContent || '';
  qs('#dialogTitle').textContent = qs('h3', card)?.textContent || '';
  qs('#dialogSummary').textContent = qs('.project-summary', card)?.textContent || '';
  qs('#dialogProblem').textContent = qs('.project-problem', card)?.textContent || '';
  qs('#dialogSolution').textContent = qs('.project-solution', card)?.textContent || '';
  qs('#dialogFlow').innerHTML = flow.map((step, index) => `${index ? '<i>→</i>' : ''}<span>${step.textContent}</span>`).join('');
  qs('#dialogTags').innerHTML = tags.map(tag => `<span>${tag.textContent}</span>`).join('');
  renderDialogVisual(card, image);
  const contentPanel = qs('.dialog-content', dialog);
  if (contentPanel) contentPanel.scrollTop = 0;
  lockPagePosition();
  dialog.setAttribute('open', '');
  dialog.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => dialogClose?.focus({ preventScroll: true }));
}
function closeProject(restorePosition = true) {
  if (!dialog?.hasAttribute('open')) return;
  const returnY = lockedPageY;
  // Move focus back before hiding the overlay. Leaving focus on a hidden close button
  // makes some browsers scroll to the dialog's DOM position at the bottom of the page.
  if (lastOpenedProjectCard) lastOpenedProjectCard.focus({ preventScroll: true });
  else dialogClose?.blur();
  dialog.removeAttribute('open');
  dialog.setAttribute('aria-hidden', 'true');
  unlockPagePosition();
  if (restorePosition) {
    // Browser focus restoration can happen after the close event. Correct it before paint,
    // then verify once more on the next frame for Chromium, Edge, Safari, and mobile browsers.
    requestAnimationFrame(() => {
      if (Math.abs(window.scrollY - returnY) > 1) window.scrollTo({ top: returnY, left: 0, behavior: 'auto' });
      requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - returnY) > 1) window.scrollTo({ top: returnY, left: 0, behavior: 'auto' });
      });
    });
  }
}
projectGrid?.addEventListener('click', event => {
  const card = event.target.closest('.project-card');
  if (card) {
    event.preventDefault();
    openProject(card);
  }
});
projectGrid?.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.project-card')) {
    event.preventDefault();
    openProject(event.target);
  }
});
dialogClose?.addEventListener('pointerdown', event => {
  event.preventDefault();
  event.stopPropagation();
});
dialogClose?.addEventListener('pointerup', event => {
  event.preventDefault();
  event.stopPropagation();
  closeProject();
});
dialogClose?.addEventListener('click', event => {
  event.preventDefault();
  event.stopPropagation();
});
dialogCta?.addEventListener('click', () => {
  // The CTA intentionally navigates to #contact, so do not restore the previous project position.
  closeProject(false);
});
dialog?.addEventListener('click', event => { if (event.target === dialog) closeProject(); });
dialog?.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && dialog?.hasAttribute('open') && !imageLightbox?.open) {
    event.preventDefault();
    closeProject();
    return;
  }
  if (dialog?.hasAttribute('open') && activeDialogGallery.length > 1 && !imageLightbox?.open) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setDialogGalleryIndex(activeDialogGalleryIndex - 1);
      enhanceDialogVisual();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setDialogGalleryIndex(activeDialogGalleryIndex + 1);
      enhanceDialogVisual();
    }
  }
});

// Interactive spotlight follows the pointer across every project card.
if (!touchDevice && !reduceMotion) {
  projectGrid?.addEventListener('pointermove', event => {
    const card = event.target.closest('.project-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

// Custom cursor on project cards
const cursor = qs('#cursor');
if (cursor && !touchDevice && !reduceMotion) {
  window.addEventListener('pointermove', event => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, { passive: true });
  projectGrid?.addEventListener('pointerover', event => {
    if (event.target.closest('.project-card')) cursor.classList.add('active');
  });
  projectGrid?.addEventListener('pointerout', event => {
    if (event.target.closest('.project-card')) cursor.classList.remove('active');
  });
}

// Subtle 3D card tilt
if (!touchDevice && !reduceMotion) {
  qsa('.tilt-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-3px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// Magnetic buttons
if (!touchDevice && !reduceMotion) {
  qsa('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      button.style.transform = `translate(${x * 0.08}px,${y * 0.12}px)`;
    });
    button.addEventListener('pointerleave', () => { button.style.transform = ''; });
  });
}

// Contact form: opens the visitor's email app with a structured message.
const contactForm = qs('#contactForm');
contactForm?.addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(contactForm);
  const name = form.get('name')?.toString().trim() || '';
  const email = form.get('email')?.toString().trim() || '';
  const message = form.get('message')?.toString().trim() || '';
  const subject = encodeURIComponent(`Automation project inquiry from ${name}`);
  const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nWorkflow / bottleneck:\n${message}`);
  window.location.href = `mailto:barredofranzen.va@gmail.com?subject=${subject}&body=${body}`;
});

// Tools-only stack upgrade: multi-category filters, count, and spotlight
const toolkit = qs('#stack');
const toolFilters = qsa('.tool-filter', toolkit || document);
const toolCards = qsa('.tool-card', toolkit || document);
const visibleToolCount = qs('#visibleToolCount');
const activeToolLabel = qs('#activeToolLabel');

function filterTools(filter) {
  if (!toolkit) return;
  toolkit.dataset.toolFilter = filter;
  let visible = 0;
  const selectedButton = toolFilters.find(button => button.dataset.filter === filter);

  toolFilters.forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });

  toolCards.forEach(card => {
    const categories = (card.dataset.category || '').split(/\s+/).filter(Boolean);
    const show = filter === 'all' || categories.includes(filter);
    card.hidden = !show;
    card.style.transform = '';

    if (show) {
      card.style.setProperty('--reveal-delay', `${Math.min(240, visible * 22)}ms`);
      visible += 1;
      card.classList.remove('tool-pop');
      requestAnimationFrame(() => card.classList.add('tool-pop'));
    }
  });

  if (visibleToolCount) visibleToolCount.textContent = String(visible).padStart(2, '0');
  if (activeToolLabel) activeToolLabel.textContent = (selectedButton?.dataset.label || 'Complete stack').toUpperCase();
}

toolFilters.forEach(button => button.addEventListener('click', () => filterTools(button.dataset.filter)));
filterTools('core');

if (toolkit && !touchDevice && !reduceMotion) {
  toolkit.addEventListener('pointermove', event => {
    const card = event.target.closest('.tool-card');
    if (!card || card.hidden) return;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    card.style.setProperty('--tool-x', `${x}px`);
    card.style.setProperty('--tool-y', `${y}px`);
    const rx = ((y / rect.height) - .5) * -2.5;
    const ry = ((x / rect.width) - .5) * 3.2;
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
  });

  toolkit.addEventListener('pointerout', event => {
    const card = event.target.closest('.tool-card');
    if (card && !card.contains(event.relatedTarget)) card.style.transform = '';
  });
}

// Brighter interactive identity portrait treatment
const identityCard = qs('#identityCard');
if (identityCard && !touchDevice && !reduceMotion) {
  const visual = qs('.identity-visual', identityCard);
  identityCard.addEventListener('pointermove', event => {
    const rect = identityCard.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    identityCard.style.setProperty('--identity-x', `${event.clientX - rect.left}px`);
    identityCard.style.setProperty('--identity-y', `${event.clientY - rect.top}px`);
    if (visual) visual.style.transform = `perspective(1200px) rotateX(${y * -2.5}deg) rotateY(${x * 3.5}deg)`;
  });
  identityCard.addEventListener('pointerleave', () => { if (visual) visual.style.transform = ''; });
}

// Full-screen image viewer for project visuals
const imageLightbox = qs('#imageLightbox');
const lightboxImage = qs('#lightboxImage');
const lightboxTitle = qs('#lightboxTitle');
const lightboxClose = qs('#lightboxClose');
const dialogVisual = qs('#dialogVisual');

function enhanceDialogVisual() {
  if (!dialogVisual) return;
  const img = qs('img', dialogVisual);
  if (!img) return;
  if (!qs('.visual-expand', dialogVisual)) {
    const expandButton = document.createElement('button');
    expandButton.type = 'button';
    expandButton.className = 'visual-expand';
    expandButton.innerHTML = '<span>View Fullscreen</span><i>↗</i>';
    dialogVisual.appendChild(expandButton);
  }
  if (!qs('.visual-hint', dialogVisual)) {
    const hint = document.createElement('div');
    hint.className = 'visual-hint';
    hint.textContent = touchDevice ? 'Tap image to expand' : 'Click image to expand';
    dialogVisual.appendChild(hint);
  }
  img.tabIndex = 0;
  img.setAttribute('role', 'button');
  img.setAttribute('aria-label', 'View project image fullscreen');
}

if (typeof openProject === 'function') {
  const originalOpenProject = openProject;
  openProject = function(card) {
    originalOpenProject(card);
    enhanceDialogVisual();
    const contentPanel = qs('.dialog-content', dialog);
    if (contentPanel) contentPanel.scrollTop = 0;
  };
}

function openImageLightbox() {
  if (!imageLightbox || !dialogVisual || !lightboxImage) return;
  const sourceImage = qs('img', dialogVisual);
  if (!sourceImage) return;
  lightboxImage.src = sourceImage.getAttribute('src') || '';
  lightboxImage.alt = sourceImage.getAttribute('alt') || '';
  if (lightboxTitle) {
    const galleryItem = activeDialogGallery[activeDialogGalleryIndex];
    const projectTitle = qs('#dialogTitle')?.textContent || 'Project preview';
    lightboxTitle.textContent = galleryItem ? `${projectTitle} — ${galleryItem.title}` : projectTitle;
  }
  imageLightbox.showModal();
}

function closeImageLightbox() {
  if (!imageLightbox?.open) return;
  imageLightbox.close();
  if (!dialog?.open) document.body.style.overflow = '';
}

dialogVisual?.addEventListener('click', event => {
  const previous = event.target.closest('.dialog-gallery-prev');
  const next = event.target.closest('.dialog-gallery-next');
  const thumb = event.target.closest('.dialog-gallery-thumb');

  if (previous) {
    event.preventDefault();
    event.stopPropagation();
    setDialogGalleryIndex(activeDialogGalleryIndex - 1);
    enhanceDialogVisual();
    return;
  }
  if (next) {
    event.preventDefault();
    event.stopPropagation();
    setDialogGalleryIndex(activeDialogGalleryIndex + 1);
    enhanceDialogVisual();
    return;
  }
  if (thumb) {
    event.preventDefault();
    event.stopPropagation();
    setDialogGalleryIndex(Number(thumb.dataset.galleryIndex || 0));
    enhanceDialogVisual();
    return;
  }
  if (event.target.closest('.visual-expand') || event.target.matches('.dialog-gallery-main, #dialogVisual > img')) {
    openImageLightbox();
  }
});

dialogVisual?.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.tagName === 'IMG') {
    event.preventDefault();
    openImageLightbox();
  }
});

lightboxClose?.addEventListener('click', closeImageLightbox);
imageLightbox?.addEventListener('click', event => {
  if (event.target === imageLightbox) closeImageLightbox();
});
imageLightbox?.addEventListener('cancel', event => {
  event.preventDefault();
  closeImageLightbox();
});


// Keep wheel scrolling useful even when the pointer is over the fixed visual panel.
const projectDialogContent = qs('.dialog-content', dialog);
dialogVisual?.addEventListener('wheel', event => {
  if (!dialog?.open || !projectDialogContent) return;
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  projectDialogContent.scrollBy({ top: event.deltaY, behavior: 'auto' });
  event.preventDefault();
}, { passive: false });
