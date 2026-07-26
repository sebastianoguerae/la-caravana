// La Caravana Creativa — Valoración interactiva
// Renderizado de las secciones 5-7: Normalización (waterfall), Valoración a 3
// lentes (activos / múltiplo de SDE / DCF) y Rango de valor (barra horizontal).
//
// Misma convención que js/render.js: funciones puras buildXxx...() que arman
// HTML/SVG desde `supuestos` explícito (testeables desde Node con `vm`, sin
// tocar `document`), más wrappers que inyectan en el DOM. Reutiliza
// formatCOP/formatAxisCOP/niceDomain, definidos en js/render.js (cargado antes
// de este archivo en index.html).
//
// Los sliders son owner-only (CSS: body.mode-buyer .owner-only { display:none }
// en css/style.css) — los compradores ven los resultados calculados con los
// valores por defecto de DATA.supuestosDefault y las notas metodológicas, pero
// no pueden mover los controles.
//
// Interactividad: para que arrastrar un slider no se interrumpa (un <input
// type="range"> no debe destruirse/recrearse mientras el usuario lo arrastra),
// cada sección se construye una vez como "shell" (texto fijo + los <input> de
// los sliders) y solo los contenedores internos <div id="...-dynamic"> se
// reemplazan en cada evento 'input' — los <input> nunca se tocan después de
// creados, solo se lee su .value.
//
// Paleta — validada con la skill `dataviz` contra la superficie oscura del
// sitio (--bg-elevated #1c1c24), tomando los slots del octeto categórico de
// referencia de la skill (los mismos de los que, sin saberlo, ya salían
// --chart-bar/--chart-positive/--chart-negative en la Sección 2):
//   Waterfall (Sección 5):
//     node scripts/validate_palette.js "#3987e5,#199e70,#e66767" --mode dark --surface "#1c1c24"
//     → ALL CHECKS PASS (CVD adyacente verde/rojo en banda WARN 6.5 — mismo caso
//       ya documentado y mitigado en el gráfico de la Sección 2: aquí se
//       refuerza con etiquetas de valor directas en cada barra + leyenda +
//       tabla accesible sr-only).
//   Rango de valor (Sección 7):
//     node scripts/validate_palette.js "#3987e5,#d55181,#c98500" --mode dark --surface "#1c1c24"
//     → ALL CHECKS PASS, sin WARN.
// La banda de triangulación en la Sección 7 NO usa un 4º color categórico
// (evita competir con las 3 identidades de lente): es un realce translúcido
// neutro con borde punteado + etiqueta de texto.

// ---------------------------------------------------------------------------
// Estado mutable de los sliders. No toca DATA — se reinicia a los valores por
// defecto de DATA.supuestosDefault en cada carga de página.
// ---------------------------------------------------------------------------
const valState = {
  fueraDeLibros: DATA.supuestosDefault.fueraDeLibros.valor,
  costoReemplazo: DATA.supuestosDefault.costoReemplazo.valor,
  valorActivosTrabajo: DATA.supuestosDefault.valorActivosTrabajo.valor,
  multiploWorking: 2.0,
  tasaDCF: DATA.supuestosDefault.tasaDCF,
};

// Arma un objeto con la misma forma de DATA.supuestosDefault, con los valores
// actuales de los sliders superpuestos. Así calcSDE()/calcValoracion() siempre
// reciben un `supuestos` completo y siguen siendo puras y testeables llamando
// directamente con DATA.supuestosDefault (los defaults).
function getSupuestosConEstado() {
  const base = DATA.supuestosDefault;
  return {
    fueraDeLibros: { valor: valState.fueraDeLibros, rango: base.fueraDeLibros.rango, etiqueta: base.fueraDeLibros.etiqueta },
    addbacks: base.addbacks,
    costoReemplazo: { valor: valState.costoReemplazo, rango: base.costoReemplazo.rango, ownerOnly: base.costoReemplazo.ownerOnly },
    multiploSDE: base.multiploSDE,
    valorActivosTrabajo: { valor: valState.valorActivosTrabajo, rango: base.valorActivosTrabajo.rango },
    valorEquiposUsado: base.valorEquiposUsado,
    valorEquiposNuevo: base.valorEquiposNuevo,
    tasaDCF: valState.tasaDCF,
    escenariosCrecimiento: base.escenariosCrecimiento,
  };
}

