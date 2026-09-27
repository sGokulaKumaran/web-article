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