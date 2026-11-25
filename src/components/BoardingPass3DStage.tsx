import * as React from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Download,
  Film,
  Image as ImageIcon,
  RotateCw,
  Video,
} from 'lucide-react';
import {
  drawBoardingPassTextureCanvas,
  MARKETING_PASS_THEMES,
  MarketingBoardingPassSpec,
  MarketingPassThemeId,
} from './BoardingPassSocialProofCanvas';

type CameraPresetId = 'hero' | 'ticket' | 'globe' | 'reel';

interface BoardingPass3DStageProps {
  spec: MarketingBoardingPassSpec;
  onChangeTheme: (themeId: MarketingPassThemeId) => void;
  onSendFrameToVideo: (frameDataUrl: string) => void;
  onSendFrameToImageEditor: (frameDataUrl: string) => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  hero: { label: 'Hero Showcase', pos: [0.4, 2.35, 6.2], target: [0, 1.45, 0] },
  ticket: { label: 'Boarding Pass', pos: [-1.15, 1.95, 4.1], target: [-0.85, 1.7, 0.15] },
  globe: { label: 'Flight Globe', pos: [2.95, 2.45, 4.35], target: [1.35, 1.3, -0.35] },
  reel: { label: '9:16 Reveal', pos: [0.15, 2.8, 7.1], target: [0, 1.55, 0] },
};

// Module-scope scratch math objects (zero per-frame GC)
const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();
const _jetPos = new THREE.Vector3();
const _jetLook = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _moteColor = new THREE.Color();

