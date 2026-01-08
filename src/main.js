import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial'
import GUI from 'lil-gui'
import Stats from 'stats.js'
import { metalness, transmission } from 'three/src/nodes/TSL.js';
import vertexShader from './shaders/vertex.glsl?raw'
import fragmentShader from './shaders/fragment.glsl?raw'
THREE.ColorManagement.legacyMode = false





const startTime = Date.now()


// Palettes
const colorsA = ['#f0f0f0', '#eaa353', '#f49510', '#211f1c', '#c9c9c9']
const colorsB = ['#f0f0f0', '#eaa353', '#f49510', '#211f1c', '#c9c9c9']


const planegeometryA = new THREE.PlaneGeometry(25, 15 , 100, 100)
const planegeometryB = new THREE.PlaneGeometry(25, 15 , 100, 100)


function makeRainbowMaterial(palette, { transparent = false, opactity= 1, intensity=1}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: startTime }, // shared reference
      uColor: { value: palette.map((c) => new THREE.Color(c)) }, // unique per plane
      uIntensity: {value:intensity}
    },
    vertexShader,
    fragmentShader,
    transparent,
  })
}

function makeRainbowMaterial2(palette, { transparent = false, opactity= 1}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: startTime }, // shared reference
      uColor: { value: palette.map((c) => new THREE.Color(c)) }, // unique per plane
    },
    vertexShader,
    fragmentShader,
    transparent,
  })
}


// Plane A
const lightplane = new THREE.Mesh( planegeometryA, makeRainbowMaterial(colorsA, { transparent: false, opacity: 1 } ) )
lightplane.position.set(0, 0, -6)

// Plane B (clone geometry, different colors)
const lightplane2 = new THREE.Mesh(planegeometryB, makeRainbowMaterial2(colorsB, { transparent: false, opacity: 1 }))
lightplane2.position.set(20, 0, -6) // move it so you can see both


lightplane.position.set(0, 0, -4)
// lightplane.rotateX(THREE.MathUtils.degToRad(-20))

//scene setup
const ambientLight = new THREE.AmbientLight()
const pointLight = new THREE.PointLight()
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000) // <-- black background

scene.add(lightplane)
scene.add(lightplane2)


const camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputEncoding = THREE.sRGBEncoding
document.body.appendChild(renderer.domElement)

// Stats.js (show ALL default panels by stacking 3 instances)
const statsFps = new Stats()
statsFps.showPanel(0) // FPS
statsFps.dom.style.position = 'fixed'
statsFps.dom.style.left = '0'
statsFps.dom.style.top = '0'
statsFps.dom.style.zIndex = '9999'
document.body.appendChild(statsFps.dom)

const statsMs = new Stats()
statsMs.showPanel(1) // MS
statsMs.dom.style.position = 'fixed'
statsMs.dom.style.left = '0'
statsMs.dom.style.top = '48px'
statsMs.dom.style.zIndex = '9999'
document.body.appendChild(statsMs.dom)

const statsMb = new Stats()
statsMb.showPanel(2) // MB (only meaningful if `performance.memory` exists)
statsMb.dom.style.position = 'fixed'
statsMb.dom.style.left = '0'
statsMb.dom.style.top = '96px'
statsMb.dom.style.zIndex = '9999'
document.body.appendChild(statsMb.dom)

// Extra renderer stats (draw calls / tris / textures / geometries)
const rendererInfoEl = document.createElement('pre')
rendererInfoEl.style.position = 'fixed'
rendererInfoEl.style.left = '0'
rendererInfoEl.style.top = '144px'
rendererInfoEl.style.zIndex = '9999'
rendererInfoEl.style.margin = '0'
rendererInfoEl.style.padding = '6px 8px'
rendererInfoEl.style.background = 'rgba(0,0,0,0.55)'
rendererInfoEl.style.color = '#fff'
rendererInfoEl.style.font = '12px/1.2 monospace'
rendererInfoEl.style.pointerEvents = 'none'
document.body.appendChild(rendererInfoEl)


camera.position.set(0, 0, 45)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0) // or whatever you want to look at

// --- GUI + movable standard cube ---
const gui = new GUI()

// --- GUI: gradient plane colors ---
const gradientFolder = gui.addFolder('Gradient Plane')
const gradientParams = {
  color0: colorsA[0],
  color1: colorsA[1],
  color2: colorsA[2],
  color3: colorsA[3],
  color4: colorsA[4],
}

const setGradientColor = (index, value) => {
  const uColor = lightplane.material?.uniforms?.uColor
  if (!uColor?.value?.[index]) return
  uColor.value[index].set(value)
}

gradientFolder.addColor(gradientParams, 'color0').name('Color 1').onChange((v) => setGradientColor(0, v))
gradientFolder.addColor(gradientParams, 'color1').name('Color 2').onChange((v) => setGradientColor(1, v))
gradientFolder.addColor(gradientParams, 'color2').name('Color 3').onChange((v) => setGradientColor(2, v))
gradientFolder.addColor(gradientParams, 'color3').name('Color 4').onChange((v) => setGradientColor(3, v))
gradientFolder.addColor(gradientParams, 'color4').name('Color 5').onChange((v) => setGradientColor(4, v))
gradientFolder.open()

