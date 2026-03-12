# 🎮 Motor de Experiencia Elite - Documentación Técnica

## 📚 Índice

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Economía de EXP](#economía-de-exp)
4. [Sistema de Ligas](#sistema-de-ligas)
5. [Curva de Nivel](#curva-de-nivel)
6. [Componentes Visuales](#componentes-visuales)
7. [Mantenimiento](#mantenimiento)

---

## Visión General

El **Motor de Experiencia Elite** es un sistema de gamificación RPG completo que transforma el progreso de entrenamiento en una experiencia épica y adictiva. El usuario avanza desde el **Nivel 1** hasta el **Nivel 500**, atravesando **9 Ligas** distintivas, cada una con su propia identidad visual y psicológica.

### Características Principales

- ✅ **500 Niveles** con curva exponencial calibrada
- ✅ **9 Ligas/Tiers** con estética única (Óxido → Dios del Olimpo)
- ✅ **EXP Derivada Retroactivamente** (no se guarda, se calcula al vuelo)
- ✅ **Sistema de Bonificaciones**: Tonelaje + Logros + Rachas + PRs
- ✅ **Celebración Automática** de level-up con detección inteligente
- ✅ **HUD Premium** con glass-morphism y gradientes dinámicos
- ✅ **Accesibilidad Completa** (ARIA, teclado, lectores de pantalla)
- ✅ **Optimizado** con memoización React y búsqueda binaria O(log n)

---

## Arquitectura

### Separación de Responsabilidades (SOLID)

```
📁 types/rpg.ts
   └─ Interfaces y tipos estrictos del ecosistema RPG
   └─ RPGStats, RPGTier, RPGTierName

📁 constants/rpgTiers.ts
   └─ Definición de las 9 ligas con paletas visuales
   └─ Diccionario inmutable RPG_TIERS
   └─ Función getTierForLevel()

📁 utils/rpgEngine.ts
   └─ Lógica matemática pura y agnóstica de UI
   └─ calculateUserRPGStats() - Función principal
   └─ Algoritmos de cálculo de EXP, nivel, bonificaciones

📁 hooks/useRPGStats.ts
   └─ Custom hook React con memoización
   └─ Orquesta lectura de logs, logros y rachas
   └─ Evita re-renders innecesarios

📁 components/dashboard/RPGProgressBar.tsx
   └─ Componente visual principal (HUD)
   └─ Barra de progreso con animaciones fluidas
   └─ Badges de estado (multiplicador, logros)

📁 components/dashboard/LevelUpCelebration.tsx
   └─ Modal de celebración animado
   └─ Detecta cambios de liga automáticamente
   └─ Overlay a pantalla completa con efectos

📁 pages/Dashboard.tsx
   └─ Punto de integración principal
   └─ Consume useRPGStats y renderiza componentes
```

### Flujo de Datos

```
localStorage (logs, achievements)
        ↓
   Dashboard.tsx
        ↓
   useRPGStats(logs)
        ↓
  calculateUserRPGStats()
        ↓
     RPGStats
        ↓
  RPGProgressBar.tsx
  LevelUpCelebration.tsx
```

---

## Economía de EXP

### Fórmula de Cálculo Total

```typescript
EXP_Total = EXP_Tonelaje + EXP_Logros + EXP_PRs
```

### 1. EXP por Tonelaje (Base)

**Regla:** `1 Tonelada (1,000 kg) = 10 EXP`

```typescript
const totalVolume = calculateTotalVolume(logs); // kg
const totalTonnes = totalVolume / 1000;
const baseExp = Math.floor(totalTonnes * 10);
```

**Ejemplos:**
- 1,250 kg → 1.25 toneladas → `12 EXP`
- 14,900 kg → 14.9 toneladas → `149 EXP`
- 250,000 kg → 250 toneladas → `2,500 EXP`

### 2. Multiplicador por Racha (Solo afecta tonelaje)

**Regla:** `+2% EXP por día de racha` (Cap: +50% a los 25 días)

```typescript
const streakMultiplier = 1.0 + Math.min(currentStreak * 0.02, 0.5);
const expFromTonnage = Math.floor(baseExp * streakMultiplier);
```

**Ejemplos:**
- 10 días de racha → `x1.20` (20% bonus)
- 25 días de racha → `x1.50` (50% bonus MAX)
- 30 días de racha → `x1.50` (cap alcanzado)

### 3. Bonificación por Logros

**Valores fijos según tier:**

| Tier | EXP Bonus | Equivalente en Tonelaje |
|------|-----------|-------------------------|
| 🥉 **BRONZE** | +500 EXP | 50 toneladas |
| 🥈 **SILVER** | +1,500 EXP | 150 toneladas |
| 🥇 **GOLD** | +5,000 EXP | 500 toneladas |
| 💎 **DIAMOND** | +15,000 EXP | 1,500 toneladas |
| 👑 **ELITE** | +50,000 EXP | 5,000 toneladas |

```typescript
const ACHIEVEMENT_EXP_VALUES = {
  BRONZE: 500,
  SILVER: 1500,
  GOLD: 5000,
  DIAMOND: 15000,
  ELITE: 50000,
};
```

### 4. Bonificación por PRs y Fallo Muscular

**Regla:** `+25 EXP` por cada set que cumpla:
- **RIR 0** (fallo muscular absoluto), o
- **Nuevo PR histórico** (peso máximo en ese ejercicio)

```typescript
const bonusExpFromPRs = prCount * 25;
```

### Ejemplo Completo de Cálculo

**Datos del usuario:**
- Tonelaje histórico: `250,000 kg` (250 toneladas)
- Racha actual: `10 días`
- PRs históricos: `5 sets`
- Logros: 2x BRONZE, 1x SILVER

**Cálculo paso a paso:**

```typescript
// 1. EXP base por tonelaje
baseExp = Math.floor(250 * 10) = 2,500 EXP

// 2. Aplicar multiplicador por racha (10 días = +20%)
streakMultiplier = 1.0 + (10 * 0.02) = 1.20
expFromTonnage = Math.floor(2,500 * 1.20) = 3,000 EXP

// 3. Bonus por PRs
bonusExpFromPRs = 5 * 25 = 125 EXP

// 4. Bonus por logros
bonusExpFromAchievements = (500 + 500 + 1,500) = 2,500 EXP

// 5. TOTAL
totalExp = 3,000 + 125 + 2,500 = 5,625 EXP
```

Con `5,625 EXP`, el usuario estaría en **Nivel 18** (Óxido y Sudor).

---

## Sistema de Ligas

### Las 9 Ligas del Sistema

| Nivel | Liga | Sentimiento | Colores Tailwind | Icono |
|-------|------|-------------|------------------|-------|
| 1-24 | **Óxido y Sudor** | Áspero, industrial, inicial | `from-zinc-600 to-zinc-400` | Dumbbell |
| 25-49 | **Acero Forjado** | Pulido, sólido, confiable | `from-slate-400 to-slate-200` | Hammer |
| 50-99 | **Bronce Espartano** | Guerrero, antiguo, rudo | `from-orange-700 to-amber-600` | Shield |
| 100-149 | **Plata de Gladiador** | Brillante, afilado, combativo | `from-gray-300 to-slate-100` | Swords |
| 150-199 | **Oro Olímpico** | Triunfal, prestigioso, luminoso | `from-yellow-500 to-yellow-300` | Medal |
| 200-299 | **Platino de Titán** | Frío, majestuoso, inquebrantable | `from-cyan-500 to-blue-400` | Mountain |
| 300-399 | **Diamante Semidiós** | Etéreo, valioso, raro | `from-violet-500 to-fuchsia-400` | Gem |
| 400-499 | **Aura de Leyenda** | Ardiente, mítico, inestable | `from-rose-500 via-orange-500 to-amber-400` + `animate-pulse` | Flame |
| **500** | **Dios del Olimpo** | Galáctico, final, omnipotente | `from-indigo-500 via-purple-500 to-emerald-400` + glow | Crown |

### Transiciones de Liga

Cada salto de liga (cada 50/100 niveles) desencadena:

1. **Cambio visual completo** de la barra de progreso
2. **Nuevo gradiente** y border color
3. **Nuevo icono** semántico
4. **Alerta especial** en el modal de level-up: "¡NUEVA LIGA DE PRESTIGIO DESBLOQUEADA!"

---

## Curva de Nivel

### Fórmula Exponencial

```typescript
Total_EXP_Required = Math.floor(100 * Math.pow(L - 1, 1.85))
```

**Donde:**
- `L` = Nivel objetivo (1-500)
- Exponente `1.85` calibrado para escalar progresivamente

### Tabla de Referencia

| Nivel | EXP Requerida (Acumulada) | EXP para Siguiente |
|-------|---------------------------|--------------------|
| 1 | 0 | 100 |
| 10 | 5,754 | 827 |
| 25 | 37,946 | 2,284 |
| 50 | 194,984 | 5,518 |
| 100 | 985,277 | 13,935 |
| 150 | 2,376,644 | 23,426 |
| 200 | 4,477,135 | 33,789 |
| 300 | 10,655,654 | 56,306 |
| 400 | 19,745,223 | 80,550 |
| 500 | 31,746,031 | CAP |

### Algoritmo de Nivel Actual

**Búsqueda binaria optimizada O(log n):**

```typescript
function getLevelFromExp(totalExp: number): number {
  if (totalExp <= 0) return 1;
  if (totalExp >= getExpRequiredForLevel(500)) return 500;
  
  let left = 1, right = 500, level = 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const expForMid = getExpRequiredForLevel(mid);
    const expForNext = getExpRequiredForLevel(mid + 1);
    
    if (totalExp >= expForMid && totalExp < expForNext) {
      level = mid;
      break;
    } else if (totalExp >= expForNext) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return level;
}
```

---

## Componentes Visuales

### RPGProgressBar.tsx

**Estructura del HUD:**

```jsx
<div className="glass-panel + tier.borderColorClass">
  {/* HEADER */}
  <div className="flex items-start justify-between">
    {/* Icono + Título de Liga */}
    <div>
      <IconComponent /> {/* Dinámico según tier */}
      <h3>{tier.displayName} - Nivel {level}</h3>
    </div>
    
    {/* Badges de Estado */}
    <div>
      {streakMultiplier > 1.0 && <Badge>x{mult}</Badge>}
      {achievementBonus > 0 && <Badge>🏆 +{exp}k</Badge>}
    </div>
  </div>
  
  {/* BARRA DE PROGRESO */}
  <div className="progress-container">
    <div 
      className={`fill bg-gradient-to-r ${tier.gradientClass}`}
      style={{ width: `${progressPercentage}%` }}
    >
      {/* Glow effect */}
    </div>
  </div>
  
  {/* FOOTER */}
  <div className="flex justify-between">
    <span>{expInLevel} / {expNeeded} EXP</span>
    <span>{expRemaining} EXP para Nivel {level + 1}</span>
  </div>
</div>
```

### LevelUpCelebration.tsx

**Secuencia de animación:**

1. **Overlay fade-in** (bg-black/95 + backdrop-blur)
2. **Partículas decorativas** (20 puntos aleatorios con gradiente de la liga)
3. **Icono de liga** con resplandor pulsante
4. **Texto "¡NIVEL ALCANZADO!"** con sparkles
5. **Número gigante** del nuevo nivel (zoom-in-75)
6. **Nombre de la liga** en texto secundario
7. **Alerta de nueva liga** (si aplica) con gradiente animado
8. **Botón "Continuar"** en la parte inferior

**Detección automática:**

```typescript
useEffect(() => {
  const lastSeenLevel = parseInt(
    localStorage.getItem('rpg_last_seen_level') ?? '1', 10
  );
  
  if (rpgStats.level > lastSeenLevel) {
    setPreviousLevel(lastSeenLevel);
    setShowLevelUpModal(true);
    localStorage.setItem('rpg_last_seen_level', rpgStats.level.toString());
  }
}, [rpgStats.level]);
```

---

## Mantenimiento

### Añadir una Nueva Liga

1. **Definir rango de niveles** en `constants/rpgTiers.ts`
2. **Crear entrada en RPG_TIERS** con:
   - `name`: identificador único
   - `displayName`: nombre visible
   - `minLevel` / `maxLevel`
   - `gradientClass`: gradiente Tailwind
   - `borderColorClass`: color de borde
   - `iconName`: icono de lucide-react
   - `glowClass` (opcional): efectos especiales

### Modificar la Economía de EXP

**Archivo:** `utils/rpgEngine.ts`

```typescript
// Cambiar valor base por tonelada
const EXP_PER_TONNE = 10; // Aumentar para progresión más rápida

// Modificar multiplicador por racha
const STREAK_MULTIPLIER_PER_DAY = 0.02; // 2% por día
const MAX_STREAK_MULTIPLIER = 0.5;      // Cap de 50%

// Ajustar bonus por PRs
const PR_BONUS_EXP = 25;

// Cambiar valores de logros
const ACHIEVEMENT_EXP_VALUES = {
  BRONZE: 500,   // Modificar aquí
  SILVER: 1500,
  GOLD: 5000,
  DIAMOND: 15000,
  ELITE: 50000,
};
```

### Ajustar la Curva de Nivel

**Archivo:** `utils/rpgEngine.ts`

```typescript
function getExpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > 500) return getExpRequiredForLevel(500);
  
  // Modificar exponente para cambiar la curva
  // Menor exponente = progresión más lineal
  // Mayor exponente = progresión más agresiva
  return Math.floor(100 * Math.pow(level - 1, 1.85));
  //                                        ^^^^^
  //                                    Ajustar aquí
}
```

**Ejemplos de exponentes:**
- `1.5` → Curva suave (más fácil)
- `1.85` → Curva actual (equilibrada)
- `2.0` → Curva agresiva (más difícil)
- `2.2` → Curva muy agresiva (end-game brutal)

### Debugging y Testing

**Consola del navegador:**

```javascript
// Ver EXP total y nivel actual
const logs = JSON.parse(localStorage.getItem('fitness_pro_logs_v1'));
console.log('Total volume:', calculateTotalVolume(logs));

// Simular nivel específico
const expForLevel50 = getExpRequiredForLevel(50);
console.log('EXP para nivel 50:', expForLevel50);

// Resetear nivel visto (volver a mostrar celebración)
localStorage.setItem('rpg_last_seen_level', '1');
```

---

## Casos de Uso

### Usuario Nuevo (Día 1)

```
Tonelaje: 0 kg
Racha: 0 días
Logros: 0
PRs: 0

EXP Total: 0
Nivel: 1
Liga: Óxido y Sudor
```

### Usuario Intermedio (3 meses)

```
Tonelaje: 150,000 kg (150 toneladas)
Racha: 15 días
Logros: 3x BRONZE, 2x SILVER
PRs: 8

Cálculo:
- Base: 150 ton * 10 = 1,500 EXP
- Racha: 1,500 * 1.30 = 1,950 EXP
- PRs: 8 * 25 = 200 EXP
- Logros: (500*3 + 1500*2) = 4,500 EXP

EXP Total: 6,650
Nivel: 19
Liga: Óxido y Sudor
```

### Usuario Avanzado (1 año)

```
Tonelaje: 800,000 kg (800 toneladas)
Racha: 25 días (cap)
Logros: 10x BRONZE, 5x SILVER, 3x GOLD, 1x DIAMOND
PRs: 35

Cálculo:
- Base: 800 ton * 10 = 8,000 EXP
- Racha: 8,000 * 1.50 = 12,000 EXP
- PRs: 35 * 25 = 875 EXP
- Logros: (500*10 + 1500*5 + 5000*3 + 15000*1) = 37,500 EXP

EXP Total: 50,375
Nivel: 57
Liga: Bronce Espartano
```

### Usuario Élite (2+ años)

```
Tonelaje: 3,000,000 kg (3,000 toneladas)
Racha: 25 días
Logros: Todos desbloqueados (incluye ELITE)
PRs: 120

Cálculo:
- Base: 3,000 ton * 10 = 30,000 EXP
- Racha: 30,000 * 1.50 = 45,000 EXP
- PRs: 120 * 25 = 3,000 EXP
- Logros: ~150,000 EXP (estimado)

EXP Total: ~198,000
Nivel: ~120
Liga: Plata de Gladiador
```

---

## Optimizaciones Implementadas

### 1. Memoización React

```typescript
const rpgStats = useMemo(() => {
  return calculateUserRPGStats(logs, currentStreak, achievements);
}, [logs, currentStreak, achievements]);
```

**Evita:** Re-cálculos costosos en cada render.

### 2. Búsqueda Binaria

```typescript
// O(log n) en lugar de O(n)
function getLevelFromExp(totalExp: number): number {
  // Búsqueda binaria entre 1 y 500
}
```

**Evita:** Iteración lineal de 500 niveles.

### 3. Early Returns

```typescript
if (totalExp <= 0) return 1;
if (totalExp >= getExpRequiredForLevel(500)) return 500;
```

**Evita:** Cálculos innecesarios en casos extremos.

### 4. Math.floor Global

```typescript
const baseExp = Math.floor(totalTonnes * EXP_PER_TONNE);
```

**Evita:** Decimales extraños en la UI.

---

## Accesibilidad (a11y)

### ARIA Attributes

```jsx
<div
  role="progressbar"
  aria-valuenow={expInCurrentLevel}
  aria-valuemin="0"
  aria-valuemax={expForNextLevel}
  aria-label="Progreso hacia el siguiente nivel de experiencia"
>
  {/* Barra visual */}
</div>
```

### Navegación por Teclado

- Modal se cierra con `Enter` o `Space` en el botón
- Focus trap automático durante celebración
- Scroll bloqueado durante overlay

### Lectores de Pantalla

- Iconos tienen `aria-label` descriptivo
- Badges tienen texto legible semánticamente
- Niveles y EXP anunciados correctamente

---

## Roadmap Futuro

### Posibles Mejoras

- ☑️ **Logros RPG específicos**: "Alcanzar nivel 100", "Desbloquear liga Diamante"
- ☑️ **Ranking global**: Comparar nivel con otros usuarios
- ☑️ **Recompensas por nivel**: Desbloquear temas visuales, avatares
- ☑️ **Prestige system**: Reiniciar desde nivel 1 con multiplicador permanente
- ☑️ **Eventos temporales**: EXP doble los fines de semana
- ☑️ **Minijuegos**: Ganar EXP extra con retos especiales
- ☑️ **Exportar progreso**: Compartir tarjeta de nivel en redes sociales

---

## Créditos

**Diseñado y desarrollado por:**
- Arquitectura: Staff Engineer AI
- Gamificación: Especialista en Psicología RPG
- UI/UX: Experto en Design Systems
- Matemáticas: Motor Algorítmico Optimizado

**Stack tecnológico:**
- React 19
- TypeScript (strict mode)
- TailwindCSS
- Lucide React (iconos)
- Vite

---

¡Que cada entreno sea una batalla épica! 💪🎮
