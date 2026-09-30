/* =========================================================
   POWERPOINT PRESENTATION CONTROLLER
   ========================================================= */

const slides = Array.from(
  document.querySelectorAll(".slide")
);

let currentSlide = 0;


/* =========================================================
   DISPLAY SETTINGS
   Theme, page size and word size are all user preferences,
   so they are saved in localStorage and restored on the
   next visit. localStorage can throw (private mode, blocked
   cookies), hence the small wrapper around it.
   ========================================================= */

const STORAGE_KEY = "code-ppt-display";

/* A page size is really an aspect ratio. "auto" follows the
   shape of the screen, which is what a phone wants. */

const PAGE_SIZES = {

  "auto": null,

  "16:9": 16 / 9,

  "16:10": 16 / 10,

  "4:3": 4 / 3

};


/* Word size steps. 1 is the size the slides were designed
   at; the others are a real zoom, so everything grows
   together and nothing is ever cut off. */

const WORD_STEPS = [

  0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75

];


const DEFAULT_SETTINGS = {

  theme: "dark",

  pageSize: "auto",

  wordStep: 2

};


function readSettings() {

  const settings = Object.assign({}, DEFAULT_SETTINGS);

  try {

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (saved && typeof saved === "object") {

      if (["light", "dark", "system"].includes(saved.theme)) {
        settings.theme = saved.theme;
      }

      if (Object.prototype.hasOwnProperty.call(PAGE_SIZES, saved.pageSize)) {
        settings.pageSize = saved.pageSize;
      }

      if (
        Number.isInteger(saved.wordStep) &&
        saved.wordStep >= 0 &&
        saved.wordStep < WORD_STEPS.length
      ) {
        settings.wordStep = saved.wordStep;
      }

    }

  } catch (error) {

    /* No storage available: the defaults are fine. */

  }

  return settings;

}


function saveSettings() {

  try {

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

  } catch (error) {

    /* Ignore: the settings still apply for this session. */

  }

}


const settings = readSettings();


/* =========================================================
   STAGE SIZE
   The desktop stage is a fixed 1920 x 1080. A phone cannot
   use it: shrunk to a 390px screen, 22px body text would
   render at about 4px. So on a touch device the stage is
   swapped for a narrow, portrait shaped one and the mobile
   CSS in style.css reflows every slide into a single column
   with much larger type.
   ========================================================= */

const deckElement = document.getElementById("deck");

const deckFitElement = document.getElementById("deck-fit");

const stageElement = document.getElementById("deck-stage");


/* Reads the real visible area, so fullscreen and
   maximised windows are measured correctly. */

function getViewportSize() {

  return {

    width:
      window.visualViewport?.width ??
      document.documentElement.clientWidth ??
      window.innerWidth,

    height:
      window.visualViewport?.height ??
      document.documentElement.clientHeight ??
      window.innerHeight

  };

}


function isTouchDevice() {

  return window.matchMedia("(hover: none), (pointer: coarse)").matches;

}


function clamp(value, min, max) {

  return Math.min(Math.max(value, min), max);

}


/* The stage shape is remembered rather than re-read on every
   resize. A phone browser hides and shows its address bar as
   the page scrolls, which changes the viewport height by a
   noticeable amount; re-deriving the stage from that would
   reflow the whole slide and make it jump while reading.
   Only a real change of shape (turning the device, or a
   window being dragged much wider or narrower) updates it. */

let stageAspect = 0;

const ASPECT_CHANGE_LIMIT = 0.12;


function updateStageAspect(force) {

  const viewport = getViewportSize();

  const aspect = viewport.width / viewport.height;

  const changed =
    stageAspect === 0 ||
    Math.abs(aspect - stageAspect) > ASPECT_CHANGE_LIMIT;

  if (force || changed) {

    stageAspect = aspect;

  }

}


function getStageRatio() {

  const chosenRatio = PAGE_SIZES[settings.pageSize];

  if (chosenRatio !== null) {

    return chosenRatio;

  }

  /* Following the screen. A landscape phone, though, is a thin
     strip that is far wider than it is tall, which would give a
     stage too short for any slide to sit in. A slide shape is
     capped at 16:9 there, so the content keeps a sensible
     height and only a little scrolling is ever needed. */

  if (isTouchDevice() && stageAspect >= 1) {

    return Math.min(stageAspect, 16 / 9);

  }

  return stageAspect;

}


function getStageSize() {

  const ratio = getStageRatio();

  if (isTouchDevice()) {

    /* Landscape has room for two columns, so the stage is
       wider there; portrait gets a narrow single column.
       The height follows the stage ratio, clamped so an
       extreme screen shape cannot produce a silly stage. */

    const width = stageAspect >= 1 ? 1280 : 720;

    return {

      width: width,

      height: Math.round(
        clamp(width / ratio, width * 0.45, width * 2.4)
      )

    };

  }

  return {

    width: 1920,

    height: Math.round(
      clamp(1920 / ratio, 900, 1920)
    )

  };

}


function fitDeckToScreen() {

  if (!deckElement || !stageElement || !deckFitElement) {

    return;

  }

  const viewport = getViewportSize();

  const stage = getStageSize();

  const wordScale = WORD_STEPS[settings.wordStep];

  /* The stage fills the screen, so the slide is as large as
     it can be without being cut off. A chosen page size that
     does not match the screen leaves letterbox bars, which is
     exactly what a real page size does. */

  const fit = Math.min(

    viewport.width / stage.width,
    viewport.height / stage.height

  );

  stageElement.style.width = stage.width + "px";

  stageElement.style.height = stage.height + "px";

  stageElement.style.transform = `scale(${wordScale})`;

  deckFitElement.style.width = stage.width * wordScale + "px";

  deckFitElement.style.height = stage.height * wordScale + "px";

  deckFitElement.style.transform = `scale(${fit})`;

  /* #deck is given the size the slide finally appears at, so
     the browser scrolls exactly the right amount. */

  deckElement.style.width = stage.width * wordScale * fit + "px";

  deckElement.style.height = stage.height * wordScale * fit + "px";

}


