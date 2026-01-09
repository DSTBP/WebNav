import {
  liquidMetalFragmentShader,
  ShaderMount
} from 'https://esm.sh/@paper-design/shaders';

const DEFAULT_UNIFORMS = {
  u_repetition: 1.5,
  u_softness: 0.5,
  u_shiftRed: 0.3,
  u_shiftBlue: 0.3,
  u_distortion: 0,
  u_contour: 0,
  u_angle: 100,
  u_scale: 1.5,
  u_shape: 1,
  u_offsetX: 0.1,
  u_offsetY: -0.1
};

function mountLiquidMetal(targetId, uniforms = {}) {
  const container =
    typeof targetId === 'string' ? document.getElementById(targetId) : targetId;

  if (!container || container.dataset.liquidMounted === 'true') {
    return;
  }

  try {
    new ShaderMount(
      container,
      liquidMetalFragmentShader,
      { ...DEFAULT_UNIFORMS, ...uniforms },
      undefined,
      0.6
    );
    container.dataset.liquidMounted = 'true';
  } catch (error) {
    console.warn('[LiquidMetal] Failed to mount shader:', error);
  }
}

window.WebNavLiquidMetal = window.WebNavLiquidMetal || {};
window.WebNavLiquidMetal.mount = (targetId, uniforms) =>
  mountLiquidMetal(targetId, uniforms);

window.dispatchEvent(new CustomEvent('webnav:liquid-metal-ready'));

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () =>
    mountLiquidMetal('back-to-top-liquid')
  );
} else {
  mountLiquidMetal('back-to-top-liquid');
}
