(() => {
  const root = document.querySelector('.explorer');
  if (!root) return;
  const products = JSON.parse(document.querySelector('#explore-products').textContent);
  const scene = root.querySelector('.orbit-scene');
  const stage = root.querySelector('.orbit-stage');
  const categories = [...root.querySelectorAll('[data-explore-category]')];
  const lightbox = root.querySelector('#photo-lightbox');
  const lightboxImage = root.querySelector('#lightbox-image');
  const lightboxTitle = root.querySelector('#lightbox-title');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const number = value => new Intl.NumberFormat('fa', {useGrouping: false}).format(value);
  const mod = (value, length) => ((value % length) + length) % length;
  let filtered = products;
  let tiles = [];
  let position = 0;
  let animation = 0;
  let pointer = null;
  let suppressClick = false;
  let lastProduct = null;
  let category = 'all';
  let geometry;
  let categoryAnimationTimer;

  function showPhoto(item) {
    lightboxImage.src = item.image_url;
    lightboxImage.alt = item.name;
    lightboxTitle.textContent = item.name;
    if (!lightbox.open) lightbox.showModal();
  }

  function measure() {
    const width = scene.clientWidth;
    const mobile = width <= 760;
    geometry = {
      x: width * (mobile ? 0.015 : 0.22), y: scene.clientHeight / 2,
      radius: mobile ? width * 0.80 : width * 0.53,
      step: mobile ? 34 : 32,
      card: mobile ? width * 0.34 : Math.min(width * 0.23, 240),
    };
    scene.style.setProperty('--orbit-diameter', `${geometry.radius * 2}px`);
    scene.style.setProperty('--orbit-center-x', `${geometry.x}px`);
    scene.style.setProperty('--orbit-card-width', `${geometry.card}px`);
    draw();
  }

  function draw() {
    const selected = mod(Math.round(position), tiles.length);
    tiles.forEach((tile, index) => {
      const distance = mod(index - position + tiles.length / 2, tiles.length) - tiles.length / 2;
      const visible = Math.abs(distance) < 2.85;
      tile.hidden = !visible;
      if (!visible) return;
      tile.style.setProperty('--enter-delay', `${Math.round(Math.abs(distance) * 24)}ms`);
      const degrees = distance * geometry.step;
      const angle = degrees * Math.PI / 180;
      const x = geometry.x + Math.cos(angle) * geometry.radius;
      const y = geometry.y + Math.sin(angle) * geometry.radius;
      const active = index === selected;
      tile.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${degrees * 0.65}deg) scale(${active ? 1.035 : 0.94})`;
      tile.style.zIndex = String(10 - Math.round(Math.abs(distance)));
      tile.classList.toggle('is-selected', active);
      tile.setAttribute('aria-pressed', String(active));
      tile.tabIndex = -1;
    });
  }

  function details() {
    const index = mod(Math.round(position), filtered.length);
    const item = filtered[index];
    if (lastProduct !== item.id) {
      root.querySelector('#selected-category').textContent = item.category_name;
      root.querySelector('#selected-name').textContent = item.name;
      root.querySelector('#selected-description').textContent = item.description;
      root.querySelector('#selected-price').textContent = item.price;
      lastProduct = item.id;
    }
    root.querySelector('#orbit-count').textContent = `${number(index + 1)} / ${number(filtered.length)}`;
    const url = new URL(location.href);
    if (category === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', category);
    url.searchParams.set('product', item.id);
    history.replaceState(null, '', url);
  }

  function stopAnimation() {
    cancelAnimationFrame(animation);
    animation = 0;
  }

  function select(target, immediate = false) {
    stopAnimation();
    const start = position;
    const delta = target - start;
    if (immediate || reducedMotion.matches || Math.abs(delta) < 0.001) {
      position = mod(target, tiles.length);
      draw();
      details();
      return;
    }
    const began = performance.now();
    function frame(now) {
      const progress = Math.min((now - began) / 360, 1);
      position = start + delta * (1 - Math.pow(1 - progress, 3));
      draw();
      if (progress < 1) animation = requestAnimationFrame(frame);
      else {
        animation = 0;
        position = mod(target, tiles.length);
        details();
      }
    }
    animation = requestAnimationFrame(frame);
  }

  function build(selectedId, animate = false) {
    stopAnimation();
    pointer = null;
    stage.classList.remove('is-dragging');
    const fragment = document.createDocumentFragment();
    // Repeat short categories so the circular track stays continuous at either end.
    const copies = Math.max(1, Math.ceil(9 / filtered.length));
    tiles = [];
    for (let cycle = 0; cycle < copies; cycle++) {
      filtered.forEach((item, itemIndex) => {
        const index = tiles.length;
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'orbit-card';
        if (animate) {
          tile.classList.add('is-entering');
          tile.addEventListener('animationend', () => tile.classList.remove('is-entering'), {once: true});
        }
        tile.setAttribute('aria-label', `نمایش بزرگ ${item.name}`);
        tile.setAttribute('aria-haspopup', 'dialog');
        tile.dataset.product = item.id;
        const image = document.createElement('img');
        image.src = item.image_url;
        image.alt = '';
        image.draggable = false;
        const label = document.createElement('span');
        label.className = 'orbit-card-label';
        label.textContent = item.name;
        tile.append(image, label);
        tile.addEventListener('click', () => {
          if (suppressClick) return;
          const delta = mod(index - position + tiles.length / 2, tiles.length) - tiles.length / 2;
          select(position + delta);
          showPhoto(item);
        });
        tiles.push(tile);
        fragment.append(tile);
      });
    }
    stage.replaceChildren(fragment);
    position = Math.max(0, filtered.findIndex(item => item.id === selectedId));
    measure();
    details();
  }

  categories.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.exploreCategory;
    filtered = category === 'all' ? products : products.filter(item => item.category === category);
    categories.forEach(chip => {
      const active = chip === button;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    clearTimeout(categoryAnimationTimer);
    scene.classList.remove('is-category-changing');
    void scene.offsetWidth;
    scene.classList.add('is-category-changing');
    categoryAnimationTimer = setTimeout(() => scene.classList.remove('is-category-changing'), 700);
    build(undefined, true);
  }));

  stage.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    stopAnimation();
    suppressClick = false;
    pointer = {id: event.pointerId, y: event.clientY, start: position, moved: false};
  });
  stage.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const distance = event.clientY - pointer.y;
    if (!pointer.moved && Math.abs(distance) > 6) {
      pointer.moved = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    if (!pointer.moved) return;
    position = pointer.start - distance / (geometry.radius * geometry.step * Math.PI / 180);
    draw();
  });
  function endDrag(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    const moved = pointer.moved;
    pointer = null;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (moved) {
      suppressClick = true;
      select(Math.round(position));
      setTimeout(() => { suppressClick = false; }, 0);
    } else select(Math.round(position));
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', event => {
    // Touch begins with implicit capture on the image button. Its capture-loss
    // event bubbles here when the stage takes over; that is not the end of a drag.
    if (event.target === stage) endDrag(event);
  });
  let wheelTotal = 0;
  let wheelTimer;
  stage.addEventListener('wheel', event => {
    if (event.ctrlKey) return;
    event.preventDefault();
    wheelTotal += (event.deltaY || event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scene.clientHeight : 1);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelTotal = 0; }, 150);
    if (Math.abs(wheelTotal) >= 35) {
      if (!animation) select(Math.round(position) + Math.sign(wheelTotal));
      wheelTotal = 0;
    }
  }, {passive: false});
  stage.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') select(0);
      else if (event.key === 'End') select(filtered.length - 1);
      else select(Math.round(position) + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1));
    }
  });
  root.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) lightbox.close();
  });
  new ResizeObserver(measure).observe(scene);
  const params = new URLSearchParams(location.search);
  const initialCategory = categories.find(chip => chip.dataset.exploreCategory === params.get('category'));
  if (initialCategory) {
    category = initialCategory.dataset.exploreCategory;
    filtered = category === 'all' ? products : products.filter(item => item.category === category);
    categories.forEach(chip => {
      const active = chip === initialCategory;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    initialCategory.scrollIntoView({block: 'nearest', inline: 'nearest'});
  }
  build(params.get('product'));
})();
