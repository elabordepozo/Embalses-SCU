// Variable para almacenar los datos de los embalses
let embalsesData = [];
// Variable para almacenar los datos históricos de Céspedes
let cespedesHistoricData = [];

// Variables globales
let filteredData = [...embalsesData];
let modalChart = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadEmbalsesData();
        await loadCespedesHistoricData();
        initializeDashboard();
        setupEventListeners();
        populateEmbalseSelector();
        populateDateFilters();
        updateStatistics();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        showErrorMessage('Error al cargar los datos de los embalses. Verifique que el archivo CSV esté disponible.');
    }
});

// Cargar datos desde CSV
async function loadEmbalsesData() {
    try {
        // Evitar caché y resolver correctamente la ruta en GitHub Pages y local
        const cacheBuster = `v=${Date.now()}`;
        const isGitHubPages = window.location.hostname.endsWith('github.io');
        // Base del path actual (carpeta donde está index.html)
        const basePath = window.location.pathname.replace(/[^\/]*$/, '');
        const csvUrl = `${basePath}BD/embalses_santiago_cuba.csv?${cacheBuster}`;

        const response = await fetch(csvUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        embalsesData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = parseCSVLine(line);
                if (values.length >= headers.length) {
                    const embalse = {
                        id: i,
                        nombre: values[0]?.trim() || '',
                        municipio: values[1]?.trim() || '',
                        capacidad: parseFloat(values[2]) || 0,
                        volumenActual: parseFloat(values[3]) || 0,
                        uso: values[4]?.trim() || '',
                        coordenadas: {
                            lat: parseFloat(values[5]) || 0,
                            lng: parseFloat(values[6]) || 0
                        },
                        fechaActualizacion: values[7]?.trim() || ''
                    };
                    
                    // Validar datos básicos
                    if (embalse.nombre && embalse.capacidad > 0) {
                        embalsesData.push(embalse);
                    }
                }
            }
        }
        
        console.log(`Datos cargados: ${embalsesData.length} embalses`);
        return embalsesData;
    } catch (error) {
        console.error('Error al cargar datos CSV:', error);
        throw error;
    }
}

// Cargar datos históricos de Céspedes
async function loadCespedesHistoricData() {
    try {
        const cacheBuster = `v=${Date.now()}`;
        const basePath = window.location.pathname.replace(/[^\/]*$/, '');
        const csvUrl = `${basePath}BD/Céspedes.csv?${cacheBuster}`;

        const response = await fetch(csvUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // Saltar la primera línea (encabezado)
        cespedesHistoricData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = line.split(',');
                if (values.length >= 14) {
                    const yearData = {
                        no: parseInt(values[0]) || 0,
                        year: parseInt(values[1]) || 0,
                        months: {
                            Ene: parseFloat(values[2]) || 0,
                            Feb: parseFloat(values[3]) || 0,
                            Mar: parseFloat(values[4]) || 0,
                            Abr: parseFloat(values[5]) || 0,
                            May: parseFloat(values[6]) || 0,
                            Jun: parseFloat(values[7]) || 0,
                            Jul: parseFloat(values[8]) || 0,
                            Ago: parseFloat(values[9]) || 0,
                            Sep: parseFloat(values[10]) || 0,
                            Oct: parseFloat(values[11]) || 0,
                            Nov: parseFloat(values[12]) || 0,
                            Dic: parseFloat(values[13]) || 0
                        }
                    };
                    
                    if (yearData.year > 0) {
                        cespedesHistoricData.push(yearData);
                    }
                }
            }
        }
        
        console.log(`Datos históricos de Céspedes cargados: ${cespedesHistoricData.length} años`);
        return cespedesHistoricData;
    } catch (error) {
        console.error('Error al cargar datos históricos de Céspedes:', error);
        throw error;
    }
}

// Función para parsear líneas CSV que pueden contener comas dentro de comillas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

// Inicializar dashboard
function initializeDashboard() {
    // Calcular porcentajes
    embalsesData.forEach(embalse => {
        embalse.porcentaje = Math.round((embalse.volumenActual / embalse.capacidad) * 100);
        embalse.categoria = getCategoria(embalse.porcentaje);
    });
    
    // Actualizar filteredData
    filteredData = [...embalsesData];
}

