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
   Removed: on-screen UI controls are hidden so the deck
   behaves like native PowerPoint (keyboard / click only).
   ========================================================= */


/* =========================================================
   CLICK-TO-ADVANCE (PowerPoint behaviour)
   Clicks anywhere on the deck move to the next slide,
   but interactive controls keep their own click behaviour.
   ========================================================= */

// const deck = document.getElementById("deck");

// deck.addEventListener(
//   "click",
//   function (event) {

//     /* Let real controls handle their own clicks */

//     if (
//       event.target.closest("button") ||
//       event.target.closest("a")
//     ) {

//       return;

//     }

//     nextSlide();

//   }
// );


// /* Right click / left third goes back, like a presenter remote */

// deck.addEventListener(
//   "contextmenu",
//   function (event) {

//     event.preventDefault();  

//     previousSlide();

//   }
// );


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


/* =========================================================
   LOGIC GATES — INTERACTIVE (Slides 10-12)
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


/* Master update — drives ALL visuals */

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

    /* Current flow — either branch completes the circuit */

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

    /* Current flow — the series link and the bulb
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

    /* Current flow — the current takes whichever
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


  /* Arm — swings down from the upper (NC) contact,
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