# Scripts de automatización

## `zepp_to_github.py`

Extrae automáticamente los datos de un screenshot de Zepp Life usando **Gemini Vision** y los sube al `data/zepp/weight-log.json` del repositorio.

### Instalación

Solo necesitas **Python 3.8+** estándar. Sin dependencias externas.

```bash
python3 --version
```

### Configuración (una sola vez)

Añade esto a tu `~/.bashrc` o `~/.zshrc`:

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"
export GEMINI_API_KEY="AIzaSyxxxxxxxxxxxxxxxxx"
```

- **GITHUB_TOKEN** → https://github.com/settings/tokens → *Generate new token (classic)* → permiso: `repo`
- **GEMINI_API_KEY** → https://aistudio.google.com/app/apikey (gratuito)

Recarga la terminal:
```bash
source ~/.bashrc
```

### Uso

```bash
# Con selector gráfico (recomendado)
python3 scripts/zepp_to_github.py

# Pasando la ruta directamente
python3 scripts/zepp_to_github.py ~/Descargas/zepp_screenshot.jpg
```

### Flujo completo

```
📱 Te mides con la báscula Zepp
        ↓
📸 Screenshot a la pantalla de resultados
        ↓
💻 python3 scripts/zepp_to_github.py
        ↓
🤖 Gemini extrae los datos de la imagen
        ↓
✅ Confirmas los datos en terminal
        ↓
⬆️  Push automático a GitHub
        ↓
🧠 La IA de feedback ya tiene los datos
```

### Notas

- Detecta y evita entradas duplicadas (misma fecha + hora)
- Las mediciones se insertan al principio del JSON (más recientes arriba)
- Usa `gemini-2.0-flash` — rápido y gratuito para este uso
- **Sin dependencias pip** — solo stdlib de Python