// Obtener categoría según porcentaje
function getCategoria(porcentaje) {
    if (porcentaje >= 70) return 'high';
    if (porcentaje >= 40) return 'medium';
    return 'low';
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', applyAllFilters);

    // Filtros de fecha (flatpickr serán inicializados en populateDateFilters)
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');
    // Los eventos onChange se asignan por flatpickr en populateDateFilters

    // Selector de embalses
    const embalseSelect = document.getElementById('embalseSelect');
    embalseSelect.addEventListener('change', handleEmbalseSelection);

    // Botón limpiar filtros
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);

    // Modal
    const modal = document.getElementById('embalseModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Función para actualizar el gráfico según los filtros
function updateTrendsChartWithFilters() {
    const selectedEmbalseId = document.getElementById('embalseSelect').value;
    if (selectedEmbalseId) {
        const selectedEmbalse = embalsesData.find(e => e.id === parseInt(selectedEmbalseId));
        if (selectedEmbalse && (selectedEmbalse.nombre.toLowerCase().includes('céspedes') || selectedEmbalse.nombre.toLowerCase().includes('cespedes'))) {
            createTrendsChart();
        }
    }
}

// Manejar todos los filtros
function applyAllFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    // Leer valores desde flatpickr inputs
    const monthInput = document.getElementById('monthFilter');
    const yearInput = document.getElementById('yearFilter');

    // getSelected... ahora devuelve arrays de Date (selectedDates) que pueden ser 0,1 o 2 elementos (range)
    const selectedMonthsDates = getSelectedMonthsFromFlatpickr(monthInput); // array de Date
    const selectedYearsDates = getSelectedYearsFromFlatpickr(yearInput); // array de Date

    // Convertir a rangos útiles
    let monthRange = null; // {start: Date, end: Date}
    if (selectedMonthsDates.length === 1) {
        monthRange = { start: selectedMonthsDates[0], end: selectedMonthsDates[0] };
    } else if (selectedMonthsDates.length >= 2) {
        monthRange = { start: selectedMonthsDates[0], end: selectedMonthsDates[selectedMonthsDates.length - 1] };
    }

    let yearRange = null;
    if (selectedYearsDates.length === 1) {
        yearRange = { start: selectedYearsDates[0], end: selectedYearsDates[0] };
    } else if (selectedYearsDates.length >= 2) {
        yearRange = { start: selectedYearsDates[0], end: selectedYearsDates[selectedYearsDates.length - 1] };
    }

    let data = [...embalsesData];

    // Filtro de búsqueda
    if (searchTerm) {
        data = data.filter(embalse => 
            embalse.nombre.toLowerCase().includes(searchTerm) ||
            embalse.municipio.toLowerCase().includes(searchTerm)
        );
    }

    // Filtro por rangos de año/mes (si existen)
    if (yearRange) {
        data = data.filter(embalse => {
            if (!embalse.fechaActualizacion) return false;
            const d = new Date(embalse.fechaActualizacion);
            // Normalizar años a rango completo
            const start = new Date(yearRange.start.getFullYear(), 0, 1);
            const end = new Date(yearRange.end.getFullYear(), 11, 31, 23, 59, 59, 999);
            return d >= start && d <= end;
        });
    }

    if (monthRange) {
        data = data.filter(embalse => {
            if (!embalse.fechaActualizacion) return false;
            const d = new Date(embalse.fechaActualizacion);
            // monthRange start/end tienen año incluido (usamos ambos para construir intervalos completos de mes)
            const start = new Date(monthRange.start.getFullYear(), monthRange.start.getMonth(), 1);
            const end = new Date(monthRange.end.getFullYear(), monthRange.end.getMonth() + 1, 0, 23, 59, 59, 999); // último día del mes
            return d >= start && d <= end;
        });
    }

    filteredData = data;
    updateStatistics();
}

// Poblar el selector de embalses
function populateEmbalseSelector() {
    const select = document.getElementById('embalseSelect');
    select.innerHTML = '<option value="">Selecciona un embalse...</option>';
    
    embalsesData.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach(embalse => {
        const option = document.createElement('option');
        option.value = embalse.id;
        option.textContent = embalse.nombre;
        select.appendChild(option);
    });
}

