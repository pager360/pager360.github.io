// --- Enable mouse-wheel horizontal scrolling on a carousel element ---
function enableHorizontalWheelScroll(el) {
  if (!el) return;
  el.addEventListener('wheel', (e) => {
    // Translate vertical wheel movement into horizontal scrolling so the
    // scene carousels can be scrolled with a standard mouse wheel.
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }, { passive: false });
}

// --- Depth Comparison (Image Slider) ---
function initDepthComparison() {
  const container = document.getElementById('depth-viewer-left-container');
  if (!container) return;

  const leftImage = document.getElementById('depth-viewer-left');
  const rightImage = document.getElementById('depth-viewer-right');
  const slider = document.getElementById('depth-slider');
  const sliderLine = document.getElementById('depth-slider-line');
  const exampleSelector = document.getElementById('depth-example-selector');
  const competitorSelector = document.getElementById('depth-competitor-selector');
  const rightLabel = document.getElementById('depth-label-right');

  // Define Examples
  const examples = [
    { id: 'example_1', name: 'Venice', path: 'assets/images/data/depth_comparisons/example_1' },
    { id: 'example_2', name: 'Johannesburg', path: 'assets/images/data/depth_comparisons/example_2' },
    { id: 'example_3', name: 'Church', path: 'assets/images/data/depth_comparisons/example_3' },
    { id: 'example_4', name: 'Living Room', path: 'assets/images/data/depth_comparisons/example_4' },
    { id: 'example_5', name: 'Matterport3D', path: 'assets/images/data/depth_comparisons/example_5' },
    { id: 'example_6', name: 'Stanford Lobby', path: 'assets/images/data/depth_comparisons/example_6' },
    { id: 'example_7', name: 'Franklinstrasse', path: 'assets/images/data/depth_comparisons/example_7' },
    { id: 'example_8', name: 'Velopalast', path: 'assets/images/data/depth_comparisons/example_8' },
    { id: 'example_9', name: 'Office', path: 'assets/images/data/depth_comparisons/example_9' },
    { id: 'example_10', name: 'Conference Room', path: 'assets/images/data/depth_comparisons/example_10' },
    { id: 'example_11', name: 'Basilica', path: 'assets/images/data/depth_comparisons/example_11' },
    { id: 'example_12', name: 'Mansion', path: 'assets/images/data/depth_comparisons/example_12' },
  ];

  // We compare against the strongest scale-invariant competitor (DA²) and the
  // strongest metric-depth competitor (DAP), plus the input RGB panorama.
  const competitors = [
    { id: 'da2', name: 'DA²', file: 'da2.jpg' },
    { id: 'dap', name: 'DAP', file: 'dap.jpg' },
    { id: 'rgb', name: 'RGB', file: 'rgb.jpg' },
  ];

  let currentExample = examples.findIndex(e => e.name === 'Stanford Lobby');
  if (currentExample < 0) currentExample = 0;
  let currentCompetitor = 0; // Default to first competitor (DA²)

  function updateImages() {
    const example = examples[currentExample];
    const competitor = competitors[currentCompetitor];

    // Ours is left (clipped), competitor is right (background)
    leftImage.src = `${example.path}/ours.jpg`;
    rightImage.src = `${example.path}/${competitor.file}`;

    if (rightLabel) rightLabel.innerText = competitor.name;

    updateExampleUI();
    updateCompetitorUI();
  }

  function updateExampleUI() {
    const buttons = exampleSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === currentExample) {
        btn.classList.add('ring-2', 'ring-blue-600', 'opacity-100', 'shadow-md');
        btn.classList.remove('opacity-70', 'hover:opacity-100', 'shadow-sm');
      } else {
        btn.classList.remove('ring-2', 'ring-blue-600', 'opacity-100', 'shadow-md');
        btn.classList.add('opacity-70', 'hover:opacity-100', 'shadow-sm');
      }
    });
  }

  function updateCompetitorUI() {
    const buttons = competitorSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === currentCompetitor) {
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
      } else {
        btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
      }
    });
  }

  // Generate Example UI
  examples.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 w-20 h-14 rounded-md bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none relative overflow-hidden`;
    btn.style.backgroundImage = `url('${item.path}/rgb.jpg')`;
    btn.title = item.name;
    btn.onclick = () => {
      currentExample = index;
      updateImages();
    };

    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-[9px] text-white font-bold drop-shadow-md bg-gradient-to-t from-black/80 to-transparent';
    span.innerText = item.name;
    btn.appendChild(span);

    exampleSelector.appendChild(btn);
  });

  // Generate Competitor UI
  competitors.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors shadow-sm`;
    btn.title = item.name;
    btn.innerText = item.name;
    btn.onclick = () => {
      currentCompetitor = index;
      updateImages();
    };
    competitorSelector.appendChild(btn);
  });

  // Enable wheel scrolling through the scene carousel
  enableHorizontalWheelScroll(exampleSelector);

  // Slider Logic
  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      container.style.width = `${val}%`;
      sliderLine.style.left = `${val}%`;
    });
  }

  // Handle Resize and Initial Layout — keep the clipped "ours" image the same
  // rendered width as the full background so the two halves line up.
  const wrapper = document.getElementById('depth-viewer-wrapper');
  function updateLayout() {
    if (wrapper && leftImage) {
      leftImage.style.width = `${wrapper.clientWidth}px`;
    }
  }

  // Initial Load
  updateImages();
  updateLayout();

  const resizeObserver = new ResizeObserver(() => {
    updateLayout();
  });
  if (wrapper) {
    resizeObserver.observe(wrapper);
  }
}

