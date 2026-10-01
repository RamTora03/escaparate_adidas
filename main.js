import './style.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import * as THREE from 'three';
import gsap from 'gsap';

// ========== RENDERIZADOR Y ESCENA ==========
const canvas = document.getElementById('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// Habilitar sombras proyectadas en el renderizador
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111216);

// Mapa de entorno procedural para reflejos fotorrealistas en el vidrio
const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.2, 7.5);

// ========== CÁMARA CON BLOQUEO EN Y ==========
const controles = new OrbitControls(camera, renderer.domElement);
controles.enableDamping = true;
controles.target.set(0, 0.5, 0);
controles.addEventListener('change', () => {
  controles.target.y = 0.5;
  camera.position.y = 1.2;
});
controles.update();

// ========== ILUMINACIÓN Y SOMBRAS ==========
scene.add(new THREE.AmbientLight(0xffffff, 0.8)); // Luz ambiente

const luz = new THREE.PointLight(0x00129b, 2.5, 20); // Luz azul Adidas
luz.position.set(-2, 2, 2);
luz.castShadow = true; // Emitir sombras
luz.shadow.mapSize.width = 1024;
luz.shadow.mapSize.height = 1024;
luz.shadow.bias = -0.001;
scene.add(luz);

// ========== TEXTURAS Y MATERIALES ==========
// Textura concreto procedural
const canvasConcreto = document.createElement('canvas');
canvasConcreto.width = canvasConcreto.height = 256;
const ctx = canvasConcreto.getContext('2d');
ctx.fillStyle = '#2b2c30';
ctx.fillRect(0, 0, 256, 256);
for (let i = 0; i < 4000; i++) {
  const x = Math.random() * 256, y = Math.random() * 256;
  ctx.fillStyle = `rgba(${Math.random() * 50},${Math.random() * 50},${Math.random() * 50},0.12)`;
  ctx.fillRect(x, y, 2, 2);
}
const texturaConcreto = new THREE.CanvasTexture(canvasConcreto);
texturaConcreto.wrapS = texturaConcreto.wrapT = THREE.RepeatWrapping;
texturaConcreto.repeat.set(4, 4);

// Implementación de los 5 materiales de la rúbrica
const matStandard = new THREE.MeshStandardMaterial({ map: texturaConcreto, roughness: 0.85 });
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
const matBasic = new THREE.MeshBasicMaterial({ color: 0x00129b, wireframe: true });
const matPhong = new THREE.MeshPhongMaterial({ color: 0x888899, shininess: 80 });

// ========== ESTRUCTURA KIOSCO ==========
const piso = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 6), matStandard);
piso.position.set(0, -2, 0);
piso.receiveShadow = true; // Recibir sombras
scene.add(piso);

// Pared trasera
const paredTrasera = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 5), 
  new THREE.MeshStandardMaterial({ color: 0xCDDC39, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide })
);
paredTrasera.position.set(0, 0.5, -3);
paredTrasera.receiveShadow = true;
scene.add(paredTrasera);

const marquesina = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 6.2), matMetalNegro);
marquesina.position.set(0, 3.1, 0);
scene.add(marquesina);

// Columnas
[[-3.9, 2.9], [3.9, 2.9], [-3.9, -2.9], [3.9, -2.9]].forEach(([x, z]) => {
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5, 0.25), matMetalNegro);
  col.position.set(x, 0.5, z);
  col.castShadow = true;
  col.receiveShadow = true;
  scene.add(col);
});

const cristalFrontal = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.8), matCristal);
cristalFrontal.position.set(0, 0.5, 2.95);
scene.add(cristalFrontal);

// Marcos cristal frontal
for (let i = -2.5; i <= 2.5; i += 1.25) {
  const marco = new THREE.Mesh(new THREE.BoxGeometry(0.06, 4.8, 0.08), matMetalNegro);
  marco.position.set(i, 0.5, 2.96);
  scene.add(marco);
}

const cristalDerecho = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.8), matCristal);
cristalDerecho.rotation.y = -Math.PI / 2;
cristalDerecho.position.set(3.9, 0.5, 0);
scene.add(cristalDerecho);

