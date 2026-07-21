// La Caravana Creativa — Valoración
// Gate de claves: dueños vs. compradores.
//
// Hashes generados con:
//   echo -n ELEFANTE2026 | shasum -a 256
//   echo -n CARAVANA2026 | shasum -a 256
const HASH_OWNER = '45b3d9cde53e4ec5ca83b4567ab32eaae68cc33f09b91e439cae05c49bd49c87';
const HASH_BUYER = 'b755b5d9055a97da3e2f5255842a078bd198dc6ee5938f5f4fd1548245c2dc77';

const SESSION_KEY = 'lacaravana_mode';

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Compara SHA-256 hex de input.toUpperCase() contra HASH_OWNER / HASH_BUYER.
// Devuelve 'owner' | 'buyer' | null.
async function checkKey(input) {
  const hash = await sha256Hex(input.toUpperCase());
  if (hash === HASH_OWNER) return 'owner';
  if (hash === HASH_BUYER) return 'buyer';
  return null;
}

// Agrega clase mode-owner / mode-buyer a <body> y muestra la app.
function showView(mode) {
  document.body.classList.remove('mode-owner', 'mode-buyer');
  document.body.classList.add(mode === 'owner' ? 'mode-owner' : 'mode-buyer');

  const keyScreen = document.getElementById('key-screen');
  const app = document.getElementById('app');
  if (keyScreen) keyScreen.hidden = true;
  if (app) app.hidden = false;

  // Pinta las secciones 1-4 (definidas en js/render.js) tras pasar el gate.
  if (typeof renderAll === 'function') renderAll();
  // Pinta las secciones 5-7 (normalización, valoración, rango — js/valuation.js).
  if (typeof renderValoracionTodo === 'function') renderValoracionTodo();
}

function initKeyGate() {
  const form = document.getElementById('key-form');
  const input = document.getElementById('key-input');
  const error = document.getElementById('key-error');

  // Modo persiste en sessionStorage: si ya hay uno válido, saltar la pantalla de clave.
  const savedMode = sessionStorage.getItem(SESSION_KEY);
  if (savedMode === 'owner' || savedMode === 'buyer') {
    showView(savedMode);
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // crypto.subtle solo existe en contextos seguros (HTTPS o localhost). Al
    // abrir el archivo directamente (file://) es `undefined` y checkKey()
    // reventaría con un TypeError poco claro — se avisa con un mensaje
    // entendible en vez de dejar que la promesa rechace en silencio.
    if (!crypto.subtle) {
      error.textContent = 'Abre el sitio vía servidor local (python3 -m http.server) o HTTPS — el navegador bloquea crypto en file://';
      error.hidden = false;
      return;
    }

    const mode = await checkKey(input.value);
    if (mode) {
      sessionStorage.setItem(SESSION_KEY, mode);
      error.hidden = true;
      showView(mode);
    } else {
      error.hidden = false;
      input.value = '';
      input.focus();
    }
  });
}

document.addEventListener('DOMContentLoaded', initKeyGate);