// ---------------------------------------------------------------------------
// Cálculos puros — solo usan `supuestos` (misma forma que DATA.supuestosDefault)
// y DATA.serieHistorica. Nunca tocan el DOM.
// ---------------------------------------------------------------------------

// SDE (Seller's Discretionary Earnings) = utilidad contable 2025 + ajustes de
// normalización − costo de reemplazo de la gestión de las socias.
function calcSDE(supuestos) {
  const y2025 = DATA.serieHistorica.filter(function (d) { return d.anio === 2025; })[0];
  return y2025.utilidad
    + supuestos.fueraDeLibros.valor
    + supuestos.addbacks.sueldosSocias
    + supuestos.addbacks.depreciacion
    + supuestos.addbacks.gastosFinancieros
    + supuestos.addbacks.ajusteHonorarios
    - supuestos.costoReemplazo.valor;
}

// DCF de un escenario a 5 años: FCF_t = SDE*(1+g)^t descontado a `tasa`, más
// valor terminal (perpetuidad sin crecimiento adicional) = FCF5/tasa,
// descontado también a 5 años.
function calcDCFEscenario(sde, g, tasa) {
  let vp = 0;
  let fcfT = sde;
  for (let t = 1; t <= 5; t++) {
    fcfT = sde * Math.pow(1 + g, t);
    vp += fcfT / Math.pow(1 + tasa, t);
  }
  const valorTerminal = fcfT / tasa; // fcfT quedó en FCF5 tras el loop
  const vpTerminal = valorTerminal / Math.pow(1 + tasa, 5);
  return vp + vpTerminal;
}

// Valoración a 3 lentes: activos (ancla = valor neto en libros del auxiliar
// de activos fijos, piso = liquidación a precios de reventa US), múltiplo de
// SDE (rango fijo multiploSDE), DCF (3 escenarios), y el rango de
// triangulación resaltado — decisión metodológica 2026-07-21: la banda
// destacada es la lente de múltiplo de SDE completa ([SDE×1.5, SDE×3.0]), la
// lente principal para una Pyme de servicios; se calcula desde `sde` y
// `multiploSDE` (no se hardcodea), y coincide con el rango `multiplo` de abajo.
function calcValoracion(supuestos) {
  const sde = calcSDE(supuestos);
  // Activos: intervalo [piso de liquidación, valor de trabajo]. El piso fijo
  // de liquidación es $28M (reventa a precios US); el valor de trabajo por
  // defecto es el neto en libros del auxiliar (30/06/2026). Se calcula con
  // min/max (no se asume working >= piso) para no romper si el slider baja
  // por debajo de los $28M.
  const pisoLiquidacion = 28000000;
  const working = supuestos.valorActivosTrabajo.valor;
  const activos = [Math.min(pisoLiquidacion, working), Math.max(pisoLiquidacion, working)];
  const multiplo = [sde * supuestos.multiploSDE[0], sde * supuestos.multiploSDE[1]];
  const tasa = supuestos.tasaDCF;
  const esc = supuestos.escenariosCrecimiento;
  const dcf = {
    pesimista: calcDCFEscenario(sde, esc.pesimista, tasa),
    base: calcDCFEscenario(sde, esc.base, tasa),
    optimista: calcDCFEscenario(sde, esc.optimista, tasa),
  };
  const mins = [activos[0], multiplo[0], dcf.pesimista];
  const maxs = [activos[1], multiplo[1], dcf.optimista];
  return {
    sde: sde,
    activos: activos,
    multiplo: multiplo,
    dcf: dcf,
    rango: [multiplo[0], multiplo[1]],
    rangoTotal: [Math.min.apply(null, mins), Math.max.apply(null, maxs)],
  };
}

