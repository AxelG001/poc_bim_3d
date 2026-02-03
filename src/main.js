import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial';
import { VanillaMeshTransmissionMaterial } from './VanillaMeshTransmissionMaterial';
import { TextGeometry } from 'three/examples/jsm/Addons.js';
import GUI from 'lil-gui';
import Stats from 'stats.js';
import { metalness, transmission } from 'three/src/nodes/TSL.js';
import vertexShader from './shaders/vertex.glsl?raw';
import fragmentShader from './shaders/fragment.glsl?raw';
import waterVertexShader from './shaders/water/vertex.glsl?raw'
import SimpleVertexShader from './shaders/blob/vertex.glsl?raw'
import SimpleFragmentShader from './shaders/blob/fragment.glsl?raw'
import waterFragmentShader from './shaders/water/fragment.glsl?raw'
import { sample } from 'three/tsl';

THREE.ColorManagement.legacyMode = false

const startTime = Date.now()

// Palettes
const colorsA = ['#ff881a', '#f49510', '#f49510', '#fbe4e4', '#fbe4e4']

const gui = new GUI()
const planegeometryA = new THREE.PlaneGeometry(25, 15, 100, 100)

// Add texture loader
const textureLoader = new THREE.TextureLoader()



const fontLoader = new FontLoader()
fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', (font) => {
  const textGeometry = new TextGeometry('Bim Agency', {
     font: font,
                size: 2,
                depth: 0.1,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
  })
  
  const textMaterial = new THREE.MeshBasicMaterial({ color: '#585858' })
  const textMesh = new THREE.Mesh(textGeometry, textMaterial)
  textMesh.position.set(-8, 0, -8)
  scene.add(textMesh)
})
// Create a plane with a video texture
function makeVideoPlane(videoSrc, options = {}) {
  const { width = 20, height = 15, loop = true, muted = true, autoplay = true } = options

  // Create video element
  const video = document.createElement('video')
  video.src = videoSrc
  video.loop = loop
  video.muted = muted
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  // Create video texture
  const videoTexture = new THREE.VideoTexture(video)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.minFilter = THREE.LinearFilter
  videoTexture.magFilter = THREE.LinearFilter

  const geometry = new THREE.PlaneGeometry(width, height)
  const material = new THREE.MeshBasicMaterial({
    map: videoTexture,
    side: THREE.DoubleSide
  })

  const mesh = new THREE.Mesh(geometry, material)

  // Store video reference on mesh for control
  mesh.userData.video = video

  // Auto-play when ready
  if (autoplay) {
    video.play().catch((e) => {
      console.log('Autoplay blocked, click to play:', e)
      // Add click listener to start video on user interaction
      document.addEventListener('click', () => video.play(), { once: true })
    })
  }
  return mesh
}

// Create a plane with an image texture
function makeTexturedPlane( options = {}) {
  const { width = 20, height = 15, transparent = false } = options

  const texture = textureLoader.load('./texture/orange_background.png')
  texture.colorSpace = THREE.SRGBColorSpace // Correct color handling

  const geometry = new THREE.PlaneGeometry(width, height)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent,
    side: THREE.DoubleSide
  })

  return new THREE.Mesh(geometry, material)
}

const imagePlane = makeTexturedPlane('/texture/orange_background.png', {
  width: 15,
  height: 6,
  transparent: false
})
imagePlane.position.set(0, 0, -9.5) // Position in front of the gradient

const videoPlane = makeVideoPlane('./video/showreel.mp4', {
  width: 16,
  height: 9,
  loop: true,
  muted: true
})
videoPlane.position.set(0, 0, -5)


function makeRainbowMaterial(palette, { intensity = 0.8 }) {
  // Convert colors to linear space for correct rendering
  const linearColors = palette.map((c) => {
    const color = new THREE.Color(c)
    color.convertSRGBToLinear() // Convert to linear space
    return color
  })
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: startTime },
      uColor: { value: linearColors },
      uIntensity: { value: 0.8 }
    },
    vertexShader,
    fragmentShader,
  })
}
const simpleShaderGeometry = new THREE.PlaneGeometry(10,10,32,32)

