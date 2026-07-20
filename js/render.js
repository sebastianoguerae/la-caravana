// La Caravana Creativa — Valoración
// Renderizado de las secciones 1-4 (empresa, foto financiera, activos, marcas).
//
// Convención: cada sección tiene una función pura buildXxxHTML() que arma un
// string de HTML a partir de DATA (sin tocar `document`, testeable desde Node),
// y una función renderXxx() que la inyecta en el DOM y engancha interacción
// (tooltips). Todas las cifras salen de DATA — nunca se inventan ni se
// hardcodean números en este archivo.
//
// Paleta del gráfico (barras/línea) validada con la skill `dataviz` contra la
// superficie oscura del sitio (#1c1c24): naranja #d95926 (ingresos),
// verde #199e70 (utilidad positiva), rojo #e66767 (utilidad negativa/pérdida).
// node scripts/validate_palette.js "#d95926,#199e70,#e66767" --mode dark --surface "#1c1c24"
// → todos los checks PASS (CVD adyacente en banda 6-8, por eso se refuerza con
// forma distinta -barra vs. línea- y con leyenda + valores directos).

// ---------------------------------------------------------------------------
// Formato de moneda COP: "$193,6M" / "−$16,1M" (millones, coma decimal).
// ---------------------------------------------------------------------------
function formatCOP(n) {
  const negative = n < 0;
  const abs = Math.abs(n);
  const millions = abs / 1000000;
  const rounded = Math.round(millions * 10) / 10;
  const str = rounded.toFixed(1).replace('.', ',');
  return (negative ? '−$' : '$') + str + 'M';
}

// Formato compacto para etiquetas de eje (sin signo $, sin decimal si es entero).
function formatAxisCOP(n) {
  const negative = n < 0;
  const abs = Math.abs(n);
  const millions = abs / 1000000;
  const rounded = Math.round(millions * 10) / 10;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  const str = isWhole ? String(Math.round(rounded)) : rounded.toFixed(1).replace('.', ',');
  return (negative ? '−' : '') + str + 'M';
}

// Redondea un dominio [min,max] a un paso "bonito" (1/2/5/10 * 10^n) con ~targetTicks marcas.
function niceDomain(minVal, maxVal, targetTicks) {
  const ticks = targetTicks || 6;
  const range = (maxVal - minVal) || 1;
  const rawStep = range / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  let step;
  if (norm < 1.5) step = 1 * mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const niceMin = Math.floor(minVal / step) * step;
  const niceMax = Math.ceil(maxVal / step) * step;
  return { min: niceMin, max: niceMax, step: step };
}