/* The viewport can change size several times while
   entering or leaving fullscreen, and the final size is
   only known after the browser settles. Re-fitting on the
   next two frames guarantees the last, correct value wins. */

let fitFrameCount = 0;

function scheduleFit() {

  updateStageAspect();

  fitFrameCount = 2;

  if (fitFrameCount > 0) {

    requestAnimationFrame(function runFit() {

      fitDeckToScreen();

      fitFrameCount--;

      if (fitFrameCount > 0) {

        requestAnimationFrame(runFit);

      }

    });

  }

}


/* Turning the device is a real change of shape, so the stage
   is rebuilt for the new orientation even if the viewport
   measurements arrive late. */

function handleOrientationChange() {

  updateStageAspect(true);

  scheduleFit();

}


window.addEventListener(
  "resize",
  scheduleFit
);

window.addEventListener(
  "orientationchange",
  handleOrientationChange
);

window.visualViewport?.addEventListener(
  "resize",
  scheduleFit
);

document.addEventListener(
  "fullscreenchange",
  scheduleFit
);

document.addEventListener(
  "webkitfullscreenchange",
  scheduleFit
);

/* Safety net for browsers that resize the page
   without firing a window resize event. */

if (window.ResizeObserver) {

  new ResizeObserver(scheduleFit).observe(
    document.documentElement
  );

}

/* The shape of the stage is read once up front, so the very
   first render is already correct. */

updateStageAspect(true);

fitDeckToScreen();


/* =========================================================
   SHOW SLIDE
   ========================================================= */

function showSlide(index) {

  if (index < 0) {
    index = 0;
  }

  if (index >= slides.length) {
    index = slides.length - 1;
  }


  slides.forEach((slide, i) => {

    slide.classList.toggle(
      "active",
      i === index
    );

    /* A slide that scrolls (a long one on a phone) has to
       start at the top again, or the next slide would open
       halfway down. */
    if (i === index && slide.scrollTop) {
      slide.scrollTop = 0;
    }

  });


  currentSlide = index;

  updateSlideIndicator();

}


/* =========================================================
   NEXT SLIDE
   ========================================================= */

function nextSlide() {

  if (currentSlide < slides.length - 1) {

    showSlide(currentSlide + 1);

  }

}


/* =========================================================
   PREVIOUS SLIDE
   ========================================================= */

function previousSlide() {

  if (currentSlide > 0) {

    showSlide(currentSlide - 1);

  }

}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

    /* Let the browser keep its own shortcuts
       (Ctrl+P, Cmd+S, Alt+Left and so on) and anything
       typed into a control. */
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    if (
      event.target instanceof HTMLElement &&
      event.target.closest("input, textarea, select, [contenteditable]")
    ) {
      return;
    }


    /* NEXT */

    if (
      event.key === "ArrowRight" ||
      event.key === "ArrowDown" ||
      event.key === "PageDown" ||
      event.key === " " ||
      event.key === "Enter"
    ) {

      event.preventDefault();

      nextSlide();

      return;

    }


    /* PREVIOUS */

    if (
      event.key === "ArrowLeft" ||
      event.key === "ArrowUp" ||
      event.key === "PageUp"
    ) {

      event.preventDefault();

      previousSlide();

      return;

    }


    /* FIRST */

    if (event.key === "Home") {

      event.preventDefault();

      showSlide(0);

      return;

    }


    /* LAST */

    if (event.key === "End") {

      event.preventDefault();

      showSlide(slides.length - 1);

      return;

    }


    /* FULLSCREEN */

    if (
      event.key === "f" ||
      event.key === "F"
    ) {

      event.preventDefault();

      toggleFullscreen();

      return;

    }


    /* THEME
       t cycles light -> dark -> follow the system. */

    if (event.key === "t" || event.key === "T") {

      event.preventDefault();

      cycleTheme();

      return;

    }


    /* PAGE SIZE
       p cycles auto -> 16:9 -> 16:10 -> 4:3. */

    if (event.key === "p" || event.key === "P") {

      event.preventDefault();

      cyclePageSize();

      return;

    }


    /* WORD SIZE */

    if (
      event.key === "+" ||
      event.key === "="
    ) {

      event.preventDefault();

      changeWordSize(1);

      return;

    }


    if (
      event.key === "-" ||
      event.key === "_"
    ) {

      event.preventDefault();

      changeWordSize(-1);

      return;

    }


    /* 0 resets the word size back to 100%. */

    if (event.key === "0") {

      event.preventDefault();

      setWordSize(2, true);

      return;

    }


    /* SETTINGS PANEL
       s or ? opens it, Escape closes it. */

    if (
      event.key === "s" ||
      event.key === "S" ||
      event.key === "?"
    ) {

      event.preventDefault();

      toggleSettingsPanel();

      return;

    }


    if (event.key === "Escape") {

      closeSettingsPanel();

      return;

    }


    /* BLACK SCREEN */

    if (
      event.key === "b" ||
      event.key === "B"
    ) {

      event.preventDefault();

      toggleBlackScreen();

      return;

    }

  }
);


/* =========================================================
   FULLSCREEN
   ========================================================= */

async function toggleFullscreen() {

  try {

    if (!document.fullscreenElement) {

      await document.documentElement.requestFullscreen();

    } else {

      await document.exitFullscreen();

    }

  } catch (error) {

    console.error(
      "Fullscreen error:",
      error
    );

  }

}


/* =========================================================
   THEME
   "system" follows the operating system, and keeps following
   it if the user changes it while the page is open.
   ========================================================= */

const systemThemeQuery =
  window.matchMedia("(prefers-color-scheme: dark)");


function applyTheme() {

  const dark =
    settings.theme === "system"
      ? systemThemeQuery.matches
      : settings.theme === "dark";

  document.body.classList.toggle("dark", dark);

}


function getThemeLabel() {

  if (settings.theme === "system") {
    return "follow system";
  }

  return settings.theme;

}


function setTheme(theme) {

  settings.theme = theme;

  applyTheme();

  saveSettings();

  syncSettingsUI();

  showToast("Theme: " + getThemeLabel());

}