const simpleShaderMaterial = new THREE.RawShaderMaterial({
  vertexShader: SimpleVertexShader,
  fragmentShader: SimpleFragmentShader,
  uniforms: {
    uTime: { value: 0.0 }
  }
})
const count = simpleShaderGeometry.attributes.position.count
const randoms = new Float32Array(count)
for(let i = 0; i < count; i++)
{
    randoms[i] = Math.random()
}
simpleShaderGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

const simpleShaderMesh = new THREE.Mesh(simpleShaderGeometry, simpleShaderMaterial)
simpleShaderMesh.position.set(0, 0, -5)

function makeUnicornBackgroundMaterial(palette, { intensity = 1 }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      uColor: { value: palette.map((c) => new THREE.Color(c)) },
      uIntensity: { value: intensity },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMousePos: { value: new THREE.Vector2(0.5, 0.5) },
    },
    vertexShader,
    fragmentShader,
    vertexColors: true,
    glslVersion: THREE.GLSL3,
    attenuationColor: new THREE.Color('#ffffff'),
  })
}


const waterGeometry = new THREE.PlaneGeometry(20, 20, 512, 512)
// Material
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms:
  {
    uTime: { value: 0.0 },

    uBigWavesElevation: { value: 0.2 },
    uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
    uBigWavesSpeed: { value: 0.75 },

    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallIterations: { value: 4 },

    uDepthColor: { value: new THREE.Color('#4d1c9c') },
    uSurfaceColor: { value: new THREE.Color('#00ffff') },
    uColorOffset: { value: 0.08 },
    uColorMultiplier: { value: 5 }
  }
})


// Plane A
const lightplane = new THREE.Mesh(planegeometryA, makeRainbowMaterial(colorsA, { transparent: false, opacity: 1, intensity: 1 }))
lightplane.position.set(0, 0, -10) // Move it further back by default

// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.position.set(0, 4, 0)
water.rotation.x = 2 * Math.PI

// scene setup
const scene = new THREE.Scene()


const camera = new THREE.PerspectiveCamera(12, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true,  })

renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2))
// renderer.toneMapping = THREE.ACESFilmicToneMapping
// renderer.outputEncoding = THREE.sRGBEncoding

console.log('Renderer:', devicePixelRatio, renderer.getPixelRatio())

document.body.appendChild(renderer.domElement)



camera.position.set(0, 0, 45)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0, 0) // or whatever you want to look at

// --- GUI: gradient plane controls ---
const gradientFolder = gui.addFolder('Gradient Plane')
gradientFolder.add(lightplane.position, 'z', -100, 10, 0.1).name('Distance (Z)')
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


const standardCube = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({
    color: '#ff5533',
    roughness: 0.35,
    metalness: 0.05,
  })
)

standardCube.position.set(3.0, -2.2, 0)

const customMat = new THREE.MeshPhysicalMaterial({
  transmission: 1.0,
  thickness: 0.2,
  roughness: 0.6,
  metalness: 0.0,
  dispersion: 0.3,
  ior: 1.5,
  transparent: true,
  dispersion: 0.9,
  iridescence: 1,
  iridescenceIOR: 1.20,

})






const newGlassMaterial = new THREE.MeshPhysicalMaterial({
  thickness: 3.0,
  roughness: 0.9,
  clearcoat: 0.1,
  clearcoatRoughness: 0,
  transmission: 0.99,
  ior: 1.25,
  envMapIntensity: 1

})

customMat.alpha = false

// const cubeFolder = gui.addFolder('Standard Cube')
// cubeFolder.add(standardCube.position, 'x', -10, 10, 0.01)
// cubeFolder.add(standardCube.position, 'y', -10, 10, 0.01)
// cubeFolder.add(standardCube.position, 'z', -10, 10, 0.01)
// cubeFolder.add(standardCube.rotation, 'x', -Math.PI, Math.PI, 0.001)
// cubeFolder.add(standardCube.rotation, 'y', -Math.PI, Math.PI, 0.001)
// cubeFolder.add(standardCube.rotation, 'z', -Math.PI, Math.PI, 0.001)
// cubeFolder.add(standardCube.scale, 'x', 0.1, 5, 0.01).name('scaleX')
// cubeFolder.add(standardCube.scale, 'y', 0.1, 5, 0.01).name('scaleY')
// cubeFolder.add(standardCube.scale, 'z', 0.1, 5, 0.01).name('scaleZ')