// ---------------------------------------------------------------------------
// Sección 5 — Normalización: waterfall SVG (utilidad 2025 → SDE)
// ---------------------------------------------------------------------------
function buildWaterfallSVG(supuestos, sde) {
  const y2025 = DATA.serieHistorica.filter(function (d) { return d.anio === 2025; })[0].utilidad;
  const steps = [
    { label: 'Utilidad contable 2025', tipo: 'total', valor: y2025 },
    { label: 'Fuera de libros', tipo: 'incremento', valor: supuestos.fueraDeLibros.valor },
    { label: 'Sueldos socias', tipo: 'incremento', valor: supuestos.addbacks.sueldosSocias },
    { label: 'Depreciación', tipo: 'incremento', valor: supuestos.addbacks.depreciacion },
    { label: 'Gastos financieros', tipo: 'incremento', valor: supuestos.addbacks.gastosFinancieros },
    { label: 'Ajuste honorarios', tipo: 'incremento', valor: supuestos.addbacks.ajusteHonorarios },
    { label: 'Costo de reemplazo', tipo: 'decremento', valor: supuestos.costoReemplazo.valor },
    { label: 'SDE', tipo: 'total', valor: sde },
  ];

  let running = 0;
  const bars = steps.map(function (s) {
    let before, after;
    if (s.tipo === 'total') {
      before = 0;
      after = s.valor;
    } else if (s.tipo === 'incremento') {
      before = running;
      after = running + s.valor;
    } else {
      before = running;
      after = running - s.valor;
    }
    running = after;
    return { label: s.label, tipo: s.tipo, valor: s.valor, before: before, after: after };
  });

  const width = 820;
  const height = 400;
  const marginTop = 24;
  const marginRight = 16;
  const marginBottom = 62;
  const marginLeft = 76;
  const innerW = width - marginLeft - marginRight;
  const innerH = height - marginTop - marginBottom;

  const allValues = [0];
  bars.forEach(function (b) { allValues.push(b.before, b.after); });
  const domain = niceDomain(Math.min.apply(null, allValues), Math.max.apply(null, allValues), 6);

  function yScale(v) {
    return marginTop + innerH * (domain.max - v) / (domain.max - domain.min);
  }
  const y0 = yScale(0);

  const n = bars.length;
  const band = innerW / n;
  const barW = Math.min(56, band * 0.6);

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

  let barsSvg = '';
  let connectorsSvg = '';
  let labelsSvg = '';
  bars.forEach(function (b, i) {
    const cx = marginLeft + band * i + band / 2;
    const barX = cx - barW / 2;
    const top = yScale(Math.max(b.before, b.after));
    const bottom = yScale(Math.min(b.before, b.after));
    const h = Math.max(bottom - top, 1.5);
    const cls = b.tipo === 'total' ? 'wf-bar-total' : (b.tipo === 'incremento' ? 'wf-bar-incremento' : 'wf-bar-decremento');
    const sign = b.valor === 0 ? '' : (b.tipo === 'incremento' ? '+ ' : (b.tipo === 'decremento' ? '− ' : ''));
    const valorLabel = b.tipo === 'total' ? formatCOP(b.valor) : (sign + formatCOP(Math.abs(b.valor)));

    barsSvg += '<rect class="wf-bar ' + cls + '" tabindex="0" role="img" ' +
      'aria-label="' + b.label + ': ' + valorLabel + '" ' +
      'x="' + barX + '" y="' + top + '" width="' + barW + '" height="' + h + '" rx="4"></rect>';

    labelsSvg += '<text x="' + cx + '" y="' + (top - 8) + '" class="wf-value-label" text-anchor="middle">' + valorLabel + '</text>';
    labelsSvg += '<text x="' + cx + '" y="' + (height - marginBottom + 22) + '" class="chart-axis-label wf-cat-label" text-anchor="middle">' + b.label + '</text>';

    if (i < bars.length - 1) {
      const nextCx = marginLeft + band * (i + 1) + band / 2;
      const nextBarX = nextCx - barW / 2;
      const connY = yScale(b.after);
      connectorsSvg += '<line x1="' + (barX + barW) + '" x2="' + nextBarX + '" y1="' + connY + '" y2="' + connY + '" class="wf-connector"></line>';
    }
  });

  return '<svg class="chart-svg wf-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-labelledby="wfTitle wfDesc">' +
    '<title id="wfTitle">Puente de normalización: utilidad contable 2025 a SDE</title>' +
    '<desc id="wfDesc">Waterfall desde la utilidad contable 2025 hasta el SDE: suma fuera de libros, sueldos socias, depreciación, gastos financieros y ajuste de honorarios; resta el costo de reemplazo.</desc>' +
    gridSvg + connectorsSvg + barsSvg + labelsSvg +
    '</svg>';
}