// ---------------------------------------------------------------------------
// Sección 2 — gráfico SVG: barras de ingresos + línea de utilidad (2015-2025).
// Un solo eje Y compartido (misma unidad, COP) — nunca doble eje.
// ---------------------------------------------------------------------------
function buildFinancieraChartSVG(serie) {
  const width = 760;
  const height = 380;
  const marginTop = 20;
  const marginRight = 20;
  const marginBottom = 40;
  const marginLeft = 64;
  const innerW = width - marginLeft - marginRight;
  const innerH = height - marginTop - marginBottom;

  const values = [];
  serie.forEach(function (d) { values.push(d.ingresos, d.utilidad, 0); });
  const rawMin = Math.min.apply(null, values);
  const rawMax = Math.max.apply(null, values);
  const domain = niceDomain(rawMin, rawMax, 6);

  function yScale(v) {
    return marginTop + innerH * (domain.max - v) / (domain.max - domain.min);
  }
  const y0 = yScale(0);

  const n = serie.length;
  const band = innerW / n;
  const barW = Math.min(24, band * 0.5);

  // Gridlines + etiquetas de eje Y.
  let gridSvg = '';
  for (let t = domain.min; t <= domain.max + 1e-6; t += domain.step) {
    const tRounded = Math.round(t);
    const y = yScale(tRounded);
    const isZero = tRounded === 0;
    gridSvg += '<line x1="' + marginLeft + '" x2="' + (width - marginRight) + '" y1="' + y + '" y2="' + y +
      '" class="' + (isZero ? 'chart-axis-zero' : 'chart-grid') + '"></line>';
    gridSvg += '<text x="' + (marginLeft - 10) + '" y="' + (y + 4) + '" class="chart-axis-label" text-anchor="end">' +
      formatAxisCOP(tRounded) + '</text>';
  }

  // Barras (ingresos) + etiquetas de año + puntos de la línea (utilidad).
  let barsSvg = '';
  let axisLabelsSvg = '';
  const points = [];
  serie.forEach(function (d, i) {
    const cx = marginLeft + band * i + band / 2;
    const barX = cx - barW / 2;
    const yTop = yScale(d.ingresos);
    const r = 4;
    barsSvg += '<path class="chart-bar" tabindex="0" role="img" ' +
      'aria-label="Ingresos ' + d.anio + ': ' + formatCOP(d.ingresos) + '" ' +
      'data-year="' + d.anio + '" data-value="' + d.ingresos + '" data-series="ingresos" d="' +
      'M ' + barX + ' ' + y0 +
      ' L ' + barX + ' ' + (yTop + r) +
      ' Q ' + barX + ' ' + yTop + ' ' + (barX + r) + ' ' + yTop +
      ' L ' + (barX + barW - r) + ' ' + yTop +
      ' Q ' + (barX + barW) + ' ' + yTop + ' ' + (barX + barW) + ' ' + (yTop + r) +
      ' L ' + (barX + barW) + ' ' + y0 + ' Z"></path>';

    axisLabelsSvg += '<text x="' + cx + '" y="' + (height - marginBottom + 20) + '" class="chart-axis-label" text-anchor="middle">' +
      d.anio + '</text>';

    points.push({ x: cx, y: yScale(d.utilidad), value: d.utilidad, anio: d.anio });
  });

  // Segmentos de línea coloreados por signo del punto de destino + marcadores.
  let lineSvg = '';
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cls = p1.value < 0 ? 'chart-line-negative' : 'chart-line-positive';
    lineSvg += '<line x1="' + p0.x + '" y1="' + p0.y + '" x2="' + p1.x + '" y2="' + p1.y +
      '" class="chart-line-segment ' + cls + '"></line>';
  }
  points.forEach(function (p) {
    const cls = p.value < 0 ? 'chart-point-negative' : 'chart-point-positive';
    lineSvg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="4.5" class="chart-point ' + cls + '" tabindex="0" role="img" ' +
      'aria-label="Utilidad ' + p.anio + ': ' + formatCOP(p.value) + '" ' +
      'data-year="' + p.anio + '" data-value="' + p.value + '" data-series="utilidad"></circle>';
  });

  return '<svg class="chart-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-labelledby="chartFinTitle chartFinDesc">' +
    '<title id="chartFinTitle">Ingresos y utilidad 2015-2025</title>' +
    '<desc id="chartFinDesc">Barras: ingresos anuales. Línea: utilidad del ejercicio; los tramos y puntos en rojo marcan años de pérdida.</desc>' +
    gridSvg + barsSvg + axisLabelsSvg + lineSvg +
    '</svg>';
}

