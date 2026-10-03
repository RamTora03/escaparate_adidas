import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import gsap from 'gsap';

const CRISTAL_PROYECTA_SOMBRA = false;

const canvas = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111216);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.2, 7.5);

const controles = new OrbitControls(camera, renderer.domElement);
controles.enableDamping = true;
controles.target.set(0, 0.5, 0);
controles.addEventListener('change', () => {
  controles.target.y = 0.5;
  camera.position.y = 1.2;
});
controles.update();

scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x2a2a2e, 0.5));

const luzSol = new THREE.DirectionalLight(0xfff1dd, 2.5);
luzSol.position.set(4, 3.5, 8);
luzSol.target.position.set(0, -0.5, 0);
scene.add(luzSol.target);
luzSol.castShadow = true;
luzSol.shadow.mapSize.set(2048, 2048);
luzSol.shadow.camera.near = 1;
luzSol.shadow.camera.far = 25;
luzSol.shadow.camera.left = -7;
luzSol.shadow.camera.right = 7;
luzSol.shadow.camera.top = 7;
luzSol.shadow.camera.bottom = -7;
luzSol.shadow.bias = -0.0004;
luzSol.shadow.normalBias = 0.02;
scene.add(luzSol);

const luzFoco = new THREE.SpotLight(0xffffff, 28, 12, Math.PI / 6, 0.5, 2);
luzFoco.position.set(0.8, 2.3, 1.2);
luzFoco.target.position.set(0.8, -0.6, -0.1);
scene.add(luzFoco.target);
luzFoco.castShadow = true;
luzFoco.shadow.mapSize.set(2048, 2048);
luzFoco.shadow.camera.near = 0.5;
luzFoco.shadow.camera.far = 8;
luzFoco.shadow.bias = -0.0003;
luzFoco.shadow.normalBias = 0.02;
scene.add(luzFoco);

const luzPuntual = new THREE.PointLight(0x2f56ff, 20, 15, 2);
luzPuntual.position.set(-2, 1.5, 1.5);
luzPuntual.castShadow = true;
luzPuntual.shadow.mapSize.set(1024, 1024);
luzPuntual.shadow.camera.near = 0.3;
luzPuntual.shadow.camera.far = 15;
luzPuntual.shadow.bias = -0.001;
luzPuntual.shadow.normalBias = 0.02;
scene.add(luzPuntual);

const textureLoader = new THREE.TextureLoader();

function configurarTexturaConcreto(tex) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

const texturaConcreto = configurarTexturaConcreto(
  textureLoader.load('/textures/concrete_floor_worn_001_diff_4k.jpg')
);

const matStandardPiso = new THREE.MeshStandardMaterial({
  map: texturaConcreto,
  color: 0xffffff,
  roughness: 0.9,
  metalness: 0.0
});
const matMetalNegro = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.4, metalness: 0.8 });

const matCristal = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 1.0,
  roughness: 0.0,
  metalness: 0.1,
  transmission: 0.95,
  ior: 1.5,
  thickness: 0.2,
  depthWrite: false
});

const matToon = new THREE.MeshToonMaterial({ color: 0xff3366 });

const matPhong = new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 80 });

const matBasic = new THREE.MeshBasicMaterial({ color: 0x00129b, wireframe: true });

function aplicarSombras(objeto, { proyecta = true, recibe = true } = {}) {
  objeto.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = proyecta;
      o.receiveShadow = recibe;
    }
  });
}

const piso = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 6), matStandardPiso);
piso.position.set(0, -2, 0);
aplicarSombras(piso);
scene.add(piso);

const paredTrasera = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 5),
  new THREE.MeshStandardMaterial({ color: 0xCDDC39, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide })
);
paredTrasera.position.set(0, 0.5, -3);
aplicarSombras(paredTrasera);
scene.add(paredTrasera);

const marquesina = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 6.2), matMetalNegro);
marquesina.position.set(0, 3.1, 0);
aplicarSombras(marquesina);
scene.add(marquesina);

[[-3.9, 2.9], [3.9, 2.9], [-3.9, -2.9], [3.9, -2.9]].forEach(([x, z]) => {
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5, 0.25), matMetalNegro);
  col.position.set(x, 0.5, z);
  aplicarSombras(col);
  scene.add(col);
});

const cristalFrontal = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.8), matCristal);
cristalFrontal.position.set(0, 0.5, 2.95);
aplicarSombras(cristalFrontal, { proyecta: CRISTAL_PROYECTA_SOMBRA, recibe: true });
scene.add(cristalFrontal);

