# 📊 Datos Zepp Life — Composición Corporal

Este directorio contiene el historial de mediciones corporales registradas con la báscula inteligente a través de la app **Zepp Life**.

## Ficheros

| Fichero | Descripción |
|---|---|
| `weight-log.json` | Historial completo de mediciones en formato estructurado |
| `screenshots/` | Capturas de pantalla originales de Zepp Life (referencia visual) |

## Cómo añadir una nueva medición

Cada vez que hagas una nueva medición en Zepp Life, añade una entrada al array `mediciones` en `weight-log.json` con el siguiente formato:

```json
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "peso": 0.0,
  "tipo_cuerpo": "Equilibrado",
  "puntuacion_corporal": 0,
  "progreso_respecto_anterior": "+0.00kg",
  "IMC": 0.0,
  "estado_IMC": "Normal",
  "grasa_corporal": 0.0,
  "estado_grasa": "Normal",
  "musculo": 0.0,
  "estado_musculo": "Normal",
  "agua": 0.0,
  "estado_agua": "Normal",
  "proteina": 0.0,
  "estado_proteina": "Normal",
  "grasa_visceral": 0,
  "estado_grasa_visceral": "Normal",
  "masa_osea": 0.0,
  "estado_masa_osea": "Normal",
  "metabolismo_basal": 0,
  "estado_metabolismo": "Normal"
}
```

## Instrucciones para la IA

Al analizar este fichero para el feedback semanal de entrenamiento, ten en cuenta:

- **Tendencia de peso**: comparar las últimas 4 mediciones para ver tendencia (subida/bajada/estabilidad)
- **Composición corporal**: priorizar músculo y grasa corporal sobre el peso bruto
- **Proteína > 20%** es un indicador positivo de nutrición adecuada
- **Grasa visceral < 10** es el rango saludable
- **Puntuación corporal**: escala de la app, mayor = mejor composición general
- El usuario sigue un protocolo de **mini-cut / recomposición** con entrenamiento de fuerza (upper/lower split)
- Mide preferentemente en ayunas por las mañanas (lunes, miércoles, domingos)
