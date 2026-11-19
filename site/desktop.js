(() => {
  'use strict';

  const content = window.portfolioContent;
  const desktop = document.querySelector('#desktop');
  const desktopItems = document.querySelector('#desktop-items');
  const desktopPersonalItems = document.querySelector('#desktop-personal-items');
  const switcher = document.querySelector('#task-switcher');
  const template = document.querySelector('#window-template');
  const menus = Array.from(document.querySelectorAll('.menus details'));
  const compact = matchMedia('(max-width: 700px)');
  const touch = matchMedia('(pointer: coarse)');
  const desktopStateKey = 'macintosh-portfolio-desktop-v1';
  const startupScreen = document.querySelector('#startup-screen');
  const windows = new Map();
  const definitions = new Map();
  let activeWindow;
  let selected;
  let listView = false;
  let viewer;
  let restoringDesktop = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function icon(kind) {
    const wrapper = element('span', 'item-icon item-icon-' + kind);
    wrapper.setAttribute('aria-hidden', 'true');
    const image = element('img');
    image.src = 'assets/icons/' + kind + '.png';
    image.alt = '';
    image.draggable = false;
    wrapper.append(image);
    return wrapper;
  }

  function select(button, activate) {
    clearSelection();
    button.classList.add('selected');
    selected = { button, activate };
    syncMenus();
  }

  function clearSelection() {
    selected?.button.classList.remove('selected');
    selected = undefined;
    syncMenus();
  }

  function bindItem(button, activate) {
    button.addEventListener('click', event => {
      select(button, activate);
      if (event.detail === 0 || event.pointerType === 'touch' || touch.matches) activate();
    });
    button.addEventListener('dblclick', () => {
      if (!touch.matches) activate();
    });
  }

  function item(label, kind, activate) {
    const button = element('button', 'finder-item');
    button.type = 'button';
    button.append(icon(kind), element('span', 'item-label', label));
    bindItem(button, activate);
    return button;
  }

  function windowItem(id, label, kind) {
    return item(label, kind, () => openWindow(id));
  }

  function linkedInDesktopItem() {
    const wrapper = element('div', 'desktop-linkedin');
    const link = item('LinkedIn', 'linkedin', () => window.open(content.linkedin, '_blank', 'noopener,noreferrer'));
    const balloon = element('button', 'linkedin-balloon', 'Connect with me!');
    balloon.type = 'button';
    balloon.addEventListener('click', event => {
      event.stopPropagation();
      balloon.remove();
    });
    wrapper.append(link, balloon);
    return wrapper;
  }

  function githubLink(url, label) {
    const link = element('a', 'repo-link', label + ' ↗');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }

  function finderGrid(className = '') {
    const grid = element('div', 'finder-grid ' + className);
    grid.classList.toggle('list-view', listView);
    return grid;
  }

  function setView(isList) {
    listView = isList;
    desktop.querySelectorAll('.finder-grid').forEach(grid => grid.classList.toggle('list-view', listView));
    document.querySelector('[data-command="icons"]')?.setAttribute('aria-pressed', String(!listView));
    document.querySelector('[data-command="list"]')?.setAttribute('aria-pressed', String(listView));
    saveDesktopState();
  }

  function renderProjects(body) {
    const grid = finderGrid();
    content.projects.forEach(project => grid.append(windowItem(project.id, project.name, 'folder')));
    body.append(grid);
  }

  function renderAbout(body) {
    const layout = element('div', 'about-layout');
    const figure = element('figure', 'portrait');
    const portrait = element('img');
    portrait.src = content.portrait.src;
    portrait.alt = content.portrait.alt;
    figure.append(portrait);
    if (content.portrait.caption) figure.append(element('figcaption', '', content.portrait.caption));
    const text = element('div', 'about-copy');
    text.append(element('h3', 'bio-heading', content.name));
    text.append(element('p', 'bio-meta', content.title));
    text.append(element('p', 'bio-meta', content.school));
    const paragraphs = element('div', 'copy bio-copy');
    content.bio.forEach(paragraph => paragraphs.append(element('p', '', paragraph)));
    text.append(paragraphs);
    layout.append(figure, text);
    body.append(layout);
  }

  function renderProject(body, project) {
    const documentBody = element('article', 'document');
    documentBody.append(element('h3', '', project.name), element('p', 'copy', project.summary));
    project.parts.forEach(part => {
      const section = element('section', 'copy');
      section.append(element('h4', '', part.name), element('p', '', part.detail), githubLink(part.url, 'View ' + part.name + ' on GitHub'));
      documentBody.append(section);
    });
    const tags = element('ul', 'tag-list');
    project.tags.forEach(tag => tags.append(element('li', '', tag)));
    documentBody.append(tags);
    body.append(documentBody);
  }

  function resizeReceiptNote(note) {
    const windowElement = note.closest('.receipt-note-window');
    const paper = note.closest('.receipt-note-paper');
    const minHeight = 112;
    note.style.height = 'auto';
    const noteHeight = Math.max(minHeight, note.scrollHeight);
    note.style.height = noteHeight + 'px';
    const previousPaperHeight = paper.style.height;
    paper.style.height = 'auto';
    const frameHeight = paper.offsetHeight - note.offsetHeight;
    paper.style.height = previousPaperHeight;
    const requiredHeight = noteHeight + frameHeight;
    windowElement.style.height = Math.max(windowElement.offsetHeight, requiredHeight) + 'px';
  }

  function renderReceiptNote(body) {
    body.classList.add('receipt-note-body');
    const paper = element('div', 'receipt-note-paper');
    const close = element('button', 'receipt-note-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close Message Slip');
    close.addEventListener('click', () => closeWindow('note'));
    const resizeGrip = element('span', 'receipt-note-resize-grip');
    resizeGrip.setAttribute('aria-hidden', 'true');
    const dragHandle = element('div', 'receipt-note-drag-handle');
    dragHandle.setAttribute('aria-hidden', 'true');
    const note = element('textarea', 'receipt-note-text');
    note.maxLength = window.receiptNoteMaxCharacters || 1000;
    note.placeholder = '';
    note.setAttribute('aria-label', 'Your note');
    note.rows = 6;
    const count = element('span', 'receipt-note-count');
    const send = element('button', 'receipt-note-send', 'Send');
    send.type = 'button';
    send.addEventListener('click', () => openWindow('receipt-send'));
    const update = () => {
      count.textContent = note.value.length + ' / ' + note.maxLength;
      resizeReceiptNote(note);
      moveWindow(paper.closest('.window'), paper.closest('.window').offsetLeft, paper.closest('.window').offsetTop);
    };
    note.addEventListener('input', update);
    paper.append(dragHandle, close, resizeGrip, note, count, send);
    body.append(paper);
    requestAnimationFrame(update);
  }

  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-turnstile-api]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.turnstile), { once: true });
        existing.addEventListener('error', () => reject(new Error('Could not load the anti-spam check.')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.dataset.turnstileApi = 'true';
      script.addEventListener('load', () => resolve(window.turnstile), { once: true });
      script.addEventListener('error', () => reject(new Error('Could not load the anti-spam check.')), { once: true });
      document.head.append(script);
    });
  }

  function renderReceiptSend(body) {
    body.classList.add('receipt-send-body');
    const form = element('form', 'receipt-send-form');
    const message = element('p', 'receipt-send-message', 'Complete the anti-spam check to print your note!');
    const checkLabel = element('p', 'receipt-check-label');
    const check = element('div', 'receipt-turnstile');
    const status = element('p', 'receipt-send-status');
    status.setAttribute('role', 'status');
    const send = element('button', 'image-button receipt-submit', 'Send');
    send.type = 'submit';
    send.disabled = true;
    form.append(message, check, status, send);
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const note = windows.get('note')?.querySelector('.receipt-note-text')?.value || '';
      const token = check.dataset.token;
      send.disabled = true;
      try {
        await window.submitReceiptNote(note, token);
        const cleared = windows.get('note')?.querySelector('.receipt-note-text');
        if (cleared) {
          cleared.value = '';
          cleared.dispatchEvent(new Event('input'));
        }
        message.textContent = 'Your note has been sent to the receipt printer.';
        check.hidden = true;
        checkLabel.hidden = true;
        send.hidden = true;
      } catch (error) {
        status.textContent = error.message;
        send.disabled = !check.dataset.token;
        if (window.turnstile && check.dataset.widgetId !== undefined) {
          window.turnstile.reset(check.dataset.widgetId);
          delete check.dataset.token;
        }
      }
    });
    const config = window.receiptNoteConfig || {};
    if (!config.turnstileSiteKey) {
      status.textContent = 'Receipt notes are not configured yet.';
      return body.append(form);
    }
    loadTurnstile().then(turnstile => {
      check.dataset.widgetId = turnstile.render(check, {
        sitekey: config.turnstileSiteKey,
        callback: token => {
          check.dataset.token = token;
          send.disabled = false;
        },
        'expired-callback': () => {
          delete check.dataset.token;
          send.disabled = true;
        },
        'error-callback': () => { status.textContent = 'The anti-spam check could not load. Please try again.'; }
      });
    }).catch(error => { status.textContent = error.message; });
    body.append(form);
  }

  function sheet(photos) {
    const grid = element('div', 'contact-sheet');
    photos.forEach((photo, index) => {
      const button = element('button', 'photo-tile');
      button.type = 'button';
      const thumbnail = element('img', photo.pixelated ? 'pixelated' : '');
      thumbnail.src = photo.thumbnail || photo.src;
      thumbnail.alt = photo.alt || '';
      thumbnail.loading = 'lazy';
      thumbnail.draggable = false;
      button.append(thumbnail, element('span', '', photo.caption || 'Frame ' + (index + 1)));
      bindItem(button, () => showPhoto(photos, index));
      grid.append(button);
    });
    return grid;
  }

  function renderPhotos(body) {
    const albums = element('section', 'photo-section');
    const grid = finderGrid('album-grid');
    content.albums.forEach(album => grid.append(item(album.name, 'folder', () => navigatePhotos(body, album.id))));
    grid.append(item('Videos', 'folder', () => navigatePhotos(body, 'videos')));
    albums.append(element('h3', '', ''), grid);
    body.append(albums);
  }

  function renderFolderNavigation(body, folderName) {
    const navigation = element('nav', 'folder-navigation');
    navigation.setAttribute('aria-label', 'Photo folders');
    const back = element('button', '', '← Media');
    back.type = 'button';
    back.addEventListener('click', () => navigatePhotos(body, 'photos'));
    navigation.append(back, element('span', '', 'Media / ' + folderName));
    body.append(navigation);
  }

  function renderAlbum(body, album) {
    renderFolderNavigation(body, album.name);
    if (album.photos.length) {
      const photos = element('div', 'photo-section');
      photos.append(sheet(album.photos));
      body.append(photos);
    } else {
      body.append(element('p', 'empty-album', 'This folder is empty.'));
    }
  }

  function renderVideos(body) {
    renderFolderNavigation(body, 'Videos');
    const grid = finderGrid();
    content.videos.forEach(video => grid.append(windowItem('video-' + video.id, video.name, 'instagram')));
    body.append(grid);
  }

  function navigatePhotos(body, folder) {
    const win = body.closest('.window');
    win.dataset.photoFolder = folder;
    clearSelection();
    body.replaceChildren();
    body.scrollTop = 0;
    if (folder === 'videos') {
      renderVideos(body);
      win.querySelector('.titlebar h2').textContent = 'Videos';
      setStatus(win, countLabel(content.videos.length, 'video'), 'Videos');
    } else if (folder !== 'photos') {
      const album = content.albums.find(entry => entry.id === folder);
      if (!album) return navigatePhotos(body, 'photos');
      renderAlbum(body, album);
      win.querySelector('.titlebar h2').textContent = album.name;
      setStatus(win, countLabel(album.photos.length, 'photo'), 'Media');
    } else {
      renderPhotos(body);
      win.querySelector('.titlebar h2').textContent = 'Media';
      const entry = definitions.get('photos');
      setStatus(win, entry.status, entry.context);
    }
    if (!restoringDesktop) body.querySelector('button')?.focus({ preventScroll: true });
    saveDesktopState();
  }

  function renderVideo(body, video) {
    body.classList.add('video-body');
    const player = element('video');
    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';
    player.src = video.src;
    player.setAttribute('aria-label', video.name);
    const message = element('p', 'video-error', 'This video could not be played. Try opening it directly below.');
    message.hidden = true;
    message.setAttribute('role', 'status');
    player.addEventListener('error', () => { message.hidden = false; });
    const link = element('a', 'video-link', '');
    link.href = video.src;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    body.append(player, message, link);
  }

  function stopVideos(win) {
    win.querySelectorAll('video').forEach(video => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    });
  }

  function renderViewer(body) {
    const layout = element('div', 'viewer-body');
    const figure = element('figure');
    const image = element('img');
    image.addEventListener('load', () => sizeViewerToImage(image));
    figure.append(image);
    const controls = element('div', 'viewer-controls');
    const caption = element('span');
    caption.setAttribute('aria-live', 'polite');
    controls.append(caption);
    layout.append(figure, controls);
    body.append(layout);
  }

  function sizeViewerToImage(image) {
    const win = image.closest('.window');
    const figure = image.closest('figure');
    if (!win || !figure || !image.naturalWidth || !image.naturalHeight) return;

    if (compact.matches) {
      const layout = image.closest('.viewer-body');
      const controls = layout.querySelector('.viewer-controls');
      const styles = getComputedStyle(layout);
      const horizontalChrome =
        (win.offsetWidth - win.clientWidth) +
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight) +
        (figure.offsetWidth - figure.clientWidth);
      const verticalChrome =
        (win.offsetHeight - win.clientHeight) +
        win.querySelector('.titlebar').offsetHeight +
        win.querySelector('.window-status').offsetHeight +
        win.querySelector('.window-footer').offsetHeight +
        parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom) +
        parseFloat(styles.rowGap || styles.gap) +
        controls.offsetHeight +
        (figure.offsetHeight - figure.clientHeight);
      const top = parseFloat(getComputedStyle(win).top) || 140;
      const maxWindowWidth = Math.max(1, desktop.clientWidth - 36);
      const maxWindowHeight = Math.max(1, desktop.clientHeight - top - 12);
      const maxImageWidth = Math.max(1, maxWindowWidth - horizontalChrome);
      const maxImageHeight = Math.max(1, maxWindowHeight - verticalChrome);
      const scale = Math.min(1, maxImageWidth / image.naturalWidth, maxImageHeight / image.naturalHeight);
      const width = Math.ceil(image.naturalWidth * scale + horizontalChrome);
      const height = Math.ceil(image.naturalHeight * scale + verticalChrome);

      win.style.setProperty('--viewer-mobile-width', width + 'px');
      win.style.setProperty('--viewer-mobile-height', height + 'px');
      return;
    }

    win.style.removeProperty('--viewer-mobile-width');
    win.style.removeProperty('--viewer-mobile-height');

    const windowChromeWidth = win.offsetWidth - figure.clientWidth;
    const windowChromeHeight = win.offsetHeight - figure.clientHeight;
    const availableWidth = Math.max(1, desktop.clientWidth - 22 - windowChromeWidth);
    const availableHeight = Math.max(1, desktop.clientHeight - 22 - windowChromeHeight);
    const availableLongEdge = Math.min(availableWidth, availableHeight);
    const imageLongEdge = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, availableLongEdge / imageLongEdge);
    const width = Math.ceil(image.naturalWidth * scale + windowChromeWidth);
    const height = Math.ceil(image.naturalHeight * scale + windowChromeHeight);

    win.style.width = 'min(' + width + 'px, calc(100% - 22px))';
    win.style.height = 'min(' + height + 'px, calc(100% - 22px))';
    moveWindow(win, win.offsetLeft, win.offsetTop);
    saveDesktopState();
  }

  function showPhoto(photos, index) {
    viewer = { photos, index };
    openWindow('viewer');
    updateViewer();
  }

  function advancePhoto(step) {
    const nextIndex = viewer.index + step;
    if (nextIndex < 0 || nextIndex >= viewer.photos.length) return;
    viewer.index = nextIndex;
    updateViewer();
  }

  function updateViewer() {
    const win = windows.get('viewer');
    const { index, photos } = viewer;
    const photo = photos[index];
    const image = win.querySelector('.viewer-body img');
    image.src = photo.src;
    if (image.complete) sizeViewerToImage(image);
    image.alt = photo.alt || '';
    image.classList.toggle('pixelated', Boolean(photo.pixelated));
    setStatus(win, photo.caption || 'Frame ' + (index + 1), '');
    saveDesktopState();
  }

  function define(id, data) {
    definitions.set(id, data);
  }

  const countLabel = (count, singular, plural = singular + 's') =>
    count + ' ' + (count === 1 ? singular : plural);

  define('projects', { title: 'Projects', status: countLabel(content.projects.length, 'item'), context: 'Finder', width: 516, height: 350, render: renderProjects });
  define('about', { title: 'Welcome!', context: 'SimpleText', width: 730, height: 660, render: renderAbout });
  define('resume', {
    title: 'Resume', context: 'PDF Reader', width: 730, height: 660,
    render: body => {
      body.classList.add('resume-body');
      const link = document.createElement('a');
      link.href = 'assets/resume.pdf';
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Open PDF in a new tab';
      const reader = document.createElement('iframe');
      reader.src = 'assets/resume.pdf';
      reader.title = content.name + '’s résumé';
      body.append(link, reader);
    }
  });
  define('photos', { title: 'Media', status: countLabel(content.albums.length + 1, 'item'), context: 'Finder', width: 640, height: 420, render: renderPhotos });
  content.videos.forEach(video => define('video-' + video.id, {
    title: video.name, status: '', context: 'Movie Player', width: 720, height: 520,
    render: body => renderVideo(body, video)
  }));
  define('viewer', { title: 'Photo Viewer', width: 640, height: 465, render: renderViewer });
  define('note', { title: 'Message Slip', width: 290, height: 142, className: 'receipt-note-window', render: renderReceiptNote });
  define('receipt-send', { title: 'Print Note', status: '', context: 'Anti-Spam Check', width: 390, height: 260, className: 'receipt-send-window', render: renderReceiptSend });
  content.projects.forEach(project => define(project.id, {
    title: project.name, status: 'Embedded systems', context: countLabel(project.parts.length, 'repository', 'repositories'),
    width: 610, height: 485, render: body => renderProject(body, project)
  }));

  function saveDesktopState() {
    if (restoringDesktop) return;
    try {
      const openWindows = Array.from(windows, ([id, win]) => ({
        id,
        left: win.offsetLeft,
        top: win.offsetTop,
        width: win.offsetWidth,
        height: win.offsetHeight,
        zIndex: Number(win.style.zIndex) || 0,
        folder: id === 'photos' ? win.dataset.photoFolder || 'photos' : undefined
      })).sort((a, b) => a.zIndex - b.zIndex);
      const viewerState = viewer && windows.has('viewer')
        ? { photos: viewer.photos, index: viewer.index }
        : null;
      sessionStorage.setItem(desktopStateKey, JSON.stringify({
        version: 1,
        listView,
        activeWindow: activeWindow?.dataset.window || null,
        windows: openWindows,
        viewer: viewerState
      }));
    } catch {
      // The desktop still works when storage is unavailable or disabled.
    }
  }

  function restoreDesktopState() {
    let state;
    try {
      const saved = sessionStorage.getItem(desktopStateKey);
      if (saved === null) return false;
      state = JSON.parse(saved);
    } catch {
      return false;
    }
    if (!state || state.version !== 1 || !Array.isArray(state.windows)) return false;

    restoringDesktop = true;
    showDesktop();
    setView(Boolean(state.listView));
    const savedWindows = state.windows
      .filter(saved => saved && definitions.has(saved.id))
      .sort((a, b) => (Number(a.zIndex) || 0) - (Number(b.zIndex) || 0));

    savedWindows.forEach(saved => {
      if (saved.id === 'viewer') {
        if (!state.viewer || !Array.isArray(state.viewer.photos) || !state.viewer.photos.length) return;
        const index = Math.max(0, Math.min(Number(state.viewer.index) || 0, state.viewer.photos.length - 1));
        viewer = { photos: state.viewer.photos, index };
      }

      openWindow(saved.id, false);
      const win = windows.get(saved.id);
      if (!win) return;
      if (Number.isFinite(saved.width) && Number.isFinite(saved.height)) {
        win.style.width = 'min(' + saved.width + 'px, calc(100% - 22px))';
        win.style.height = 'min(' + saved.height + 'px, calc(100% - 22px))';
      }
      if (saved.id === 'photos' && saved.folder) {
        navigatePhotos(win.querySelector('.window-body'), saved.folder);
      }
      if (saved.id === 'viewer') updateViewer();
      if (Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        moveWindow(win, saved.left, saved.top);
      }
    });

    const restoredActive = windows.get(state.activeWindow) || Array.from(windows.values()).at(-1);
    if (restoredActive) focusWindow(restoredActive, false);
    restoringDesktop = false;
    saveDesktopState();
    return true;
  }

  function setStatus(win, status, context) {
    win.querySelector('.window-status').replaceChildren(element('span', '', status), element('span', '', context));
  }

  function initialPosition(id, win) {
    const personalIconsLeft = desktopPersonalItems.offsetLeft;
    const aboutTop = 36;
    if (id === 'photos') {
      return [personalIconsLeft + desktopPersonalItems.offsetWidth - 4, aboutTop + 118];
    }
    if (id === 'projects') {
      return [personalIconsLeft + 19, desktop.clientHeight - win.offsetHeight - 46];
    }
    if (id === 'about') {
      // Keep the LinkedIn callout visible between the window and the right-side icons.
      return [desktop.clientWidth - win.offsetWidth - 275, aboutTop];
    }
    const left = Math.max(17, Math.round((desktop.clientWidth - 1160) / 2));
    const top = Math.max(26, Math.round((desktop.clientHeight - 590) / 2) + 26);
    const offset = Math.min(Math.max(windows.size - 2, 0), 5) * 21;
    return [left + 70 + offset, top + 35 + offset];
  }

  function moveWindow(win, left, top) {
    const maxLeft = Math.max(0, desktop.clientWidth - win.offsetWidth - 3);
    const maxTop = Math.max(0, desktop.clientHeight - win.offsetHeight - 3);
    win.style.left = Math.max(0, Math.min(left, maxLeft)) + 'px';
    win.style.top = Math.max(0, Math.min(top, maxTop)) + 'px';
  }

  function openWindow(id, focus = true) {
    if (id === 'viewer') windows.get('photos')?.classList.add('viewer-underlay');
    let win = windows.get(id);
    if (!win) {
      const entry = definitions.get(id);
      if (!entry) return;
      win = template.content.firstElementChild.cloneNode(true);
      win.dataset.window = id;
      if (entry.className) win.classList.add(entry.className);
      win.style.setProperty('--window-width', entry.width + 'px');
      win.style.setProperty('--window-height', entry.height + 'px');
      const title = win.querySelector('h2');
      title.id = 'window-' + id;
      title.textContent = entry.title;
      win.setAttribute('aria-labelledby', title.id);
      win.querySelector('.close-box').setAttribute('aria-label', 'Close ' + entry.title);
      win.querySelector('.zoom-box').setAttribute('aria-label', 'Zoom ' + entry.title);
      setStatus(win, entry.status, entry.context);
      entry.render(win.querySelector('.window-body'));
      bindWindow(win, id);
      desktop.append(win);
      windows.set(id, win);
      moveWindow(win, ...initialPosition(id, win));
    }
    focusWindow(win, focus);
    saveDesktopState();
  }

  function focusWindow(win, focus = false) {
    if (activeWindow !== win) {
      activeWindow?.classList.remove('active');
      const rest = Array.from(windows.values())
        .filter(other => other !== win)
        .sort((a, b) => Number(a.style.zIndex) - Number(b.style.zIndex));
      rest.forEach((other, index) => { other.style.zIndex = 2 + index; });
      activeWindow = win;
      win.classList.add('active');
      win.style.zIndex = 2 + rest.length;
      updateSwitcher();
      syncMenus();
    }
    if (focus) win.focus({ preventScroll: true });
    saveDesktopState();
  }

  function closeWindow(id) {
    const win = windows.get(id);
    if (!win) return;
    if (id === 'note') closeWindow('receipt-send');
    if (id === 'viewer') windows.get('photos')?.classList.remove('viewer-underlay');
    const wasActive = win === activeWindow;
    if (win.contains(selected?.button)) clearSelection();
    windows.delete(id);
    stopVideos(win);
    win.remove();
    if (wasActive) {
      activeWindow = undefined;
      const next = Array.from(windows.values()).sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex))[0];
      if (next) focusWindow(next, true);
      else desktopItems.querySelector('button')?.focus();
    }
    updateSwitcher();
    syncMenus();
    saveDesktopState();
  }

  function bindWindow(win, id) {
    const titlebar = win.querySelector('.receipt-note-drag-handle') || win.querySelector('.titlebar');
    const zoom = win.querySelector('.zoom-box');
    const grip = win.querySelector('.receipt-note-resize-grip') || win.querySelector('.window-footer i');
    let drag;
    let resize;
    let restore;

    win.addEventListener('pointerdown', () => focusWindow(win));
    win.addEventListener('focusin', () => focusWindow(win));
    win.querySelector('.close-box').addEventListener('click', () => closeWindow(id));
    zoom.addEventListener('click', () => {
      if (restore) {
        win.style.width = restore.width;
        win.style.height = restore.height;
        moveWindow(win, restore.left, restore.top);
        restore = null;
      } else {
        restore = { left: win.offsetLeft, top: win.offsetTop, width: win.style.width, height: win.style.height };
        win.style.width = 'calc(100% - 22px)';
        win.style.height = 'calc(100% - 22px)';
        moveWindow(win, 10, 10);
      }
      zoom.setAttribute('aria-pressed', String(Boolean(restore)));
      saveDesktopState();
    });

    titlebar.addEventListener('pointerdown', event => {
      if (event.button !== 0 || compact.matches || restore || event.target.closest('button')) return;
      drag = {
        pointer: event.pointerId,
        left: win.offsetLeft - event.clientX,
        top: win.offsetTop - event.clientY
      };
      titlebar.setPointerCapture(event.pointerId);
    });
    titlebar.addEventListener('pointermove', event => {
      if (drag?.pointer === event.pointerId) moveWindow(win, drag.left + event.clientX, drag.top + event.clientY);
    });
    titlebar.addEventListener('lostpointercapture', () => {
      drag = null;
      saveDesktopState();
    });

    grip.addEventListener('pointerdown', event => {
      if (event.button !== 0 || compact.matches || restore) return;
      resize = {
        pointer: event.pointerId,
        width: win.offsetWidth - event.clientX,
        height: win.offsetHeight - event.clientY
      };
      grip.setPointerCapture(event.pointerId);
    });
    grip.addEventListener('pointermove', event => {
      if (resize?.pointer !== event.pointerId) return;
      const maxWidth = desktop.clientWidth - win.offsetLeft - 3;
      const maxHeight = desktop.clientHeight - win.offsetTop - 3;
      const width = Math.min(maxWidth, Math.max(280, resize.width + event.clientX));
      const height = Math.min(maxHeight, Math.max(175, resize.height + event.clientY));
      win.style.width = 'min(' + width + 'px, calc(100% - 22px))';
      win.style.height = 'min(' + height + 'px, calc(100% - 22px))';
    });
    grip.addEventListener('lostpointercapture', () => {
      resize = null;
      saveDesktopState();
    });
  }

  function updateSwitcher() {
    const buttons = Array.from(windows, ([id, win]) => {
      const button = element('button', '', definitions.get(id).title);
      button.type = 'button';
      if (win === activeWindow) button.setAttribute('aria-current', 'true');
      button.addEventListener('click', () => openWindow(id));
      return button;
    });
    switcher.replaceChildren(...buttons);
    switcher.hidden = !buttons.length;
  }

  function showDesktop() {
    activeWindow = undefined;
    windows.forEach(win => {
      stopVideos(win);
      win.remove();
    });
    windows.clear();
    clearSelection();
    updateSwitcher();
    saveDesktopState();
  }

  function resetDesktop() {
    showDesktop();
    openWindow('photos', false);
    openWindow('projects', false);
    openWindow('about', false);
  }

  const pause = duration => new Promise(resolve => window.setTimeout(resolve, duration));

  async function runStartup() {
    restoringDesktop = true;
    showDesktop();
    startupScreen.dataset.phase = 'happy';

    await pause(800);
    startupScreen.dataset.phase = 'welcome';

    await pause(2000);
    startupScreen.dataset.phase = 'desktop';
    document.documentElement.classList.remove('boot-required');
    document.body.classList.add('startup-loading');
    restoringDesktop = false;

    await pause(700);
    openWindow('photos', false);
    await pause(650);
    openWindow('projects', false);
    await pause(800);
    openWindow('about', false);
    select(welcomeDesktopItem, () => openWindow('about'));

    await pause(650);
    document.body.classList.remove('startup-loading');
    startupScreen.remove();
  }

  function syncMenus() {
    document.querySelector('[data-command="open"]').disabled = !selected;
    document.querySelector('[data-command="close"]').disabled = !activeWindow;
  }

  const commands = {
    open: () => selected?.activate(),
    close: () => activeWindow && closeWindow(activeWindow.dataset.window),
    icons: () => setView(false),
    list: () => setView(true),
    desktop: showDesktop,
    reset: resetDesktop
  };

  menus.forEach(menu => {
    menu.querySelector('summary').addEventListener('click', () => {
      menus.filter(other => other !== menu).forEach(other => { other.open = false; });
    });
  });
  document.addEventListener('click', event => {
    const command = event.target.closest('[data-command]');
    const opener = event.target.closest('[data-open]');
    if (command) commands[command.dataset.command]();
    if (opener) openWindow(opener.dataset.open);
    if (command || opener || !event.target.closest('.menus summary')) menus.forEach(menu => { menu.open = false; });
    if (event.target === desktop) clearSelection();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const menu = menus.find(item => item.open);
      if (menu) {
        menu.open = false;
        menu.querySelector('summary').focus();
      } else if (activeWindow?.dataset.window === 'viewer') {
        closeWindow('viewer');
      }
    }
    if (activeWindow?.dataset.window === 'viewer' && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      advancePhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  window.addEventListener('resize', () => {
    if (compact.matches) {
      const image = windows.get('viewer')?.querySelector('.viewer-body img');
      if (image?.complete) sizeViewerToImage(image);
    } else {
      windows.forEach(win => moveWindow(win, parseFloat(win.style.left), parseFloat(win.style.top)));
      saveDesktopState();
    }
  });
  window.addEventListener('pagehide', saveDesktopState);

  function updateClock() {
    document.querySelector('#clock').textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const welcomeDesktopItem = windowItem('about', 'Welcome!', 'document');
  desktopItems.append(
    windowItem('projects', 'Projects', 'system'),
    welcomeDesktopItem,
    windowItem('resume', 'Resume', 'resume'),
    item('GitHub', 'application', () => window.open(content.github, '_blank', 'noopener,noreferrer')),
    linkedInDesktopItem()
  );
  desktopPersonalItems.append(
    windowItem('photos', 'Media', 'disk'),
    item('Instagram', 'instagram', () => window.open(content.instagram, '_blank', 'noopener,noreferrer')),
    item('Spotify', 'spotify', () => window.open(content.spotify, '_blank', 'noopener,noreferrer')),
    windowItem('note', 'Message Slip', 'notepad')
  );
  document.querySelector('.menus a').href = content.github;
  updateClock();
  setInterval(updateClock, 15000);
  if (!restoreDesktopState()) {
    if (document.documentElement.classList.contains('boot-required')) runStartup();
    else resetDesktop();
  } else {
    startupScreen.remove();
  }
})();
