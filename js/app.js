import { createViewer } from "./viewer.js";

const VIEWS = [
  {
    src: "./swap-img-result/crop/01_front.png",
    alt: "換髮結果，正面",
  },
  {
    src: "./swap-img-result/crop/02_left_45.png",
    alt: "換髮結果，左 45 度",
  },
  {
    src: "./swap-img-result/crop/03_right_45.png",
    alt: "換髮結果，右 45 度",
  },
  {
    src: "./swap-img-result/crop/04_back.png",
    alt: "換髮結果，背面",
  },
];

function setupTurntable(root) {
  const image = root.querySelector("[data-view]");
  const stage = root.querySelector("[data-stage]");
  const buttons = [...root.querySelectorAll("[data-angle]")];
  const autoBox = root.querySelector("[data-auto]");
  let index = 0;
  let timer = 0;

  const show = (next) => {
    index = (next + VIEWS.length) % VIEWS.length;
    const view = VIEWS[index];
    image.src = view.src;
    image.alt = view.alt;
    buttons.forEach((button, i) => {
      const on = i === index;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-selected", String(on));
    });
  };

  const play = () => {
    window.clearInterval(timer);
    if (!autoBox.checked) return;
    timer = window.setInterval(() => show(index + 1), 1400);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      show(Number(button.dataset.angle));
      play();
    });
  });

  autoBox.addEventListener("change", play);

  let drag = null;
  const start = (x) => {
    drag = { x, index };
    stage.classList.add("is-drag");
    autoBox.checked = false;
    play();
  };
  const move = (x) => {
    if (!drag) return;
    const step = Math.round((drag.x - x) / 72);
    show(drag.index + step);
  };
  const end = () => {
    drag = null;
    stage.classList.remove("is-drag");
  };

  stage.addEventListener("pointerdown", (event) => {
    stage.setPointerCapture(event.pointerId);
    start(event.clientX);
  });
  stage.addEventListener("pointermove", (event) => move(event.clientX));
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      show(index + 1);
      play();
    }
    if (event.key === "ArrowLeft") {
      show(index - 1);
      play();
    }
  });

  VIEWS.forEach(({ src }) => {
    const preload = new Image();
    preload.src = src;
  });

  play();
}

const table = document.querySelector("[data-turntable]");
if (table) setupTurntable(table);

const modelSection = document.querySelector("#model");
const modelToggle = document.querySelector("[data-model-toggle]");
let viewerReady = false;

function ensureViewer() {
  if (viewerReady) return;
  viewerReady = true;
  createViewer({
    canvas: document.querySelector("#view"),
    status: document.querySelector("[data-status]"),
    bar: document.querySelector("[data-bar]"),
    ui: document.querySelector("[data-viewer-ui]"),
    reset: document.querySelector("[data-reset]"),
    src: "./3d-model/bust.glb",
  });
}

function setModelOpen(open) {
  if (!modelSection || !modelToggle) return;
  modelSection.hidden = !open;
  modelToggle.textContent = open ? "收起 3D 人像" : "展開 3D 人像";
  modelToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    ensureViewer();
    modelSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

modelToggle?.addEventListener("click", () => {
  setModelOpen(modelSection.hidden);
});

