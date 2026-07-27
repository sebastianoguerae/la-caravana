// La Caravana Creativa SAS — datos de la empresa para el documento de valoración.
// Todas las cifras están en COP, tal como aparecen en los documentos fuente
// (enteros/decimales exactos, sin redondear). Cada bloque cita su documento fuente.
//
// Fuentes:
//   [A] "Lista de equipos e ingresos.pdf" — pág. 2-3 (equipos), pág. 4 (serie histórica 2015-2025)
//   [B] "PYG COMPARATIVO DICIEMBRE 2025 2024 2.PDF" — detalle PyG 2025 vs 2024
//   [C] "P Y G COMPARATIVO 2023.pdf" — detalle PyG 2023 vs 2022 (totales)
//   [D] Hechos declarados por los dueños (Mariana Leyva / Ana Cecilia), 2026-07-20

const DATA = {

  // ── Serie histórica 2015-2025 [Fuente A, pág. 4] ──────────────────────────
  // Columnas transcritas TAL CUAL de la tabla "COMPARATIVO ENTRE LOS AÑOS 2015 A 2025".
  // IMPORTANTE: en varios años, ingresos - costos - gastos ≠ utilidad publicada.
  // Esto NO es un error de transcripción: la tabla fuente muestra "gastos" e "ingresos"
  // como líneas operacionales (no incluyen partidas no operacionales: financieros,
  // recuperaciones, gastos extraordinarios/diversos, etc.), mientras que "utilidad"
  // sí es el resultado final del ejercicio (utilidad neta real, con todas las partidas).
  // Se confirma este patrón cruzando contra los PyG detallados [B] y [C]:
  //   - 2024: ingresos/costos/gastos operacionales cuadran EXACTO contra utilidad (-3,769,413.16 en ambas fuentes).
  //   - 2022: idem, cuadra exacto (utilidad 14,085,878.02 en ambas fuentes).
  //   - 2023 y 2025: la utilidad de esta serie NO coincide con la utilidad real del PyG
  //     detallado correspondiente (ver notas en pygDetalle). Se documentan las diferencias
  //     por año pero se mantienen los valores fuente sin inventar cifras (instrucción del brief).
  serieHistorica: [
    // año, ingresos, costos, gastos, utilidad (pérdida)
    { anio: 2015, ingresos: 18160000.00,  costos: 0,            gastos: 15168590.93,  utilidad: 2923548.31 },
    // diff |ingresos-costos-gastos - utilidad| = 67,860.76 (dentro de tolerancia)
    { anio: 2016, ingresos: 156854353.00, costos: 0,            gastos: 116125321.43, utilidad: 36942934.33 },
    // diff = 3,786,097.24 (> 1.5M; se documenta, se mantiene valor fuente)
    { anio: 2017, ingresos: 189851601.00, costos: 0,            gastos: 176266741.00, utilidad: 6541910.00 },
    // diff = 7,042,950.00 (> 1.5M; se documenta, se mantiene valor fuente)
    { anio: 2018, ingresos: 365037586.00, costos: 0,            gastos: 333208389.64, utilidad: 15461221.05 },
    // diff = 16,367,975.31 (> 1.5M; se documenta, se mantiene valor fuente)
    { anio: 2019, ingresos: 416548250.00, costos: 13964211.00,  gastos: 376194332.05, utilidad: 10302962.03 },
    // diff = 16,086,744.92 (> 1.5M; se documenta, se mantiene valor fuente)
    { anio: 2020, ingresos: 150954899.12, costos: 67212797.87,  gastos: 123462564.28, utilidad: -43833126.59 },
    // diff = 4,112,663.56 (> 1.5M; se documenta, se mantiene valor fuente)
    { anio: 2021, ingresos: 136361150.00, costos: 71272994.99,  gastos: 87079678.00,  utilidad: -23212678.00 },
    // diff = 1,221,155.01 (dentro de tolerancia)
    { anio: 2022, ingresos: 316780065.00, costos: 163149003.27, gastos: 128837644.10, utilidad: 14085878.02 },
    // diff = 10,707,539.61 (> 1.5M) PERO cuadra exacto contra PyG comparativo [C]:
    // utilidad real 2022 (14,085,878.02) = idéntica en ambas fuentes.
    // Nota: PyG comparativo [C] reporta ingresos operacionales 2022 = 316,760,065.00
    // (20,000 COP menos que esta serie: 316,780,065.00) — discrepancia menor entre documentos.
    { anio: 2023, ingresos: 220094143.00, costos: 68855730.47,  gastos: 132077465.55, utilidad: 19531126.20 },
    // diff = 370,179.22 (dentro de tolerancia) PERO la utilidad real del PyG comparativo [C]
    // para 2023 es 26,336,241.72 (ver pygDetalle.2023) — NO coincide con esta serie.
    // Se mantiene el valor de la serie histórica (fuente canónica del brief) sin alterarlo.
    { anio: 2024, ingresos: 210294175.00, costos: 65039869.83,  gastos: 143734920.77, utilidad: -3769413.16 },
    // diff = 5,288,797.56 (> 1.5M por definición de columnas, ver nota general arriba)
    // PERO la utilidad real del PyG comparativo [B] para 2024 es -3,769,413.16 — coincide EXACTO.
    { anio: 2025, ingresos: 193582687.00, costos: 64683016.55,  gastos: 140518044.71, utilidad: -16065402.86 },
    // diff = 4,447,028.60 (> 1.5M por definición de columnas, ver nota general arriba)
    // ADEMÁS: la utilidad real del PyG comparativo [B] para 2025 es -18,737,733.23
    // (no -16,065,402.86). Es una discrepancia real entre la serie histórica (ppt) y el
    // PyG detallado 2025/2024 — documentada también en notas.discrepancias.
  ],

  // ── Detalle PyG por línea 2025/2024 y totales 2023/2022 ───────────────────
  pygDetalle: {
    2025: {
      // [Fuente B] Diciembre DE 2025
      ingresosPorLinea: {
        photoBooth: 87153000.00,
        photoBoothNoGravada: 1640000.00,
        servicioHashtagSpot: 5560000.00,
        accesoriosAdicionales: 1050000.00,
        mirrorBooth: 27245000.00,
        auroraBooth: 27570000.00,
        video360: 8296250.00,
        anilloFiestero: 29965000.00,
        boomerang180: 0,
        ventaKitAlbum: 728437.00,
        comboMarcos: 0,
        transporteAlmacenamiento: 9255000.00,
        devolucionesEnVentas: -4880000.00,
      },
      // Suma de líneas de ingreso (todas) = 193,582,687.00 == ingresosOperacionales total (verificado)
      ingresosOperacionales: 193582687.00,
      ingresosNoOperacionales: 55673.62, // financieros 13,551.68 + recuperaciones 0 + diversos 42,121.94
      totalIngresos: 193638360.62,
      gastosPrincipales: {
        personal: 80967506.00,
        honorarios: 16045800.00,
        impuestos: 1879359.03,
        arrendamientos: 6934000.00,
        seguros: 1075900.00,
        servicios: 17023214.00,
        legales: 1376900.00,
        mantenimientoReparaciones: 2217612.00,
        gastosDeViaje: 0,
        depreciaciones: 14335607.04,
        diversos: 1402352.04,
        otros: 70000.00,
      },
      gastosOperacionalesAdministracion: 143258250.11,
      gastosOperacionalesVentas: 0, // publicidad, propaganda y promoción
      gastosNoOperacionales: 4508827.19, // financieros 4,495,642.81 + extraordinarios 5,288.01 + diversos 7,896.37
      totalGastos: 147767077.30,
      costos: {
        servicios: 26252490.83,
        mantenimientoReparaciones: 1408744.00,
        gastosDeViaje: 3570493.70,
        diversos: 33377288.02,
        arrendamientos: 0,
      },
      totalCostos: 64609016.55,
      utilidad: -18737733.23,
      // Nota: esta utilidad real (-18,737,733.23) difiere de la utilidad de la serie
      // histórica para 2025 (-16,065,402.86). Ver notas.discrepancias.
      totalPatrimonio: 13588629.76, // fuente [B] p.7 "PYG COMPARATIVO DICIEMBRE 2025 2024 2.PDF"
    },
    2024: {
      // [Fuente B] Diciembre DE 2024
      ingresosPorLinea: {
        photoBooth: 112095937.00,
        photoBoothNoGravada: 0,
        servicioHashtagSpot: 8860000.00,
        accesoriosAdicionales: 4868195.00,
        mirrorBooth: 15130000.00,
        auroraBooth: 15160000.00,
        video360: 9155000.00,
        anilloFiestero: 42130000.00,
        boomerang180: 4025000.00,
        ventaKitAlbum: 554748.00,
        comboMarcos: 1917732.00,
        transporteAlmacenamiento: 10045000.00,
        devolucionesEnVentas: -13647437.00,
      },
      ingresosOperacionales: 210294175.00,
      ingresosNoOperacionales: 262777.30,
      totalIngresos: 210556952.30,
      gastosPrincipales: {
        personal: 72535170.00,
        honorarios: 16015200.00,
        impuestos: 2665226.42,
        arrendamientos: 6384000.00,
        seguros: 4039249.00,
        servicios: 21766894.30,
        legales: 1613700.00,
        mantenimientoReparaciones: 1792476.00,
        gastosDeViaje: 757560.00,
        depreciaciones: 13264011.84,
        diversos: 2001394.21,
        otros: 0,
      },
      gastosOperacionalesAdministracion: 142834881.77,
      gastosOperacionalesVentas: 900039.00, // publicidad, propaganda y promoción
      gastosNoOperacionales: 5551574.86,
      totalGastos: 149286495.63,
      costos: {
        servicios: 32214895.93,
        mantenimientoReparaciones: 95459.00,
        gastosDeViaje: 3916110.48,
        diversos: 28721051.48,
        arrendamientos: 92352.94,
      },
      totalCostos: 65039869.83,
      utilidad: -3769413.16, // coincide exacto con la serie histórica 2024
      totalPatrimonio: 32326362.99,
    },
    // ── Totales 2023/2022 [Fuente C] — este PDF no trae detalle por línea de ingreso ──
    2023: {
      ingresosOperacionales: 220094143.00,
      ingresosPorGrupo: {
        comercioMayorMenor: 6377168.00,
        transporteAlmacenamiento: 5600000.00,
        actividadesInmobiliariasEmpresariales: 218211975.00,
        devolucionesEnVentas: -10095000.00,
      },
      ingresosNoOperacionales: 8694373.20,
      totalIngresos: 228788516.20,
      gastosOperacionalesAdministracion: 127839695.03,
      gastosPrincipales: {
        personal: 61173064.00,
        honorarios: 14602800.00,
        impuestos: 2771594.05,
        arrendamientos: 7752000.00,
        seguros: 3471835.00,
        servicios: 17613533.82,
        legales: 1480200.00,
        mantenimientoReparaciones: 1821764.00,
        depreciaciones: 14804696.16,
        diversos: 2348208.00,
      },
      gastosOperacionalesVentas: 2459670.52,
      gastosNoOperacionales: 6699125.83,
      totalGastos: 136998491.38,
      totalCostos: 65453783.10,
      utilidad: 26336241.72,
      // Nota: esta utilidad real (26,336,241.72) difiere de la utilidad de la serie
      // histórica para 2023 (19,531,126.20). Ver notas.discrepancias.
      totalPatrimonio: 42900891.67,
    },
    2022: {
      ingresosOperacionales: 316760065.00,
      // Nota: la serie histórica reporta 316,780,065.00 para 2022 (20,000 COP de diferencia).
      ingresosPorGrupo: {
        comercioMayorMenor: 12365132.00,
        transporteAlmacenamiento: 17165000.00,
        actividadesInmobiliariasEmpresariales: 311974933.00,
        devolucionesEnVentas: -24745000.00,
      },
      ingresosNoOperacionales: 905692.19,
      totalIngresos: 317665757.19,
      gastosOperacionalesAdministracion: 125164922.26,
      gastosPrincipales: {
        personal: 62759717.00,
        honorarios: 7456000.00,
        impuestos: 3685375.18,
        arrendamientos: 4170000.00,
        seguros: 3523431.00,
        servicios: 20861406.00,
        legales: 1386500.00,
        mantenimientoReparaciones: 1698240.00,
        depreciaciones: 18631126.08,
        deterioroActivos: 832442.00,
        diversos: 160685.00,
      },
      gastosOperacionalesVentas: 3672721.84,
      gastosNoOperacionales: 11593231.80,
      totalGastos: 140430875.90,
      totalCostos: 163149003.27,
      utilidad: 14085878.02, // coincide exacto con la serie histórica 2022
      totalPatrimonio: 16564649.95,
    },
  },

  // ── Equipos [Fuente A, pág. 2-3 "LISTADO DE EQUIPOS DISPONIBLES"] ─────────
  // El PDF fuente agrupa el listado en 6 bloques (uno de ellos con cantidad 3),
  // totalizando 8 unidades físicas. Se transcribe tal cual el documento, sin
  // inventar un séptimo grupo para forzar el conteo mencionado en el brief.
  equipos: [
    {
      nombre: 'Photo Booth Abierto',
      cantidad: 3,
      descripcion: 'Con cámara Canon, Flash Alien Bees B400, tablet Surface Pro, impresora DNP, maletas de transporte, regulador, extensión de 7 metros, repuesto de bombillo y cables de flash, tinta y papel referencia DS40.',
    },
    {
      nombre: 'Magic Mirror',
      cantidad: 1,
      descripcion: 'Caja con tapa de transporte, espejo con cámara Canon, Flash Alien Bees B800, impresora DNP, extensión de 7 metros, regulador, tinta y papel RX1.',
    },
    {
      nombre: 'Aurora Booth',
      cantidad: 1,
      descripcion: 'Caja de transporte base Aurora, caja con impresora DNP, tablet Surface Pro, extensión 7 metros, regulador, tinta y papel DS620.',
    },
    {
      nombre: 'Anillo Móvil',
      cantidad: 1,
      descripcion: 'Aro de luz con tablet Surface Pro, comparte la impresora del Aurora, tinta y papel DS620, 1 batería de uso y 1 batería de repuesto con sus cargadores.',
    },
    {
      nombre: 'Hashtag Spot',
      cantidad: 1,
      descripcion: 'Impresora DNP con estructura blanca y 3 palos de madera como soporte, 1 banner explicativo, computador Mac con el programa, tinta y papel DS40.',
    },
    {
      nombre: 'Plataforma Video 360',
      cantidad: 1,
      descripcion: 'Plataforma con capacidad para 4 personas, aro de luz para colocar tablet o celular (comparte la tablet Surface Pro del anillo móvil y la maleta de herramientas con extensión y regulador).',
    },
  ],

  // ── Activos fijos [Fuente: auxiliar "DESCRIPCION ACTIVOS FIJOS DE LA
  //    CARAVANA.xlsx", corte 30/06/2026, carpeta leon/la caravana/] ─────────
  // Registro contable de activos fijos de la empresa: 4 grupos (maquinaria y
  // equipo de eventos, vehículo, equipo de cómputo, muebles y enseres), con
  // costo histórico de adquisición, depreciación acumulada y valor neto en
  // libros a la fecha de corte. `maquinariaItems` desglosa los 8 ítems
  // notables dentro del grupo "Maquinaria y equipo" (los booths/equipos de
  // evento); varios se adquirieron en USD puestos en Colombia (importación) —
  // se documenta el monto en USD original cuando aplica (`notaUSD`), pero
  // costo/neto quedan en COP tal como el auxiliar.
  activosFijos: {
    corte: '30/06/2026',
    fuente: 'auxiliar "DESCRIPCION ACTIVOS FIJOS DE LA CARAVANA.xlsx", corte 30/06/2026, carpeta leon/la caravana/',
    grupos: [
      { nombre: 'Maquinaria y equipo', costo: 173313344,   depAcumulada: 84143087.64,  neto: 89170256.36 },
      // Vehículo excluido de la valoración por decisión de los dueños
      // (26-jul-2026): el campero Daihatsu no debe estar en la ecuación.
      // Se conserva en el registro contable (transparencia), marcado como excluido.
      { nombre: 'Vehículo',            costo: 45000000,    depAcumulada: 27791718.12,  neto: 17208281.88, excluidoDeValoracion: true },
      { nombre: 'Equipo de cómputo',   costo: 23891285,    depAcumulada: 20796446,     neto: 2080096 },
      { nombre: 'Muebles y enseres',   costo: 8647009,     depAcumulada: 5388918,      neto: 3258091 },
    ],
    // Ítems notables del grupo "Maquinaria y equipo" (suman exacto al neto
    // del grupo: 89,170,256.36). notaUSD = monto original en USD (equipos
    // importados, puestos en Colombia) cuando el auxiliar lo documenta.
    maquinariaItems: [
      { nombre: 'Photobooth 1 (Supply Co)',                    anio: 2015, costo: 23518305, neto: 9084168 },
      { nombre: 'Photobooth 2 (Photobooth Solutions)',         anio: 2016, costo: 28108952, neto: 9752063.36 },
      { nombre: 'Impresora DS40',                              anio: 2016, costo: 4705607,  neto: 1821736 },
      { nombre: 'Photobooth 3 (Supply Co)',                    anio: 2017, costo: 27326406, neto: 15246409, notaUSD: 9300 },
      { nombre: 'Photobooth 4 (Photobooth Solutions)',         anio: 2017, costo: 15752382, neto: 8971498,  notaUSD: 5300 },
      { nombre: 'Mirror Booth',                                anio: 2017, costo: 35000000, neto: 19933648, notaUSD: 10310 },
      { nombre: 'Aurora Booth + estructura',                   anio: 2019, costo: 14052812, neto: 6343635,  notaUSD: 4069 },
      { nombre: 'Equipo 360 Boomerang + base',                 anio: 2023, costo: 22711794, neto: 18017099 },
    ],
    // netoSinVehiculo = neto total (111,716,725.24) − neto Vehículo (17,208,281.88)
    // = 94,508,443.36 — usado como valor de trabajo de la lente de activos
    // desde la decisión de excluir el vehículo (26-jul-2026).
    totales: { costo: 250851638, depAcumulada: 138120169.76, neto: 111716725.24, netoSinVehiculo: 94508443.36 },
  },

  // ── Servicios (según la web lacaravanacreativa.com) ───────────────────────
  servicios: [
    'Photo Booth',
    'Espejo Mágico',
    'Hashtag Spot',
    'Aurora Booth',
    'Video 360',
    'Anillo Fiestero',
    'Boomerang 180',
    'Insta-Marcos',
    'Telesco-Pic Bar',
    'Caravana Memories',
  ],

  // ── Ciudades donde opera ───────────────────────────────────────────────────
  ciudades: ['Bogotá', 'Cartagena', 'Barranquilla', 'Medellín'],

  // ── Datos de la empresa ────────────────────────────────────────────────────
  empresa: {
    nombre: 'La Caravana Creativa SAS',
    nit: '900873425-7',
    tipoSociedad: 'SAS',
    fundacion: 2015,
    representanteLegal: 'Mariana Leyva Uribe',
    web: 'lacaravanacreativa.com',
    contactoEmail: 'eventos@lacaravanacreativa.com',
    whatsapp: '320 479 4324',
    ciudades: ['Bogotá', 'Cartagena', 'Barranquilla', 'Medellín'],
    // ── Marcas clientes [Fuente: "clientes_investigacion.md", carpeta
    //    leon/la caravana/, investigación 2026-07-26] ───────────────────────
    // 37 marcas VERIFICADAS: aparecen como logo en la sección "Nuestros
    // Clientes" del sitio oficial lacaravanacreativa.com/nuestros-clientes
    // (evidencia de primera mano — el propio proveedor las exhibe como
    // clientes; no hay corroboración independiente de prensa/redes por marca,
    // pero el hecho de estar en su propia página sí queda documentado).
    marcas: [
      'Starbucks', 'DoubleTree by Hilton', 'Sofitel Bogotá Victoria Regia',
      'Hard Rock Cafe', 'BMW', 'Mercedes-Benz', 'Coca-Cola', 'Águila',
      'Éxito', 'Mango', 'Stradivarius', 'Steve Madden', 'Coach',
      'Tiffany & Co.', 'Carolina Herrera', 'Azulu', "Kiehl's", 'Belcorp',
      'MASGLO Belleza Profesional', 'Blush-Bar', 'LATAM Airlines',
      'SeePuertoRico.com', 'Discovery Channel', 'HBO',
      'Discovery Home & Health', 'Janssen (Johnson & Johnson)',
      'Merqueo.com', 'Newell Rubbermaid', 'Racafe & Cia S.C.A.', 'OLAFAM',
      'Credicorp Capital', 'SAP Business One', 'REM Construcciones',
      'Prabyc Ingenieros', 'Cámara de Comercio de Bogotá',
      'La Casa de Ronald McDonald', 'Elements',
    ],
  },

  // ── Supuestos por defecto para los cálculos de valoración [Fuente D] ──────
  supuestosDefault: {
    fueraDeLibros: {
      valor: 25000000,
      rango: [20000000, 30000000],
      etiqueta: 'declarado por los dueños, no verificable en contabilidad',
    },
    addbacks: {
      depreciacion: 14335607, // = pygDetalle.2025.gastosPrincipales.depreciaciones (redondeado a entero por el dueño)
      gastosFinancieros: 4508827, // ya no hay deuda ni intereses — declarado por dueños 2026-07-20
      ajusteHonorarios: 7500000,
      sueldosSocias: 80967506, // Mariana Leyva y Ana Cecilia salieron de nómina; ganaban $4M/mes entre las dos
                               // + prestaciones = toda la línea de gastos de personal 2025 (80,967,506)
    },
    costoReemplazo: {
      valor: 0,
      rango: [0, 40000000],
      ownerOnly: true, // slider visible solo en modo dueño, para sensibilizar cuánto costaría reemplazar su gestión
    },
    multiploSDE: [1.5, 3.0],
    // valorEquipos (línea original sin desglosar) fue reemplazado por
    // valorEquiposUsado / valorEquiposNuevo (ver abajo).
    // Valor de mercado de los equipos [investigación de precios, 2026-07-20,
    // "leon/la caravana/investigacion_precios_equipos.md"]. TRM usada: 3.260
    // COP/USD (TRM oficial vigente 18-21 jul 2026). "Usado" = valor de reventa
    // en el mercado (piso de valoración); "nuevo" = costo de reposición a nuevo
    // (referencia, no es lo que vendería la empresa). Punto medio de cada rango
    // en USD convertido a COP a esa TRM: usado ≈ US$12.484 (40.700.000/3.260) → $40,7M;
    // nuevo ≈ US$28.804 (93.900.000/3.260) → $93,9M.
    valorEquiposUsado: {
      valor: 40700000,
      rango: [28000000, 54000000],
    },
    valorEquiposNuevo: {
      valor: 93900000,
      rango: [72000000, 116000000],
    },
    // valor de trabajo de la lente de activos: default = valor neto en libros
    // (auxiliar 30/06/2026); piso del rango = liquidación a precios de
    // reventa US (investigación 20-jul-2026).
    // Vehículo excluido por decisión de los dueños 26-jul-2026: default pasa
    // de 111,716,725.24 (neto total) a 94,508,443.36 (= 111,716,725.24 −
    // 17,208,281.88, neto en libros SIN el campero Daihatsu).
    valorActivosTrabajo: {
      valor: 94508443.36,
      rango: [28000000, 130000000],
    },
    // tasa 30% refleja riesgo de persona clave y tamaño; a 22% el valor terminal
    // implicaba ~4.5× SDE, por encima del techo de la lente de múltiplos
    // (decisión metodológica 2026-07-21).
    tasaDCF: 0.30,
    escenariosCrecimiento: {
      pesimista: -0.02,
      base: 0,
      optimista: 0.05,
    },
  },

  // ── Notas obligatorias ─────────────────────────────────────────────────────
  notas: {
    sinDeuda: 'Sin deuda: la empresa hoy no tiene deudas ni gastos de intereses (declarado por dueños 2026-07-20).',
    sociasFueraDeNomina: 'Las socias Mariana Leyva y Ana Cecilia salieron de nómina; ganaban $4M/mes entre las dos + prestaciones — equivale a toda la línea de gastos de personal 2025 ($80,967,506).',
    ingresosFueraDeLibros: 'declarado por los dueños, no verificable en contabilidad',
    discrepancias: [
      'Serie histórica 2015-2025 (Fuente A, pág. 4): en varios años, ingresos - costos - gastos no cuadra exacto contra la utilidad publicada. Esto ocurre porque "ingresos"/"costos"/"gastos" en esa tabla son partidas operacionales, mientras "utilidad" es el resultado neto del ejercicio (incluye partidas no operacionales). Se confirma cruzando 2022 y 2024 contra los PyG detallados, donde la utilidad SÍ cuadra exacto.',
      '2023: la utilidad de la serie histórica (19,531,126.20) no coincide con la utilidad real del PyG comparativo 2023/2022 (26,336,241.72). Se mantienen ambos valores en sus respectivos bloques sin alterarlos.',
      '2025: la utilidad de la serie histórica (-16,065,402.86) no coincide con la utilidad real del PyG comparativo 2025/2024 (-18,737,733.23). Se mantienen ambos valores en sus respectivos bloques sin alterarlos.',
      '2022: ingresos operacionales reportados como 316,780,065.00 en la serie histórica vs. 316,760,065.00 en el PyG comparativo 2023/2022 (diferencia de 20,000 COP, probable error de digitación en una de las dos fuentes).',
      '2025: costos según serie histórica [A] $64.683.016,55 vs total costos según PyG detallado [B] $64.609.016,55 — diferencia de $74.000 entre fuentes; se mantienen ambos valores tal cual sus fuentes.',
    ],
  },
};