function cycleTheme() {

  const order = ["light", "dark", "system"];

  setTheme(
    order[(order.indexOf(settings.theme) + 1) % order.length]
  );

}


systemThemeQuery.addEventListener("change", function () {

  if (settings.theme === "system") {

    applyTheme();

  }

});


/* =========================================================
   PAGE SIZE
   ========================================================= */

function setPageSize(pageSize) {

  settings.pageSize = pageSize;

  saveSettings();

  scheduleFit();

  syncSettingsUI();

  showToast("Page size: " + pageSize);

}


function cyclePageSize() {

  const order = Object.keys(PAGE_SIZES);

  setPageSize(
    order[(order.indexOf(settings.pageSize) + 1) % order.length]
  );

}


/* =========================================================
   WORD SIZE
   The whole stage is scaled, so the text, the diagrams and
   the spacing all grow together and nothing is ever
   clipped. A slide bigger than the screen is scrolled.
   ========================================================= */

function getWordSizeLabel() {

  return Math.round(WORD_STEPS[settings.wordStep] * 100) + "%";

}


function setWordSize(step, announce) {

  const next = clamp(step, 0, WORD_STEPS.length - 1);

  if (next === settings.wordStep) {

    return;

  }

  settings.wordStep = next;

  saveSettings();

  scheduleFit();

  syncSettingsUI();

  if (announce) {

    showToast("Word size: " + getWordSizeLabel());

  }

}


function changeWordSize(direction) {

  setWordSize(settings.wordStep + direction, true);

}


/* =========================================================
   ACCESSIBILITY TOOLBAR
   The settings button, the panel, the pager and the toast
   all live outside the deck, so they keep a usable size on
   a phone and never interfere with the click-to-advance
   behaviour of the slides themselves.
   ========================================================= */

const a11yButton =
  document.getElementById("a11y-button");

const a11yPanel =
  document.getElementById("a11y-panel");

const a11yClose =
  document.getElementById("a11y-close");

const a11yWordValue =
  document.getElementById("a11y-word-value");

const pagerCount =
  document.getElementById("pager-count");

const pagerPrev =
  document.getElementById("pager-prev");

const pagerNext =
  document.getElementById("pager-next");

const progressBar =
  document.getElementById("progress-bar");

const toastElement =
  document.getElementById("toast");


/* ---------- Settings panel ---------- */

function isSettingsPanelOpen() {

  return !a11yPanel.hidden;

}


function openSettingsPanel() {

  a11yPanel.hidden = false;

  a11yButton.setAttribute("aria-expanded", "true");

  syncSettingsUI();

}


function closeSettingsPanel() {

  a11yPanel.hidden = true;

  a11yButton.setAttribute("aria-expanded", "false");

}


function toggleSettingsPanel() {

  if (isSettingsPanelOpen()) {
    closeSettingsPanel();
  } else {
    openSettingsPanel();
  }

}


function syncSettingsUI() {

  /* Highlight the current choice in every group. */
  a11yPanel
    .querySelectorAll("[data-theme]")
    .forEach(function (button) {

      button.setAttribute(
        "aria-pressed",
        String(button.dataset.theme === settings.theme)
      );

    });

  a11yPanel
    .querySelectorAll("[data-page]")
    .forEach(function (button) {

      button.setAttribute(
        "aria-pressed",
        String(button.dataset.page === settings.pageSize)
      );

    });

  a11yWordValue.textContent = getWordSizeLabel();

}


a11yButton.addEventListener(
  "click",
  function (event) {

    event.stopPropagation();

    toggleSettingsPanel();

  }
);


a11yClose.addEventListener(
  "click",
  function (event) {

    event.stopPropagation();

    closeSettingsPanel();

  }
);


/* Tapping a choice inside the panel must not fall through to
   the deck behind it, which would change the slide. */
a11yPanel.addEventListener(
  "click",
  function (event) {

    event.stopPropagation();

  }
);


document.addEventListener(
  "click",
  function (event) {

    if (!isSettingsPanelOpen()) {
      return;
    }

    if (a11yPanel.contains(event.target)) {
      return;
    }

    if (a11yButton.contains(event.target)) {
      return;
    }

    closeSettingsPanel();

  }
);


a11yPanel
  .querySelectorAll("[data-theme]")
  .forEach(function (button) {

    button.addEventListener("click", function () {

      setTheme(button.dataset.theme);

    });

  });


a11yPanel
  .querySelectorAll("[data-page]")
  .forEach(function (button) {

    button.addEventListener("click", function () {

      setPageSize(button.dataset.page);

    });

  });


document
  .getElementById("a11y-word-down")
  .addEventListener("click", function () {

    changeWordSize(-1);

  });


document
  .getElementById("a11y-word-up")
  .addEventListener("click", function () {

    changeWordSize(1);

  });


document
  .getElementById("a11y-fullscreen")
  .addEventListener("click", toggleFullscreen);


document
  .getElementById("a11y-black")
  .addEventListener("click", toggleBlackScreen);


pagerPrev.addEventListener("click", function (event) {

  event.stopPropagation();

  previousSlide();

});


pagerNext.addEventListener("click", function (event) {

  event.stopPropagation();

  nextSlide();

});


/* ---------- Slide counter and progress ---------- */

function updateSlideIndicator() {

  const number = currentSlide + 1;

  const total = slides.length;

  pagerCount.textContent = number + " / " + total;

  progressBar.style.width =
    (number / total) * 100 + "%";

  pagerPrev.disabled = currentSlide === 0;

  pagerNext.disabled = currentSlide === total - 1;

}


/* ---------- Toast, confirms a keyboard change ---------- */

let toastTimer = null;

function showToast(message) {

  toastElement.textContent = message;

  toastElement.classList.add("visible");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(function () {

    toastElement.classList.remove("visible");

  }, 1400);

}


/* =========================================================
   BLACK SCREEN
   ========================================================= */

function toggleBlackScreen() {

  const screen =
    document.getElementById("black-screen");

  screen.classList.toggle("active");

}


/* =========================================================
   BLACK SCREEN CLICK
   ========================================================= */