function createProceduralGlobeTexture(themeId: MarketingPassThemeId): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;

  // Ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  if (themeId === 'obsidian') {
    oceanGrad.addColorStop(0, '#0E1C2F');
    oceanGrad.addColorStop(0.5, '#132A45');
    oceanGrad.addColorStop(1, '#0C1829');
  } else if (themeId === 'ivory') {
    oceanGrad.addColorStop(0, '#2C5978');
    oceanGrad.addColorStop(0.5, '#3A7296');
    oceanGrad.addColorStop(1, '#264E6B');
  } else {
    oceanGrad.addColorStop(0, '#0052D4');
    oceanGrad.addColorStop(0.5, '#00A3E8');
    oceanGrad.addColorStop(1, '#0068B5');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle lat/lon graticule
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.2;
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Stylized landmass silhouettes
  const landColor =
    themeId === 'obsidian' ? '#DFC083' : themeId === 'ivory' ? '#E5D3B3' : '#00D97E';
  const landAccent =
    themeId === 'obsidian' ? '#C79B4F' : themeId === 'ivory' ? '#D94E34' : '#FFC300';

  const drawLand = (pts: Array<[number, number]>, color: string) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // North America
  drawLand(
    [
      [110, 95],
      [255, 80],
      [310, 145],
      [270, 210],
      [220, 250],
      [165, 225],
      [130, 165],
    ],
    landColor
  );
  // South America
  drawLand(
    [
      [245, 275],
      [315, 295],
      [340, 365],
      [295, 445],
      [262, 430],
      [248, 345],
    ],
    landAccent
  );
  // Europe + Africa
  drawLand(
    [
      [475, 110],
      [585, 95],
      [605, 165],
      [530, 195],
      [470, 175],
    ],
    landColor
  );
  drawLand(
    [
      [485, 212],
      [595, 222],
      [620, 325],
      [562, 412],
      [512, 368],
      [474, 280],
    ],
    landAccent
  );
  // Asia + Japan
  drawLand(
    [
      [608, 92],
      [840, 108],
      [880, 190],
      [795, 255],
      [690, 252],
      [615, 185],
    ],
    landColor
  );
  // Australia
  drawLand(
    [
      [790, 330],
      [885, 342],
      [898, 408],
      [818, 416],
      [778, 378],
    ],
    landAccent
  );

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness map (glossy ocean, matte continents)
  const rc = document.createElement('canvas');
  rc.width = W;
  rc.height = H;
  const rctx = rc.getContext('2d')!;
  rctx.fillStyle = '#4A4A4A';
  rctx.fillRect(0, 0, W, H);
  rctx.fillStyle = '#C8C8C8';
  rctx.globalAlpha = 0.85;
  rctx.drawImage(c, 0, 0);
  const roughnessMap = new THREE.CanvasTexture(rc);

  return { map, roughnessMap };
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 16, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(10, 14, 24, 0.52)');
  grad.addColorStop(0.55, 'rgba(10, 14, 24, 0.22)');
  grad.addColorStop(1, 'rgba(10, 14, 24, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function buildCompositeJetliner(metalColor: number): THREE.Group {
  const jet = new THREE.Group();

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xfcfbf8,
    roughness: 0.22,
    metalness: 0.15,
    clearcoat: 0.9,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: metalColor,
    roughness: 0.24,
    metalness: 0.86,
  });
  const cockpitMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.75,
  });

  // 1. Turned fuselage (LatheGeometry)
  const profile = [
    new THREE.Vector2(0.0, -0.26),
    new THREE.Vector2(0.025, -0.22),
    new THREE.Vector2(0.048, -0.1),
    new THREE.Vector2(0.052, 0.1),
    new THREE.Vector2(0.036, 0.22),
    new THREE.Vector2(0.0, 0.27),
  ];
  const fuselageGeo = new THREE.LatheGeometry(profile, 20);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, bodyMat);
  fuselage.castShadow = true;
  jet.add(fuselage);

  // 2. Swept main wings (ExtrudeGeometry)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.08);
  wingShape.lineTo(0.28, -0.09);
  wingShape.lineTo(0.25, -0.13);
  wingShape.lineTo(0, -0.02);
  wingShape.lineTo(-0.25, -0.13);
  wingShape.lineTo(-0.28, -0.09);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
  });
  wingGeo.rotateX(Math.PI / 2);
  const wings = new THREE.Mesh(wingGeo, accentMat);
  wings.position.set(0, 0.0, 0.02);
  jet.add(wings);

  // 3. Vertical tail fin
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(-0.08, 0);
  finShape.lineTo(-0.12, 0.12);
  finShape.lineTo(-0.05, 0.12);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, {
    depth: 0.01,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 1,
  });
  finGeo.rotateY(Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, accentMat);
  fin.position.set(-0.005, 0.02, -0.14);
  jet.add(fin);

  // 4. Horizontal tail stabilizers
  const stabGeo = new THREE.BoxGeometry(0.16, 0.008, 0.045);
  const stab = new THREE.Mesh(stabGeo, bodyMat);
  stab.position.set(0, 0.015, -0.2);
  jet.add(stab);

  // 5. Twin under-wing engines + cockpit canopy
  const engineGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.075, 12);
  engineGeo.rotateX(Math.PI / 2);
  const engL = new THREE.Mesh(engineGeo, cockpitMat);
  engL.position.set(-0.11, -0.024, 0.01);
  const engR = new THREE.Mesh(engineGeo, cockpitMat);
  engR.position.set(0.11, -0.024, 0.01);
  jet.add(engL, engR);

  const canopyGeo = new THREE.SphereGeometry(0.032, 12, 10);
  canopyGeo.scale(0.85, 0.6, 1.5);
  const canopy = new THREE.Mesh(canopyGeo, cockpitMat);
  canopy.position.set(0, 0.028, 0.15);
  jet.add(canopy);

  return jet;
}

