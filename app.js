/* =========================================================
   POWERPOINT PRESENTATION CONTROLLER
   ========================================================= */

const slides = Array.from(
  document.querySelectorAll(".slide")
);

let currentSlide = 0;


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

  });


  currentSlide = index;

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


    /* THEME */

    if (
      event.key === "t" ||
      event.key === "T"
    ) {

      event.preventDefault();

      toggleTheme();

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
   ========================================================= */

function toggleTheme() {

  document.body.classList.toggle("dark");

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

showSlide(0);


/* =========================================================
   HELP PANEL
   ========================================================= */

const helpButton =
  document.getElementById("help-button");

const keyboardHelp =
  document.getElementById("keyboard-help");

const closeHelp =
  document.getElementById("close-help");


function openHelp() {

  keyboardHelp.classList.add("active");

  keyboardHelp.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeHelpPanel() {

  keyboardHelp.classList.remove("active");

  keyboardHelp.setAttribute(
    "aria-hidden",
    "true"
  );

}


helpButton.addEventListener(
  "click",
  openHelp
);


closeHelp.addEventListener(
  "click",
  closeHelpPanel
);


/* Click outside */

keyboardHelp.addEventListener(
  "click",
  function (event) {

    if (event.target === keyboardHelp) {

      closeHelpPanel();

    }

  }
);


/* Escape */

document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Escape" &&
      keyboardHelp.classList.contains("active")
    ) {

      closeHelpPanel();

    }

  }
);


/* =========================================================
   BULB CIRCUIT — INTERACTIVE (Slide 6)
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


/* Animate dots — electrons move − to + */

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
    .textContent = "Circuit CLOSED — Bulb ON";

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
    .textContent = "Circuit OPEN — Bulb OFF";

  document.getElementById("btn-on")
    .classList.remove("active");

  document.getElementById("btn-off")
    .classList.add("active");

}


/* =========================================================
   RELAY — INTERACTIVE (Slide 8)
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


/* Create dots — does NOT clear container */

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


/* ACTIVATE RELAY — step by step */

async function activateRelay() {

  if (relayState !== "off") return;

  relayState = "animating";

  const btnOn =
    document.getElementById("btn-relay-on");

  const btnReset =
    document.getElementById("btn-relay-reset");

  btnOn.disabled = true;
  btnReset.disabled = true;


  /* STEP 1 — Current enters coil */

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


  /* STEP 2 — Magnetic field forms */

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


  /* STEP 3 — Arm pulled down */

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


  /* STEP 4 — Contact closes */

  document.getElementById("relay-step-text")
    .textContent =
      "Step 4: Contact closes \u2014 arm tip meets fixed contact.";

  highlightStep(4);

  document.getElementById("contact-bridge")
    .style.transition = "opacity 0.3s";

  document.getElementById("contact-bridge")
    .setAttribute("opacity", "1");

  await sleep(1000);


  /* STEP 5 — Secondary circuit completes */

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


/* RESET RELAY — reverse sequence */

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