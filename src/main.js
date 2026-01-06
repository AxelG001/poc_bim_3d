import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { MeshTransmissionMaterial } from './MeshTransmissionMaterial'
import GUI from 'lil-gui'

THREE.ColorManagement.legacyMode = false

//scene setup
const ambientLight = new THREE.AmbientLight()
const pointLight = new THREE.PointLight()
const scene = new THREE.Scene()
scene.background = new THREE.Color('#f0f0f0ff')


const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(5, 0, 20)

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(Math.max(1, window.devicePixelRatio), 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.outputEncoding = THREE.sRGBEncoding
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)

// --- GUI + movable standard cube ---
const gui = new GUI()

const standardCube = new THREE.Mesh(
  new THREE.BoxGeometry(1.2, 1.2, 1.2),
  new THREE.MeshStandardMaterial({
    color: '#ff5533',
    roughness: 0.35,
    metalness: 0.05
  })
)

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

const [{ scene: gltfScene }, env] = await Promise.all([
  /*
  Author: glenatron (https://sketchfab.com/glenatron)
  License: CC-BY-NC-4.0 (http://creativecommons.org/licenses/by-nc/4.0/)
  Source: https://sketchfab.com/3d-models/gelatinous-cube-e08385238f4d4b59b012233a9fbdca21
  Title: Gelatinous Cube
  */
  new Promise((res) => gltfLoader.load('/gelatinous_cube-transformed.glb', res)),
  new Promise((res) => envLoader.load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr', res))
])

  scene.environment = env
  scene.environment.mapping = THREE.EquirectangularReflectionMapping

  scene.add(ambientLight)
  scene.add(pointLight)
  scene.add(gltfScene)

  pointLight.position.set(10, 10, 10)
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
      temporalDistortion: 0.2
    })

  if (cube1) {
    cube1.material = createGlassMaterial()
  } else {
    console.warn('Could not find object named "cube1" in the GLB.')
  }

  // Add a dodecahedron next to the GLB model, using the same shader/material
  const dodecaGeo = new THREE.DodecahedronGeometry(1.25, 0)
  const dodeca = new THREE.Mesh(dodecaGeo, createGlassMaterial())
  dodeca.position.set(-2.5, -2.2, 0) // adjust to taste
  scene.add(dodeca)


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

    if (cube1?.material) cube1.material.time = t / 1000
    dodeca.material.time = t / 1000

    dodeca.rotation.y = t * 0.0006
    dodeca.rotation.x = t * 0.0003

    controls.update()
    renderer.render(scene, camera)
  }

  animate()