// ---------------------------------------------------------------------------
// Sección 1 — La empresa
// ---------------------------------------------------------------------------
function buildEmpresaHTML() {
  const e = DATA.empresa;
  const servicios = DATA.servicios.map(function (s) {
    return '<li class="pill">' + s + '</li>';
  }).join('');
  const ciudades = DATA.ciudades.map(function (c) {
    return '<li class="badge">' + c + '</li>';
  }).join('');

  return (
    '<h2>1. La empresa</h2>' +
    '<p class="section-lead">' + e.nombre + ' crea experiencias fotográficas para eventos desde ' + e.fundacion +
    ', operando en ' + DATA.ciudades.join(', ') + '.</p>' +
    '<blockquote class="quote-callout">Una foto es un tiquete de regreso a un momento que de otra forma no volverá.</blockquote>' +
    '<h3>Servicios</h3>' +
    '<ul class="pill-grid">' + servicios + '</ul>' +
    '<h3>Ciudades donde opera</h3>' +
    '<ul class="badge-row">' + ciudades + '</ul>' +
    '<h3>Datos básicos</h3>' +
    '<dl class="meta-grid">' +
      '<dt>Nombre</dt><dd>' + e.nombre + '</dd>' +
      '<dt>NIT</dt><dd>' + e.nit + '</dd>' +
      '<dt>Tipo de sociedad</dt><dd>' + e.tipoSociedad + '</dd>' +
      '<dt>Fundada en</dt><dd>' + e.fundacion + '</dd>' +
      '<dt>Representante legal</dt><dd>' + e.representanteLegal + '</dd>' +
      '<dt>Sitio web</dt><dd><a href="https://' + e.web + '" target="_blank" rel="noopener">' + e.web + '</a></dd>' +
      '<dt>Email</dt><dd><a href="mailto:' + e.contactoEmail + '">' + e.contactoEmail + '</a></dd>' +
      '<dt>WhatsApp</dt><dd>' + e.whatsapp + '</dd>' +
    '</dl>'
  );
}