const standardCube = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({
    color: '#ff5533',
    roughness: 0.35,
    metalness: 0.05,
  })
)
const customMat = new THREE.MeshPhysicalMaterial({
    transmission: 1.0,
    thickness: 0.1,
    roughness: 0.4, 
    metalness: 0.0,
    dispersion: 1,
    ior: 1.5,
    transparent: true,
    dispersion: 0.9,
    iridescence: 0.4,
    specularColor: new THREE.Color('#f37500ff'),
  })

standardCube.position.set(3.0, -2.2, 0)
scene.add(standardCube)

const cubeFolder = gui.addFolder('Standard Cube')
cubeFolder.add(standardCube.position, 'x', -10, 10, 0.01)
cubeFolder.add(standardCube.position, 'y', -10, 10, 0.01)
cubeFolder.add(standardCube.position, 'z', -10, 10, 0.01)
cubeFolder.add(standardCube.rotation, 'x', -Math.PI, Math.PI, 0.001)
cubeFolder.add(standardCube.rotation, 'y', -Math.PI, Math.PI, 0.001)
cubeFolder.add(standardCube.rotation, 'z', -Math.PI, Math.PI, 0.001)
cubeFolder.add(standardCube.scale, 'x', 0.1, 5, 0.01).name('scaleX')
cubeFolder.add(standardCube.scale, 'y', 0.1, 5, 0.01).name('scaleY')
cubeFolder.add(standardCube.scale, 'z', 0.1, 5, 0.01).name('scaleZ')

const cubeMatParams = {
  color: '#ff5533',
  roughness: standardCube.material.roughness,
  metalness: standardCube.material.metalness
}
cubeFolder.addColor(cubeMatParams, 'color').onChange((v) => standardCube.material.color.set(v))
cubeFolder.add(cubeMatParams, 'roughness', 0, 1, 0.001).onChange((v) => (standardCube.material.roughness = v))
cubeFolder.add(cubeMatParams, 'metalness', 0, 1, 0.001).onChange((v) => (standardCube.material.metalness = v))
cubeFolder.open()
// --- end GUI + cube ---

const envLoader = new RGBELoader()
const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()

dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
gltfLoader.setDRACOLoader(dracoLoader)

// Load everything in parallel (2 models + HDR)
const [cubeGltf, logoGltf, env] = await Promise.all([
  gltfLoader.loadAsync('/gelatinous_cube-transformed.glb'),
  gltfLoader.loadAsync('/models/LOGOBIMthin.glb'),
  envLoader.loadAsync('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr'),
])
env.mapping = THREE.EquirectangularReflectionMapping
scene.environment = env
scene.background = new THREE.Color(0x000000) // <-- black background


const gltfScene = cubeGltf.scene
// scene.add(gltfScene)

const bimlogo = logoGltf.scene
scene.add(bimlogo)

bimlogo.position.set(0, 0, 20)
bimlogo.rotation.x = Math.PI * 0.5
bimlogo.scale.setScalar(2)

  // pointLight.position.set(10, 10, 10)
  gltfScene.position.set(1, -3.45, 0)
  const cube1 = gltfScene.getObjectByName('cube1')



  const createGlassMaterial = () =>
    Object.assign(new MeshTransmissionMaterial(10), {
      clearcoat: 1,
      clearcoatRoughness: 0,
      transmission: 1,
      chromaticAberration: 0.03,
      anisotrophicBlur: 0.1,
      roughness: 0,
      thickness: 4.5,
      ior: 1.5,
      distortion: 0.1,
      distortionScale: 0.2,
      temporalDistortion: 0.2,
    })

  if (cube1) {
    cube1.material = createGlassMaterial()
  } else {
    console.warn('Could not find object named "cube1" in the GLB.')
  }

  // Add a dodecahedron next to the GLB model, using the same shader/material
  const dodecaGeo = new THREE.DodecahedronGeometry(1.25, 0)
  const dodeca = new THREE.Mesh(dodecaGeo, customMat)
  dodeca.position.set(-2.5, -2.2, 0) // adjust to taste
  scene.add(dodeca)


  const knotGeo = new THREE.TorusKnotGeometry(1, 0.3, 128, 32)
  const knot = new THREE.Mesh(knotGeo, customMat)
  knot.position.set(3, 3, 0)
  scene.add(knot)

  // Apply glass to the BIM logo (all meshes)
  bimlogo.traverse((o) => {
    if (!o.isMesh) return
    o.material = customMat
  })


  function resize() {
    const width = window.innerWidth
    const height = window.innerHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }

  window.addEventListener('resize', resize)
  resize()

  function animate(t) {
  

    requestAnimationFrame(animate)
lightplane.material.uniforms.time.value = Date.now() - startTime
    if (cube1?.material) cube1.material.time = t / 1000
    dodeca.material.time = t / 1000

    dodeca.rotation.y = t * 0.0006
    dodeca.rotation.x = t * 0.0003

    controls.update()
    renderer.render(scene, camera)

     // Update all stats panels
  statsFps.update()
  statsMs.update()
  statsMb.update()

  // Update renderer info
  const info = renderer.info
  rendererInfoEl.textContent =
    `calls:     ${info.render.calls}\n` +
    `triangles: ${info.render.triangles}\n` +
    `lines:     ${info.render.lines}\n` +
    `points:    ${info.render.points}\n` +
    `geoms:     ${info.memory.geometries}\n` +
    `textures:  ${info.memory.textures}`
  }

  animate()