// --- Normal Comparison (Image Slider) ---
function initNormalComparison() {
  const container = document.getElementById('normal-viewer-left-container');
  if (!container) return;

  const leftImage = document.getElementById('normal-viewer-left');
  const rightImage = document.getElementById('normal-viewer-right');
  const slider = document.getElementById('normal-slider');
  const sliderLine = document.getElementById('normal-slider-line');
  const exampleSelector = document.getElementById('normal-example-selector');
  const competitorSelector = document.getElementById('normal-competitor-selector');
  const rightLabel = document.getElementById('normal-label-right');

  // Define Examples
  const examples = [
    { id: 'example_1', name: 'Marble Lounge', path: 'assets/images/data/normals_comparisons/example_1' },
    { id: 'example_2', name: 'Skyline Loft', path: 'assets/images/data/normals_comparisons/example_2' },
    { id: 'example_3', name: 'Floral Suite', path: 'assets/images/data/normals_comparisons/example_3' },
    { id: 'example_4', name: 'Wood Apartment', path: 'assets/images/data/normals_comparisons/example_4' },
    { id: 'example_5', name: 'Sage Bedroom', path: 'assets/images/data/normals_comparisons/example_5' },
    { id: 'example_6', name: 'Forest Deck', path: 'assets/images/data/normals_comparisons/example_6' }
  ];

  const competitors = [
    { id: 'mtl', name: 'MTL', file: 'MTL.jpg' },
    { id: 'rgb', name: 'RGB', file: 'rgb.jpg' },
  ];

  let currentExample = 0;
  let currentCompetitor = 0;

  function updateImages() {
    const example = examples[currentExample];
    const competitor = competitors[currentCompetitor];

    // Ours is left
    leftImage.src = `${example.path}/ours.jpg`;

    // Competitor is right
    rightImage.src = `${example.path}/${competitor.file}`;

    // Update label
    if (rightLabel) rightLabel.innerText = competitor.name;

    // Update UI Toggles
    updateExampleUI();
    updateCompetitorUI();
  }

  function updateExampleUI() {
    const buttons = exampleSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === currentExample) {
        btn.classList.add('ring-2', 'ring-purple-600', 'opacity-100', 'shadow-md');
        btn.classList.remove('opacity-70', 'hover:opacity-100', 'shadow-sm');
      } else {
        btn.classList.remove('ring-2', 'ring-purple-600', 'opacity-100', 'shadow-md');
        btn.classList.add('opacity-70', 'hover:opacity-100', 'shadow-sm');
      }
    });
  }

  function updateCompetitorUI() {
    const buttons = competitorSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === currentCompetitor) {
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
      } else {
        btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
      }
    });
  }

  // Generate Example UI
  examples.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 w-20 h-14 rounded-md bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none relative overflow-hidden`;
    btn.style.backgroundImage = `url('${item.path}/rgb.jpg')`;
    btn.title = item.name;
    btn.onclick = () => {
      currentExample = index;
      updateImages();
    };

    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-[9px] text-white font-bold drop-shadow-md bg-gradient-to-t from-black/80 to-transparent';
    span.innerText = item.name;
    btn.appendChild(span);

    exampleSelector.appendChild(btn);
  });

  // Generate Competitor UI
  competitors.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors shadow-sm`;
    btn.title = item.name;
    btn.innerText = item.name;
    btn.onclick = () => {
      currentCompetitor = index;
      updateImages();
    };
    competitorSelector.appendChild(btn);
  });

  // Slider Logic
  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = e.target.value;
      container.style.width = `${val}%`;
      sliderLine.style.left = `${val}%`;
    });
  }

  // Handle Resize and Initial Layout
  const wrapper = document.getElementById('normal-viewer-wrapper');
  function updateLayout() {
    if (wrapper && leftImage) {
      leftImage.style.width = `${wrapper.clientWidth}px`;
    }
  }

  // Enable wheel scrolling through the scene carousel
  enableHorizontalWheelScroll(exampleSelector);

  // Initial
  updateImages();
  updateLayout();

  // Resize Observer
  const resizeObserver = new ResizeObserver(() => {
    updateLayout();
  });
  if (wrapper) {
    resizeObserver.observe(wrapper);
  }
}


