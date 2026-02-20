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
    controls.autoRotate = false; // Start with autoRotate disabled
    controls.autoRotateSpeed = 0.5;

    // Auto-rotation with inactivity timeout
    let autoRotateTimeout;
    let isUserDragging = false;
    const INACTIVITY_TIME = 10000; // 10 seconds in milliseconds

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
        btn.classList.add('ring-4', 'ring-md-sys-color-primary', 'opacity-100');
        btn.classList.remove('opacity-70', 'hover:opacity-100');
      } else {
        btn.classList.remove('ring-4', 'ring-md-sys-color-primary', 'opacity-100');
        btn.classList.add('opacity-70', 'hover:opacity-100');
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
        btn.classList.add('ring-4', 'ring-md-sys-color-primary', 'opacity-100');
        btn.classList.remove('opacity-70', 'hover:opacity-100');
      } else {
        btn.classList.remove('ring-4', 'ring-md-sys-color-primary', 'opacity-100');
        btn.classList.add('opacity-70', 'hover:opacity-100');
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
    btn.className = `flex-shrink-0 w-24 h-16 rounded-lg bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none`;
    btn.style.backgroundImage = `url('${item.path}/rgb.jpg')`;
    btn.title = item.name;
    btn.onclick = () => loadExample(index);

    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-xs text-white font-bold drop-shadow-md bg-gradient-to-t from-black/60 to-transparent rounded-lg';
    span.innerText = item.name;
    btn.appendChild(span);

    exampleSelector.appendChild(btn);
  });

  // Generate Competitor UI (excluding "Ours")
  competitors.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 px-4 py-2 rounded-lg bg-md-sys-color-secondaryContainer text-md-sys-color-onSecondaryContainer transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none font-medium text-sm`;
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


// --- Point Cloud Viewer (Three.js) ---
function initPointCloud() {
  const container = document.getElementById('viewer-cloud');
  const selectorContainer = document.getElementById('cloud-selector');
  if (!container || !selectorContainer) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1A1C1E');

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 1, 3);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Create geometry
  const particles = 15000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particles * 3);
  const colors = new Float32Array(particles * 3);
  const color = new THREE.Color();

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({ size: 0.015, vertexColors: true });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Scenes Data
  const cloudScenes = [
    { id: 'torus', name: 'Torus', thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Torus.png/320px-Torus.png' },
    { id: 'sphere', name: 'Sphere', thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Sphere_wireframe.svg/320px-Sphere_wireframe.svg.png' },
    { id: 'cube', name: 'Cube', thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Necker_cube.svg/320px-Necker_cube.svg.png' }
  ];

  // Update Geometry Function
  function updateParticles(type) {
    const posArray = points.geometry.attributes.position.array;
    const colArray = points.geometry.attributes.color.array;

    for (let i = 0; i < particles; i++) {
      let x, y, z;

      if (type === 'torus') {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const r = 1.0 + Math.random() * 0.2;
        x = (2 + r * Math.cos(v)) * Math.cos(u) * 0.5;
        y = (2 + r * Math.cos(v)) * Math.sin(u) * 0.5;
        z = r * Math.sin(v) * 0.5;

        const vy = (y + 1) / 2;
        color.setHSL(0.6 + (vy * 0.2), 0.8, 0.6);

      } else if (type === 'sphere') {
        const u = Math.random() * Math.PI * 2;
        const v = Math.acos(2 * Math.random() - 1);
        const r = 1.2 + Math.random() * 0.05;
        x = r * Math.sin(v) * Math.cos(u);
        y = r * Math.sin(v) * Math.sin(u);
        z = r * Math.cos(v);

        color.setRGB((x + 1.2) / 2.4, (y + 1.2) / 2.4, (z + 1.2) / 2.4);

      } else if (type === 'cube') {
        x = (Math.random() - 0.5) * 2.5;
        y = (Math.random() - 0.5) * 2.5;
        z = (Math.random() - 0.5) * 2.5;

        color.setHSL(Math.abs(x * y * z), 0.7, 0.5);
      }

      // Update Position Buffer
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      // Update Color Buffer
      colArray[i * 3] = color.r;
      colArray[i * 3 + 1] = color.g;
      colArray[i * 3 + 2] = color.b;
    }

    points.geometry.attributes.position.needsUpdate = true;
    points.geometry.attributes.color.needsUpdate = true;
  }

  function loadCloudScene(index) {
    updateParticles(cloudScenes[index].id);

    // Update UI
    const buttons = selectorContainer.querySelectorAll('button');
    buttons.forEach((btn, idx) => {
      if (idx === index) {
        btn.classList.add('ring-4', 'ring-md-sys-color-primary', 'opacity-100');
        btn.classList.remove('opacity-70', 'hover:opacity-100');
      } else {
        btn.classList.remove('ring-4', 'ring-md-sys-color-primary', 'opacity-100');
        btn.classList.add('opacity-70', 'hover:opacity-100');
      }
    });
  }

  // Generate UI
  cloudScenes.forEach((item, index) => {
    const btn = document.createElement('button');
    btn.className = `flex-shrink-0 w-24 h-16 rounded-lg bg-cover bg-center transition-all duration-200 border border-gray-200 shadow-sm opacity-70 hover:opacity-100 focus:outline-none bg-white`;
    btn.style.backgroundImage = `url('${item.thumb}')`;
    btn.style.backgroundSize = 'contain';
    btn.style.backgroundRepeat = 'no-repeat';
    btn.title = item.name;
    btn.onclick = () => loadCloudScene(index);

    const span = document.createElement('span');
    span.className = 'block w-full h-full flex items-end justify-center pb-1 text-xs text-gray-800 font-bold drop-shadow-sm bg-gradient-to-t from-white/90 to-transparent rounded-lg';
    span.innerText = item.name;
    btn.appendChild(span);

    selectorContainer.appendChild(btn);
  });

  // Initial Load
  loadCloudScene(0);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.002;
    points.rotation.x += 0.001;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    if (container.clientWidth > 0 && container.clientHeight > 0) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  init360();
  initPointCloud();
});