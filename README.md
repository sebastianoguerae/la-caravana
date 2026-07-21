# La Caravana Creativa — Valoración

Sitio estático (SPA en HTML/CSS/JS vanilla, sin librerías ni backend) que presenta a
**La Caravana Creativa SAS** (cabinas fotográficas para eventos, Colombia) y explica su
valoración. Pensado para desplegarse en GitHub Pages.

## Estructura

```
index.html      Esqueleto de la página: pantalla de clave + app con nav de 7 secciones
css/style.css   Estilos: tema oscuro tipo memo de inversión, acento degradé rosa/naranja
js/app.js       Gate de claves (checkKey, showView) y lógica de la app
```

## Acceso

La página pide una clave antes de mostrar el contenido. Según la clave ingresada se
entra en modo **dueños** o modo **compradores**:

- Modo dueños: se ve todo el contenido, incluidos los elementos marcados `owner-only`.
- Modo compradores: los elementos `owner-only` quedan ocultos.

El modo se valida comparando el hash SHA-256 (hex) de la clave en mayúsculas contra
constantes hardcodeadas en `js/app.js` — la clave nunca se guarda ni se transmite en
claro. El modo elegido persiste en `sessionStorage` mientras dure la pestaña.

## Desarrollo local

No requiere build ni dependencias, pero **no** abras `index.html` directo desde el
disco (`file://`): el navegador bloquea `crypto.subtle` fuera de un contexto seguro
(HTTPS o `localhost`), así que la pantalla de clave no puede validar el hash SHA-256 y
falla con un error. Sirve la carpeta con un servidor local y abre `http://localhost`:

```
python3 -m http.server
```

Luego entra a `http://localhost:8000` en el navegador.

## Estado

Este es el esqueleto base del sitio (Tarea 1 de 5). Las secciones (`#empresa`,
`#foto-financiera`, `#activos`, `#marcas-clientes`, `#normalizacion`, `#valoracion`,
`#rango-valor`) están vacías; su contenido y datos se agregan en tareas posteriores.