// Poblar filtros de fecha
function populateDateFilters() {
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');

    // Usar datos históricos de Céspedes si están disponibles para determinar el rango
    let minYear = 1998;
    let maxYear = new Date().getFullYear();
    
    if (cespedesHistoricData.length > 0) {
        const years = cespedesHistoricData.map(d => d.year).filter(y => y > 0);
        if (years.length > 0) {
            minYear = Math.min(...years);
            maxYear = Math.max(...years);
        }
    }

    // Inicializar flatpickr si está disponible
    if (window.flatpickr) {
        try {
            // Selector de meses con calendario visual (modo múltiple)
            flatpickr(monthFilter, {
                mode: 'multiple',
                dateFormat: 'm',
                altInput: true,
                altFormat: 'F',
                locale: {
                    firstDayOfWeek: 1,
                    weekdays: {
                        shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                        longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                    },
                    months: {
                        shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                        longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                    }
                },
                plugins: [new monthSelectPlugin({ 
                    shorthand: false, 
                    dateFormat: 'm', 
                    altFormat: 'F'
                })],
                onChange: function() {
                    applyAllFilters();
                    updateTrendsChartWithFilters();
                },
                defaultDate: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => new Date(2024, m - 1, 1))
            });

            // Selector de años con calendario visual (modo múltiple)
            flatpickr(yearFilter, {
                mode: 'multiple',
                dateFormat: 'Y',
                altInput: true,
                altFormat: 'Y',
                minDate: new Date(minYear, 0, 1),
                maxDate: new Date(maxYear, 11, 31),
                locale: {
                    firstDayOfWeek: 1,
                    weekdays: {
                        shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
                        longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
                    },
                    months: {
                        shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                        longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                    }
                },
                onChange: function() {
                    applyAllFilters();
                    updateTrendsChartWithFilters();
                },
                // Pre-seleccionar todos los años disponibles
                defaultDate: cespedesHistoricData.map(d => new Date(d.year, 0, 1))
            });

        } catch (e) {
            console.warn('Error inicializando flatpickr:', e);
        }
    } else {
        console.warn('flatpickr no está disponible. Los filtros de fecha no tendrán selector tipo calendario.');
    }
}

// Helpers para leer valores seleccionados de flatpickr
function getSelectedMonthsFromFlatpickr(inputElem) {
    if (!inputElem) return [];
    const fp = inputElem._flatpickr;
    if (!fp) return [];
    // Retornar números de mes (0-11)
    return fp.selectedDates.map(d => d.getMonth());
}

function getSelectedYearsFromFlatpickr(inputElem) {
    if (!inputElem) return [];
    const fp = inputElem._flatpickr;
    if (!fp) return [];
    // Retornar años como números
    return fp.selectedDates.map(d => d.getFullYear());
}

// Obtener meses seleccionados (retorna array de nombres de meses)
function getSelectedMonthNames() {
    const monthFilter = document.getElementById('monthFilter');
    const selectedMonths = getSelectedMonthsFromFlatpickr(monthFilter);
    
    if (selectedMonths.length === 0) {
        // Si no hay selección, retornar todos los meses
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }
    
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return selectedMonths.sort((a, b) => a - b).map(m => monthNames[m]);
}

// Obtener años seleccionados
function getSelectedYears() {
    const yearFilter = document.getElementById('yearFilter');
    const selectedYears = getSelectedYearsFromFlatpickr(yearFilter);
    
    if (selectedYears.length === 0 && cespedesHistoricData.length > 0) {
        // Si no hay selección, retornar todos los años
        return cespedesHistoricData.map(d => d.year).filter(y => y > 0);
    }
    
    return selectedYears.sort((a, b) => a - b);
}

// Manejar selección de embalse
function handleEmbalseSelection(event) {
    const selectedId = parseInt(event.target.value);
    if (selectedId) {
        const selectedEmbalse = embalsesData.find(embalse => embalse.id === selectedId);
        if (selectedEmbalse) {
            showEmbalseInfo(selectedEmbalse);
        }
    } else {
        clearEmbalseInfo();
    }
}

