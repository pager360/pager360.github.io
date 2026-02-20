// ---  d360 Viewer (Three.js) with Split Screen Comparison ---
function init360() {
  const container = document.getElementById('viewer-depth-split');
  const exampleSelector = document.getElementById('depth-example-selector');
  const competitorSelector = document.getElementById('depth-competitor-selector');
  if (!container || !exampleSelector || !competitorSelector) return;

  // Define Examples
  const examples = [
    { id: 'example_1', name: 'Example 1', path: 'assets/images/data/depth_comparisons/example_1' },
    { id: 'example_2', name: 'Example 2', path: 'assets/images/data/depth_comparisons/example_2' },
    { id: 'example_3', name: 'Example 3', path: 'assets/images/data/depth_comparisons/example_3' },
    { id: 'example_4', name: 'Example 4', path: 'assets/images/data/depth_comparisons/example_4' },
    { id: 'example_5', name: 'Example 5', path: 'assets/images/data/depth_comparisons/example_5' },
    { id: 'example_6', name: 'Example 6', path: 'assets/images/data/depth_comparisons/example_6' },
  ];

  const competitors = [
    { id: 'dreamcube', name: 'DreamCube', file: 'dreamcube.jpg' },
    { id: 'panda', name: 'Panda', file: 'panda.jpg' },
    { id: 'unik3d', name: 'Unik3D', file: 'unik3d.jpg' },
  ];

  let currentExample = 0;
  let currentCompetitor = 0; // Default to first competitor (DreamCube)

  // Create split viewer containers
  const leftHalf = document.createElement('div');
  leftHalf.className = 'viewer-half';
  const leftLabel = document.createElement('div');
  leftLabel.className = 'viewer-label';
  leftLabel.innerText = 'PaGeR (Ours) - Left Side';
  leftHalf.appendChild(leftLabel);

  const rightHalf = document.createElement('div');
  rightHalf.className = 'viewer-half';
  const rightLabel = document.createElement('div');
  rightLabel.className = 'viewer-label';
  rightLabel.innerText = competitors[currentCompetitor].name;
  rightHalf.appendChild(rightLabel);

  container.appendChild(leftHalf);
  container.appendChild(rightHalf);

  // Setup Two Three.js Scenes with synced controls
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');

  function createViewer(containerElement) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, containerElement.clientWidth / containerElement.clientHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerElement.clientWidth, containerElement.clientHeight);
    renderer.setClearColor(0x000000, 1);
    containerElement.appendChild(renderer.domElement);

    // Inverted Sphere
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: null, color: 0xffffff });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.set(0, 0, 0.1);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.rotateSpeed = -0.5;
    controls.autoRotate = true; // Start with autoRotate enabled
    controls.autoRotateSpeed = 0.5;

    // Auto-rotation with inactivity timeout
    let autoRotateTimeout;
    let isUserDragging = false;
    const INACTIVITY_TIME = 3000; // 3 seconds in milliseconds

    function enableAutoRotate() {
      if (!isUserDragging) {
        controls.autoRotate = true;
      }
    }

    function resetAutoRotateTimer() {
      controls.autoRotate = false;
      clearTimeout(autoRotateTimeout);
      autoRotateTimeout = setTimeout(enableAutoRotate, INACTIVITY_TIME);
    }

    // Listen for user drag start/end
    renderer.domElement.addEventListener('mousedown', () => {
      isUserDragging = true;
      resetAutoRotateTimer();
    });

    renderer.domElement.addEventListener('mouseup', () => {
      isUserDragging = false;
      resetAutoRotateTimer();
    });

    renderer.domElement.addEventListener('touchstart', () => {
      isUserDragging = true;
      resetAutoRotateTimer();
    });

    renderer.domElement.addEventListener('touchend', () => {
      isUserDragging = false;
      resetAutoRotateTimer();
    });

    // Initial timer to enable auto-rotation after 10 seconds
    autoRotateTimeout = setTimeout(enableAutoRotate, INACTIVITY_TIME);

    // Animation Loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle Resize
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
      sphere,
      material,
      renderer,
      controls,
      camera,
      resizeObserver
    };
  }

  const leftViewer = createViewer(leftHalf);
  const rightViewer = createViewer(rightHalf);

  // Sync cameras - when left viewer controls change, update right viewer
  leftViewer.controls.addEventListener('change', () => {
    rightViewer.camera.position.copy(leftViewer.camera.position);
    rightViewer.camera.quaternion.copy(leftViewer.camera.quaternion);
  });

  // Load textures for both viewers
  function loadExample(exampleIndex) {
    currentExample = exampleIndex;
    const example = examples[exampleIndex];

    // Load "Ours" for left side
    const ourUrl = `${example.path}/ours.jpg`;
    textureLoader.load(ourUrl,
      function (tex) {
        leftViewer.sphere.material.map = tex;
        leftViewer.sphere.material.needsUpdate = true;
      },
      undefined,
      function (err) {
        console.error("Error loading ours texture from", ourUrl, err);
        loadFallbackGrid(leftViewer.sphere.material);
      }
    );

    // Load competitor for right side
    loadCompetitor(currentCompetitor);

    // Update example UI
    const buttons = exampleSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === exampleIndex) {
        btn.classList.add('ring-2', 'ring-blue-600', 'opacity-100', 'shadow-md');
        btn.classList.remove('opacity-70', 'hover:opacity-100', 'shadow-sm');
      } else {
        btn.classList.remove('ring-2', 'ring-blue-600', 'opacity-100', 'shadow-md');
        btn.classList.add('opacity-70', 'hover:opacity-100', 'shadow-sm');
      }
    });
  }

  function loadCompetitor(competitorIndex) {
    currentCompetitor = competitorIndex;
    const competitor = competitors[competitorIndex];
    const example = examples[currentExample];
    const compUrl = `${example.path}/${competitor.file}`;

    // Update right label
    rightLabel.innerText = competitor.name;

    textureLoader.load(compUrl,
      function (tex) {
        rightViewer.sphere.material.map = tex;
        rightViewer.sphere.material.needsUpdate = true;
      },
      undefined,
      function (err) {
        console.error("Error loading competitor texture from", compUrl, err);
        loadFallbackGrid(rightViewer.sphere.material);
      }
    );

    // Update competitor UI
    const buttons = competitorSelector.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === competitorIndex) {
        btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
      } else {
        btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-50');
        btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
      }
    });
  }

  function loadFallbackGrid(material) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#102040';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#406090';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }
    for (let i = 0; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Image Load Failed", 256, 128);

    const fallbackTex = new THREE.CanvasTexture(canvas);
    material.map = fallbackTex;
    material.needsUpdate = true;
  }

  // Generate Example UI
  examples.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 w-20 h-14 rounded-md bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none relative overflow-hidden`;
    btn.style.backgroundImage = `url('${item.path}/rgb.jpg')`;
    btn.title = item.name;
    btn.onclick = () => loadExample(index);

    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-[9px] text-white font-bold drop-shadow-md bg-gradient-to-t from-black/80 to-transparent';
    span.innerText = item.name;
    btn.appendChild(span);

    exampleSelector.appendChild(btn);
  });

  // Generate Competitor UI (excluding "Ours")
  competitors.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-colors shadow-sm`;
    btn.title = item.name;
    btn.innerText = item.name;
    btn.onclick = () => loadCompetitor(index);
    competitorSelector.appendChild(btn);
  });

  // Reset button
  const resetBtn = document.getElementById('depth-reset-btn');
  if (resetBtn) {
    resetBtn.onclick = () => {
      currentExample = 0;
      currentCompetitor = 0;
      loadExample(0);

      // Reset camera to initial position
      leftViewer.controls.reset();
      rightViewer.controls.reset();
      leftViewer.camera.position.set(0, 0, 0.1);
      rightViewer.camera.position.set(0, 0, 0.1);
      leftViewer.camera.quaternion.set(0, 0, 0, 1);
      rightViewer.camera.quaternion.set(0, 0, 0, 1);
    };
  }

  // Initial Load
  loadExample(0);
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
    { id: 'example_1', name: 'Example 1', path: 'assets/images/data/normals_comparisons/example_1' },
    { id: 'example_2', name: 'Example 2', path: 'assets/images/data/normals_comparisons/example_2' },
    { id: 'example_3', name: 'Example 3', path: 'assets/images/data/normals_comparisons/example_3' }
  ];

  const competitors = [
    { id: 'mtl', name: 'MTL', file: 'MTL.jpg' }
    // Add more if available
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
    updateUI();
  }

  function updateUI() {
    // Example Buttons
    exampleSelector.innerHTML = '';
    examples.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = `flex-shrink-0 w-20 h-14 rounded-md bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none relative overflow-hidden`;
      btn.style.backgroundImage = `url('${item.path}/rgb.jpg')`;
      btn.onclick = () => {
        currentExample = index;
        updateImages();
      };

      const span = document.createElement('span');
      span.className = 'block w-full h-full flex items-end justify-center pb-1 text-[9px] text-white font-bold drop-shadow-md bg-gradient-to-t from-black/80 to-transparent';
      span.innerText = item.name;

      btn.appendChild(span);

      if (index === currentExample) {
        btn.classList.add('ring-2', 'ring-purple-600', 'opacity-100', 'shadow-md');
        btn.classList.remove('opacity-70', 'hover:opacity-100', 'shadow-sm');
      } else {
        btn.classList.remove('ring-2', 'ring-purple-600', 'opacity-100', 'shadow-md');
        btn.classList.add('opacity-70', 'hover:opacity-100', 'shadow-sm');
      }

      exampleSelector.appendChild(btn);
    });
  }

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
  init360();
  initNormalComparison();
  initPointCloud();
});