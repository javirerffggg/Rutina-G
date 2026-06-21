# Rutina-G 🏋️‍♂️🏆

Rutina-G (también conocido internamente como Fitness Pro Elite) es una **Progressive Web App (PWA)** de seguimiento de entrenamientos hiper-optimizada, diseñada con un enfoque extremo en la estética premium, la gamificación (RPG) y la retención del usuario. 

La aplicación combina un tracking de fuerza brutalmente eficiente con un sistema de recompensas dinámico, animaciones fluidas a 60fps y capacidades offline. Está diseñada específicamente para ofrecer una experiencia nativa en dispositivos móviles (especialmente iOS/Safari).

---

## ✨ Características Principales

### 🎮 Sistema de Gamificación (RPG)
- **Experiencia y Niveles**: Gana XP por cada entrenamiento completado, por rachas de consistencia y por batir tus Récords Personales (PRs). Sube de nivel de Hierro a Leyenda.
- **Sala de Trofeos Avanzada**: Desbloquea logros clasificados por rareza (Bronce, Plata, Oro, Diamante, Élite). Cada rareza tiene efectos visuales CSS avanzados (ej. bordes rotatorios de neón para Élite, cristal esmerilado para Diamante).
- **Logros Ocultos**: Mantén el misterio con logros épicos encriptados (con efecto `blur`) hasta que descubras cómo desbloquearlos.
- **Rachas y Consistencia**: Sistema estricto de tracking de rachas semanales con penalizaciones por inactividad.

### ⚡ Tracking de Entrenamiento Hiper-Fluido
- **Modo Sesión Activa (Live Activity)**: Interfaz minimalista durante el entreno. Contenedores colapsados compactos para previsualizar próximos ejercicios sin ocupar espacio.
- **Smart Timers**: Temporizador de descanso automático con notificaciones auditivas, vibración (haptics) y un espectacular efecto visual (Edge Glow) en los bordes de la pantalla cuando el tiempo llega a cero.
- **Calentamiento Automatizado**: Generación automática de series de aproximación (50% y 75% del 1RM) integradas en el primer ejercicio de tu sesión al completar la guía de calentamiento.
- **Flexibilidad Total**: Intercambia ejercicios al vuelo, reordena tu rutina, o descarta una sesión accidental con un solo clic.

### 📊 Analíticas y Visualización de Datos
- **Body Heatmap**: Mapa de calor muscular en 3D que ilustra qué grupos musculares están más fatigados en base a tu volumen reciente.
- **Dashboard Estadístico**: Gráficas de volumen evolutivo (usando Recharts), distribución del trabajo por músculo y seguimiento de tonelaje total.
- **Historial Completo**: Revisión cronológica de todos tus entrenos pasados con indicadores rápidos de PRs batidos y opción de eliminar registros (con recálculo automático de todo tu historial).

### ☁️ Sincronización y Arquitectura
- **Local-First + Cloud Sync**: La app lee y escribe instantáneamente en `localStorage` garantizando 0 milisegundos de latencia. En segundo plano, sincroniza silenciosamente con una base de datos en la nube usando **Convex**.
- **100% PWA**: Optimizada con manifiesto web, service workers, scroll behaviors personalizados y soporte nativo de iOS (pantalla completa, sin safari bars).

---

## 🛠️ Stack Tecnológico

- **Core**: React 19, TypeScript, Vite
- **Estilos y UI**: Tailwind CSS, Framer Motion (para animaciones fluidas y gestos), Lucide React (iconografía)
- **Visualización de Datos**: Recharts, React Body Highlighter
- **Backend / DB**: Convex (Realtime DB & Serverless Functions)
- **Exportación**: jspdf, jspdf-autotable, html2canvas (Exportación de reportes PDF y capturas)

---

## 🚀 Instalación y Desarrollo Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/javirerffggg/Rutina-G.git
   cd Rutina-G
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Base de Datos (Convex)**
   Asegúrate de tener configurado tu proyecto de Convex. Si es la primera vez:
   ```bash
   npx convex dev
   ```
   Esto levantará el backend y sincronizará el esquema.

4. **Iniciar el servidor de desarrollo local**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

5. **Construcción para Producción**
   ```bash
   npm run build
   ```

---

## 📱 Instalación en iOS (PWA)

Para obtener la experiencia completa para la que Rutina-G fue diseñada:
1. Abre la URL de producción en **Safari**.
2. Toca el botón "Compartir" en la barra inferior.
3. Selecciona **"Añadir a la pantalla de inicio"**.
4. Abre "Rutina-G" directamente desde tu pantalla de inicio como una aplicación nativa.

---

## 🤝 Contribución
Este proyecto está altamente personalizado para una metodología de entrenamiento específica (Push/Pull/Legs/Upper/Lower), pero su código base y sistema de progresión RPG son fácilmente adaptables a cualquier framework de entrenamiento de fuerza.