// const cubeMatParams = {
//   color: '#ff5533',
//   roughness: standardCube.material.roughness,
//   metalness: standardCube.material.metalness
// }
// cubeFolder.addColor(cubeMatParams, 'color').onChange((v) => standardCube.material.color.set(v))
// cubeFolder.add(cubeMatParams, 'roughness', 0, 1, 0.001).onChange((v) => (standardCube.material.roughness = v))
// cubeFolder.add(cubeMatParams, 'metalness', 0, 1, 0.001).onChange((v) => (standardCube.material.metalness = v))
// cubeFolder.open()
// --- end GUI + cube ---

const rgbeLoader = new RGBELoader()
const exrLoader = new EXRLoader()
const gltfLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader()

dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/')
gltfLoader.setDRACOLoader(dracoLoader)

const environments = {
  'Abstract': '/abstract.hdr',
  'Dancing Hall': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr',
  'Ocean': '/hdr/ocean.exr',
  'Pink Sky': '/hdr/pink_sky.exr',
  'Warm Sky': '/hdr/warm_sky.exr'
}

const envParams = {
  map: 'Dancing Hall'
}

async function loadEnvironment(key) {
  const path = environments[key]
  const loader = path.endsWith('.exr') ? exrLoader : rgbeLoader
  try {
    const texture = await loader.loadAsync(path)
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.environment = texture
    // scene.background = texture  // Show the HDR as background
    scene.background = new THREE.Color('#e0e0e0') // <-- black background
  } catch (e) {
    console.error('Failed to load env:', key, e)
  }
}

const envFolder = gui.addFolder('Environment')
envFolder.add(envParams, 'map', Object.keys(environments)).onChange(loadEnvironment)
// Environment rotation controls
const envRotation = { x: 0, y: 0, z: 0 }
envFolder.add(envRotation, 'x', 0, Math.PI * 2, 0.01).name('Rotation X').onChange(() => {
  scene.environmentRotation.set(envRotation.x, envRotation.y, envRotation.z)
})
envFolder.add(envRotation, 'y', 0, Math.PI * 2, 0.01).name('Rotation Y').onChange(() => {
  scene.environmentRotation.set(envRotation.x, envRotation.y, envRotation.z)
})
envFolder.add(envRotation, 'z', 0, Math.PI * 2, 0.01).name('Rotation Z').onChange(() => {
  scene.environmentRotation.set(envRotation.x, envRotation.y, envRotation.z)
})

// Load everything in parallel (2 models + default HDR)
const [cubeGltf, logoGltf, logoSplit, testCube] = await Promise.all([
  gltfLoader.loadAsync('/gelatinous_cube-transformed.glb'),
  gltfLoader.loadAsync('/models/LOGOBIMthin.glb'),
  gltfLoader.loadAsync('/models/logobimsplit.glb'),
  gltfLoader.loadAsync('/models/testcube.glb'),
  loadEnvironment(envParams.map)
])

// scene.background = new THREE.Color(0x000000) // <-- black background
scene.overrideMaterial

const gltfScene = cubeGltf.scene
console.log('SPLIT logo:', logoSplit)
console.log('BIM logo:', logoGltf)
const splitlogo = logoSplit.scene  // <-- declared here
// scene.add(gltfScene)

const bimlogo = logoGltf.scene
const splitLogo = logoSplit.scene  // <-- declared AGAIN (different casing)

const testingCube = testCube.scene
// scene.add(standardCube)
// scene.add(simpleShaderMesh)

// scene.add(bimlogo)
scene.add(splitLogo)
// scene.add(videoPlane)
scene.add(lightplane)
// scene.add(imagePlane)
// scene.add(water)

