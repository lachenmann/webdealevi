# webdealevi

Repositorio público de `alevipena.cl`.

## Migración Quarto

La rama `quarto-v2` contiene la reingeniería progresiva del sitio con Quarto y Markdown compatible con Obsidian.

Baseline pre-Quarto:

`780d9fcac3d4ae5aa1941a755299b8d13fa45428` (`webdealevi 0.7.7`)

Reglas de esta fase:

- `main` conserva el sitio público actual.
- `quarto-v2` es la rama de migración.
- El contenido público nuevo se escribirá preferentemente en Markdown estándar.
- Los PDF, MP3 y aplicaciones HTML/JavaScript existentes se preservan como recursos estáticos.
- `_site/` es salida generada y no se versiona en esta etapa.

Render local:

```bash
quarto render
```

La salida esperada se genera en `_site/`.
