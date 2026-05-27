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

  let currentExample = 0;
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
    { id: 'example_1', name: 'Indoor 1', path: 'assets/images/data/normals_comparisons/example_1' },
    { id: 'example_2', name: 'Indoor 2', path: 'assets/images/data/normals_comparisons/example_2' },
    { id: 'example_3', name: 'Indoor 3', path: 'assets/images/data/normals_comparisons/example_3' },
    { id: 'example_4', name: 'Indoor 4', path: 'assets/images/data/normals_comparisons/example_4' },
    { id: 'example_5', name: 'Indoor 5', path: 'assets/images/data/normals_comparisons/example_5' },
    { id: 'example_6', name: 'Balcony', path: 'assets/images/data/normals_comparisons/example_6' }
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


// --- Point Cloud Viewer (Three.js) ---
// --- Point Cloud Viewer (Three.js) ---
function initPointCloud() {
  const container = document.getElementById('viewer-cloud');
  const selectorContainer = document.getElementById('cloud-selector');
  if (!container || !selectorContainer) return;

  // Clear container
  container.innerHTML = '';

  // Create UI Structure
  const leftHalf = document.createElement('div');
  leftHalf.className = 'viewer-half';
  const leftLabel = document.createElement('div');
  leftLabel.className = 'viewer-label';
  leftLabel.innerText = 'Color Point Cloud';
  leftHalf.appendChild(leftLabel);

  const rightHalf = document.createElement('div');
  rightHalf.className = 'viewer-half';
  const rightLabel = document.createElement('div');
  rightLabel.className = 'viewer-label';
  rightLabel.innerText = 'Normal Point Cloud';
  rightHalf.appendChild(rightLabel);

  container.appendChild(leftHalf);
  container.appendChild(rightHalf);

  // Helper to create a viewer instance
  function createViewer(containerElement) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1A1C1E');

    const camera = new THREE.PerspectiveCamera(50, containerElement.clientWidth / containerElement.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerElement.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 2, 3);
    scene.add(dirLight);

    // Resize Handler
    const resizeObserver = new ResizeObserver(() => {
      if (containerElement.clientWidth > 0 && containerElement.clientHeight > 0) {
        camera.aspect = containerElement.clientWidth / containerElement.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
      }
    });
    resizeObserver.observe(containerElement);

    return {
      scene,
      camera,
      renderer,
      controls,
      resizeObserver,
      currentPoints: null,
      container: containerElement
    };
  }

  const leftViewer = createViewer(leftHalf);
  const rightViewer = createViewer(rightHalf);

  // Sync Controls
  let isSyncingLeft = false;
  let isSyncingRight = false;

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

  // Data
  const cloudScenes = [
    {
      id: 'blue_photostudio',
      name: 'Blue Photostudio',
      file: 'blue_photostudio.ply',
      thumb: 'assets/images/data/pointclouds/images/blue_photo_studio.jpg'
    },
    {
      id: 'office2',
      name: 'Office',
      file: 'office2_rand2.ply',
      thumb: 'assets/images/data/pointclouds/images/office_2_rand2.jpg'
    },
    {
      id: 'peppermint_powerplant',
      name: 'Powerplant',
      file: 'peppermint_powerplant.ply',
      thumb: 'assets/images/data/pointclouds/images/peppermint_powerplant_2.jpg'
    },
    {
      id: 'symmetrical_garden',
      name: 'Garden',
      file: 'symmetrical_garden.ply',
      thumb: 'assets/images/data/pointclouds/images/symmetrical_garden_02.jpg'
    }
  ];

  const loader = new THREE.PLYLoader();
  const cache = {}; // Cache loaded geometries

  function loadPlyToViewer(viewer, filePath, id) {
    // Cleanup previous
    if (viewer.currentPoints) {
      viewer.scene.remove(viewer.currentPoints);
      if (viewer.currentPoints.material) viewer.currentPoints.material.dispose();
      // Only dispose geometry if not cached
      if (!cache[id] && viewer.currentPoints.geometry) {
        viewer.currentPoints.geometry.dispose();
      }
      viewer.currentPoints = null;
    }

    // Check cache
    if (cache[id]) {
      setupPoints(viewer, cache[id], id);
      return;
    }

    viewer.container.style.cursor = 'wait';

    loader.load(
      filePath,
      (geometry) => {
        viewer.container.style.cursor = 'default';
        cache[id] = geometry;
        setupPoints(viewer, geometry, id);
      },
      undefined,
      (error) => {
        console.error('Error loading PLY:', filePath, error);
        viewer.container.style.cursor = 'default';
      }
    );
  }

  function setupPoints(viewer, geometry, id) {
    geometry.computeBoundingBox();

    // We only center/scale ONCE per geometry.
    if (!geometry.userData.centered) {
      const box = geometry.boundingBox;
      const center = new THREE.Vector3();
      box.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2.0 / maxDim;
      geometry.scale(scale, scale, scale);

      geometry.userData.centered = true;
    }

    const material = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    // points.rotation.z = -Math.PI / 2;
    points.rotation.y = -Math.PI / 2; // Align with X axis
    points.userData = { id: id };

    viewer.scene.add(points);
    viewer.currentPoints = points;
  }

  function loadCloudScene(index) {
    const sceneData = cloudScenes[index];
    const rgbPath = `assets/images/data/pointclouds/rgb/${sceneData.file}`;
    const normalPath = `assets/images/data/pointclouds/normal/${sceneData.file}`;

    // Update UI
    const buttons = selectorContainer.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === index) {
        btn.classList.add('ring-2', 'ring-emerald-600', 'opacity-100', 'shadow-md');
        btn.classList.remove('opacity-70', 'hover:opacity-100', 'shadow-sm');
      } else {
        btn.classList.remove('ring-2', 'ring-emerald-600', 'opacity-100', 'shadow-md');
        btn.classList.add('opacity-70', 'hover:opacity-100', 'shadow-sm');
      }
    });

    // Load to both viewers
    // We use distinct cache keys for rgb vs normal
    loadPlyToViewer(leftViewer, rgbPath, sceneData.id + '_rgb');
    loadPlyToViewer(rightViewer, normalPath, sceneData.id + '_normal');
  }

  // Generate UI Buttons
  cloudScenes.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 w-20 h-14 rounded-md bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none relative overflow-hidden`;
    // We use a div for the background image to ensure it covers properly
    btn.style.backgroundImage = `url('${item.thumb}')`;
    btn.onclick = () => loadCloudScene(index);

    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-[9px] text-white font-bold drop-shadow-md bg-gradient-to-t from-black/80 to-transparent';
    span.innerText = item.name;

    btn.appendChild(span);

    selectorContainer.appendChild(btn);
  });

  // Enable wheel scrolling through the scene carousel
  enableHorizontalWheelScroll(selectorContainer);

  // Initial Load
  loadCloudScene(0);

  // Animation Loop
  // Auto-rotate logic
  let autoRotateTimer;
  const AUTOROTATE_DELAY = 3000;

  function stopAutoRotate() {
    clearTimeout(autoRotateTimer);
    leftViewer.controls.autoRotate = false;
    rightViewer.controls.autoRotate = false;
  }

  function startAutoRotate() {
    leftViewer.controls.autoRotate = true;
    rightViewer.controls.autoRotate = true;
  }

  function resetTimer() {
    stopAutoRotate();
    autoRotateTimer = setTimeout(startAutoRotate, AUTOROTATE_DELAY);
  }

  [leftViewer, rightViewer].forEach(viewer => {
    viewer.controls.autoRotate = true;
    viewer.controls.autoRotateSpeed = 1.0;

    viewer.renderer.domElement.addEventListener('mousedown', stopAutoRotate);
    viewer.renderer.domElement.addEventListener('mouseup', resetTimer);
    viewer.renderer.domElement.addEventListener('touchstart', stopAutoRotate);
    viewer.renderer.domElement.addEventListener('touchend', resetTimer);
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Auto-rotate handled by OrbitControls now

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
  initPointCloud();
});