// --- Point Cloud Comparison (Three.js + GLB) ---
function initPointCloudComparison() {
  const container = document.getElementById('viewer-cloud');
  const selectorContainer = document.getElementById('cloud-selector');
  const competitorSelector = document.getElementById('cloud-competitor-selector');
  const rgbImage = document.getElementById('cloud-rgb-image');
  if (!container || !selectorContainer || !competitorSelector) return;

  container.innerHTML = '';

  // Split viewer halves
  const leftHalf = document.createElement('div');
  leftHalf.className = 'viewer-half';
  const leftLabel = document.createElement('div');
  leftLabel.className = 'viewer-label';
  leftLabel.innerText = 'PaGeR (Ours)';
  leftHalf.appendChild(leftLabel);

  const rightHalf = document.createElement('div');
  rightHalf.className = 'viewer-half';
  const rightLabel = document.createElement('div');
  rightLabel.className = 'viewer-label';
  rightLabel.innerText = 'Competitor';
  rightHalf.appendChild(rightLabel);

  container.appendChild(leftHalf);
  container.appendChild(rightHalf);

  const scenes = [
    { id: 'PanoInTheWild_venice_sunset', name: 'Venice' },
    { id: 'PanoInTheWild_livingroom_generated', name: 'Living Room' },
    { id: 'PanoInTheWild_industrial_generated', name: 'Industrial Hall' },
    { id: 'PanoInTheWild_20250703_100502_622', name: 'Campus Plaza' },
    { id: 'PanoInTheWild_19', name: 'Train Station' },
    { id: 'ZuriPano_Franklinstrasse-_s008', name: 'Franklinstrasse' },
    { id: 'ZuriPano_Freilagerstrasse-_s010', name: 'Freilagerstrasse' },
    { id: 'Matterport3D360_1e860d820a754b15a68ec56bd7cdd451', name: 'Pool Terrace' },
    { id: 'Matterport3D360_7f4f8df6c0de4998992a5f1951a1bb64', name: 'Open-Plan Villa' },
    { id: 'Matterport3D360_d9f19697d1524359a371bc0435213f43', name: 'Home Office' },
    { id: 'Matterport3D360_f051a244b87b4fde9575decf98a122cd', name: 'Mansion' },
    { id: 'Matterport3D360_f65d4fa347954fa0ba90f535f6b9bda3', name: 'Holiday Bedroom' },
  ];

  const competitors = [
    { id: 'da2', name: 'DA²', file: 'DA2.glb' },
    { id: 'dap', name: 'DAP', file: 'DAP.glb' },
  ];

  let currentScene = scenes.findIndex(s => s.name === 'Franklinstrasse');
  if (currentScene < 0) currentScene = 0;
  let currentCompetitor = 0;

  function createViewer(containerElement) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1A1C1E');

    const camera = new THREE.PerspectiveCamera(50, containerElement.clientWidth / containerElement.clientHeight, 0.01, 1000);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerElement.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    const resizeObserver = new ResizeObserver(() => {
      if (containerElement.clientWidth > 0 && containerElement.clientHeight > 0) {
        camera.aspect = containerElement.clientWidth / containerElement.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
      }
    });
    resizeObserver.observe(containerElement);

    return { scene, camera, renderer, controls, resizeObserver, currentObject: null, container: containerElement };
  }

  const leftViewer = createViewer(leftHalf);
  const rightViewer = createViewer(rightHalf);

  // Sync the two cameras
  let isSyncingLeft = false, isSyncingRight = false;
  leftViewer.controls.addEventListener('change', () => {
    if (isSyncingRight) return;
    isSyncingLeft = true;
    rightViewer.camera.position.copy(leftViewer.camera.position);
    rightViewer.camera.quaternion.copy(leftViewer.camera.quaternion);
    rightViewer.controls.target.copy(leftViewer.controls.target);
    isSyncingLeft = false;
  });
  rightViewer.controls.addEventListener('change', () => {
    if (isSyncingLeft) return;
    isSyncingRight = true;
    leftViewer.camera.position.copy(rightViewer.camera.position);
    leftViewer.camera.quaternion.copy(rightViewer.camera.quaternion);
    leftViewer.controls.target.copy(rightViewer.controls.target);
    isSyncingRight = false;
  });

  const loader = new THREE.GLTFLoader();
  const cache = {};
  // Per-scene normalization (scale + offset) seeded by ours.glb so DAP/DA2
  // share the same world transform and the manual alignment is preserved.
  const sceneNorm = {};

  function loadGlbToViewer(viewer, filePath, key, sceneId) {
    if (viewer.currentObject) {
      viewer.scene.remove(viewer.currentObject);
      viewer.currentObject = null;
    }

    if (cache[key]) {
      placeObject(viewer, cache[key], sceneId);
      return Promise.resolve();
    }

    viewer.container.style.cursor = 'wait';
    return new Promise((resolve) => {
      loader.load(filePath,
        (gltf) => {
          viewer.container.style.cursor = 'default';
          cache[key] = gltf.scene;
          placeObject(viewer, gltf.scene, sceneId);
          resolve();
        },
        undefined,
        (err) => {
          console.error('GLB load failed:', filePath, err);
          viewer.container.style.cursor = 'default';
          resolve();
        }
      );
    });
  }

  function placeObject(viewer, root, sceneId) {
    // Detach from any previous parent (only one viewer holds it at a time).
    if (root.parent) root.parent.remove(root);

    // Compute scene-level normalization ONCE from the first model loaded for
    // a scene (ours.glb, by call order in loadScene), then reuse for DAP/DA2
    // so they share the world frame and the manual alignment is preserved.
    let n = sceneNorm[sceneId];
    if (!n) {
      // Reset any cached transform from a previous scene before measuring.
      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const s = maxDim > 0 ? 2.0 / maxDim : 1;
      n = { scale: s, offset: center.clone().multiplyScalar(-s) };
      sceneNorm[sceneId] = n;
      console.log('[pcl] seed sceneNorm', sceneId,
                  'bbox center=', center.toArray().map(v => +v.toFixed(2)),
                  'size=', size.toArray().map(v => +v.toFixed(2)),
                  '-> scale=', s.toFixed(4),
                  'offset=', n.offset.toArray().map(v => +v.toFixed(2)));
    } else {
      console.log('[pcl] reuse sceneNorm', sceneId,
                  'scale=', n.scale.toFixed(4),
                  'offset=', n.offset.toArray().map(v => +v.toFixed(2)));
    }
    root.scale.setScalar(n.scale);
    root.position.copy(n.offset);

    // Ensure point primitives are visible and use vertex colors from the GLB.
    root.traverse(o => {
      if (o.isPoints && o.material) {
        o.material.size = 0.01;
        o.material.sizeAttenuation = true;
        o.material.vertexColors = true;
        o.material.needsUpdate = true;
      }
    });

    viewer.scene.add(root);
    viewer.currentObject = root;
  }

  function loadScene() {
    const sceneData = scenes[currentScene];
    const competitor = competitors[currentCompetitor];
    const base = `assets/images/data/pointclouds_comparisons/${sceneData.id}`;

    // Serialize: ours first so its bbox seeds the scene normalization, then
    // load the competitor with the same transform.
    loadGlbToViewer(leftViewer, `${base}/ours.glb`,
                    `${sceneData.id}_ours`, sceneData.id)
      .then(() => loadGlbToViewer(
        rightViewer, `${base}/${competitor.file}`,
        `${sceneData.id}_${competitor.id}`, sceneData.id));

    if (rgbImage) rgbImage.src = `${base}/rgb.jpg`;
    rightLabel.innerText = competitor.name;

    updateSceneUI();
    updateCompetitorUI();
  }

  function updateSceneUI() {
    const buttons = selectorContainer.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === currentScene) {
        btn.classList.add('ring-2', 'ring-emerald-600', 'opacity-100', 'shadow-md');
        btn.classList.remove('opacity-70', 'hover:opacity-100', 'shadow-sm');
      } else {
        btn.classList.remove('ring-2', 'ring-emerald-600', 'opacity-100', 'shadow-md');
        btn.classList.add('opacity-70', 'hover:opacity-100', 'shadow-sm');
      }
    });
  }

  function updateCompetitorUI() {
    const buttons = competitorSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === currentCompetitor) {
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
      } else {
        btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600');
      }
    });
  }

  // Build scene UI
  scenes.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 w-20 h-14 rounded-md bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none relative overflow-hidden`;
    btn.style.backgroundImage = `url('assets/images/data/pointclouds_comparisons/${item.id}/rgb.jpg')`;
    btn.title = item.name;
    btn.onclick = () => {
      currentScene = index;
      loadScene();
      startAutoRotate();
    };
    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-[9px] text-white font-bold drop-shadow-md bg-gradient-to-t from-black/80 to-transparent';
    span.innerText = item.name;
    btn.appendChild(span);
    selectorContainer.appendChild(btn);
  });

  // Build competitor UI
  competitors.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors shadow-sm`;
    btn.title = item.name;
    btn.innerText = item.name;
    btn.onclick = () => {
      currentCompetitor = index;
      loadScene();
    };
    competitorSelector.appendChild(btn);
  });

  enableHorizontalWheelScroll(selectorContainer);

  // Auto-rotate until the user touches a viewer — then stop until the next scene.
  function stopAutoRotate() {
    leftViewer.controls.autoRotate = false;
    rightViewer.controls.autoRotate = false;
  }
  function startAutoRotate() {
    leftViewer.controls.autoRotate = true;
    rightViewer.controls.autoRotate = true;
  }
  // OrbitControls (r128) natively treats Ctrl/Meta/Shift + left-drag as pan
  // when mouseButtons.LEFT is ROTATE (the default), so no extra wiring needed.
  [leftViewer, rightViewer].forEach(viewer => {
    viewer.controls.autoRotate = true;
    viewer.controls.autoRotateSpeed = 1.0;
    viewer.renderer.domElement.addEventListener('pointerdown', stopAutoRotate);
    viewer.renderer.domElement.addEventListener('wheel', stopAutoRotate, { passive: true });
  });

  // Lazy-load GLBs on first scroll-into-view and pause rendering while the
  // viewer is off-screen, so the teaser video isn't competing with this
  // section for bandwidth or GPU.
  let viewerVisible = false;
  let hasLoadedOnce = false;
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      viewerVisible = entry.isIntersecting;
      if (viewerVisible && !hasLoadedOnce) {
        hasLoadedOnce = true;
        loadScene();
      }
    });
  }, { rootMargin: '400px 0px' });
  visibilityObserver.observe(container);

  function animate() {
    requestAnimationFrame(animate);
    if (!viewerVisible) return;
    leftViewer.controls.update();
    leftViewer.renderer.render(leftViewer.scene, leftViewer.camera);
    rightViewer.controls.update();
    rightViewer.renderer.render(rightViewer.scene, rightViewer.camera);
  }
  animate();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initDepthComparison();
  initNormalComparison();
  initPointCloudComparison();
});