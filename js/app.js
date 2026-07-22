// La Caravana Creativa — Valoración
// Sin clave de acceso: el sitio abre directo en la vista de dueños.
// La vista de compradores (curada, sin detalle owner-only) se accede con
// el parámetro de URL ?vista=comprador

// Agrega clase mode-owner / mode-buyer a <body> y pinta las secciones.
function showView(mode) {
  document.body.classList.remove('mode-owner', 'mode-buyer');
  document.body.classList.add(mode === 'owner' ? 'mode-owner' : 'mode-buyer');

  // Pinta las secciones 1-4 (definidas en js/render.js).
  if (typeof renderAll === 'function') renderAll();
  // Pinta las secciones 5-7 (normalización, valoración, rango — js/valuation.js).
  if (typeof renderValoracionTodo === 'function') renderValoracionTodo();
}

document.addEventListener('DOMContentLoaded', () => {
  const vista = new URLSearchParams(location.search).get('vista');
  showView(vista === 'comprador' ? 'buyer' : 'owner');
});