document
  .getElementById("black-screen")
  .addEventListener(
    "click",
    function () {

      this.classList.remove("active");

    }
  );


/* =========================================================
   START PRESENTATION
   ========================================================= */

applyTheme();

syncSettingsUI();

showSlide(0);


/* =========================================================
   SLIDE NAVIGATION
   ========================================================= */

/*
  DESKTOP:
    - Normal click anywhere -> NEXT slide
    - Right click -> PREVIOUS slide

  MOBILE:
    - Tap LEFT half -> PREVIOUS slide
    - Tap RIGHT half -> NEXT slide
    - Swipe LEFT -> NEXT slide
    - Swipe RIGHT -> PREVIOUS slide

  Interactive controls such as buttons and links are ignored.
*/

const deck = document.getElementById("deck");

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchNavigationHandled = false;

function isInteractiveElement(target) {
  return !!target.closest(
    "button, a, input, select, textarea, [role='button']"
  );
}

function isTouchNavigationDevice() {
  return window.matchMedia(
    "(hover: none), (pointer: coarse)"
  ).matches;
}


/* =========================================================
   MOBILE â€” TOUCH START
   ========================================================= */

deck.addEventListener(
  "pointerdown",
  function (event) {

    if (
      event.pointerType !== "touch" &&
      event.pointerType !== "pen"
    ) {
      return;
    }

    if (isInteractiveElement(event.target)) {
      return;
    }

    touchStartX = event.clientX;
    touchStartY = event.clientY;
    touchStartTime = Date.now();

  },
  { passive: true }
);


/* =========================================================
   MOBILE â€” TOUCH END
   ========================================================= */

deck.addEventListener(
  "pointerup",
  function (event) {

    if (
      event.pointerType !== "touch" &&
      event.pointerType !== "pen"
    ) {
      return;
    }

    if (isInteractiveElement(event.target)) {
      return;
    }

    const touchEndX = event.clientX;
    const touchEndY = event.clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    const duration = Date.now() - touchStartTime;

    const SWIPE_DISTANCE = 50;
    const TAP_DISTANCE = 20;

    /*
      -------------------------------------------------------
      SWIPE
      -------------------------------------------------------
    */

    if (
      absX >= SWIPE_DISTANCE &&
      absX > absY
    ) {

      touchNavigationHandled = true;

      /*
        Swipe LEFT
        finger moves from right -> left
        => NEXT slide
      */
      if (deltaX < 0) {
        nextSlide();
      }

      /*
        Swipe RIGHT
        finger moves from left -> right
        => PREVIOUS slide
      */
      else {
        previousSlide();
      }

      /*
        Mobile browsers may fire a click immediately after
        pointerup. Ignore that click so the slide changes only
        once.
      */
      setTimeout(function () {
        touchNavigationHandled = false;
      }, 400);

      return;
    }


    /*
      -------------------------------------------------------
      SINGLE TAP
      -------------------------------------------------------
    */

    if (
      absX <= TAP_DISTANCE &&
      absY <= TAP_DISTANCE &&
      duration < 700
    ) {

      const rect = deck.getBoundingClientRect();

      /*
        clientX is measured against the whole screen.

        rect.left/right give us the actual visible deck
        position after the 1920x1080 deck is scaled.
      */
      const xInsideDeck =
        event.clientX - rect.left;

      const deckWidth = rect.width;

      /*
        Ignore taps that somehow happen outside the deck.
      */
      if (
        xInsideDeck < 0 ||
        xInsideDeck > deckWidth
      ) {
        return;
      }

      touchNavigationHandled = true;

      /*
        LEFT HALF
        => PREVIOUS
      */
      if (xInsideDeck < deckWidth / 2) {
        previousSlide();
      }

      /*
        RIGHT HALF
        => NEXT
      */
      else {
        nextSlide();
      }

      /*
        Prevent the browser-generated click from moving
        another slide.
      */
      setTimeout(function () {
        touchNavigationHandled = false;
      }, 400);
    }

  },
  { passive: true }
);


/* =========================================================
   MOBILE â€” TOUCH CANCELLED
   A gesture can be interrupted mid-swipe (an incoming call,
   a notification, the OS taking over for its own back/forward
   gesture, etc). Without this, the next touch would still be
   measured against the old, stale start point.
   ========================================================= */

deck.addEventListener(
  "pointercancel",
  function () {

    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;

  },
  { passive: true }
);


/* =========================================================
   DESKTOP â€” NORMAL CLICK
   ========================================================= */

deck.addEventListener(
  "click",
  function (event) {

    /*
      If this click came immediately after a touch,
      navigation has already happened.
    */
    if (touchNavigationHandled) {
      return;
    }

    /*
      Never hijack real controls.
    */
    if (isInteractiveElement(event.target)) {
      return;
    }

    /*
      Only use normal click-to-next behaviour on desktop.
    */
    if (
      window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches
    ) {
      nextSlide();
    }

  }
);


/* =========================================================
   DESKTOP â€” RIGHT CLICK = PREVIOUS
   ========================================================= */

deck.addEventListener(
  "contextmenu",
  function (event) {

    /*
      On desktop:
        right click -> previous slide

      On mobile:
        prevent the browser long-press menu,
        but DO NOT change the slide here.
        Mobile navigation is handled by pointerup above.
      */
    if (
      window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      ).matches
    ) {

      event.preventDefault();
      previousSlide();

    } else {

      event.preventDefault();

    }

  }
);


/* =========================================================
   BULB CIRCUIT â€” INTERACTIVE (Slide 6)
   ========================================================= */

let bulbAnimationId = null;

let electronDotsTop = [];

let electronDotsBot = [];

let bulbIsOn = false;

let bulbAnimTime = 0;


/* Helpers */

function pathLen(id) {

  return document.getElementById(id)
    .getTotalLength();

}


function pointAt(id, d) {

  return document.getElementById(id)
    .getPointAtLength(d);

}


/* Create electron dots along a path */