// Add position, rotation, and scale for splitLogo
splitLogo.position.set(0, 0, -4.5)
splitLogo.rotation.x = Math.PI * 0.5
splitLogo.scale.setScalar(3)

bimlogo.position.set(0, 0, 4)
bimlogo.rotation.x = Math.PI * 0.5
bimlogo.scale.setScalar(3)

// pointLight.position.set(10, 10, 10)
gltfScene.position.set(1, -3.45, 0)


const createVanillaGlassMaterial = () =>
  Object.assign(new VanillaMeshTransmissionMaterial(10), {
    samples: 2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 1,
    chromaticAberration: 0.06,
    anisotrophicBlur: 0.10,
    metalness: 0,
    roughness: 0.0,
    thickness: 3.5,
    ior: 1.5,
    distortion: 0,
    distortionScale: 0.3,
    temporalDistortion: 0.5,
  })

const createGlassMaterial = () =>
  Object.assign(new MeshTransmissionMaterial(10), {
    samples: 6,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    transmission: 1,
    chromaticAberration: 0.2,
    anisotrophicBlur: 0.06,
    metalness: 0,
    roughness: 0.2,
    thickness: 1.5,
    ior: 1.5,
    distortion: 0,
    distortionScale: 0.3,
    temporalDistortion: 0.5,
  })

const glassMaterials = []

// Helper to create and track glass materials
const createTrackedGlassMaterial = () => {
  const mat = createGlassMaterial()
  glassMaterials.push(mat)
  return mat
}

// Glass material GUI parameters
const glassParams = {
  samples: 6,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  transmission: 1,
  chromaticAberration: 0.2,
  anisotrophicBlur: 0.06,
  metalness: 0,
  roughness: 0.2,
  thickness: 1.5,
  ior: 1.5,
  distortion: 0,
  distortionScale: 0.3,
  temporalDistortion: 0.5,
}

const updateGlassMaterials = (prop, value) => {
  glassMaterials.forEach((mat) => {
    mat[prop] = value
  })
}

// Glass Material GUI
const glassFolder = gui.addFolder('Glass Material')
glassFolder.add(glassParams, 'samples', 1, 16, 1).onChange((v) => updateGlassMaterials('samples', v))
glassFolder.add(glassParams, 'clearcoat', 0, 1, 0.01).onChange((v) => updateGlassMaterials('clearcoat', v))
glassFolder.add(glassParams, 'clearcoatRoughness', 0, 1, 0.01).onChange((v) => updateGlassMaterials('clearcoatRoughness', v))
glassFolder.add(glassParams, 'transmission', 0, 1, 0.01).onChange((v) => updateGlassMaterials('transmission', v))
glassFolder.add(glassParams, 'chromaticAberration', 0, 1, 0.01).onChange((v) => updateGlassMaterials('chromaticAberration', v))
glassFolder.add(glassParams, 'anisotrophicBlur', 0, 1, 0.01).onChange((v) => updateGlassMaterials('anisotrophicBlur', v))
glassFolder.add(glassParams, 'metalness', 0, 1, 0.01).onChange((v) => updateGlassMaterials('metalness', v))
glassFolder.add(glassParams, 'roughness', 0, 1, 0.01).onChange((v) => updateGlassMaterials('roughness', v))
glassFolder.add(glassParams, 'thickness', 0, 10, 0.1).onChange((v) => updateGlassMaterials('thickness', v))
glassFolder.add(glassParams, 'ior', 1, 2.5, 0.01).onChange((v) => updateGlassMaterials('ior', v))
glassFolder.add(glassParams, 'distortion', 0, 1, 0.01).onChange((v) => updateGlassMaterials('distortion', v))
glassFolder.add(glassParams, 'distortionScale', 0, 1, 0.01).onChange((v) => updateGlassMaterials('distortionScale', v))
glassFolder.add(glassParams, 'temporalDistortion', 0, 1, 0.01).onChange((v) => updateGlassMaterials('temporalDistortion', v))
glassFolder.open()


