export const renderAmbientSceneHTML = () => `
  <div class="ambient-scene-container" aria-hidden="true">
    <!-- Layer 1: Sky & Sun -->
    <div class="ambient-layer ambient-layer-sky" data-parallax-depth="0.04">
      <div class="ambient-sun"></div>
    </div>

    <!-- Layer 2: Distant Mountains -->
    <div class="ambient-layer" data-parallax-depth="0.08">
      <svg class="ambient-svg-mountains" viewBox="0 0 1440 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path class="ambient-mountains-back" d="M0,420 Q220,320 440,370 T920,310 T1440,360 L1440,600 L0,600 Z" />
      </svg>
    </div>

    <!-- Layer 3: Midground Mountains & Lake Reflection -->
    <div class="ambient-layer" data-parallax-depth="0.14">
      <svg class="ambient-svg-mountains" viewBox="0 0 1440 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path class="ambient-mountains-mid" d="M0,450 Q300,380 600,420 T1180,390 T1440,430 L1440,600 L0,600 Z" />
        <path class="ambient-mountains-near" d="M0,480 Q180,440 380,470 T860,450 T1440,480 L1440,600 L0,600 Z" />
      </svg>
      <div class="ambient-water-plane"></div>
      <div class="ambient-sun-reflection"></div>
    </div>

    <!-- Layer 4: Distant Birds & Foreground Silhouetted Foliage -->
    <div class="ambient-layer" data-parallax-depth="0.22">
      <!-- Distant Birds -->
      <svg class="ambient-birds" width="140" height="70" viewBox="0 0 140 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,25 Q18,18 26,25 Q34,18 42,25" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none" />
        <path d="M60,40 Q66,34 72,40 Q78,34 84,40" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.75" />
        <path d="M105,15 Q110,10 115,15 Q120,10 125,15" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.6" />
      </svg>

      <!-- Foreground Foliage Branch on bottom left -->
      <svg class="ambient-foliage-left" viewBox="0 0 240 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-10,280 Q80,240 120,170 T170,50" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4" />
        <!-- Leaves -->
        <path d="M120,170 C140,150 165,160 160,185 C145,185 130,180 120,170 Z" fill="currentColor" opacity="0.5" />
        <path d="M90,205 C115,190 135,205 130,225 C115,225 100,218 90,205 Z" fill="currentColor" opacity="0.45" />
        <path d="M145,115 C170,95 195,110 190,130 C175,130 155,125 145,115 Z" fill="currentColor" opacity="0.55" />
        <path d="M170,50 C185,30 205,45 200,65 C188,65 178,60 170,50 Z" fill="currentColor" opacity="0.5" />
        <path d="M60,245 C80,230 100,245 95,260 C82,260 70,255 60,245 Z" fill="currentColor" opacity="0.4" />
      </svg>
    </div>
  </div>
`;

export const initParallax = () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const layers = document.querySelectorAll(".ambient-layer[data-parallax-depth]");
  if (!layers.length) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isRunning = true;

  const onMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    // Normalize coordinates from -1 to 1 relative to center
    targetX = (e.clientX / innerWidth - 0.5) * 2;
    targetY = (e.clientY / innerHeight - 0.5) * 2;
  };

  window.addEventListener("mousemove", onMouseMove, { passive: true });

  const render = () => {
    if (!isRunning) return;

    // Linear interpolation (smooth damping)
    currentX += (targetX - currentX) * 0.05;
    currentY += (targetY - currentY) * 0.05;

    layers.forEach((layer) => {
      const depth = parseFloat(layer.getAttribute("data-parallax-depth")) || 0.05;
      const moveX = -(currentX * depth * 35);
      const moveY = -(currentY * depth * 25);
      layer.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    });

    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);

  return () => {
    isRunning = false;
    window.removeEventListener("mousemove", onMouseMove);
  };
};