function createDots(pathId, containerId, count) {

  const container =
    document.getElementById(containerId);

  const dots = [];

  const len = pathLen(pathId);

  for (let i = 0; i < count; i++) {

    const c = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );

    c.setAttribute("r", "4.5");

    c.setAttribute("fill", "#2678c0");

    c.setAttribute("opacity", "0");

    container.appendChild(c);

    dots.push({
      el: c,
      offset: (i / count) * len
    });

  }

  return dots;

}


function initBulbDots() {

  document.getElementById(
    "electron-dots-top"
  ).innerHTML = "";

  document.getElementById(
    "electron-dots-bottom"
  ).innerHTML = "";

  electronDotsTop = createDots(
    "wire-top",
    "electron-dots-top",
    10
  );

  electronDotsBot = createDots(
    "wire-bottom",
    "electron-dots-bottom",
    10
  );

}


/* Animate dots â€” electrons move âˆ’ to + */

function animateBulbDots() {

  if (!bulbIsOn) return;

  bulbAnimTime += 1.2;

  const lenTop = pathLen("wire-top");
  const lenBot = pathLen("wire-bottom");

  electronDotsBot.forEach(function (d) {

    let off = (d.offset + bulbAnimTime) % lenBot;
    const pt = pointAt("wire-bottom", off);

    d.el.setAttribute("cx", pt.x);
    d.el.setAttribute("cy", pt.y);

  });

  electronDotsTop.forEach(function (d) {

    let off = (d.offset + bulbAnimTime) % lenTop;
    const pt = pointAt("wire-top", lenTop - off);

    d.el.setAttribute("cx", pt.x);
    d.el.setAttribute("cy", pt.y);

  });

  bulbAnimationId =
    requestAnimationFrame(animateBulbDots);

}


/* BULB ON */

function bulbOn() {

  if (bulbIsOn) return;

  bulbIsOn = true;

  /* Close switch */

  document.getElementById("switch-gap")
    .setAttribute("opacity", "0");

  document.getElementById("switch-closed")
    .setAttribute("opacity", "1");

  /* Filament glow */

  const fil =
    document.getElementById("bulb-filament");

  fil.setAttribute("stroke", "#e8a020");
  fil.setAttribute("stroke-width", "3");
  fil.style.transition = "all 0.6s";

  /* Glass tint */

  document.getElementById("bulb-glass")
    .setAttribute("fill", "#fff8e0");

  /* Halo */

  const halo =
    document.getElementById("bulb-halo");

  halo.style.transition = "opacity 0.8s";
  halo.setAttribute("opacity", "0.85");

  /* Light rays */

  const rays =
    document.getElementById("light-rays");

  rays.style.transition = "opacity 0.8s";
  rays.setAttribute("opacity", "1");

  /* Electron dots */

  initBulbDots();

  electronDotsTop.forEach(function (d) {
    d.el.setAttribute("opacity", "0.9");
  });

  electronDotsBot.forEach(function (d) {
    d.el.setAttribute("opacity", "0.9");
  });

  bulbAnimTime = 0;

  bulbAnimationId =
    requestAnimationFrame(animateBulbDots);

  /* Status */

  document.getElementById("bulb-status")
    .textContent = "Circuit CLOSED â€” Bulb ON";

  document.getElementById("btn-on")
    .classList.add("active");

  document.getElementById("btn-off")
    .classList.remove("active");

}


/* BULB OFF */

function bulbOff() {

  bulbIsOn = false;

  if (bulbAnimationId) {
    cancelAnimationFrame(bulbAnimationId);
  }

  /* Open switch */

  document.getElementById("switch-gap")
    .setAttribute("opacity", "1");

  document.getElementById("switch-closed")
    .setAttribute("opacity", "0");

  /* Filament dark */

  const fil =
    document.getElementById("bulb-filament");

  fil.setAttribute("stroke", "#666");
  fil.setAttribute("stroke-width", "2.2");

  /* Glass */

  document.getElementById("bulb-glass")
    .setAttribute("fill", "#fafafa");

  /* Hide halo + rays */

  document.getElementById("bulb-halo")
    .setAttribute("opacity", "0");

  document.getElementById("light-rays")
    .setAttribute("opacity", "0");

  /* Remove dots */

  document.getElementById(
    "electron-dots-top"
  ).innerHTML = "";

  document.getElementById(
    "electron-dots-bottom"
  ).innerHTML = "";

  /* Status */

  document.getElementById("bulb-status")
    .textContent = "Circuit OPEN â€” Bulb OFF";

  document.getElementById("btn-on")
    .classList.remove("active");

  document.getElementById("btn-off")
    .classList.add("active");

}


/* =========================================================
   RELAY â€” INTERACTIVE (Slide 8)
   ========================================================= */

let relayState = "off";

let relayCoilDots = [];

let relaySecDots = [];

let relayAnimId = null;

let relayAnimTime = 0;


function sleep(ms) {

  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });

}


/* Create dots â€” does NOT clear container */

function createRelayDots(
  pathId, containerId, count
) {

  const container =
    document.getElementById(containerId);

  const dots = [];

  const path =
    document.getElementById(pathId);

  if (!path) return dots;

  const len = path.getTotalLength();

  for (let i = 0; i < count; i++) {

    const c = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );

    c.setAttribute("r", "4");

    c.setAttribute("fill", "#2678c0");

    c.setAttribute("opacity", "0");

    container.appendChild(c);

    dots.push({
      el: c,
      offset: (i / count) * len,
      pathId: pathId
    });

  }

  return dots;

}


/* Animate relay dots */

function animateRelayDots() {

  relayAnimTime += 1.0;

  relayCoilDots.forEach(function (d) {

    const path =
      document.getElementById(d.pathId);

    if (!path) return;

    const len = path.getTotalLength();

    let off =
      (d.offset + relayAnimTime) % len;

    /* Top wire: reverse direction */

    const pt = path.getPointAtLength(
      d.pathId.indexOf("top") !== -1
        ? (len - off)
        : off
    );

    d.el.setAttribute("cx", pt.x);
    d.el.setAttribute("cy", pt.y);

  });


  relaySecDots.forEach(function (d) {

    const path =
      document.getElementById(d.pathId);

    if (!path) return;

    const len = path.getTotalLength();

    let off =
      (d.offset + relayAnimTime) % len;

    const pt = path.getPointAtLength(
      d.pathId.indexOf("in") !== -1
        ? (len - off)
        : off
    );

    d.el.setAttribute("cx", pt.x);
    d.el.setAttribute("cy", pt.y);

  });


  if (
    relayState === "on" ||
    relayState === "animating"
  ) {

    relayAnimId =
      requestAnimationFrame(animateRelayDots);

  }

}