// Parte dinámica de la Sección 5 (todo lo que cambia con los sliders): el
// gráfico + su leyenda + la tabla accesible. Se reconstruye en cada 'input',
// nunca contiene los <input> de los sliders.
function buildWaterfallDynamicHTML(supuestos, sde) {
  const y2025 = DATA.serieHistorica.filter(function (d) { return d.anio === 2025; })[0].utilidad;
  const rows = [
    { label: 'Utilidad contable 2025', valor: y2025 },
    { label: 'Fuera de libros', valor: supuestos.fueraDeLibros.valor },
    { label: 'Sueldos socias', valor: supuestos.addbacks.sueldosSocias },
    { label: 'Depreciación', valor: supuestos.addbacks.depreciacion },
    { label: 'Gastos financieros', valor: supuestos.addbacks.gastosFinancieros },
    { label: 'Ajuste honorarios', valor: supuestos.addbacks.ajusteHonorarios },
    { label: 'Costo de reemplazo', valor: -supuestos.costoReemplazo.valor },
    { label: 'SDE (utilidad normalizada)', valor: sde },
  ];
  const accessibleRows = rows.map(function (r) {
    return '<tr><td>' + r.label + '</td><td>' + formatCOP(r.valor) + '</td></tr>';
  }).join('');

  return (
    buildWaterfallSVG(supuestos, sde) +
    '<div class="chart-legend">' +
      '<span class="legend-item"><span class="legend-swatch swatch-wf-total"></span>Total (utilidad / SDE)</span>' +
      '<span class="legend-item"><span class="legend-swatch swatch-wf-incremento"></span>Se suma</span>' +
      '<span class="legend-item"><span class="legend-swatch swatch-wf-decremento"></span>Se resta</span>' +
    '</div>' +
    '<table class="sr-only chart-data-table"><caption>Puente de normalización</caption>' +
      '<thead><tr><th>Concepto</th><th>Valor</th></tr></thead>' +
      '<tbody>' + accessibleRows + '</tbody></table>'
  );
}

function buildSDEDynamicHTML(sde) {
  return '<div class="kpi-card kpi-card-sde">' +
    '<span class="kpi-label">SDE — utilidad normalizada del dueño</span>' +
    '<span class="kpi-value">' + formatCOP(sde) + '</span>' +
  '</div>';
}