// Mostrar información del embalse seleccionado
function showEmbalseInfo(embalse) {
    // Actualizar placeholder del mapa
    const mapPlaceholder = document.querySelector('.map-placeholder');
    mapPlaceholder.innerHTML = `
        <i class="fas fa-map-marker-alt" style="color: #e74c3c;"></i>
        <h4>${embalse.nombre}</h4>
        <p><strong>Municipio:</strong> ${embalse.municipio}</p>
        <p><strong>Coordenadas:</strong> ${embalse.coordenadas.lat.toFixed(4)}, ${embalse.coordenadas.lng.toFixed(4)}</p>
        <p><strong>Capacidad:</strong> ${embalse.capacidad} hm³</p>
        <p><strong>Volumen Actual:</strong> ${embalse.volumenActual} hm³</p>
        <p><strong>Porcentaje:</strong> ${embalse.porcentaje}%</p>
        <p><strong>Uso:</strong> ${embalse.uso}</p>
    `;

    // Actualizar tendencias - verificar si es Céspedes
    const trendContent = document.querySelector('.trends-content');
    
    // Verificar si el embalse es Carlos Manuel de Céspedes
    if (embalse.nombre.toLowerCase().includes('céspedes') || embalse.nombre.toLowerCase().includes('cespedes')) {
        if (cespedesHistoricData.length > 0) {
            trendContent.innerHTML = '<canvas id="trendsChart" style="max-height: 500px;"></canvas>';
            createTrendsChart();
        } else {
            trendContent.innerHTML = `
                <div class="trend-placeholder">
                    <i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i>
                    <h4>Gráficos de Tendencia</h4>
                    <p>Para: <strong>${embalse.nombre}</strong></p>
                    <p>No se pudieron cargar los datos históricos</p>
                </div>
            `;
        }
    } else {
        trendContent.innerHTML = `
            <div class="trend-placeholder">
                <i class="fas fa-chart-line" style="color: #3498db;"></i>
                <h4>Gráficos de Tendencia</h4>
                <p>Para: <strong>${embalse.nombre}</strong></p>
                <p>Los datos históricos solo están disponibles para el embalse Carlos Manuel de Céspedes</p>
            </div>
        `;
    }
}

// Crear gráfico de tendencias históricas
let trendsChart = null;