/* Highlight step indicator */

function highlightStep(n) {

  for (let i = 1; i <= 5; i++) {

    const el = document.getElementById(
      "step-ind-" + i
    );

    if (el) {

      el.setAttribute(
        "fill",
        i <= n ? "#2563eb" : "#bbb"
      );

    }

  }

}


/* ACTIVATE RELAY â€” step by step */

async function activateRelay() {

  if (relayState !== "off") return;

  relayState = "animating";

  const btnOn =
    document.getElementById("btn-relay-on");

  const btnReset =
    document.getElementById("btn-relay-reset");

  btnOn.disabled = true;
  btnReset.disabled = true;


  /* STEP 1 â€” Current enters coil */

  document.getElementById("relay-step-text")
    .textContent =
      "Step 1: Current flows through the coil\u2026";

  highlightStep(1);

  document.getElementById(
    "relay-coil-dots"
  ).innerHTML = "";

  const dotsTop = createRelayDots(
    "relay-wire-p-top",
    "relay-coil-dots",
    8
  );

  const dotsBot = createRelayDots(
    "relay-wire-p-bot",
    "relay-coil-dots",
    8
  );

  relayCoilDots = dotsTop.concat(dotsBot);

  relayCoilDots.forEach(function (d) {
    d.el.setAttribute("opacity", "0.85");
  });

  relayAnimTime = 0;

  relayAnimId =
    requestAnimationFrame(animateRelayDots);

  await sleep(1400);


  /* STEP 2 â€” Magnetic field forms */

  document.getElementById("relay-step-text")
    .textContent =
      "Step 2: Electromagnetic field forms\u2026";

  highlightStep(2);

  document.getElementById("coil-glow-rect")
    .style.transition = "opacity 0.8s";

  document.getElementById("coil-glow-rect")
    .setAttribute("opacity", "0.3");

  const magLines = document.querySelectorAll(
    ".mag-field-line"
  );

  for (let i = 0; i < magLines.length; i++) {

    await sleep(350);
    magLines[i].classList.add("visible");

  }

  await sleep(1000);


  /* STEP 3 â€” Arm pulled down */

  document.getElementById("relay-step-text")
    .textContent =
      "Step 3: Magnetic field pulls the arm down\u2026";

  highlightStep(3);

  document.getElementById("armature-group")
    .style.transform = "rotate(22deg)";

  /* Hide the gap indicator */

  document.getElementById("contact-gap")
    .setAttribute("opacity", "0");

  await sleep(900);


  /* STEP 4 â€” Contact closes */

  document.getElementById("relay-step-text")
    .textContent =
      "Step 4: Contact closes \u2014 arm tip meets fixed contact.";

  highlightStep(4);

  document.getElementById("contact-bridge")
    .style.transition = "opacity 0.3s";

  document.getElementById("contact-bridge")
    .setAttribute("opacity", "1");

  await sleep(1000);


  /* STEP 5 â€” Secondary circuit completes */

  document.getElementById("relay-step-text")
    .textContent =
      "Step 5: Second circuit completes \u2014 bulb turns ON!";

  highlightStep(5);

  document.getElementById(
    "relay-sec-dots"
  ).innerHTML = "";

  const secIn = createRelayDots(
    "relay-wire-s-in",
    "relay-sec-dots",
    6
  );

  const secMid = createRelayDots(
    "relay-wire-s-mid",
    "relay-sec-dots",
    5
  );

  const secOut = createRelayDots(
    "relay-wire-s-out",
    "relay-sec-dots",
    5
  );

  relaySecDots = secIn.concat(secMid, secOut);

  relaySecDots.forEach(function (d) {
    d.el.setAttribute("opacity", "0.85");
  });

  /* Bulb ON */

  const rbFil = document.getElementById(
    "relay-bulb-filament"
  );

  rbFil.setAttribute("stroke", "#e8a020");
  rbFil.setAttribute("stroke-width", "2.5");
  rbFil.style.transition = "all 0.6s";

  document.getElementById("relay-bulb-glass")
    .setAttribute("fill", "#fff8e0");

  const rbHalo = document.getElementById(
    "relay-bulb-halo"
  );

  rbHalo.style.transition = "opacity 0.8s";
  rbHalo.setAttribute("opacity", "0.8");

  const rbRays = document.getElementById(
    "relay-light-rays"
  );

  rbRays.style.transition = "opacity 0.8s";
  rbRays.setAttribute("opacity", "1");


  /* Final status */

  document.getElementById("relay-status")
    .textContent =
      "RELAY ACTIVE \u2014 CONTACT CLOSED";

  relayState = "on";

  btnOn.disabled = true;
  btnReset.disabled = false;

}


/* RESET RELAY â€” reverse sequence */

