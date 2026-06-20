#!/usr/bin/env python3
"""
zepp_to_github.py
-----------------
Toma un screenshot de Zepp Life, extrae los datos con Gemini Vision
y los sube automáticamente al JSON en GitHub.

Uso:
    python zepp_to_github.py ruta/a/screenshot.png
    python zepp_to_github.py                        # abre selector de archivo
"""

import sys
import os
import json
import base64
import re
import urllib.request
import urllib.error
from pathlib import Path

# ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
GITHUB_TOKEN  = os.environ.get("GITHUB_TOKEN", "")        # gh token o variable de entorno
GITHUB_OWNER  = "javirerffggg"
GITHUB_REPO   = "Rutina-G"
GITHUB_PATH   = "data/zepp/weight-log.json"
GITHUB_BRANCH = "main"

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")     # API key de Gemini
# ──────────────────────────────────────────────────────────────────────────────


def pick_image_file() -> Path:
    """Abre un selector de archivo gráfico si no se pasa argumento."""
    try:
        import tkinter as tk
        from tkinter import filedialog
        root = tk.Tk()
        root.withdraw()
        path = filedialog.askopenfilename(
            title="Selecciona el screenshot de Zepp Life",
            filetypes=[("Imágenes", "*.png *.jpg *.jpeg *.webp")]
        )
        root.destroy()
        if not path:
            sys.exit("❌ No seleccionaste ningún archivo.")
        return Path(path)
    except Exception:
        sys.exit("❌ No se pudo abrir el selector. Pasa la ruta como argumento.")


def image_to_base64(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def extract_data_with_gemini(image_path: Path) -> dict:
    """Envía la imagen a Gemini Vision y extrae los datos estructurados."""
    if not GEMINI_API_KEY:
        sys.exit("❌ Falta GEMINI_API_KEY. Exporta la variable de entorno.")

    prompt = """Analiza esta captura de pantalla de Zepp Life y extrae TODOS los datos numéricos visibles.
Devuelve ÚNICAMENTE un JSON válido con exactamente esta estructura (sin markdown, sin explicaciones):
{
  \"fecha\": \"YYYY-MM-DD\",
  \"hora\": \"HH:MM\",
  \"peso\": 0.0,
  \"tipo_cuerpo\": \"string\",
  \"puntuacion_corporal\": 0,
  \"progreso_respecto_anterior\": \"+0.00kg\",
  \"IMC\": 0.0,
  \"estado_IMC\": \"string\",
  \"grasa_corporal\": 0.0,
  \"estado_grasa\": \"string\",
  \"musculo\": 0.0,
  \"estado_musculo\": \"string\",
  \"agua\": 0.0,
  \"estado_agua\": \"string\",
  \"proteina\": 0.0,
  \"estado_proteina\": \"string\",
  \"grasa_visceral\": 0,
  \"estado_grasa_visceral\": \"string\",
  \"masa_osea\": 0.0,
  \"estado_masa_osea\": \"string\",
  \"metabolismo_basal\": 0,
  \"estado_metabolismo\": \"string\"
}
Para la fecha y hora usa la que aparece en la imagen. Si no aparece el año, usa el año actual 2026.
Los campos estado_* son las etiquetas como Normal, Genial, No consiguió objetivos, etc."""

    img_b64 = image_to_base64(image_path)
    mime = "image/jpeg" if image_path.suffix.lower() in (".jpg", ".jpeg") else "image/png"

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime, "data": img_b64}}
            ]
        }]
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"❌ Error Gemini API: {e.code} {e.read().decode()}")

    text = result["candidates"][0]["content"]["parts"][0]["text"].strip()

    # Limpiar si viene con markdown
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        print("⚠️  Respuesta de Gemini:\n", text)
        sys.exit(f"❌ No se pudo parsear el JSON: {e}")

    return data


def github_api(method: str, endpoint: str, body: dict = None) -> dict:
    """Llamada genérica a la GitHub API."""
    if not GITHUB_TOKEN:
        sys.exit("❌ Falta GITHUB_TOKEN. Exporta la variable de entorno.")

    url = f"https://api.github.com{endpoint}"
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json"
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"❌ GitHub API error {e.code}: {e.read().decode()}")


def update_weight_log(new_entry: dict):
    """Descarga el JSON actual, añade la entrada y hace push."""
    # 1. Obtener fichero actual (necesitamos el SHA para actualizarlo)
    file_info = github_api(
        "GET",
        f"/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{GITHUB_PATH}?ref={GITHUB_BRANCH}"
    )
    current_sha  = file_info["sha"]
    current_json = json.loads(base64.b64decode(file_info["content"]).decode())

    # 2. Comprobar duplicados por fecha+hora
    existing = current_json.get("mediciones", [])
    for m in existing:
        if m.get("fecha") == new_entry.get("fecha") and m.get("hora") == new_entry.get("hora"):
            print(f"⚠️  Ya existe una medición para {new_entry['fecha']} {new_entry['hora']}. Saltando.")
            return False

    # 3. Insertar nueva medición al principio (más recientes primero)
    existing.insert(0, new_entry)
    current_json["mediciones"] = existing

    # 4. Codificar y hacer PUT
    new_content = base64.b64encode(
        json.dumps(current_json, ensure_ascii=False, indent=2).encode()
    ).decode()

    fecha_str = new_entry.get("fecha", "desconocida")
    github_api(
        "PUT",
        f"/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{GITHUB_PATH}",
        {
            "message": f"data(zepp): medición {fecha_str}",
            "content": new_content,
            "sha": current_sha,
            "branch": GITHUB_BRANCH
        }
    )
    return True


def main():
    # Determinar ruta de imagen
    if len(sys.argv) >= 2:
        image_path = Path(sys.argv[1])
        if not image_path.exists():
            sys.exit(f"❌ Archivo no encontrado: {image_path}")
    else:
        print("📂 Abriendo selector de archivo...")
        image_path = pick_image_file()

    print(f"🔍 Procesando: {image_path.name}")

    # Extraer datos con Gemini
    print("🤖 Enviando a Gemini Vision...")
    entry = extract_data_with_gemini(image_path)

    # Mostrar preview
    print("\n📊 Datos extraídos:")
    print(f"   Fecha:          {entry.get('fecha')} {entry.get('hora')}")
    print(f"   Peso:           {entry.get('peso')} kg")
    print(f"   Grasa corporal: {entry.get('grasa_corporal')} %")
    print(f"   Músculo:        {entry.get('musculo')} kg")
    print(f"   Puntuación:     {entry.get('puntuacion_corporal')}")
    print()

    # Confirmar antes de subir
    confirm = input("✅ ¿Subir estos datos a GitHub? [S/n]: ").strip().lower()
    if confirm == "n":
        print("❌ Cancelado.")
        return

    # Subir a GitHub
    print("⬆️  Subiendo a GitHub...")
    if update_weight_log(entry):
        print(f"\n🎉 ¡Listo! Medición del {entry.get('fecha')} subida correctamente.")
        print(f"   🔗 https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/blob/main/{GITHUB_PATH}")
    else:
        print("   No se realizaron cambios.")


if __name__ == "__main__":
    main()