export const BoardingPass3DStage: React.FC<BoardingPass3DStageProps> = ({
  spec,
  onChangeTheme,
  onSendFrameToVideo,
  onSendFrameToImageEditor,
}) => {
  const mountRef = React.useRef<HTMLDivElement | null>(null);
  const rendererRef = React.useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = React.useRef<THREE.Scene | null>(null);
  const cameraRef = React.useRef<THREE.PerspectiveCamera | null>(null);
  const ticketFrontMatRef = React.useRef<THREE.MeshPhysicalMaterial | null>(null);
  const globeMatRef = React.useRef<THREE.MeshStandardMaterial | null>(null);
  const accentMatRef = React.useRef<THREE.MeshPhysicalMaterial | null>(null);
  const cameraPresetTargetRef = React.useRef<{
    pos: [number, number, number];
    target: [number, number, number];
    active: boolean;
  }>({
    pos: CAMERA_PRESETS.hero.pos,
    target: CAMERA_PRESETS.hero.target,
    active: false,
  });
  const autoSpinRef = React.useRef<boolean>(true);
  const specRef = React.useRef<MarketingBoardingPassSpec>(spec);
  specRef.current = spec;

  const [dockOpen, setDockOpen] = React.useState(true);
  const [activePreset, setActivePreset] = React.useState<CameraPresetId>('hero');
  const [autoSpin, setAutoSpin] = React.useState(true);
  const [frameGuide, setFrameGuide] = React.useState<'9:16' | '16:9'>('9:16');
  const [recording, setRecording] = React.useState(false);
  const [contextLost, setContextLost] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  // Helper to capture an exact cropped PNG matching 9:16 or 16:9 framing
  const captureStagePng = React.useCallback((): string | null => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return null;

    // Render right before reading the drawing buffer
    renderer.render(scene, camera);
    const srcCanvas = renderer.domElement;

    if (frameGuide === '9:16') {
      const targetAspect = 9 / 16;
      const srcW = srcCanvas.width;
      const srcH = srcCanvas.height;
      const cropW = Math.min(srcW, Math.round(srcH * targetAspect));
      const cropX = Math.round((srcW - cropW) / 2);

      const out = document.createElement('canvas');
      out.width = 1080;
      out.height = 1920;
      const ctx = out.getContext('2d');
      if (!ctx) return srcCanvas.toDataURL('image/png');
      ctx.drawImage(srcCanvas, cropX, 0, cropW, srcH, 0, 0, out.width, out.height);
      return out.toDataURL('image/png', 1.0);
    }

    return srcCanvas.toDataURL('image/png', 1.0);
  }, [frameGuide]);

  const handleDownloadSnapshot = () => {
    const dataUrl = captureStagePng();
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whisk-3d-boarding-pass-${spec.destCode.toLowerCase()}-${frameGuide.replace(':', 'x')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusMessage(`Saved ${frameGuide} PNG snapshot.`);
    window.setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleRecordTurntable = () => {
    const renderer = rendererRef.current;
    if (!renderer || recording) return;
    const canvas = renderer.domElement;
    if (typeof (canvas as any).captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      setStatusMessage('Browser video recording unavailable; use Capture PNG + Omni Video Animator.');
      return;
    }

    try {
      const stream = (canvas as any).captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        setRecording(false);
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whisk-3d-reel-${spec.destCode.toLowerCase()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatusMessage('Downloaded 6-second 3D turntable WebM reel.');
        window.setTimeout(() => setStatusMessage(null), 3500);
      };

      setRecording(true);
      setAutoSpin(true);
      autoSpinRef.current = true;
      recorder.start();
      window.setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 6000);
    } catch {
      setRecording(false);
      setStatusMessage('Could not start video recorder in this browser.');
    }
  };

  // Mount Three.js scene once in stable ref container
  React.useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL from renderer string (never user agent)
    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 620;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    const initialTheme = MARKETING_PASS_THEMES[specRef.current.themeId];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialTheme.sceneBgHex);
    scene.fog = new THREE.FogExp2(initialTheme.sceneBgHex, 0.042);
    sceneRef.current = scene;

    // Mandatory RoomEnvironment studio reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 80);
    camera.position.set(...CAMERA_PRESETS.hero.pos);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.hero.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.8;
    controls.maxDistance = 12.0;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.update();

    const onControlStart = () => {
      cameraPresetTargetRef.current.active = false;
    };
    controls.addEventListener('start', onControlStart);

    // 3-point warm/cool studio lighting rig
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x2a241f, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.25);
    keyLight.position.set(4.5, 7.2, 5.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -5.5;
    keyLight.shadow.camera.right = 5.5;
    keyLight.shadow.camera.top = 5.5;
    keyLight.shadow.camera.bottom = -5.5;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.15);
    rimLight.position.set(-5.0, 4.2, -4.5);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff7ed, 2.4, 4.8, 2.2);
      softbox.position.set(-2.4, 4.4, 3.6);
      softbox.lookAt(0, 1.4, 0);
      scene.add(softbox);
    }

    // Studio floor + soft radial contact shadow (grounded at y = 0)
    const floorGeo = new THREE.CircleGeometry(18, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: initialTheme.sceneBgHex,
      roughness: 0.88,
      metalness: 0.04,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    const contactTex = createContactShadowTexture();
    const contactMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    });
    const contactPlane = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 4.2), contactMat);
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(0.2, 0.008, -0.05);
    scene.add(contactPlane);

    // Master hero diorama turntable group
    const dioramaGroup = new THREE.Group();
    scene.add(dioramaGroup);

    const metallicAccentMat = new THREE.MeshPhysicalMaterial({
      color: initialTheme.metalHex,
      roughness: 0.22,
      metalness: 0.92,
      anisotropy: 0.75,
      clearcoat: 0.4,
    });
    accentMatRef.current = metallicAccentMat;

    // --- COMPOSITE HERO MODEL 1: LUXURY WHISK BOARDING PASS ASSEMBLY (7 PARTS) ---
    const ticketAssembly = new THREE.Group();
    ticketAssembly.position.set(-0.9, 0, 0.22);
    ticketAssembly.rotation.y = 0.24;
    dioramaGroup.add(ticketAssembly);

    // 1. Turned architectural display plinth seated flush on floor (y = 0)
    const plinthGeo = new THREE.CylinderGeometry(0.95, 1.08, 0.14, 40);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x1e2433,
      roughness: 0.55,
      metalness: 0.25,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = 0.07;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    ticketAssembly.add(plinth);

    // 2. Brushed brass cradle rail on top of plinth
    const cradleGeo = new THREE.BoxGeometry(1.72, 0.08, 0.26);
    const cradle = new THREE.Mesh(cradleGeo, metallicAccentMat);
    cradle.position.set(0, 0.17, 0);
    cradle.castShadow = true;
    ticketAssembly.add(cradle);

    // 3. Beveled Boarding Pass Core Card (ExtrudeGeometry)
    const cardW = 1.96;
    const cardH = 2.94;
    const cardR = 0.11;
    const cardShape = new THREE.Shape();
    cardShape.moveTo(-cardW / 2 + cardR, -cardH / 2);
    cardShape.lineTo(cardW / 2 - cardR, -cardH / 2);
    cardShape.quadraticCurveTo(cardW / 2, -cardH / 2, cardW / 2, -cardH / 2 + cardR);
    cardShape.lineTo(cardW / 2, cardH / 2 - cardR);
    cardShape.quadraticCurveTo(cardW / 2, cardH / 2, cardW / 2 - cardR, cardH / 2);
    cardShape.lineTo(-cardW / 2 + cardR, cardH / 2);
    cardShape.quadraticCurveTo(-cardW / 2, cardH / 2, -cardW / 2, cardH / 2 - cardR);
    cardShape.lineTo(-cardW / 2, -cardH / 2 + cardR);
    cardShape.quadraticCurveTo(-cardW / 2, -cardH / 2, -cardW / 2 + cardR, -cardH / 2);

    const cardBodyGeo = new THREE.ExtrudeGeometry(cardShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 3,
    });
    cardBodyGeo.center();

    const cardGroup = new THREE.Group();
    cardGroup.position.set(0, 1.72, 0);
    cardGroup.rotation.x = -0.06;
    ticketAssembly.add(cardGroup);

    const cardEdgeMat = new THREE.MeshStandardMaterial({
      color: initialTheme.metalHex,
      roughness: 0.3,
      metalness: 0.82,
    });
    const cardCoreMesh = new THREE.Mesh(cardBodyGeo, cardEdgeMat);
    cardCoreMesh.castShadow = true;
    cardCoreMesh.receiveShadow = true;
    cardGroup.add(cardCoreMesh);

    // 4. High-Resolution Dynamic Front Boarding Pass Print Face (CanvasTexture)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const initialTexCanvas = drawBoardingPassTextureCanvas(specRef.current);
    const ticketFrontTex = new THREE.CanvasTexture(initialTexCanvas);
    ticketFrontTex.colorSpace = THREE.SRGBColorSpace;
    ticketFrontTex.anisotropy = maxAniso;

    const ticketFrontMat = new THREE.MeshPhysicalMaterial({
      map: ticketFrontTex,
      roughness: 0.42,
      metalness: 0.04,
      clearcoat: 0.35,
      clearcoatRoughness: 0.28,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    ticketFrontMatRef.current = ticketFrontMat;

    const frontFace = new THREE.Mesh(new THREE.PlaneGeometry(cardW - 0.04, cardH - 0.04), ticketFrontMat);
    frontFace.position.z = 0.036;
    cardGroup.add(frontFace);

    // 5. Matte Embossed Back Panel
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x161b26,
      roughness: 0.72,
      metalness: 0.12,
    });
    const backFace = new THREE.Mesh(new THREE.PlaneGeometry(cardW - 0.04, cardH - 0.04), backMat);
    backFace.rotation.y = Math.PI;
    backFace.position.z = -0.036;
    cardGroup.add(backFace);

    // 6. Raised Metallic Whisk Medallion Seal (LatheGeometry) at top-right corner
    const sealGeo = new THREE.CylinderGeometry(0.14, 0.15, 0.026, 28);
    sealGeo.rotateX(Math.PI / 2);
    const sealMesh = new THREE.Mesh(sealGeo, metallicAccentMat);
    sealMesh.position.set(cardW / 2 - 0.24, cardH / 2 - 0.24, 0.042);
    cardGroup.add(sealMesh);

    // 7. Optical Protective Display Sleeve Rim (subtle clearcoat glass edge)
    const sleeveMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.0,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.16 : 0.95,
      ior: 1.5,
      thickness: 0.15,
      depthWrite: false,
    });
    const sleeveFrame = new THREE.Mesh(
      new THREE.BoxGeometry(cardW + 0.08, cardH + 0.08, 0.018),
      sleeveMat
    );
    sleeveFrame.position.z = -0.065;
    sleeveFrame.renderOrder = 2;
    cardGroup.add(sleeveFrame);

    // --- COMPOSITE HERO MODEL 2: CARTOGRAPHIC GLOBE & ORBITING JET DIORAMA (7 PARTS) ---
    const globeAssembly = new THREE.Group();
    globeAssembly.position.set(1.42, 0, -0.35);
    dioramaGroup.add(globeAssembly);

    // 1. Turned architectural pedestal base (LatheGeometry, flush at y = 0)
    const baseProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.72, 0.0),
      new THREE.Vector2(0.68, 0.09),
      new THREE.Vector2(0.42, 0.15),
      new THREE.Vector2(0.16, 0.24),
      new THREE.Vector2(0.12, 0.44),
      new THREE.Vector2(0.22, 0.48),
      new THREE.Vector2(0.0, 0.48),
    ];
    const baseGeo = new THREE.LatheGeometry(baseProfile, 36);
    const globeStand = new THREE.Mesh(baseGeo, metallicAccentMat);
    globeStand.castShadow = true;
    globeStand.receiveShadow = true;
    globeAssembly.add(globeStand);

    // 2. Brushed Brass Meridian Arc Ring
    const meridianGeo = new THREE.TorusGeometry(1.16, 0.036, 16, 64, Math.PI * 1.15);
    const meridian = new THREE.Mesh(meridianGeo, metallicAccentMat);
    meridian.position.set(0, 1.52, 0);
    meridian.rotation.z = -Math.PI * 0.58;
    meridian.castShadow = true;
    globeAssembly.add(meridian);

    // 3. Textured Globe Sphere (SRGBColorSpace + roughnessMap)
    const globePivot = new THREE.Group();
    globePivot.position.set(0, 1.52, 0);
    globePivot.rotation.z = 0.24;
    globeAssembly.add(globePivot);

    const { map: globeColorMap, roughnessMap: globeRoughMap } = createProceduralGlobeTexture(
      specRef.current.themeId
    );
    globeColorMap.anisotropy = maxAniso;
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeColorMap,
      roughnessMap: globeRoughMap,
      roughness: 0.72,
      metalness: 0.08,
    });
    globeMatRef.current = globeMat;

    const globeMesh = new THREE.Mesh(new THREE.SphereGeometry(1.02, 48, 32), globeMat);
    globeMesh.castShadow = true;
    globeMesh.receiveShadow = true;
    globePivot.add(globeMesh);

    // 4. Curved 3D Flight Route Arc (TubeGeometry) + Origin/Dest Beacons
    const startPt = new THREE.Vector3(-0.78, 0.42, 0.52).normalize().multiplyScalar(1.03);
    const endPt = new THREE.Vector3(0.68, 0.54, 0.54).normalize().multiplyScalar(1.03);
    const midArc = startPt.clone().add(endPt).multiplyScalar(0.5).normalize().multiplyScalar(1.48);
    const flightCurve = new THREE.QuadraticBezierCurve3(startPt, midArc, endPt);
    const arcGeo = new THREE.TubeGeometry(flightCurve, 44, 0.018, 10, false);
    const arcMat = new THREE.MeshStandardMaterial({
      color: 0xff5a3c,
      emissive: 0xff3b30,
      emissiveIntensity: 0.55,
      roughness: 0.3,
      metalness: 0.2,
    });
    const arcMesh = new THREE.Mesh(arcGeo, arcMat);
    globePivot.add(arcMesh);

    const pinGeo = new THREE.SphereGeometry(0.055, 16, 12);
    const pinStart = new THREE.Mesh(pinGeo, arcMat);
    pinStart.position.copy(startPt);
    const pinEnd = new THREE.Mesh(pinGeo, arcMat);
    pinEnd.position.copy(endPt);
    globePivot.add(pinStart, pinEnd);

    // 5. Composite 5-Part Miniature Jetliner gliding along the flight arc
    const jetliner = buildCompositeJetliner(initialTheme.metalHex);
    jetliner.scale.setScalar(0.95);
    globePivot.add(jetliner);

    // --- INSTANCED AMBIENT GOLDEN BOKEH MOTES (36 instances) ---
    const moteCount = 36;
    const moteGeo = new THREE.OctahedronGeometry(0.034, 1);
    const moteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.85,
    });
    const motes = new THREE.InstancedMesh(moteGeo, moteMat, moteCount);
    const moteSeeds: Array<{ angle: number; radius: number; y: number; speed: number; scale: number }> = [];
    for (let i = 0; i < moteCount; i++) {
      const seed = {
        angle: (i / moteCount) * Math.PI * 2 + (i % 5) * 0.3,
        radius: 2.6 + (i % 7) * 0.36,
        y: 0.45 + (i % 9) * 0.34,
        speed: 0.14 + (i % 4) * 0.05,
        scale: 0.65 + (i % 5) * 0.18,
      };
      moteSeeds.push(seed);
      _dummy.position.set(
        Math.cos(seed.angle) * seed.radius,
        seed.y,
        Math.sin(seed.angle) * seed.radius
      );
      _dummy.scale.setScalar(seed.scale);
      _dummy.updateMatrix();
      motes.setMatrixAt(i, _dummy.matrix);
      _moteColor.setHSL(0.08 + (i % 6) * 0.04, 0.78, 0.66);
      motes.setColorAt(i, _moteColor);
    }
    motes.instanceMatrix.needsUpdate = true;
    if (motes.instanceColor) motes.instanceColor.needsUpdate = true;
    motes.computeBoundingSphere();
    motes.frustumCulled = false;
    scene.add(motes);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // ResizeObserver for crisp container fitting
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 620;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObs = new ResizeObserver(onResize);
    resizeObs.observe(container);

    // Paced 60fps / software-WebGL afterDraw animation loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Gentle diorama float & globe spin
      if (autoSpinRef.current) {
        dioramaGroup.rotation.y += dt * 0.24;
      }
      globePivot.rotation.y += dt * 0.32;
      cardGroup.position.y = 1.72 + Math.sin(elapsed * 1.4) * 0.045;

      // Move jetliner along curved flight path
      const jetT = (elapsed * 0.22) % 1;
      flightCurve.getPointAt(jetT, _jetPos);
      flightCurve.getPointAt(Math.min(0.999, jetT + 0.02), _jetLook);
      jetliner.position.copy(_jetPos);
      jetliner.lookAt(_jetLook);

      // Update ambient instanced bokeh motes
      for (let i = 0; i < moteCount; i++) {
        const s = moteSeeds[i];
        const a = s.angle + elapsed * s.speed;
        _dummy.position.set(
          Math.cos(a) * s.radius,
          s.y + Math.sin(elapsed * 1.2 + i) * 0.08,
          Math.sin(a) * s.radius
        );
        _dummy.rotation.set(elapsed * 0.4 + i, elapsed * 0.6, 0);
        _dummy.scale.setScalar(s.scale);
        _dummy.updateMatrix();
        motes.setMatrixAt(i, _dummy.matrix);
      }
      motes.instanceMatrix.needsUpdate = true;

      // Smooth damped camera preset transitions
      const preset = cameraPresetTargetRef.current;
      if (preset.active) {
        _camGoal.set(preset.pos[0], preset.pos[1], preset.pos[2]);
        _targetGoal.set(preset.target[0], preset.target[1], preset.target[2]);
        const factor = 1 - Math.exp(-5.5 * dt);
        camera.position.lerp(_camGoal, factor);
        controls.target.lerp(_targetGoal, factor);
        if (
          camera.position.distanceTo(_camGoal) < 0.03 &&
          controls.target.distanceTo(_targetGoal) < 0.03
        ) {
          preset.active = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      resizeObs.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            if (!mat) return;
            for (const val of Object.values(mat)) {
              if (val && (val as THREE.Texture).isTexture) {
                (val as THREE.Texture).dispose();
              }
            }
            mat.dispose();
          });
        }
      });
      envTarget.dispose();
      renderer.dispose();
    };
  }, []);

  // Dynamically update live boarding pass texture, globe finish, and studio backdrop when spec/theme changes
  React.useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const frontMat = ticketFrontMatRef.current;
    const globeMat = globeMatRef.current;
    const accentMat = accentMatRef.current;
    if (!renderer || !scene || !frontMat) return;

    const palette = MARKETING_PASS_THEMES[spec.themeId];
    scene.background = new THREE.Color(palette.sceneBgHex);
    scene.fog = new THREE.FogExp2(palette.sceneBgHex, 0.042);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const nextCanvas = drawBoardingPassTextureCanvas(spec);
    const nextTex = new THREE.CanvasTexture(nextCanvas);
    nextTex.colorSpace = THREE.SRGBColorSpace;
    nextTex.anisotropy = maxAniso;
    const oldTex = frontMat.map;
    frontMat.map = nextTex;
    frontMat.needsUpdate = true;
    oldTex?.dispose();

    if (globeMat) {
      const { map, roughnessMap } = createProceduralGlobeTexture(spec.themeId);
      map.anisotropy = maxAniso;
      const oldMap = globeMat.map;
      const oldRough = globeMat.roughnessMap;
      globeMat.map = map;
      globeMat.roughnessMap = roughnessMap;
      globeMat.needsUpdate = true;
      oldMap?.dispose();
      oldRough?.dispose();
    }

    if (accentMat) {
      accentMat.color.setHex(palette.metalHex);
    }
  }, [spec]);

  const selectPreset = (id: CameraPresetId) => {
    setActivePreset(id);
    cameraPresetTargetRef.current = {
      pos: CAMERA_PRESETS[id].pos,
      target: CAMERA_PRESETS[id].target,
      active: true,
    };
  };

  return (
    <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-slate-200 bg-[#0B0E15] select-none">
      {/* Dedicated empty ref container for Three.js WebGL canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Optional 9:16 TikTok / IG Reels safe-crop guide overlay */}
      {frameGuide === '9:16' && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-full aspect-[9/16] border-x border-dashed border-white/45 relative">
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#0F172A]/85 text-[10px] font-semibold tracking-wider text-white uppercase">
              9:16 TikTok / Reels Crop
            </span>
          </div>
        </div>
      )}

      {/* Minimal top-left semantic label (solid rgba surface, no backdrop-filter over WebGL) */}
      <div className="pointer-events-none absolute top-3.5 left-4 z-10 flex items-center gap-3">
        <div className="bg-[#0F172A]/90 border border-white/15 rounded-xl px-3.5 py-2 text-white">
          <div className="text-xs font-bold tracking-tight">
            Whisk 3D Boarding Pass Stage
          </div>
          <div className="text-[11px] text-slate-300 tabular-nums">
            {spec.originCode} → {spec.destCode} · Drag to orbit · Scroll to zoom
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="absolute top-3.5 right-4 z-10 bg-[#0F172A]/95 border border-white/15 text-white text-xs font-medium px-3.5 py-2 rounded-xl">
          {statusMessage}
        </div>
      )}

      {contextLost && (
        <div className="absolute inset-0 z-20 bg-[#0B0E15] flex flex-col items-center justify-center text-white p-6 text-center">
          <p className="text-sm font-semibold">3D WebGL context paused.</p>
          <p className="text-xs text-slate-400 mt-1">
            Switch tabs or reload to restore interactive 3D rendering.
          </p>
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock (Zero Viewport Occlusion, solid rgba, no backdrop-filter) */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 w-[min(920px,94%)] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="mb-1.5 px-3 py-1 rounded-lg bg-[#0F172A]/92 border border-white/15 text-[11px] font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          {dockOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          <span>{dockOpen ? 'Hide Controls' : 'Show Controls'}</span>
        </button>

        {dockOpen && (
          <div className="w-full bg-[#0F172A]/94 border border-white/15 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-white">
            {/* Theme Swatches */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
              {(Object.values(MARKETING_PASS_THEMES)).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    spec.themeId === t.id
                      ? 'bg-white text-slate-900'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Camera Presets */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
              {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetId) => (
                <button
                  key={presetId}
                  type="button"
                  onClick={() => selectPreset(presetId)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    activePreset === presetId
                      ? 'bg-white/20 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {CAMERA_PRESETS[presetId].label}
                </button>
              ))}
            </div>

            {/* Aspect Guide + Spin */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFrameGuide((g) => (g === '9:16' ? '16:9' : '9:16'))}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
              >
                Crop: {frameGuide}
              </button>
              <button
                type="button"
                onClick={() => setAutoSpin((s) => !s)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  autoSpin ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>Spin</span>
              </button>
            </div>

            {/* Export & Gemini Handoff Actions */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                className="px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>
              <button
                type="button"
                onClick={handleRecordTurntable}
                disabled={recording}
                className="px-3 py-1.5 rounded-lg bg-[#D94E34] hover:bg-[#c54229] text-white text-[11px] font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{recording ? 'Recording 6s...' : 'Record 6s Reel'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const frame = captureStagePng();
                  if (frame) onSendFrameToImageEditor(frame);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Edit AI</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const frame = captureStagePng();
                  if (frame) onSendFrameToVideo(frame);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Animate AI</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