async function resetRelay() {

  if (relayState !== "on") return;

  relayState = "animating";

  document.getElementById("btn-relay-reset")
    .disabled = true;


  /* Reverse step 5 */

  document.getElementById("relay-step-text")
    .textContent =
      "Resetting\u2026 Secondary circuit opening.";

  document.getElementById(
    "relay-sec-dots"
  ).innerHTML = "";

  relaySecDots = [];

  const rbFil = document.getElementById(
    "relay-bulb-filament"
  );

  rbFil.setAttribute("stroke", "#666");
  rbFil.setAttribute("stroke-width", "1.8");

  document.getElementById("relay-bulb-glass")
    .setAttribute("fill", "#fafafa");

  document.getElementById("relay-bulb-halo")
    .setAttribute("opacity", "0");

  document.getElementById("relay-light-rays")
    .setAttribute("opacity", "0");

  await sleep(700);


  /* Reverse step 4 */

  document.getElementById("relay-step-text")
    .textContent =
      "Resetting\u2026 Contact opening.";

  highlightStep(3);

  document.getElementById("contact-bridge")
    .setAttribute("opacity", "0");

  await sleep(500);


  /* Reverse step 3 */

  document.getElementById("relay-step-text")
    .textContent =
      "Resetting\u2026 Arm returning to rest.";

  highlightStep(2);

  document.getElementById("armature-group")
    .style.transform = "rotate(0deg)";

  document.getElementById("contact-gap")
    .setAttribute("opacity", "1");

  await sleep(700);


  /* Reverse step 2 */

  document.getElementById("relay-step-text")
    .textContent =
      "Resetting\u2026 Magnetic field fading.";

  highlightStep(1);

  const magLines = document.querySelectorAll(
    ".mag-field-line"
  );

  for (
    let i = magLines.length - 1;
    i >= 0;
    i--
  ) {

    magLines[i].classList.remove("visible");
    await sleep(250);

  }

  document.getElementById("coil-glow-rect")
    .setAttribute("opacity", "0");

  await sleep(500);


  /* Reverse step 1 */

  document.getElementById("relay-step-text")
    .textContent =
      "Resetting\u2026 Coil current stopping.";

  highlightStep(0);

  if (relayAnimId) {
    cancelAnimationFrame(relayAnimId);
  }

  document.getElementById(
    "relay-coil-dots"
  ).innerHTML = "";

  relayCoilDots = [];

  await sleep(400);


  /* Done */

  relayState = "off";

  document.getElementById("relay-status")
    .textContent = "COIL OFF \u2014 CONTACT OPEN";

  document.getElementById("relay-step-text")
    .textContent =
      "Press \u201cActivate Relay\u201d to see " +
      "the physical sequence.";

  document.getElementById("btn-relay-on")
    .disabled = false;

  document.getElementById("btn-relay-reset")
    .disabled = false;

}


/* =========================================================
   LOGIC GATES â€” INTERACTIVE (Slides 10-12)
   ========================================================= */

const gateState = {

  or: { a: false, b: false },

  and: { a: false, b: false },

  not: { a: false }

};


/* Unified toggle function */

function toggleGate(gate, input) {

  gateState[gate][input] =
    !gateState[gate][input];

  updateGate(gate);

}


/* =========================================================
   CURRENT FLOW CONTROL
   Turns the dashed overlay paths on only where real
   current would actually be flowing.
   ========================================================= */

function setFlow(id, on) {

  const el = document.getElementById(id);

  if (!el) return;

  if (on) {

    el.classList.add("flowing");

  } else {

    el.classList.remove("flowing");

  }

}


/* Master update â€” drives ALL visuals */

function updateGate(gate) {

  const s = gateState[gate];


  if (gate === "or") {

    updateRelay("or", "a", s.a);
    updateRelay("or", "b", s.b);

    const output = s.a || s.b;

    updateBulb("or", output);
    updateTruthTable(
      "or", s.a, s.b, output
    );

    /* Status text */

    const st =
      document.getElementById("or-status");

    if (!s.a && !s.b) {
      st.textContent =
        "Both switches OFF \u2192 Bulb OFF";
    } else if (s.a && s.b) {
      st.textContent =
        "Both switches ON \u2192 Bulb ON";
    } else {
      const which = s.a ? "A" : "B";
      st.textContent =
        "Switch " + which +
        " ON \u2192 Bulb ON (either is enough)";
    }

    /* Buttons */

    updateBtn("or", "a", s.a);
    updateBtn("or", "b", s.b);

    /* Current flow â€” either branch completes the circuit */

    /* Current flow - each relay drives its own coil circuit,
       and its output circuit only carries current once its
       contact has actually closed. Either branch reaching the
       merge point is enough to light the bulb. */

    setFlow("or-flow-in-a", s.a);
    setFlow("or-flow-coil-a", s.a);
    setFlow("or-flow-v-a", s.a);
    setFlow("or-flow-arm-a", s.a);
    setFlow("or-flow-a-out", s.a);

    setFlow("or-flow-in-b", s.b);
    setFlow("or-flow-coil-b", s.b);
    setFlow("or-flow-v-b", s.b);
    setFlow("or-flow-arm-b", s.b);
    setFlow("or-flow-b-out", s.b);

    /* Bulb feed, then the bulb return wire to ground */
    setFlow("or-flow-bulb", output);


  } else if (gate === "and") {

    updateRelay("and", "a", s.a);
    updateRelay("and", "b", s.b);

    const output = s.a && s.b;

    updateBulb("and", output);
    updateTruthTable(
      "and", s.a, s.b, output
    );

    const st =
      document.getElementById("and-status");

    if (s.a && s.b) {
      st.textContent =
        "Both switches ON \u2192 Bulb ON";
    } else if (!s.a && !s.b) {
      st.textContent =
        "Both switches OFF \u2192 Bulb OFF";
    } else {
      const which = s.a ? "A" : "B";
      const other = s.a ? "B" : "A";
      st.textContent =
        "Switch " + which + " ON but " +
        other + " OFF \u2192 Bulb OFF";
    }

    updateBtn("and", "a", s.a);
    updateBtn("and", "b", s.b);

    /* Current flow â€” the series link and the bulb
       only carry current when BOTH contacts close */

    /* Current flow - the link between the two armature
       outputs only carries current when BOTH contacts
       close, so the bulb and its return wire stay dark
       unless both switches are on. */

    setFlow("and-flow-in-a", s.a);
    setFlow("and-flow-coil-a", s.a);
    setFlow("and-flow-v-a", s.a);
    setFlow("and-flow-arm-a", s.a);

    /* Current leaves A and runs up to contact B */
    setFlow("and-flow-series", s.a);

    setFlow("and-flow-in-b", s.b);
    setFlow("and-flow-coil-b", s.b);

    /* Contact B, armature B, bulb feed and bulb return */
    setFlow("and-flow-b-contact", output);
    setFlow("and-flow-bulb", output);


  } else if (gate === "not") {

    updateNotRelay(s.a);

    const output = !s.a;

    updateBulb("not", output);
    updateNotTruthTable(s.a);

    const st =
      document.getElementById("not-status");

    if (s.a) {
      st.textContent =
        "Switch ON \u2192 Bulb OFF (inverted!)";
    } else {
      st.textContent =
        "Switch OFF \u2192 Bulb ON (inverted!)";
    }

    updateBtn("not", "a", s.a);

    /* Current flow â€” the current takes whichever
       contact the arm is actually resting on */

    /* Current flow - the coil circuit is live while the
       switch is closed; the output circuit is live only
       while the armature rests on the supplied upper
       contact. The two are never live at the same time. */

    setFlow("not-flow-in", s.a);
    setFlow("not-flow-coil", s.a);

    setFlow("not-flow-upper", !s.a);

  }

}


