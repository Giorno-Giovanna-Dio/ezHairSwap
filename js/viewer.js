import * as THREE from "three";
import { t } from "./i18n.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

function meshBox(object) {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3();
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry?.computeBoundingBox();
    if (!child.geometry?.boundingBox) return;
    const next = child.geometry.boundingBox.clone();
    next.applyMatrix4(child.matrixWorld);
    box.union(next);
  });
  if (box.isEmpty()) box.setFromObject(object);
  return box;
}

function frameObject(object, camera, controls) {
  const first = meshBox(object);
  const size = first.getSize(new THREE.Vector3());
  const target = 2.2;
  const scale = target / Math.max(size.y, 0.0001);
  object.scale.multiplyScalar(scale);

  const box = meshBox(object);
  const sized = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);

  const height = sized.y;
  const fit = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
  const dist = fit * 0.62;
  camera.position.set(dist * 0.06, height * 0.02, dist);
  camera.near = dist / 80;
  camera.far = dist * 40;
  camera.updateProjectionMatrix();
  controls.target.set(0, height * 0.06, 0);
  controls.minDistance = dist * 0.55;
  controls.maxDistance = dist * 3;
  controls.update();
}

function showFallback(canvas, ui, status) {
  if (canvas) canvas.hidden = true;
  if (status) status.textContent = t("model.webgl");
  const bar = ui?.querySelector(".bar");
  if (bar) bar.hidden = true;
}

export function createViewer({ canvas, status, bar, ui, reset, src }) {
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
  } catch {
    showFallback(canvas, ui, status);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6;

  scene.add(new THREE.AmbientLight(0xfff4e8, 0.85));
  const key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(2.2, 3.4, 2.8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffc9a3, 0.55);
  fill.position.set(-2.4, 1.2, -1.6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c2, 0.4);
  rim.position.set(0.2, 1.8, -2.8);
  scene.add(rim);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(1, 64),
    new THREE.MeshStandardMaterial({
      color: 0xf3ead8,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const resize = () => {
    const width = canvas.clientWidth || canvas.parentElement.clientWidth;
    const height = canvas.clientHeight || 640;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  };

  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

  const loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  loader.load(
    src,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      scene.add(model);
      resize();
      frameObject(model, camera, controls);
      controls.saveState();
      const framed = meshBox(model);
      ground.position.y = framed.min.y;
      const framedSize = framed.getSize(new THREE.Vector3());
      ground.scale.setScalar(Math.max(framedSize.x, framedSize.z) * 0.85);
      ui?.classList.add("is-ready");
    },
    (event) => {
      if (!event.total) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      if (status) status.textContent = t("model.loadingPct", { pct });
      if (bar) bar.style.width = `${Math.max(8, pct)}%`;
    },
    () => {
      if (status) status.textContent = t("model.fail");
    },
  );

  reset?.addEventListener("click", () => {
    controls.reset();
    controls.autoRotate = true;
  });

  const tick = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  window.addEventListener("resize", resize);
  resize();
  tick();
}
