(function () {
  'use strict';

  let currentSlide = 1;
  const totalSlides = 3;
  let autohideTimer = null;
  let blankState = null;

  const deck = document.getElementById('deck');
  const slides = document.querySelectorAll('.slide');
  const counterCurrent = document.getElementById('ppt-current');
  const counterTotal = document.getElementById('ppt-total');
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const fullscreenBtn = document.getElementById('btn-fullscreen');
  const drawerBtn = document.getElementById('drawer-btn');
  const drawer = document.getElementById('slide-drawer');
  const drawerItems = document.querySelectorAll('.drawer-item');
  const blankScreen = document.getElementById('blank-screen');
  const pptControls = document.getElementById('ppt-controls');

  // 1. Dynamic Slide Scaling for true 16:9 aspect ratio in any resolution
  function scaleDeck() {
    if (!deck) return;
    const targetW = 1920;
    const targetH = 1080;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const scale = Math.min(winW / targetW, winH / targetH);
    deck.style.transform = 'scale(' + scale + ')';
  }

  window.addEventListener('resize', scaleDeck);
  scaleDeck();

  // 2. Slide Navigation Logic
  function goToSlide(slideNum) {
    if (slideNum < 1 || slideNum > totalSlides) return;
    if (slideNum === currentSlide) return;

    slides.forEach(function (slide) { slide.classList.remove('active'); });
    drawerItems.forEach(function (item) { item.classList.remove('active'); });

    currentSlide = slideNum;
    var targetSlide = document.getElementById('slide-' + currentSlide);
    if (targetSlide) targetSlide.classList.add('active');

    var targetThumb = document.querySelector('.drawer-item[data-slide="' + currentSlide + '"]');
    if (targetThumb) targetThumb.classList.add('active');

    if (counterCurrent) counterCurrent.textContent = currentSlide;
    if (prevBtn) prevBtn.disabled = currentSlide === 1;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides;

    hideBlankScreen();
    triggerToolbarActivity();
  }


  // 3. Fullscreen PPT Presentation Mode (F5 / F)
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function (err) {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  function updateFullscreenBtnIcon() {
    if (!fullscreenBtn) return;
    if (document.fullscreenElement) {
      fullscreenBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>';
      fullscreenBtn.title = 'Exit Slide Show (Esc)';
    } else {
      fullscreenBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
      fullscreenBtn.title = 'Start Slide Show (F5 / F)';
    }
  }

  document.addEventListener('fullscreenchange', updateFullscreenBtnIcon);

  // 4. Blank Screen Feature (PPT shortcuts: B for black, W for white)
  function toggleBlankScreen(color) {
    if (!blankScreen) return;
    if (blankState === color) {
      hideBlankScreen();
    } else {
      blankState = color;
      blankScreen.className = color === 'white' ? 'white active' : 'active';
    }
  }

  function hideBlankScreen() {
    if (!blankScreen) return;
    blankState = null;
    blankScreen.className = '';
  }

  if (blankScreen) blankScreen.addEventListener('click', hideBlankScreen);

  // 5. Drawer Toggle (Slide Thumbnails / Outline)
  function toggleDrawer() {
    if (drawer) drawer.classList.toggle('open');
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
  }

  // 6. Complete PowerPoint Keyboard Navigation
  document.addEventListener('keydown', function (e) {
    if (blankState && (e.key === 'b' || e.key === 'B' || e.key === 'w' || e.key === 'W' || e.key === 'Escape' || e.key === ' ')) {
      hideBlankScreen();
      return;
    }

    switch (e.key) {
      // Forward slide
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
      case 'n':
      case 'N':
      case 'Enter':
        e.preventDefault();
        nextSlide();
        break;

      // Previous slide
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'p':
      case 'P':
      case 'Backspace':
        e.preventDefault();
        prevSlide();
        break;

      // First & Last slide
      case 'Home':
        e.preventDefault();
        goToSlide(1);
        break;
      case 'End':
        e.preventDefault();
        goToSlide(totalSlides);
        break;

      // Fullscreen / Slide Show
      case 'F5':
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;

      // Black Screen
      case 'b':
      case 'B':
      case '.':
        e.preventDefault();
        toggleBlankScreen('black');
        break;

      // White Screen
      case 'w':
      case 'W':
      case ',':
        e.preventDefault();
        toggleBlankScreen('white');
        break;

      // Close overlays
      case 'Escape':
        closeDrawer();
        hideBlankScreen();
        break;
    }
  });

  // 7. Click on Slide advances presentation (like PowerPoint)
  if (deck) {
    deck.addEventListener('click', function (e) {
      if (e.target.closest('button') || e.target.closest('#slide-drawer') || e.target.closest('#ppt-controls')) {
        return;
      }
      nextSlide();
    });
  }

  // 8. Toolbar Autohide after inactivity
  function triggerToolbarActivity() {
    if (!pptControls) return;
    pptControls.classList.remove('dimmed');
    clearTimeout(autohideTimer);
    autohideTimer = setTimeout(function () {
      pptControls.classList.add('dimmed');
    }, 3500);
  }

  window.addEventListener('mousemove', triggerToolbarActivity);
  triggerToolbarActivity();

  // 9. Wire Controls & Initial State
  if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prevSlide(); });
  if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextSlide(); });
  if (fullscreenBtn) fullscreenBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleFullscreen(); });
  if (drawerBtn) drawerBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleDrawer(); });

  drawerItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      var slideNum = parseInt(this.getAttribute('data-slide'), 10);
      goToSlide(slideNum);
      closeDrawer();
    });
  });

  document.addEventListener('click', function (e) {
    if (drawer && drawer.classList.contains('open') && !drawer.contains(e.target) && e.target !== drawerBtn && !drawerBtn.contains(e.target)) {
      closeDrawer();
    }
  });

  if (counterTotal) counterTotal.textContent = totalSlides;
  if (counterCurrent) counterCurrent.textContent = currentSlide;
  if (prevBtn) prevBtn.disabled = true;
  updateFullscreenBtnIcon();

})();


  function nextSlide() {
    if (currentSlide < totalSlides) goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    if (currentSlide > 1) goToSlide(currentSlide - 1);
  }