// Add a dodecahedron next to the GLB model, using the same shader/material
// const dodecaGeo = new THREE.DodecahedronGeometry(1.25, 0)
// const dodeca = new THREE.Mesh(dodecaGeo, customMat)
// dodeca.position.set(-2.5, -2.2, 0) // adjust to taste
// scene.add(dodeca)


const knotGeo = new THREE.TorusKnotGeometry(1, 0.3, 128, 32)
const knot = new THREE.Mesh(knotGeo, createTrackedGlassMaterial())
knot.position.set(3, 3, 0)
scene.add(knot)

// Apply glass to the BIM logo (all meshes)
bimlogo.traverse((o) => {
  if (!o.isMesh) return
  o.material = createGlassMaterial();
  o.castShadow = false;
  o.receiveShadow = false;
})
// Apply material to splitLogo meshes
splitLogo.traverse((o) => {
  if (!o.isMesh) return

  const matName = o.material.name.toLowerCase()
  console.log('Mesh:', o.name, '| Material:', o.material.name) // Debug

  if (matName.includes('sideglass') || matName.includes('side')) {
    // o.material = customMat
    o.material = createTrackedGlassMaterial()
    // o.material = new THREE.MeshNormalMaterial()
  } else if (matName.includes('frontglass') || matName.includes('front')) {
    o.material = createTrackedGlassMaterial()
  } else {
    // Fallback material
    o.material = customMat
  }

  o.castShadow = false
  o.receiveShadow = false
})


testingCube.traverse((o) => {
  if (!o.isMesh) return
  o.material = createGlassMaterial();
  o.castShadow = false;
  o.receiveShadow = false;
})
// scene.add(testingCube)





gradientFolder.addColor(gradientParams, 'color0').name('Color 1').onChange((v) => setGradientColor(0, v))
gradientFolder.addColor(gradientParams, 'color1').name('Color 2').onChange((v) => setGradientColor(1, v))
gradientFolder.addColor(gradientParams, 'color2').name('Color 3').onChange((v) => setGradientColor(2, v))
gradientFolder.addColor(gradientParams, 'color3').name('Color 4').onChange((v) => setGradientColor(3, v))
gradientFolder.addColor(gradientParams, 'color4').name('Color 5').onChange((v) => setGradientColor(4, v))
gradientFolder.open()


const customFolder = gui.addFolder('Custom Material')
customFolder.add(customMat, 'transmission', 0, 1, 0.01)
customFolder.add(customMat, 'thickness', 0, 5, 0.1)
customFolder.add(customMat, 'roughness', 0, 1, 0.01)
customFolder.add(customMat, 'metalness', 0, 1, 0.01)
customFolder.add(customMat, 'ior', 1, 2.333, 0.01)
customFolder.add(customMat, 'iridescence', 0, 1, 0.01)
customFolder.open()


// --- GUI: Water controls ---
const waterFolder = gui.addFolder('Water')
waterFolder.add(waterMaterial.uniforms.uBigWavesElevation, 'value', 0, 1, 0.01).name('Big Waves Elevation')
waterFolder.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x', 0, 10, 0.01).name('Big Waves Freq X')
waterFolder.add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y', 0, 10, 0.01).name('Big Waves Freq Z')
waterFolder.add(waterMaterial.uniforms.uBigWavesSpeed, 'value', 0, 4, 0.01).name('Big Waves Speed')
waterFolder.addColor({ color: '#4d1c9c' }, 'color').name('Color 1').onChange((v) => waterMaterial.uniforms.uDepthColor.value.set(v))
waterFolder.addColor({ color: '#00ffff' }, 'color').name('Color 2').onChange((v) => waterMaterial.uniforms.uSurfaceColor.value.set(v))
waterFolder.add(waterMaterial.uniforms.uColorOffset, 'value', -1, 1, 0.01).name('Color Offset')
waterFolder.add(waterMaterial.uniforms.uColorMultiplier, 'value', 0, 10, 0.01).name('Color Multiplier')
waterFolder.open()

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

  waterMaterial.uniforms.uTime.value = t * 0.001
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

var gl = renderer.getContext();
console.log(gl);