/* Update a standard relay unit */

function updateRelay(gate, id, on) {

  const prefix = gate + "-";

  /* Switch visual */

  const swOpen = document.getElementById(
    prefix + "sw-" + id + "-open"
  );

  const swClosed = document.getElementById(
    prefix + "sw-" + id + "-closed"
  );

  if (swOpen) {
    swOpen.setAttribute(
      "opacity", on ? "0" : "1"
    );
  }

  if (swClosed) {
    swClosed.setAttribute(
      "opacity", on ? "1" : "0"
    );
  }


  /* Coil glow */

  const glow = document.getElementById(
    prefix + "coil-" + id + "-glow"
  );

  if (glow) {

    glow.style.transition = "opacity 0.3s";

    glow.setAttribute(
      "opacity", on ? "0.35" : "0"
    );

  }


  /* Arm rotation.
     The armature is hinged on the right and its free (left)
     end is pulled DOWN onto the fixed contact, so a negative
     rotation closes the contact. */

  const arm = document.getElementById(
    prefix + "arm-" + id
  );

  if (arm) {
    arm.style.transform =
      on ? "rotate(-22deg)" : "rotate(0deg)";
  }


  /* Contact bridge */

  const bridge = document.getElementById(
    prefix + "bridge-" + id
  );

  if (bridge) {

    bridge.style.transition = "opacity 0.3s";

    bridge.setAttribute(
      "opacity", on ? "1" : "0"
    );

  }

}


/* Update NOT gate relay (special double-throw) */

function updateNotRelay(on) {

  /* Switch */

  const swOpen = document.getElementById(
    "not-sw-a-open"
  );

  const swClosed = document.getElementById(
    "not-sw-a-closed"
  );

  swOpen.setAttribute(
    "opacity", on ? "0" : "1"
  );

  swClosed.setAttribute(
    "opacity", on ? "1" : "0"
  );


  /* Coil glow */

  const glow = document.getElementById(
    "not-coil-glow"
  );

  glow.style.transition = "opacity 0.3s";

  glow.setAttribute(
    "opacity", on ? "0.35" : "0"
  );


  /* Arm â€” swings down from the upper (NC) contact,
     which carries the supply, to the lower (NO)
     dead end. Drawn resting on the upper contact,
     so the energised position is a negative turn. */

  const arm = document.getElementById(
    "not-arm"
  );

  if (on) {

    arm.style.transform = "rotate(-44deg)";

  } else {

    arm.style.transform = "rotate(0deg)";

  }


  /* Contact bridges */

  const upper = document.getElementById(
    "not-bridge-upper"
  );

  const lower = document.getElementById(
    "not-bridge-lower"
  );

  upper.style.transition = "opacity 0.3s";
  lower.style.transition = "opacity 0.3s";

  upper.setAttribute(
    "opacity", on ? "0" : "1"
  );

  lower.setAttribute(
    "opacity", on ? "1" : "0"
  );

}


/* Update bulb visuals */

function updateBulb(gate, on) {

  const prefix = gate + "-bulb-";

  const glass = document.getElementById(
    prefix + "glass"
  );

  const filament = document.getElementById(
    prefix + "filament"
  );

  const halo = document.getElementById(
    prefix + "halo"
  );

  const rays = document.getElementById(
    gate + "-light-rays"
  );

  if (glass) {
    glass.setAttribute(
      "fill", on ? "#fff8e0" : "#fafafa"
    );
  }

  if (filament) {

    filament.setAttribute(
      "stroke", on ? "#e8a020" : "#666"
    );

    filament.setAttribute(
      "stroke-width", on ? "2" : "1.5"
    );

  }

  if (halo) {

    halo.style.transition = "opacity 0.5s";

    halo.setAttribute(
      "opacity", on ? "0.7" : "0"
    );

  }

  if (rays) {

    rays.style.transition = "opacity 0.5s";

    rays.setAttribute(
      "opacity", on ? "1" : "0"
    );

  }

}


/* Update toggle button */

function updateBtn(gate, id, on) {

  const btn = document.getElementById(
    "btn-" + gate + "-" + id
  );

  if (!btn) return;

  btn.textContent =
    id.toUpperCase() + " = " +
    (on ? "ON" : "OFF");

  if (on) {
    btn.classList.add("on");
  } else {
    btn.classList.remove("on");
  }

}


/* Update truth table highlighting for OR/AND */

function updateTruthTable(gate, a, b) {

  const rowKey =
    (a ? "1" : "0") + (b ? "1" : "0");

  const rows = ["00", "01", "10", "11"];

  rows.forEach(function (key) {

    const row = document.getElementById(
      gate + "-row-" + key
    );

    if (row) {

      if (key === rowKey) {
        row.classList.add("active-row");
      } else {
        row.classList.remove("active-row");
      }

    }

  });

}


/* Update truth table for NOT */

function updateNotTruthTable(a) {

  const row0 = document.getElementById(
    "not-row-0"
  );

  const row1 = document.getElementById(
    "not-row-1"
  );

  if (a) {
    row0.classList.remove("active-row");
    row1.classList.add("active-row");
  } else {
    row0.classList.add("active-row");
    row1.classList.remove("active-row");
  }

}