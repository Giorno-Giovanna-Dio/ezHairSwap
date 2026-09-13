import { createViewer } from "./viewer.js";
import { initI18n, t } from "./i18n.js";

initI18n();

const VIEW_KEYS = [
  "look.alt.front",
  "look.alt.left",
  "look.alt.right",
  "look.alt.back",
];

const VIEW_SRC = [
  "./swap-img-result/crop/01_front.png",
  "./swap-img-result/crop/02_left_45.png",
  "./swap-img-result/crop/03_right_45.png",
  "./swap-img-result/crop/04_back.png",
];

function views() {
  return VIEW_KEYS.map((key, i) => ({
    src: VIEW_SRC[i],
    alt: t(key),
  }));
}

function setupTurntable(root) {
  const image = root.querySelector("[data-view]");
  const stage = root.querySelector("[data-stage]");
  const buttons = [...root.querySelectorAll("[data-angle]")];
  const autoBox = root.querySelector("[data-auto]");
  let index = 0;
  let timer = 0;

  const show = (next) => {
    const list = views();
    index = (next + list.length) % list.length;
    const view = list[index];
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

  VIEW_SRC.forEach((src) => {
    const preload = new Image();
    preload.src = src;
  });

  document.addEventListener("langchange", () => show(index));
  play();
}

const table = document.querySelector("[data-turntable]");
if (table) setupTurntable(table);

const modelSection = document.querySelector("#model");
const modelToggle = document.querySelector("[data-model-toggle]");
let viewerReady = false;
let modelOpen = false;

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
  modelOpen = open;
  modelSection.hidden = !open;
  modelToggle.textContent = t(open ? "foot.modelCollapse" : "foot.modelExpand");
  modelToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    ensureViewer();
    modelSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

modelToggle?.addEventListener("click", () => {
  setModelOpen(modelSection.hidden);
});

document.addEventListener("langchange", () => {
  if (modelToggle) {
    modelToggle.textContent = t(modelOpen ? "foot.modelCollapse" : "foot.modelExpand");
  }
});