const cristalDerecho = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.8), matCristal);
cristalDerecho.rotation.y = -Math.PI / 2;
cristalDerecho.position.set(3.9, 0.5, 0);
aplicarSombras(cristalDerecho, { proyecta: CRISTAL_PROYECTA_SOMBRA, recibe: true });
scene.add(cristalDerecho);

for (let i = -2.5; i <= 2.5; i += 1.25) {
  const marco = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.8, 0.08), matMetalNegro);
  marco.position.set(i, 0.5, 2.96);
  aplicarSombras(marco);
  scene.add(marco);
}

const datosPodios = [
  { y: -1, mat: matBasic },
  { y: -1.4, mat: matToon },
  { y: -1.8, mat: matPhong }
];

const podiosGenerados = datosPodios.map(p => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 32), p.mat);
  mesh.position.set(0.7, p.y, -0.1);
  aplicarSombras(mesh);
  mesh.userData = { interactivo: true };
  scene.add(mesh);
  return mesh;
});

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);

let zapatoGroup = null;

loader.load('/3d_model/adidas_logo.glb', (gltf) => {
  const logo = gltf.scene;
  const box = new THREE.Box3().setFromObject(logo);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  logo.position.sub(center);
  logo.scale.setScalar(2.2 / Math.max(size.x, 0.001));
  logo.position.set(0, 1, -2.85);
  logo.rotation.set(Math.PI / 2, 0, 0);

  aplicarSombras(logo);
  scene.add(logo);
});

loader.load('/3d_model/balenciaga_adidas_hoodie.glb', (gltf) => {
  const mani = gltf.scene;
  mani.scale.setScalar(2);
  mani.position.set(-1.5, -1.9, -0.5);
  mani.rotation.y = Math.PI / 6;

  aplicarSombras(mani);
  mani.userData = { interactivo: true };
  scene.add(mani);
});

loader.load('/3d_model/shoes_adidas.glb', (gltf) => {
  const zapatoMesh = gltf.scene;
  const box = new THREE.Box3().setFromObject(zapatoMesh);
  zapatoMesh.position.sub(box.getCenter(new THREE.Vector3()));

  zapatoGroup = new THREE.Group();
  zapatoGroup.add(zapatoMesh);
  zapatoGroup.scale.setScalar(5);
  zapatoGroup.position.set(0.8, 0.2, 0);

  aplicarSombras(zapatoGroup);
  zapatoGroup.userData = { interactivo: true };
  scene.add(zapatoGroup);
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let targetRotationX = 0;
let targetRotationY = 0;

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  targetRotationY = mouse.x * 0.5;
  targetRotationX = mouse.y * 0.3;

  raycaster.setFromCamera(mouse, camera);
  const inter = raycaster.intersectObjects(scene.children, true).find(
    i => i.object.userData.interactivo || i.object.parent?.userData.interactivo
  );

  document.body.style.cursor = inter ? 'pointer' : 'default';
});

window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const inter = raycaster.intersectObjects(scene.children, true).find(
    i => i.object.userData.interactivo || i.object.parent?.userData.interactivo
  );

  if (inter && zapatoGroup) {
    gsap.to(zapatoGroup.rotation, {
      y: zapatoGroup.rotation.y + Math.PI * 2,
      duration: 1,
      ease: 'power2.out'
    });
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    gsap.to(paredTrasera.material.color, {
      r: Math.random(), g: Math.random(), b: Math.random(), duration: 0.5
    });
  }
  if (e.key.toLowerCase() === 'r') {
    gsap.to(camera.position, { x: 0, y: 1.2, z: 7.5, duration: 1 });
    controles.target.set(0, 0.5, 0);
  }
});

const reloj = new THREE.Clock();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  const t = reloj.getElapsedTime();

  if (zapatoGroup) {
    zapatoGroup.position.y = 0.2 + Math.sin(t * 2) * 0.15;
    zapatoGroup.rotation.y += 0.01;

    zapatoGroup.rotation.x += (targetRotationX - zapatoGroup.rotation.x) * 0.05;
    zapatoGroup.rotation.z += (targetRotationY * 0.2 - zapatoGroup.rotation.z) * 0.05;
  }

  podiosGenerados.forEach((p, i) => p.rotation.y = t * (0.5 + i * 0.2));
  controles.update();
  renderer.render(scene, camera);
});