// Shell de la Sección 5 — se construye una sola vez (contiene los <input> de
// los sliders); las notas de disclosure son texto fijo (no dependen del valor
// numérico, así no hace falta reconstruirlas en cada 'input').
function buildNormalizacionShellHTML(supuestos, sde) {
  const notaFueraDeLibros = supuestos.fueraDeLibros.etiqueta;
  const notaSocias = DATA.notas.sociasFueraDeNomina + ' La operación corre con contratistas.';
  const notaFinancieros = DATA.notas.sinDeuda;
  const sliderFuera = supuestos.fueraDeLibros;
  const sliderCosto = supuestos.costoReemplazo;

  // El puente línea a línea (waterfall + notas de disclosure con montos
  // individuales) es solo para dueños: un comprador no debe ver el desglose
  // exacto de cada ajuste. El bloque `.buyer-summary` (fuera del owner-only,
  // visible en ambos modos) le da al comprador el resultado (SDE, en vivo)
  // más la misma honestidad metodológica obligatoria (fuera de libros
  // declarado y no verificable, sueldos de socias, deuda extinta), pero en
  // prosa, sin cifras línea a línea.
  return (
    '<h2>5. Normalización</h2>' +
    '<p class="section-lead">Puente desde la utilidad contable 2025 hasta el SDE (Seller’s Discretionary Earnings): la utilidad normalizada del dueño, sumando ajustes declarados por los dueños y restando el costo de reemplazar su gestión.</p>' +
    '<div class="owner-only">' +
      '<div class="chart-card"><div id="wf-dynamic">' + buildWaterfallDynamicHTML(supuestos, sde) + '</div></div>' +
      '<p class="disclosure-note"><strong>Fuera de libros:</strong> ' + notaFueraDeLibros + '.</p>' +
      '<p class="disclosure-note"><strong>Sueldos socias:</strong> ' + notaSocias + '</p>' +
      '<p class="disclosure-note"><strong>Gastos financieros:</strong> ' + notaFinancieros + '</p>' +
    '</div>' +
    '<div class="buyer-summary">' +
      '<div id="sde-dynamic">' + buildSDEDynamicHTML(sde) + '</div>' +
      '<p class="disclosure-note">El SDE (utilidad discrecional del vendedor) parte del resultado contable 2025 y lo normaliza con ajustes estándar: ingresos declarados por los dueños que no pasan por contabilidad (no verificables), salarios de las socias que salieron de la operación, depreciación, gastos financieros de deuda ya extinta y honorarios sobredimensionados. Detalle disponible para los dueños.</p>' +
    '</div>' +
    '<div class="owner-only slider-panel">' +
      '<h3>Ajustar supuestos (solo dueños)</h3>' +
      '<div class="slider-row">' +
        '<label for="slider-fuera-libros">Fuera de libros: <span id="lbl-fuera-libros">' + formatCOP(sliderFuera.valor) + '</span></label>' +
        '<input type="range" id="slider-fuera-libros" min="' + sliderFuera.rango[0] + '" max="' + sliderFuera.rango[1] + '" step="500000" value="' + sliderFuera.valor + '">' +
      '</div>' +
      '<div class="slider-row">' +
        '<label for="slider-costo-reemplazo">Costo de reemplazo (sensibilidad de gestión): <span id="lbl-costo-reemplazo">' + formatCOP(sliderCosto.valor) + '</span></label>' +
        '<input type="range" id="slider-costo-reemplazo" min="' + sliderCosto.rango[0] + '" max="' + sliderCosto.rango[1] + '" step="1000000" value="' + sliderCosto.valor + '">' +
      '</div>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// Sección 6 — Valoración a 3 lentes
// ---------------------------------------------------------------------------
function buildCardMultiploDynamicHTML(supuestos, sde, valoracion, multiploWorking) {
  const resultado = sde * multiploWorking;
  return (
    '<p class="lente-desc">SDE actual: ' + formatCOP(sde) + '.</p>' +
    '<div class="kpi-card"><span class="kpi-label">Múltiplo ' + multiploWorking.toFixed(1) + '×</span><span class="kpi-value">' + formatCOP(resultado) + '</span></div>' +
    '<p class="lente-nota">Rango: SDE × ' + supuestos.multiploSDE[0].toFixed(1) + ' = ' + formatCOP(valoracion.multiplo[0]) +
      '  a  SDE × ' + supuestos.multiploSDE[1].toFixed(1) + ' = ' + formatCOP(valoracion.multiplo[1]) + '.</p>'
  );
}

function buildCardDCFDynamicHTML(supuestos, valoracion) {
  const esc = supuestos.escenariosCrecimiento;
  return '<div class="dcf-scenarios">' +
    '<div class="kpi-card dcf-scenario"><span class="kpi-label">Pesimista (g ' + (esc.pesimista * 100).toFixed(0) + '%)</span><span class="kpi-value">' + formatCOP(valoracion.dcf.pesimista) + '</span></div>' +
    '<div class="kpi-card dcf-scenario dcf-base"><span class="kpi-label">Base (g ' + (esc.base * 100).toFixed(0) + '%)</span><span class="kpi-value">' + formatCOP(valoracion.dcf.base) + '</span></div>' +
    '<div class="kpi-card dcf-scenario"><span class="kpi-label">Optimista (g ' + (esc.optimista * 100).toFixed(0) + '%)</span><span class="kpi-value">' + formatCOP(valoracion.dcf.optimista) + '</span></div>' +
  '</div>';
}

function buildValoracionShellHTML(supuestos, sde, valoracion, multiploWorking) {
  const activosTrabajo = supuestos.valorActivosTrabajo;
  const equiposUsado = supuestos.valorEquiposUsado;
  const equiposNuevo = supuestos.valorEquiposNuevo;
  const grupoVehiculo = DATA.activosFijos.grupos.filter(function (g) { return g.nombre === 'Vehículo'; })[0];

  const cardActivos =
    '<div class="lente-card">' +
      '<h3>a. Activos</h3>' +
      '<p class="lente-desc">Ancla: valor neto en libros del auxiliar de activos fijos. El piso del rango es la liquidación a precios de reventa internacionales.</p>' +
      '<div class="kpi-card"><span class="kpi-label">Valor de activos (neto en libros sin vehículo, 30/06/2026)</span><span class="kpi-value" id="valor-activos-neto">' + formatCOP(activosTrabajo.valor) + '</span></div>' +
      '<div class="owner-only slider-row">' +
        '<label for="slider-valor-activos">Ajustar valor de trabajo: <span id="lbl-valor-activos">' + formatCOP(activosTrabajo.valor) + '</span></label>' +
        '<input type="range" id="slider-valor-activos" min="' + activosTrabajo.rango[0] + '" max="' + activosTrabajo.rango[1] + '" step="100000" value="' + activosTrabajo.valor + '">' +
      '</div>' +
      '<p class="lente-nota">Referencias — costo de adquisición histórico: ' + formatCOP(DATA.activosFijos.totales.costo) + ' (equipos importados: los booths costaron USD 5.300–9.300 c/u puestos en Colombia). Reventa usada a precios US: ' + formatCOP(equiposUsado.rango[0]) + '–' + formatCOP(equiposUsado.rango[1]) + '. Reposición a nuevo (US, sin importación): ' + formatCOP(equiposNuevo.rango[0]) + '–' + formatCOP(equiposNuevo.rango[1]) + '. Excluye el vehículo (campero Daihatsu 2017, neto ' + formatCOP(grupoVehiculo.neto) + ') por decisión de los dueños.</p>' +
      '<p class="lente-fuente">Fuente: ' + DATA.activosFijos.fuente + '; investigación de precios de equipos, 20 jul 2026 (reventa usada y reposición a nuevo; TRM 3.260 COP/USD).</p>' +
    '</div>';

  const cardMultiplo =
    '<div class="lente-card">' +
      '<h3>b. Múltiplo de SDE</h3>' +
      '<div id="card-multiplo-dynamic">' + buildCardMultiploDynamicHTML(supuestos, sde, valoracion, multiploWorking) + '</div>' +
      '<div class="owner-only slider-row">' +
        '<label for="slider-multiplo">Múltiplo de trabajo: <span id="lbl-multiplo">' + multiploWorking.toFixed(1) + '×</span></label>' +
        '<input type="range" id="slider-multiplo" min="' + supuestos.multiploSDE[0] + '" max="' + supuestos.multiploSDE[1] + '" step="0.1" value="' + multiploWorking + '">' +
      '</div>' +
    '</div>';

  const cardDCF =
    '<div class="lente-card">' +
      '<h3>c. DCF simple (5 años)</h3>' +
      '<p class="lente-desc">FCF = SDE creciendo a la tasa del escenario; valor terminal = FCF año 5 / tasa de descuento (perpetuidad sin crecimiento adicional), también descontado.</p>' +
      '<div id="card-dcf-dynamic">' + buildCardDCFDynamicHTML(supuestos, valoracion) + '</div>' +
      '<div class="owner-only slider-row">' +
        '<label for="slider-tasa-dcf">Tasa de descuento: <span id="lbl-tasa-dcf">' + (supuestos.tasaDCF * 100).toFixed(0) + '%</span></label>' +
        '<input type="range" id="slider-tasa-dcf" min="0.15" max="0.40" step="0.01" value="' + supuestos.tasaDCF + '">' +
      '</div>' +
      '<p class="lente-nota">Tasa por defecto: 30% — refleja riesgo de persona clave y el tamaño de la empresa. A 22%, el valor terminal implicaba un múltiplo de ~4,5× SDE, por encima del techo de la lente de múltiplo (3,0×) (decisión metodológica 2026-07-21).</p>' +
    '</div>';

  return (
    '<h2>6. Valoración — 3 lentes</h2>' +
    '<p class="section-lead">Tres formas independientes de estimar el valor de la empresa, cada una con su propio resultado y sus propios supuestos.</p>' +
    '<div class="lentes-grid">' + cardActivos + cardMultiplo + cardDCF + '</div>'
  );
}

// ---------------------------------------------------------------------------
// Sección 7 — Rango de valor (barra horizontal, sin sliders propios)
// ---------------------------------------------------------------------------
function buildRangoBarSVG(valoracion) {
  const width = 820;
  const height = 260;
  const marginTop = 40;
  const marginRight = 24;
  const marginBottom = 46;
  const marginLeft = 150;
  const innerW = width - marginLeft - marginRight;
  const innerH = height - marginTop - marginBottom;

  const domain = niceDomain(valoracion.rangoTotal[0], valoracion.rangoTotal[1], 6);

  function xScale(v) {
    return marginLeft + innerW * (v - domain.min) / (domain.max - domain.min);
  }

  const rows = [
    { label: 'Activos (piso)', cls: 'rb-activos', range: valoracion.activos },
    { label: 'Múltiplo de SDE', cls: 'rb-multiplo', range: valoracion.multiplo },
    { label: 'DCF (pesimista-optimista)', cls: 'rb-dcf', range: [valoracion.dcf.pesimista, valoracion.dcf.optimista] },
  ];
  const rowH = innerH / rows.length;
  const barH = Math.min(28, rowH * 0.5);

  let gridSvg = '';
  for (let t = domain.min; t <= domain.max + 1e-6; t += domain.step) {
    const tRounded = Math.round(t);
    const x = xScale(tRounded);
    gridSvg += '<line x1="' + x + '" x2="' + x + '" y1="' + marginTop + '" y2="' + (marginTop + innerH) + '" class="chart-grid"></line>';
    gridSvg += '<text x="' + x + '" y="' + (marginTop + innerH + 22) + '" class="chart-axis-label" text-anchor="middle">' + formatAxisCOP(tRounded) + '</text>';
  }

  const triX0 = xScale(valoracion.rango[0]);
  const triX1 = xScale(valoracion.rango[1]);
  const triBand =
    '<rect class="rb-triangulacion" x="' + triX0 + '" y="' + marginTop + '" width="' + Math.max(triX1 - triX0, 1) + '" height="' + innerH + '"></rect>' +
    '<text x="' + ((triX0 + triX1) / 2) + '" y="' + (marginTop - 16) + '" class="rb-tri-label" text-anchor="middle">Rango de triangulación</text>';

  let barsSvg = '';
  let labelsSvg = '';
  rows.forEach(function (r, i) {
    const cy = marginTop + rowH * i + rowH / 2;
    const x0 = xScale(r.range[0]);
    const x1 = xScale(r.range[1]);
    const w = Math.max(x1 - x0, 2);
    barsSvg += '<rect class="rb-bar ' + r.cls + '" tabindex="0" role="img" ' +
      'aria-label="' + r.label + ': ' + formatCOP(r.range[0]) + ' a ' + formatCOP(r.range[1]) + '" ' +
      'x="' + x0 + '" y="' + (cy - barH / 2) + '" width="' + w + '" height="' + barH + '" rx="' + (barH / 2) + '"></rect>';
    labelsSvg += '<text x="' + (marginLeft - 12) + '" y="' + (cy + 4) + '" class="chart-axis-label" text-anchor="end">' + r.label + '</text>';
    labelsSvg += '<text x="' + x0 + '" y="' + (cy - barH / 2 - 8) + '" class="rb-value-label" text-anchor="start">' + formatCOP(r.range[0]) + '</text>';
    labelsSvg += '<text x="' + x1 + '" y="' + (cy - barH / 2 - 8) + '" class="rb-value-label" text-anchor="end">' + formatCOP(r.range[1]) + '</text>';
  });

  return '<svg class="chart-svg rb-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-labelledby="rbTitle rbDesc">' +
    '<title id="rbTitle">Rango de valor — 3 lentes</title>' +
    '<desc id="rbDesc">Barra horizontal con los rangos de las 3 lentes de valoración (activos, múltiplo de SDE, DCF) y el rango de triangulación resaltado.</desc>' +
    gridSvg + triBand + barsSvg + labelsSvg +
    '</svg>';
}

function buildRangoHTML(valoracion) {
  const svg = buildRangoBarSVG(valoracion);
  const accessibleRows = [
    { label: 'Activos (piso)', min: valoracion.activos[0], max: valoracion.activos[1] },
    { label: 'Múltiplo de SDE', min: valoracion.multiplo[0], max: valoracion.multiplo[1] },
    { label: 'DCF (pesimista-optimista)', min: valoracion.dcf.pesimista, max: valoracion.dcf.optimista },
    { label: 'Rango de triangulación', min: valoracion.rango[0], max: valoracion.rango[1] },
  ].map(function (r) { return '<tr><td>' + r.label + '</td><td>' + formatCOP(r.min) + '</td><td>' + formatCOP(r.max) + '</td></tr>'; }).join('');

  return (
    '<h2>7. Rango de valor</h2>' +
    '<p class="section-lead">Triangulación de las 3 lentes de valoración. Banda destacada: múltiplo de SDE (1,5×–3,0×), la lente principal para una Pyme de servicios. Los activos son el piso: desde $28M (liquidación) hasta $94M (valor neto en libros de los equipos); el DCF valida la sensibilidad a supuestos de crecimiento y tasa (decisión metodológica 2026-07-21).</p>' +
    '<div class="chart-card">' +
      svg +
      '<div class="chart-legend">' +
        '<span class="legend-item"><span class="legend-swatch swatch-rb-activos"></span>Activos</span>' +
        '<span class="legend-item"><span class="legend-swatch swatch-rb-multiplo"></span>Múltiplo de SDE</span>' +
        '<span class="legend-item"><span class="legend-swatch swatch-rb-dcf"></span>DCF</span>' +
      '</div>' +
      '<table class="sr-only chart-data-table"><caption>Rango de valor por lente</caption>' +
        '<thead><tr><th>Lente</th><th>Mínimo</th><th>Máximo</th></tr></thead>' +
        '<tbody>' + accessibleRows + '</tbody></table>' +
    '</div>' +
    '<p class="disclosure-note"><strong>Sin deuda:</strong> ' + DATA.notas.sinDeuda + '</p>' +
    '<h3>Qué mueve el precio</h3>' +
    '<ul class="drivers-list">' +
      '<li>Recuperar el nivel de ingresos de 2018-2019 (el pico histórico de la empresa).</li>' +
      '<li>Contratos corporativos recurrentes, no solo eventos puntuales.</li>' +
      '<li>Piso de valor: venta de los equipos por separado si el negocio no continúa operando.</li>' +
    '</ul>'
  );
}

// ---------------------------------------------------------------------------
// Wrappers DOM — orquestan las secciones 5-7 y la interacción de los sliders.
// ---------------------------------------------------------------------------
function setTextIfExists(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Reconstruye solo los contenedores dinámicos (nunca los <input> de los
// sliders) con los valores recalculados — se llama en cada evento 'input'.
function updateDynamicParts(supuestos, sde, valoracion) {
  const wf = document.getElementById('wf-dynamic');
  if (wf) wf.innerHTML = buildWaterfallDynamicHTML(supuestos, sde);

  const sdeEl = document.getElementById('sde-dynamic');
  if (sdeEl) sdeEl.innerHTML = buildSDEDynamicHTML(sde);

  const cardMult = document.getElementById('card-multiplo-dynamic');
  if (cardMult) cardMult.innerHTML = buildCardMultiploDynamicHTML(supuestos, sde, valoracion, valState.multiploWorking);

  const cardDCF = document.getElementById('card-dcf-dynamic');
  if (cardDCF) cardDCF.innerHTML = buildCardDCFDynamicHTML(supuestos, valoracion);

  const elRango = document.getElementById('rango-valor');
  if (elRango) elRango.innerHTML = buildRangoHTML(valoracion);

  setTextIfExists('lbl-fuera-libros', formatCOP(supuestos.fueraDeLibros.valor));
  setTextIfExists('lbl-costo-reemplazo', formatCOP(supuestos.costoReemplazo.valor));
  setTextIfExists('lbl-valor-activos', formatCOP(supuestos.valorActivosTrabajo.valor));
  setTextIfExists('valor-activos-neto', formatCOP(supuestos.valorActivosTrabajo.valor));
  setTextIfExists('lbl-multiplo', valState.multiploWorking.toFixed(1) + '×');
  setTextIfExists('lbl-tasa-dcf', (supuestos.tasaDCF * 100).toFixed(0) + '%');
}

function attachSliderListeners() {
  const bindings = [
    { id: 'slider-fuera-libros', field: 'fueraDeLibros' },
    { id: 'slider-costo-reemplazo', field: 'costoReemplazo' },
    { id: 'slider-valor-activos', field: 'valorActivosTrabajo' },
    { id: 'slider-multiplo', field: 'multiploWorking' },
    { id: 'slider-tasa-dcf', field: 'tasaDCF' },
  ];
  bindings.forEach(function (b) {
    const input = document.getElementById(b.id);
    if (!input) return;
    input.addEventListener('input', function () {
      valState[b.field] = parseFloat(input.value);
      renderValoracionTodo();
    });
  });
}

// Punto de entrada de las secciones 5-7 — invocado desde showView() en
// js/app.js, igual que renderAll() de js/render.js. En el primer render arma
// los "shells" (con los <input> de los sliders); en los siguientes, solo
// actualiza los contenedores dinámicos para no interrumpir el arrastre.
function renderValoracionTodo() {
  const supuestos = getSupuestosConEstado();
  const sde = calcSDE(supuestos);
  const valoracion = calcValoracion(supuestos);

  const elNorm = document.getElementById('normalizacion');
  const elVal = document.getElementById('valoracion');
  const elRango = document.getElementById('rango-valor');

  const isFirstRender = !document.getElementById('slider-fuera-libros');

  if (isFirstRender) {
    if (elNorm) elNorm.innerHTML = buildNormalizacionShellHTML(supuestos, sde);
    if (elVal) elVal.innerHTML = buildValoracionShellHTML(supuestos, sde, valoracion, valState.multiploWorking);
    if (elRango) elRango.innerHTML = buildRangoHTML(valoracion);
    attachSliderListeners();
  } else {
    updateDynamicParts(supuestos, sde, valoracion);
  }
}