// ---------------------------------------------------------------------------
// Sección 2 — Foto financiera
// ---------------------------------------------------------------------------
function buildFinancieraHTML() {
  const serie = DATA.serieHistorica;
  const y2025 = serie.filter(function (d) { return d.anio === 2025; })[0];
  const y2019 = serie.filter(function (d) { return d.anio === 2019; })[0];

  const chartSvg = buildFinancieraChartSVG(serie);
  const accessibleRows = serie.map(function (d) {
    return '<tr><td>' + d.anio + '</td><td>' + formatCOP(d.ingresos) + '</td><td>' + formatCOP(d.utilidad) + '</td></tr>';
  }).join('');

  const kpis =
    '<div class="kpi-grid">' +
      '<div class="kpi-card"><span class="kpi-label">Ingresos 2025</span>' +
        '<span class="kpi-value">' + formatCOP(y2025.ingresos) + '</span></div>' +
      '<div class="kpi-card"><span class="kpi-label">Resultado contable 2025</span>' +
        '<span class="kpi-value kpi-negative">' + formatCOP(y2025.utilidad) + '</span></div>' +
      '<div class="kpi-card"><span class="kpi-label">Pico histórico de ingresos (2019)</span>' +
        '<span class="kpi-value">' + formatCOP(y2019.ingresos) + '</span></div>' +
    '</div>';

  // Tabla A — ingresos por línea de servicio, 2025 vs. 2024 (ambas vistas).
  const linea2025 = DATA.pygDetalle[2025].ingresosPorLinea;
  const linea2024 = DATA.pygDetalle[2024].ingresosPorLinea;
  const lineaLabels = {
    photoBooth: 'Photo Booth',
    photoBoothNoGravada: 'Photo Booth (no gravada)',
    servicioHashtagSpot: 'Hashtag Spot',
    accesoriosAdicionales: 'Accesorios adicionales',
    mirrorBooth: 'Espejo Mágico (Mirror Booth)',
    auroraBooth: 'Aurora Booth',
    video360: 'Video 360',
    anilloFiestero: 'Anillo Fiestero',
    boomerang180: 'Boomerang 180',
    ventaKitAlbum: 'Venta kit álbum',
    comboMarcos: 'Combo marcos',
    transporteAlmacenamiento: 'Transporte y almacenamiento',
    devolucionesEnVentas: 'Devoluciones en ventas',
  };
  const filaLineas = Object.keys(linea2025).map(function (k) {
    const v2024 = Object.prototype.hasOwnProperty.call(linea2024, k) ? linea2024[k] : 0;
    return '<tr><td>' + (lineaLabels[k] || k) + '</td><td>' + formatCOP(linea2025[k]) + '</td><td>' + formatCOP(v2024) + '</td></tr>';
  }).join('');

  const tablaLineas =
    '<div class="table-scroll">' +
      '<table class="pyg-table">' +
        '<thead><tr><th>Línea de servicio</th><th>2025</th><th>2024</th></tr></thead>' +
        '<tbody>' + filaLineas +
          '<tr class="pyg-total"><td>Total ingresos operacionales</td>' +
            '<td>' + formatCOP(DATA.pygDetalle[2025].ingresosOperacionales) + '</td>' +
            '<td>' + formatCOP(DATA.pygDetalle[2024].ingresosOperacionales) + '</td></tr>' +
        '</tbody>' +
      '</table>' +
    '</div>';

  // Tabla B — totales comparativos 2023-2025, incluida la utilidad (ambas vistas: transparencia).
  const anios = [2023, 2024, 2025];
  function filaTotal(label, campo) {
    return '<tr><td>' + label + '</td>' + anios.map(function (a) {
      return '<td>' + formatCOP(DATA.pygDetalle[a][campo]) + '</td>';
    }).join('') + '</tr>';
  }
  const filaUtilidad = '<tr class="pyg-total pyg-result"><td>Utilidad del ejercicio (resultado contable)*</td>' +
    anios.map(function (a) {
      const v = DATA.pygDetalle[a].utilidad;
      return '<td' + (v < 0 ? ' class="negative"' : '') + '>' + formatCOP(v) + '</td>';
    }).join('') + '</tr>';

  const tablaTotales =
    '<div class="table-scroll">' +
      '<table class="pyg-table">' +
        '<thead><tr><th>Concepto</th><th>2023</th><th>2024</th><th>2025</th></tr></thead>' +
        '<tbody>' +
          filaTotal('Ingresos operacionales', 'ingresosOperacionales') +
          filaTotal('Total costos', 'totalCostos') +
          filaTotal('Total gastos', 'totalGastos') +
          filaUtilidad +
        '</tbody>' +
      '</table>' +
    '</div>';

  // Notas de transparencia — discrepancias documentadas entre fuentes (ambas vistas).
  const notasDisclosure =
    '<details class="notes-disclosure">' +
      '<summary>* Notas y discrepancias entre fuentes</summary>' +
      '<ul>' + DATA.notas.discrepancias.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
    '</details>';

  // Tabla C — detalle de gastos principales línea a línea (solo dueños).
  const gastoLabels = {
    personal: 'Personal',
    honorarios: 'Honorarios',
    impuestos: 'Impuestos',
    arrendamientos: 'Arrendamientos',
    seguros: 'Seguros',
    servicios: 'Servicios',
    legales: 'Legales',
    mantenimientoReparaciones: 'Mantenimiento y reparaciones',
    gastosDeViaje: 'Gastos de viaje',
    depreciaciones: 'Depreciaciones',
    diversos: 'Diversos',
    otros: 'Otros',
  };
  const filaGastos = Object.keys(gastoLabels).map(function (k) {
    return '<tr><td>' + gastoLabels[k] + '</td>' + anios.map(function (a) {
      const obj = DATA.pygDetalle[a].gastosPrincipales;
      const has = obj && Object.prototype.hasOwnProperty.call(obj, k);
      return '<td>' + (has ? formatCOP(obj[k]) : '—') + '</td>';
    }).join('') + '</tr>';
  }).join('');
  const tablaGastos =
    '<div class="table-scroll">' +
      '<table class="pyg-table">' +
        '<thead><tr><th>Concepto</th><th>2023</th><th>2024</th><th>2025</th></tr></thead>' +
        '<tbody>' + filaGastos + '</tbody>' +
      '</table>' +
    '</div>';

  return (
    '<h2>2. Foto financiera</h2>' +
    '<p class="section-lead">Serie histórica de ingresos y utilidad, 2015-2025.</p>' +
    '<div class="chart-card">' +
      '<p class="chart-unit-note">Cifras en millones de COP.</p>' +
      chartSvg +
      '<div class="chart-legend">' +
        '<span class="legend-item"><span class="legend-swatch swatch-ingresos"></span>Ingresos (barras)</span>' +
        '<span class="legend-item"><span class="legend-swatch swatch-positivo"></span>Utilidad positiva (línea)</span>' +
        '<span class="legend-item"><span class="legend-swatch swatch-negativo"></span>Utilidad en pérdida (línea)</span>' +
      '</div>' +
      '<table class="sr-only chart-data-table"><caption>Ingresos y utilidad por año</caption>' +
        '<thead><tr><th>Año</th><th>Ingresos</th><th>Utilidad</th></tr></thead>' +
        '<tbody>' + accessibleRows + '</tbody></table>' +
    '</div>' +
    kpis +
    '<h3>Ingresos por línea de servicio — 2025 vs. 2024</h3>' +
    tablaLineas +
    '<h3>Totales comparativos 2023-2025</h3>' +
    tablaTotales +
    notasDisclosure +
    '<div class="owner-only">' +
      '<h3>Detalle de gastos principales (solo dueños)</h3>' +
      tablaGastos +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Sección 3 — Activos, la base del negocio
// ---------------------------------------------------------------------------
function buildActivosHTML() {
  const cards = DATA.equipos.map(function (eq) {
    return '<div class="equipo-card">' +
      '<div class="equipo-head"><h3>' + eq.nombre + '</h3><span class="equipo-qty">×' + eq.cantidad + '</span></div>' +
      '<p>' + eq.descripcion + '</p>' +
    '</div>';
  }).join('');

  return (
    '<h2>3. Activos — la base del negocio</h2>' +
    '<p class="section-lead">La base del negocio: equipos profesionales listos para operar.</p>' +
    '<div class="equipos-grid">' + cards + '</div>'
  );
}

// ---------------------------------------------------------------------------
// Sección 4 — Marcas que son clientes
// ---------------------------------------------------------------------------
function buildMarcasHTML() {
  const marcas = (DATA.empresa && DATA.empresa.marcas) || DATA.marcas || [];
  const body = marcas.length === 0
    ? '<div class="marca-placeholder">Portafolio de clientes corporativos — logos por confirmar.</div>'
    : '<div class="marcas-grid">' + marcas.map(function (m) { return '<div class="marca-item">' + m + '</div>'; }).join('') + '</div>';

  return '<h2>4. Marcas que son clientes</h2>' + body;
}

// ---------------------------------------------------------------------------
// Wrappers DOM — inyectan el HTML en su <section> y enganchan interacción.
// ---------------------------------------------------------------------------
function renderEmpresa() {
  const el = document.getElementById('empresa');
  if (el) el.innerHTML = buildEmpresaHTML();
}

function renderFinanciera() {
  const el = document.getElementById('foto-financiera');
  if (!el) return;
  el.innerHTML = buildFinancieraHTML();
  initChartTooltip(el);
}

function renderActivos() {
  const el = document.getElementById('activos');
  if (el) el.innerHTML = buildActivosHTML();
}

function renderMarcas() {
  const el = document.getElementById('marcas-clientes');
  if (el) el.innerHTML = buildMarcasHTML();
}

// Tooltip compartido para barras/puntos del gráfico financiero.
function initChartTooltip(container) {
  let tooltip = document.getElementById('chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'chart-tooltip';
    tooltip.className = 'chart-tooltip';
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
  }
  const marks = container.querySelectorAll('[data-year][data-value]');
  marks.forEach(function (mark) {
    function show(evt) {
      const year = mark.getAttribute('data-year');
      const value = parseFloat(mark.getAttribute('data-value'));
      const series = mark.getAttribute('data-series') === 'ingresos' ? 'Ingresos' : 'Utilidad';
      tooltip.textContent = year + ' · ' + series + ': ' + formatCOP(value);
      tooltip.hidden = false;
      const point = evt.touches ? evt.touches[0] : evt;
      tooltip.style.left = (point.clientX + 12) + 'px';
      tooltip.style.top = (point.clientY + 12) + 'px';
    }
    function hide() { tooltip.hidden = true; }
    mark.addEventListener('mouseenter', show);
    mark.addEventListener('mousemove', show);
    mark.addEventListener('mouseleave', hide);
    mark.addEventListener('focus', show);
    mark.addEventListener('blur', hide);
  });
}

// Llama a las cuatro secciones — invocado desde showView() tras el gate de clave.
function renderAll() {
  renderEmpresa();
  renderFinanciera();
  renderActivos();
  renderMarcas();
}
