# Dashboard de Embalses - Santiago de Cuba

## 📊 Descripción
Dashboard interactivo para visualizar los porcentajes de llenado de los 11 embalses de la provincia de Santiago de Cuba. El sistema permite cargar datos desde archivos Excel/CSV y actualizar la información en tiempo real.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Visualización interactiva** de datos de embalses
- **Carga dinámica** de datos desde archivos CSV
- **Actualización en tiempo real** de información
- **Filtros y búsqueda** avanzada
- **Gráficos dinámicos** (circular y barras)
- **Exportación de datos** a CSV
- **Diseño responsivo** para todos los dispositivos

### 📈 Visualizaciones
- Gráfico circular de distribución por categorías
- Gráfico de barras con volúmenes por embalse
- Tarjetas individuales con barras de progreso
- Modal detallado para cada embalse

### 🔍 Filtros Disponibles
- **Todos**: Muestra todos los embalses
- **Alto (>70%)**: Embalses con llenado alto
- **Medio (40-70%)**: Embalses con llenado medio
- **Bajo (<40%)**: Embalses con llenado bajo

## 📁 Estructura del Proyecto

```
Dashboard/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── script.js               # Lógica JavaScript
├── README.md               # Este archivo
└── BD/                     # Carpeta de datos
    ├── embalses_santiago_cuba.csv    # Datos en formato CSV
    └── embalses_santiago_cuba.xlsx   # Datos en formato Excel
```

## 📋 Estructura del Archivo de Datos

### Formato CSV/Excel
El archivo debe contener las siguientes columnas:

| Columna | Descripción | Tipo | Ejemplo |
|---------|-------------|------|---------|
| Nombre | Nombre del embalse | Texto | "Carlos Manuel de Céspedes" |
| Municipio | Municipio donde se ubica | Texto | "Bayamo" |
| Capacidad (hm³) | Capacidad total en hectómetros cúbicos | Número | 280 |
| Volumen Actual (hm³) | Volumen actual en hectómetros cúbicos | Número | 195.2 |
| Uso | Uso principal del embalse | Texto | "Riego y abastecimiento" |
| Latitud | Coordenada de latitud | Número | 20.3833 |
| Longitud | Coordenada de longitud | Número | -76.6333 |
| Fecha Actualización | Fecha de última actualización | Fecha | 2024-01-15 |

### Ejemplo de Datos
```csv
Nombre,Municipio,Capacidad (hm³),Volumen Actual (hm³),Uso,Latitud,Longitud,Fecha Actualización
Carlos Manuel de Céspedes,Bayamo,280,195.2,Riego y abastecimiento,20.3833,-76.6333,2024-01-15
Cauto El Paso,Bayamo,150,89.5,Riego,20.4167,-76.5833,2024-01-15
```

## 🛠️ Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional, para desarrollo)

### Instalación
1. **Descargar** todos los archivos del proyecto
2. **Colocar** los archivos en una carpeta
3. **Abrir** `index.html` en el navegador

### Para Desarrollo Local
```bash
# Usando Python (si está instalado)
python -m http.server 8000

# Usando Node.js (si está instalado)
npx http-server

# Luego abrir: http://localhost:8000
```

## 📝 Cómo Actualizar los Datos

### Método 1: Editar CSV Directamente
1. Abrir `BD/embalses_santiago_cuba.csv`
2. Modificar los valores necesarios
3. Guardar el archivo
4. Hacer clic en **"Actualizar Datos"** en el dashboard

### Método 2: Usar Excel
1. Abrir `BD/embalses_santiago_cuba.xlsx` en Excel
2. Modificar los datos
3. Guardar como CSV con el mismo nombre
4. Actualizar en el dashboard

### Método 3: Crear Nuevo Archivo
1. Crear un nuevo archivo CSV con la estructura correcta
2. Colocarlo en la carpeta `BD/`
3. Renombrar a `embalses_santiago_cuba.csv`
4. Actualizar en el dashboard

## 🎯 Funcionalidades del Dashboard

### Botones Principales
- **🔄 Actualizar Datos**: Recarga los datos desde el archivo CSV
- **📥 Exportar Datos**: Descarga los datos actuales como CSV

### Interacciones
- **Búsqueda**: Escribe en el campo de búsqueda para filtrar embalses
- **Filtros**: Usa los botones de filtro para ver categorías específicas
- **Clic en Embalse**: Abre un modal con detalles completos

### Categorías de Llenado
- **🟢 Alto (>70%)**: Embalses con buen nivel de llenado
- **🟡 Medio (40-70%)**: Embalses con nivel moderado
- **🔴 Bajo (<40%)**: Embalses con nivel bajo

## 🔧 Personalización

### Modificar Colores
Editar las variables CSS en `styles.css`:
```css
.percentage-high { background: linear-gradient(135deg, #27ae60, #2ecc71); }
.percentage-medium { background: linear-gradient(135deg, #f39c12, #e67e22); }
.percentage-low { background: linear-gradient(135deg, #e74c3c, #c0392b); }
```

### Agregar Nuevos Embalses
1. Agregar fila al archivo CSV con los datos del nuevo embalse
2. Seguir la estructura de columnas establecida
3. Actualizar el dashboard

### Modificar Intervalos de Categorías
En `script.js`, función `getCategoria()`:
```javascript
function getCategoria(porcentaje) {
    if (porcentaje >= 70) return 'high';    // Cambiar 70 por otro valor
    if (porcentaje >= 40) return 'medium';  // Cambiar 40 por otro valor
    return 'low';
}
```

## 🐛 Solución de Problemas

### Error: "No se pueden cargar los datos"
- Verificar que el archivo CSV existe en la carpeta `BD/`
- Comprobar que el archivo tiene la estructura correcta
- Asegurarse de que el servidor web está funcionando

### Los datos no se actualizan
- Verificar que el archivo CSV se guardó correctamente
- Hacer clic en "Actualizar Datos"
- Revisar la consola del navegador para errores

### Problemas de visualización
- Verificar que el navegador soporta JavaScript
- Comprobar que Chart.js se carga correctamente
- Revisar la consola para errores de JavaScript

## 📞 Soporte

Para problemas o sugerencias:
1. Revisar la consola del navegador (F12)
2. Verificar la estructura del archivo CSV
3. Comprobar que todos los archivos están en su lugar

## 📄 Licencia

Este proyecto es de uso libre para fines educativos y de gestión de recursos hídricos.

---

**Desarrollado para la gestión de embalses de Santiago de Cuba** 🇨🇺