function createTrendsChart() {
    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (trendsChart) {
        trendsChart.destroy();
    }

    // Obtener filtros seleccionados
    const selectedMonthNames = getSelectedMonthNames();
    const selectedYears = getSelectedYears();
    
    // Filtrar datos históricos según los años seleccionados
    const filteredHistoricData = cespedesHistoricData.filter(d => selectedYears.includes(d.year));
    
    if (filteredHistoricData.length === 0) {
        console.warn('No hay datos para los años seleccionados');
        return;
    }

    // Calcular estadísticas por mes (solo para los meses seleccionados)
    const statistics = [];
    
    selectedMonthNames.forEach(month => {
        const values = filteredHistoricData.map(yearData => yearData.months[month]).filter(v => v > 0);
        
        if (values.length > 0) {
            statistics.push({
                month: month,
                min: Math.min(...values),
                max: Math.max(...values),
                avg: values.reduce((sum, val) => sum + val, 0) / values.length
            });
        } else {
            statistics.push({
                month: month,
                min: 0,
                max: 0,
                avg: 0
            });
        }
    });

    // Obtener datos del año más reciente de los seleccionados
    const mostRecentYear = Math.max(...selectedYears);
    const currentYearData = cespedesHistoricData.find(d => d.year === mostRecentYear);
    const currentYearValues = currentYearData ? selectedMonthNames.map(m => currentYearData.months[m]) : [];
    
    // Crear datasets para cada año seleccionado (si son pocos)
    const yearDatasets = [];
    if (selectedYears.length <= 5 && selectedYears.length > 1) {
        // Generar colores dinámicamente
        const colors = [
            { border: '#9b59b6', bg: 'rgba(155, 89, 182, 0.1)' },
            { border: '#34495e', bg: 'rgba(52, 73, 94, 0.1)' },
            { border: '#16a085', bg: 'rgba(22, 160, 133, 0.1)' },
            { border: '#d35400', bg: 'rgba(211, 84, 0, 0.1)' },
            { border: '#c0392b', bg: 'rgba(192, 57, 43, 0.1)' }
        ];
        
        selectedYears.forEach((year, index) => {
            const yearData = cespedesHistoricData.find(d => d.year === year);
            if (yearData) {
                const color = colors[index % colors.length];
                yearDatasets.push({
                    label: `Año ${year}`,
                    data: selectedMonthNames.map(m => yearData.months[m]),
                    borderColor: color.border,
                    backgroundColor: color.bg,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                });
            }
        });
    }

    // Crear datasets dinámicamente
    const datasets = [];
    
    // Siempre mostrar estadísticas históricas si hay más de 1 año
    if (filteredHistoricData.length > 1) {
        datasets.push(
            {
                label: 'Mínimo Histórico',
                data: statistics.map(s => s.min),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Media Histórica',
                data: statistics.map(s => s.avg),
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7
            },
            {
                label: 'Máximo Histórico',
                data: statistics.map(s => s.max),
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        );
    }
    
    // Agregar datasets de años individuales si aplica
    if (yearDatasets.length > 0) {
        datasets.push(...yearDatasets);
    } else if (currentYearValues.length > 0) {
        // Si hay muchos años, solo mostrar el más reciente
        datasets.push({
            label: `Año ${mostRecentYear}`,
            data: currentYearValues,
            borderColor: '#f39c12',
            backgroundColor: 'rgba(243, 156, 18, 0.2)',
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderDash: [5, 5]
        });
    }
    
    // Crear título dinámico
    let chartTitle = 'Tendencia de Precipitaciones - Embalse Carlos Manuel de Céspedes';
    if (selectedYears.length <= 5 && selectedYears.length > 0) {
        const yearsText = selectedYears.length === 1 ? `Año ${selectedYears[0]}` : `Años ${selectedYears.join(', ')}`;
        chartTitle += ` (${yearsText})`;
    }

    // Crear gráfico
    trendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: selectedMonthNames,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + ' mm';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Precipitación (mm)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Mes',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Limpiar información del embalse
function clearEmbalseInfo() {
    const mapPlaceholder = document.querySelector('.map-placeholder');
    mapPlaceholder.innerHTML = `
        <i class="fas fa-map"></i>
        <p>Selecciona un embalse para ver su ubicación en el mapa</p>
    `;

    const trendContent = document.querySelector('.trends-content');
    trendContent.innerHTML = `
        <div class="trend-placeholder">
            <i class="fas fa-chart-area"></i>
            <p>Selecciona un embalse para ver sus tendencias</p>
        </div>
    `;
    
    // Destruir gráfico si existe
    if (trendsChart) {
        trendsChart.destroy();
        trendsChart = null;
    }
}

// Actualizar estadísticas
function updateStatistics() {
    const totalCapacity = filteredData.reduce((sum, embalse) => sum + embalse.capacidad, 0);
    const totalCurrent = filteredData.reduce((sum, embalse) => sum + embalse.volumenActual, 0);
    const averagePercentage = filteredData.length > 0 ? 
        Math.round(filteredData.reduce((sum, embalse) => sum + embalse.porcentaje, 0) / filteredData.length) : 0;

    document.getElementById('totalCapacity').textContent = totalCapacity.toFixed(1);
    document.getElementById('totalCurrent').textContent = totalCurrent.toFixed(1);
    document.getElementById('averagePercentage').textContent = `${averagePercentage}%`;
}


// Abrir modal
function openModal(embalse) {
    const modal = document.getElementById('embalseModal');
    
    // Llenar datos del modal
    document.getElementById('modalTitle').textContent = embalse.nombre;
    document.getElementById('modalPercentage').textContent = `${embalse.porcentaje}%`;
    document.getElementById('modalCapacity').textContent = `${embalse.capacidad} hm³`;
    document.getElementById('modalCurrent').textContent = `${embalse.volumenActual} hm³`;
    document.getElementById('modalMunicipio').textContent = embalse.municipio;
    document.getElementById('modalUso').textContent = embalse.uso;

    // Crear gráfico del modal
    createModalChart(embalse);
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Crear gráfico del modal
function createModalChart(embalse) {
    const ctx = document.getElementById('modalChart').getContext('2d');
    
    if (modalChart) {
        modalChart.destroy();
    }

    modalChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Volumen Actual', 'Capacidad Restante'],
            datasets: [{
                data: [embalse.volumenActual, embalse.capacidad - embalse.volumenActual],
                backgroundColor: [
                    embalse.categoria === 'high' ? '#27ae60' : 
                    embalse.categoria === 'medium' ? '#f39c12' : '#e74c3c',
                    '#ecf0f1'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('embalseModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (modalChart) {
        modalChart.destroy();
        modalChart = null;
    }
}


// Función para actualizar datos (simulación de datos en tiempo real)
function updateData() {
    // Simular cambios en los datos
    embalsesData.forEach(embalse => {
        const change = (Math.random() - 0.5) * 2; // Cambio de -1 a +1 hm³
        embalse.volumenActual = Math.max(0, Math.min(embalse.capacidad, embalse.volumenActual + change));
        embalse.porcentaje = Math.round((embalse.volumenActual / embalse.capacidad) * 100);
        embalse.categoria = getCategoria(embalse.porcentaje);
    });

    // Actualizar visualizaciones
    updateStatistics();
}

// Actualizar datos cada 30 segundos (opcional)
// setInterval(updateData, 30000);

// Función para actualizar datos desde el servidor
async function refreshData() {
    try {
        showLoadingMessage('Actualizando datos...');
        await loadEmbalsesData();
        await loadCespedesHistoricData();
        initializeDashboard();
        populateEmbalseSelector();
        updateStatistics();
        
        // Si hay un embalse seleccionado, actualizar su información
        const selectedEmbalseId = document.getElementById('embalseSelect').value;
        if (selectedEmbalseId) {
            const selectedEmbalse = embalsesData.find(e => e.id === parseInt(selectedEmbalseId));
            if (selectedEmbalse) {
                showEmbalseInfo(selectedEmbalse);
            }
        }
        
        hideLoadingMessage();
        showSuccessMessage('Datos actualizados correctamente');
    } catch (error) {
        console.error('Error al actualizar datos:', error);
        hideLoadingMessage();
        showErrorMessage('Error al actualizar los datos. Verifique la conexión y el archivo CSV.');
    }
}

// Función para exportar datos
function exportData() {
    const dataToExport = embalsesData.map(embalse => ({
        nombre: embalse.nombre,
        municipio: embalse.municipio,
        capacidad: embalse.capacidad,
        volumenActual: embalse.volumenActual,
        porcentaje: embalse.porcentaje,
        uso: embalse.uso,
        fechaActualizacion: embalse.fechaActualizacion
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
        + "Nombre,Municipio,Capacidad (hm³),Volumen Actual (hm³),Porcentaje,Uso,Fecha Actualización\n"
        + dataToExport.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `embalses_santiago_cuba_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funciones para mostrar mensajes
function showLoadingMessage(message) {
    const existingMessage = document.querySelector('.loading-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-message';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-spinner fa-spin"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// Limpiar todos los filtros (flatpickr & search)
function clearAllFilters() {
    // Limpiar input de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    // Limpiar flatpickr instances
    const monthInput = document.getElementById('monthFilter');
    const yearInput = document.getElementById('yearFilter');

    if (monthInput && monthInput._flatpickr) monthInput._flatpickr.clear();
    if (yearInput && yearInput._flatpickr) yearInput._flatpickr.clear();

    // Recalcular filtros y UI
    applyAllFilters();
}

// Helper para comprobar si una fecha cae dentro de un conjunto de rangos o elementos seleccionados
function isDateInSelectedRanges(dateObj, selectedMonths, selectedYears) {
    if (!dateObj || !(dateObj instanceof Date)) return false;
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear().toString();

    // Si se seleccionaron años y meses, ambos deben coincidir (si ambos filtros aplican)
    if (selectedYears && selectedYears.length > 0 && !selectedYears.includes(year)) return false;
    if (selectedMonths && selectedMonths.length > 0 && !selectedMonths.includes(month)) return false;
    return true;
}

function hideLoadingMessage() {
    const loadingMessage = document.querySelector('.loading-message');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="close-message">&times;</button>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
    
    // Close button functionality
    messageDiv.querySelector('.close-message').addEventListener('click', () => {
        messageDiv.remove();
    });
}

// Conectar botones del footer
document.addEventListener('DOMContentLoaded', function() {
    // Botón de actualización
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.onclick = refreshData;
    }
    
    // Botón de exportación
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.onclick = exportData;
    }
});

// Estilos adicionales para mensajes
const messageStyles = `
.no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #7f8c8d;
    font-size: 1.2rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    backdrop-filter: blur(10px);
}

.loading-message, .status-message {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    animation: slideInRight 0.3s ease;
}

.loading-message {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
}

.status-message.success {
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    color: white;
}

.status-message.error {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: white;
}

.message-content {
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
}

.close-message {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: inherit;
    font-size: 1.2rem;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.close-message:hover {
    opacity: 1;
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = messageStyles;
document.head.appendChild(styleSheet);
