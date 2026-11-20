# Carta digital · Yohaku Coffee & Tea

Abre `dist/index.html` para revisar la carta. La página funciona como un sitio estático y el menú se puede leer con JavaScript desactivado.

## Actualizar la carta

Edita `carta.json` y ejecuta `node build.mjs` desde esta carpeta. Publica el contenido de `dist/` mediante el alojamiento elegido.

- Cambia los precios como números enteros en pesos chilenos. Por ejemplo, `3500` se muestra como `$3.500`.
- Para un producto con tamaños o cantidades, usa `options` con un `label` y un `price` en cada entrada. Las opciones de un grupo se muestran junto al nombre del grupo.
- Añade promociones vigentes al arreglo `promotions` con `title`, `description` y, si hace falta, `note` para indicar fechas o condiciones. Retira las ofertas al vencer. Cuando el arreglo está vacío, la carta dirige a Instagram.
- Los horarios, la dirección y el perfil de Instagram se editan en `location`.

## QR para el local

Usa la URL pública definitiva de la carta para el código QR. Comprueba que abre desde la cámara del teléfono usando datos móviles, sin inicio de sesión. Conserva la misma URL al actualizar precios o promociones para reutilizar los QR impresos.

Los precios vienen de la carta impresa primavera–verano. Las descripciones breves se adaptaron para pantalla. Los recursos gráficos de la web son reconstrucciones de la identidad del menú impreso.