// ========== PODIOS ==========
const datosPodios = [
  { y: -1, mat: matBasic },   // Medio
  { y: -1.4, mat: matToon }   // Abajo
];

const podiosGenerados = datosPodios.map(p => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 32), p.mat);
  mesh.position.set(0.7, p.y, -0.1);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { interactivo: true };
  scene.add(mesh);
  return mesh;
});

// ========== CARGADOR MODELOS ==========
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);

let zapatoGroup = null;

// Logo Adidas
loader.load('/3d_model/adidas_logo.glb', (gltf) => {
  const logo = gltf.scene;
  const box = new THREE.Box3().setFromObject(logo);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  logo.position.sub(center);
  logo.scale.setScalar(2.2 / Math.max(size.x, 0.001));
  logo.position.set(0, 1, -2.85);
  logo.rotation.set(Math.PI/2, 0, 0);
  logo.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
    }
  });
  scene.add(logo);
});

// Maniquí
loader.load('/3d_model/balenciaga_adidas_hoodie.glb', (gltf) => {
  const mani = gltf.scene;
  mani.scale.setScalar(2);
  mani.position.set(-1.5, -1.9, -0.5);
  mani.rotation.y = Math.PI / 6;
  mani.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      c.userData = { interactivo: true };
    }
  });
  scene.add(mani);
});

// Zapato
loader.load('/3d_model/shoes_adidas.glb', (gltf) => {
  const zapatoMesh = gltf.scene;
  const box = new THREE.Box3().setFromObject(zapatoMesh);
  zapatoMesh.position.sub(box.getCenter(new THREE.Vector3()));
  
  zapatoGroup = new THREE.Group();
  zapatoGroup.add(zapatoMesh);
  zapatoGroup.scale.setScalar(5);
  zapatoGroup.position.set(0.8, 0.2, 0);
  
  zapatoGroup.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
      c.userData = { interactivo: true };
    }
  });
  scene.add(zapatoGroup);
});

// ========== INTERACCIÓN Y RAYCASTER ==========
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let targetRotationX = 0;
let targetRotationY = 0;

// Evento Mousemove (Hover)
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

// Evento Click (Detección por Raycaster para animación GSAP)
window.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, camera);
  const inter = raycaster.intersectObjects(scene.children, true).find(
    i => i.object.userData.interactivo || i.object.parent?.userData.interactivo
  );

  if (inter && zapatoGroup) {
    // Giro rápido de 360° con GSAP al hacer clic en un objeto interactivo
    gsap.to(zapatoGroup.rotation, { 
      y: zapatoGroup.rotation.y + Math.PI * 2, 
      duration: 1, 
      ease: 'power2.out' 
    });
  }
});

// Evento Teclado
window.addEventListener('keydown', (e) => {
  // Tecla Space: cambiar color de la pared
  if (e.code === 'Space') {
    gsap.to(paredTrasera.material.color, { 
      r: Math.random(), g: Math.random(), b: Math.random(), duration: 0.5 
    });
  }
  // Tecla R: reiniciar cámara
  if (e.key.toLowerCase() === 'r') {
    gsap.to(camera.position, { x: 0, y: 1.2, z: 7.5, duration: 1 });
    controles.target.set(0, 0.5, 0);
  }
});

// ========== LOOP ANIMACIÓN ==========
const reloj = new THREE.Clock();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  const t = reloj.getElapsedTime();

  if (zapatoGroup) {
    // Flotación en Y
    zapatoGroup.position.y = 0.2 + Math.sin(t * 2) * 0.15;

    // Rotación continua
    zapatoGroup.rotation.y += 0.01; 

    // Inclinación por cursor (LERP)
    zapatoGroup.rotation.x += (targetRotationX - zapatoGroup.rotation.x) * 0.05;
    zapatoGroup.rotation.z += (targetRotationY * 0.2 - zapatoGroup.rotation.z) * 0.05;
  }

  podiosGenerados.forEach((p, i) => p.rotation.y = t * (0.5 + i * 0.2));
  controles.update();
  renderer.render(scene, camera);
});