# Guía de Importación de Ejercicios y Comidas mediante JSON

Esta guía documenta cómo enviar datos JSON para crear ejercicios y comidas en el sistema, tanto de forma individual como en lote.

## Tabla de Contenidos

1. [Crear Ejercicios](#crear-ejercicios)
2. [Crear Comidas](#crear-comidas)
3. [Importación Masiva](#importación-masiva)
4. [Ejemplos Completos](#ejemplos-completos)

---

## Crear Ejercicios

### Endpoint Individual

**POST** `/api/exercises`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Estructura JSON para un Ejercicio

```json
{
  "name": "Press de Banca",
  "description": "Ejercicio compuesto para desarrollar el pecho, hombros y tríceps",
  "instructions": "Acuéstate en el banco, agarra la barra con las manos separadas al ancho de los hombros, baja la barra al pecho y empuja hacia arriba",
  "imageUrl": "https://ejemplo.com/imagenes/press-banca.jpg",
  "videoUrl": "https://ejemplo.com/videos/press-banca.mp4",
  "machineTypeId": "clx1234567890abcdef"
}
```

### Campos del Ejercicio

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | `string` | ✅ **Sí** | Nombre del ejercicio (mínimo 1 carácter) |
| `description` | `string` | ❌ No | Descripción detallada del ejercicio |
| `instructions` | `string` | ❌ No | Instrucciones paso a paso para realizar el ejercicio |
| `imageUrl` | `string` | ❌ No | URL de la imagen del ejercicio (debe ser una URL válida o cadena vacía) |
| `videoUrl` | `string` | ❌ No | URL del video demostrativo (debe ser una URL válida o cadena vacía) |
| `machineTypeId` | `string` | ❌ No | ID del tipo de máquina asociada (CUID válido) |

### Ejemplo Mínimo

```json
{
  "name": "Sentadillas"
}
```

### Ejemplo Completo

```json
{
  "name": "Press de Banca con Barra",
  "description": "Ejercicio fundamental para desarrollar la fuerza del tren superior, especialmente pecho, hombros y tríceps",
  "instructions": "1. Acuéstate en el banco plano con los pies firmes en el suelo\n2. Agarra la barra con las manos separadas ligeramente más que el ancho de los hombros\n3. Baja la barra controladamente hasta tocar el pecho\n4. Empuja la barra hacia arriba hasta extender completamente los brazos\n5. Repite el movimiento",
  "imageUrl": "https://res.cloudinary.com/tu-cuenta/image/upload/v1234567890/press-banca.jpg",
  "videoUrl": "https://www.youtube.com/watch?v=ejemplo123",
  "machineTypeId": "clx1234567890abcdef"
}
```

---

## Crear Comidas

### Endpoint Individual

**POST** `/api/meals`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Estructura JSON para una Comida

```json
{
  "name": "Pechuga de Pollo a la Plancha",
  "description": "Pechuga de pollo cocinada a la plancha con especias",
  "instructions": "1. Sazona la pechuga con sal, pimienta y ajo\n2. Calienta la plancha a fuego medio-alto\n3. Cocina 6-8 minutos por cada lado hasta que esté dorada\n4. Deja reposar 5 minutos antes de servir",
  "imageUrl": "https://ejemplo.com/imagenes/pollo-plancha.jpg",
  "calories": 231,
  "protein": 43.5,
  "carbs": 0,
  "fats": 5.0,
  "fiber": 0
}
```

### Campos de la Comida

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | `string` | ✅ **Sí** | Nombre de la comida/receta (mínimo 1 carácter) |
| `description` | `string` | ❌ No | Descripción de la comida |
| `instructions` | `string` | ❌ No | Instrucciones de preparación |
| `imageUrl` | `string` | ❌ No | URL de la imagen de la comida (debe ser una URL válida o cadena vacía) |
| `calories` | `number` | ❌ No | Calorías por porción (debe ser >= 0) |
| `protein` | `number` | ❌ No | Gramos de proteína por porción (debe ser >= 0) |
| `carbs` | `number` | ❌ No | Gramos de carbohidratos por porción (debe ser >= 0) |
| `fats` | `number` | ❌ No | Gramos de grasas por porción (debe ser >= 0) |
| `fiber` | `number` | ❌ No | Gramos de fibra por porción (debe ser >= 0) |

### Ejemplo Mínimo

```json
{
  "name": "Ensalada César"
}
```

### Ejemplo Completo

```json
{
  "name": "Bowl de Quinoa con Pollo y Verduras",
  "description": "Plato completo y nutritivo con quinoa, pollo a la plancha y verduras asadas",
  "instructions": "1. Cocina la quinoa según las instrucciones del paquete\n2. Cocina el pollo a la plancha y córtalo en tiras\n3. Asa las verduras (brócoli, zanahoria, pimiento) en el horno\n4. Monta el bowl con quinoa como base, añade el pollo y las verduras\n5. Aliña con aceite de oliva y limón",
  "imageUrl": "https://res.cloudinary.com/tu-cuenta/image/upload/v1234567890/quinoa-bowl.jpg",
  "calories": 485,
  "protein": 35.2,
  "carbs": 52.3,
  "fats": 12.8,
  "fiber": 6.5
}
```

---

## Importación Masiva

### Endpoint de Importación de Ejercicios

**POST** `/api/exercises/import`

**Permisos:** Solo `SUPERADMIN` o `ADMIN_CENTER`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Estructura JSON para Importación de Ejercicios

```json
{
  "exercises": [
    {
      "name": "Press de Banca",
      "description": "Ejercicio para pecho",
      "instructions": "Instrucciones detalladas...",
      "imageUrl": "https://ejemplo.com/imagen1.jpg",
      "videoUrl": "https://ejemplo.com/video1.mp4",
      "machineTypeId": "clx1234567890abcdef"
    },
    {
      "name": "Sentadillas",
      "description": "Ejercicio para piernas",
      "instructions": "Instrucciones detalladas...",
      "imageUrl": "https://ejemplo.com/imagen2.jpg"
    },
    {
      "name": "Peso Muerto",
      "description": "Ejercicio compuesto completo"
    }
  ]
}
```

### Respuesta de Importación

```json
{
  "created": 2,
  "skipped": 1,
  "errors": [
    {
      "exercise": "Peso Muerto",
      "error": "El nombre del ejercicio ya existe"
    }
  ]
}
```

### Endpoint de Importación de Comidas

**POST** `/api/meals/import`

**Permisos:** Solo `SUPERADMIN` o `ADMIN_CENTER`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Estructura JSON para Importación de Comidas

```json
{
  "meals": [
    {
      "name": "Pechuga de Pollo a la Plancha",
      "description": "Pollo cocinado a la plancha",
      "instructions": "Instrucciones de preparación...",
      "imageUrl": "https://ejemplo.com/imagen1.jpg",
      "calories": 231,
      "protein": 43.5,
      "carbs": 0,
      "fats": 5.0,
      "fiber": 0
    },
    {
      "name": "Ensalada Mediterránea",
      "description": "Ensalada fresca con ingredientes mediterráneos",
      "calories": 180,
      "protein": 8.5,
      "carbs": 15.2,
      "fats": 10.3,
      "fiber": 4.2
    },
    {
      "name": "Batido de Proteínas",
      "calories": 320,
      "protein": 30.0,
      "carbs": 25.0,
      "fats": 8.0
    }
  ]
}
```

### Respuesta de Importación

```json
{
  "created": 2,
  "skipped": 1,
  "errors": [
    {
      "meal": "Batido de Proteínas",
      "error": "El nombre de la comida ya existe"
    }
  ]
}
```

---

## Ejemplos Completos

### Ejemplo: Crear Ejercicio Individual (cURL)

```bash
curl -X POST http://localhost:3000/api/exercises \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Press de Banca",
    "description": "Ejercicio fundamental para el desarrollo del pecho",
    "instructions": "Acuéstate en el banco y realiza el movimiento de press",
    "imageUrl": "https://ejemplo.com/press-banca.jpg",
    "machineTypeId": "clx1234567890abcdef"
  }'
```

### Ejemplo: Crear Comida Individual (cURL)

```bash
curl -X POST http://localhost:3000/api/meals \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pechuga de Pollo a la Plancha",
    "description": "Pollo cocinado de forma saludable",
    "calories": 231,
    "protein": 43.5,
    "carbs": 0,
    "fats": 5.0
  }'
```

### Ejemplo: Importación Masiva de Ejercicios (cURL)

```bash
curl -X POST http://localhost:3000/api/exercises/import \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "exercises": [
      {
        "name": "Press de Banca",
        "description": "Ejercicio para pecho",
        "instructions": "Instrucciones detalladas del press de banca"
      },
      {
        "name": "Sentadillas",
        "description": "Ejercicio para piernas",
        "instructions": "Instrucciones detalladas de sentadillas"
      }
    ]
  }'
```

### Ejemplo: Importación Masiva de Comidas (cURL)

```bash
curl -X POST http://localhost:3000/api/meals/import \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "meals": [
      {
        "name": "Pechuga de Pollo",
        "calories": 231,
        "protein": 43.5,
        "carbs": 0,
        "fats": 5.0
      },
      {
        "name": "Ensalada César",
        "calories": 180,
        "protein": 8.5,
        "carbs": 15.2,
        "fats": 10.3
      }
    ]
  }'
```

### Ejemplo: Usando el Servicio en Angular

#### Crear un Ejercicio

```typescript
import { ExercisesService } from './core/services/exercises.service';

// Inyectar el servicio
constructor(private exercisesService: ExercisesService) {}

// Crear ejercicio
const exerciseData = {
  name: "Press de Banca",
  description: "Ejercicio fundamental para el pecho",
  instructions: "Instrucciones detalladas...",
  imageUrl: "https://ejemplo.com/imagen.jpg",
  machineTypeId: "clx1234567890abcdef"
};

this.exercisesService.createExercise(exerciseData).subscribe({
  next: (exercise) => {
    console.log('Ejercicio creado:', exercise);
  },
  error: (err) => {
    console.error('Error:', err);
  }
});
```

#### Importar Múltiples Ejercicios

```typescript
const exercisesData = [
  {
    name: "Press de Banca",
    description: "Ejercicio para pecho"
  },
  {
    name: "Sentadillas",
    description: "Ejercicio para piernas"
  }
];

this.exercisesService.importExercises(exercisesData).subscribe({
  next: (result) => {
    console.log(`Creados: ${result.created}, Omitidos: ${result.skipped}`);
    if (result.errors.length > 0) {
      console.error('Errores:', result.errors);
    }
  },
  error: (err) => {
    console.error('Error:', err);
  }
});
```

#### Crear una Comida

```typescript
import { MealsService } from './core/services/meals.service';

// Inyectar el servicio
constructor(private mealsService: MealsService) {}

// Crear comida
const mealData = {
  name: "Pechuga de Pollo a la Plancha",
  description: "Pollo cocinado de forma saludable",
  calories: 231,
  protein: 43.5,
  carbs: 0,
  fats: 5.0,
  fiber: 0
};

this.mealsService.createMeal(mealData).subscribe({
  next: (meal) => {
    console.log('Comida creada:', meal);
  },
  error: (err) => {
    console.error('Error:', err);
  }
});
```

#### Importar Múltiples Comidas

```typescript
const mealsData = [
  {
    name: "Pechuga de Pollo",
    calories: 231,
    protein: 43.5,
    carbs: 0,
    fats: 5.0
  },
  {
    name: "Ensalada César",
    calories: 180,
    protein: 8.5,
    carbs: 15.2,
    fats: 10.3
  }
];

this.mealsService.importMeals(mealsData).subscribe({
  next: (result) => {
    console.log(`Creados: ${result.created}, Omitidos: ${result.skipped}`);
    if (result.errors.length > 0) {
      console.error('Errores:', result.errors);
    }
  },
  error: (err) => {
    console.error('Error:', err);
  }
});
```

---

## Validaciones y Restricciones

### Ejercicios

- ✅ `name` es obligatorio y debe tener al menos 1 carácter
- ✅ `imageUrl` y `videoUrl` deben ser URLs válidas o cadenas vacías
- ✅ `machineTypeId` debe ser un CUID válido si se proporciona
- ✅ Todos los campos opcionales pueden omitirse

### Comidas

- ✅ `name` es obligatorio y debe tener al menos 1 carácter
- ✅ `imageUrl` debe ser una URL válida o cadena vacía
- ✅ Todos los valores nutricionales (`calories`, `protein`, `carbs`, `fats`, `fiber`) deben ser números >= 0
- ✅ Todos los campos opcionales pueden omitirse

### Importación Masiva

- ✅ El array `exercises` o `meals` debe contener al menos 1 elemento
- ✅ Cada elemento del array debe cumplir con las validaciones individuales
- ✅ Si un elemento falla, se registra en `errors` pero el proceso continúa
- ✅ Solo usuarios con rol `SUPERADMIN` o `ADMIN_CENTER` pueden usar la importación masiva

---

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| `201` | Creado exitosamente (creación individual) |
| `200` | Operación exitosa (importación masiva) |
| `400` | Error de validación en los datos enviados |
| `401` | No autenticado (falta token o token inválido) |
| `403` | No autorizado (falta permiso para importación masiva) |
| `409` | Conflicto (nombre ya existe) |
| `500` | Error interno del servidor |

---

## Notas Importantes

1. **Autenticación**: Todas las operaciones requieren un token JWT válido en el header `Authorization: Bearer <token>`

2. **Importación Masiva**: Solo usuarios con rol `SUPERADMIN` o `ADMIN_CENTER` pueden usar los endpoints `/import`

3. **Duplicados**: Si intentas crear un ejercicio/comida con un nombre que ya existe, recibirás un error 409 (Conflict)

4. **URLs de Imágenes**: Las URLs de imágenes deben ser válidas. Puedes usar servicios como Cloudinary, Imgur, o cualquier otro servicio de hosting de imágenes

5. **Valores Nutricionales**: Los valores nutricionales de las comidas deben ser números positivos (>= 0)

6. **MachineTypeId**: Para ejercicios, el `machineTypeId` es opcional. Si no tienes un ID válido, simplemente omite este campo

---

## Archivos JSON de Ejemplo

Puedes guardar estos ejemplos en archivos `.json` para importarlos:

### `ejercicios-ejemplo.json`
```json
{
  "exercises": [
    {
      "name": "Press de Banca",
      "description": "Ejercicio fundamental para el desarrollo del pecho",
      "instructions": "Acuéstate en el banco plano, agarra la barra y realiza el movimiento de press"
    },
    {
      "name": "Sentadillas",
      "description": "Ejercicio compuesto para el desarrollo de piernas",
      "instructions": "Coloca la barra sobre los hombros y realiza el movimiento de sentadilla"
    }
  ]
}
```

### `comidas-ejemplo.json`
```json
{
  "meals": [
    {
      "name": "Pechuga de Pollo a la Plancha",
      "description": "Pollo cocinado de forma saludable",
      "calories": 231,
      "protein": 43.5,
      "carbs": 0,
      "fats": 5.0
    },
    {
      "name": "Ensalada César",
      "description": "Ensalada fresca y nutritiva",
      "calories": 180,
      "protein": 8.5,
      "carbs": 15.2,
      "fats": 10.3,
      "fiber": 4.2
    }
  ]
}
```

---

## Transformación de Formatos Personalizados

Si tienes ejercicios en un formato diferente al esperado por la API, puedes usar el script de transformación incluido.

### Script de Transformación

El proyecto incluye un script Node.js que transforma ejercicios desde formatos personalizados al formato esperado por la API.

**Ubicación:** `front/scripts/transform-exercises.js`

### Formato Personalizado Soportado

El script puede transformar ejercicios con la siguiente estructura:

```json
[
  {
    "id": "exe-102",
    "nombre": "Press de Banca",
    "tipo": "Fuerza",
    "equipo": "Barra",
    "dificultad": "Intermedio",
    "musculos": {
      "primarios": ["Pectoral mayor"],
      "secundarios": ["Tríceps", "Deltoides anterior"]
    },
    "metricas_sugeridas": {
      "series_recomendadas": 4,
      "repeticiones_objetivo": "8-12",
      "descanso_segundos": 90
    }
  }
]
```

### Uso del Script

#### Desde la Línea de Comandos

```bash
# Transformar un archivo JSON
node scripts/transform-exercises.js archivo-entrada.json > archivo-salida.json

# O usando pipe
cat archivo-entrada.json | node scripts/transform-exercises.js > archivo-salida.json
```

#### Ejemplo Práctico

```bash
# 1. Guarda tus ejercicios en formato personalizado en un archivo
# ejemplo: mis-ejercicios.json

# 2. Transforma el archivo
node scripts/transform-exercises.js mis-ejercicios.json > ejercicios-api.json

# 3. El archivo ejercicios-api.json estará listo para importar
```

#### Desde Código JavaScript/TypeScript

```javascript
const { transformExercises } = require('./scripts/transform-exercises.js');

const ejerciciosPersonalizados = [
  {
    "nombre": "Press de Banca",
    "tipo": "Fuerza",
    "equipo": "Barra",
    "dificultad": "Intermedio",
    "musculos": {
      "primarios": ["Pectoral mayor"],
      "secundarios": ["Tríceps", "Deltoides anterior"]
    },
    "metricas_sugeridas": {
      "series_recomendadas": 4,
      "repeticiones_objetivo": "8-12",
      "descanso_segundos": 90
    }
  }
];

const ejerciciosTransformados = transformExercises(ejerciciosPersonalizados);

// Ahora puedes usar ejerciciosTransformados con el servicio de importación
exercisesService.importExercises(ejerciciosTransformados).subscribe({
  next: (result) => console.log('Importados:', result),
  error: (err) => console.error('Error:', err)
});
```

### Mapeo de Campos

El script realiza las siguientes transformaciones:

| Campo Original | Campo API | Transformación |
|----------------|-----------|----------------|
| `nombre` | `name` | Mapeo directo |
| `tipo`, `dificultad`, `equipo` | `description` | Combinados en una descripción |
| `musculos.primarios` | `instructions` | Incluidos en las instrucciones |
| `musculos.secundarios` | `instructions` | Incluidos en las instrucciones |
| `metricas_sugeridas` | `instructions` | Incluidos en las instrucciones |
| `description` | `description` | Se mantiene si existe |
| `instructions` | `instructions` | Se mantiene si existe |
| `imageUrl` | `imageUrl` | Se mantiene si existe |
| `videoUrl` | `videoUrl` | Se mantiene si existe |
| `machineTypeId` | `machineTypeId` | Se mantiene si existe |

### Ejemplo Completo de Transformación

**Entrada (formato personalizado):**
```json
[
  {
    "id": "exe-102",
    "nombre": "Press de Banca",
    "tipo": "Fuerza",
    "equipo": "Barra",
    "dificultad": "Intermedio",
    "musculos": {
      "primarios": ["Pectoral mayor"],
      "secundarios": ["Tríceps", "Deltoides anterior"]
    },
    "metricas_sugeridas": {
      "series_recomendadas": 4,
      "repeticiones_objetivo": "8-12",
      "descanso_segundos": 90
    }
  }
]
```

**Salida (formato API - array directo):**
```json
[
  {
    "name": "Press de Banca",
    "description": "Tipo: Fuerza | Dificultad: Intermedio | Equipo: Barra",
    "instructions": "Músculos primarios: Pectoral mayor\nMúsculos secundarios: Tríceps, Deltoides anterior\nMétricas sugeridas: 4 series, 8-12 repeticiones, 90s de descanso"
  }
]
```

**Nota:** El servicio de Angular automáticamente envuelve este array en `{ exercises: [...] }` al enviarlo al backend.

### Notas sobre la Transformación

1. **Campos obligatorios**: El script garantiza que siempre se incluya el campo `name` (requerido por la API)

2. **Información preservada**: Toda la información del formato original se preserva en los campos `description` e `instructions`

3. **Campos opcionales**: Si tu formato original incluye `description`, `instructions`, `imageUrl`, `videoUrl` o `machineTypeId`, estos se mantienen tal cual

4. **Formato de salida**: El script genera directamente un array de ejercicios. Si usas el servicio de Angular, este automáticamente envuelve el array en `{ exercises: [...] }` para el endpoint `/api/exercises/import`

---

**Última actualización:** 2025-01-27

