// Variable para almacenar los datos de los embalses
let embalsesData = [];

// Variables globales
let filteredData = [...embalsesData];
let modalChart = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadEmbalsesData();
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

    // Filtros de fecha
    const monthFilter = document.getElementById('monthFilter');
    monthFilter.addEventListener('change', applyAllFilters);

    const yearFilter = document.getElementById('yearFilter');
    yearFilter.addEventListener('change', applyAllFilters);

    // Selector de embalses
    const embalseSelect = document.getElementById('embalseSelect');
    embalseSelect.addEventListener('change', handleEmbalseSelection);

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

// Manejar todos los filtros
function applyAllFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedMonths = Array.from(document.getElementById('monthFilter').selectedOptions).map(opt => opt.value);
    const selectedYears = Array.from(document.getElementById('yearFilter').selectedOptions).map(opt => opt.value);

    let data = [...embalsesData];

    // Filtro de búsqueda
    if (searchTerm) {
        data = data.filter(embalse => 
            embalse.nombre.toLowerCase().includes(searchTerm) ||
            embalse.municipio.toLowerCase().includes(searchTerm)
        );
    }

    // Filtro de año
    if (selectedYears.length > 0) {
        data = data.filter(embalse => {
            if (!embalse.fechaActualizacion) return false;
            const year = new Date(embalse.fechaActualizacion).getFullYear();
            return selectedYears.includes(year.toString());
        });
    }

    // Filtro de mes
    if (selectedMonths.length > 0) {
        data = data.filter(embalse => {
            if (!embalse.fechaActualizacion) return false;
            const month = new Date(embalse.fechaActualizacion).getMonth(); // 0-11
            return selectedMonths.includes(month.toString());
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

    const dates = embalsesData
        .map(e => e.fechaActualizacion ? new Date(e.fechaActualizacion) : null)
        .filter(d => d instanceof Date && !isNaN(d));

    const uniqueYears = [...new Set(dates.map(d => d.getFullYear()))].sort((a, b) => b - a);
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    monthFilter.innerHTML = '';
    monthNames.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index; // 0-11
        option.textContent = month;
        monthFilter.appendChild(option);
    });

    yearFilter.innerHTML = '';
    uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
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

    // Actualizar placeholder de tendencias
    const trendPlaceholder = document.querySelector('.trend-placeholder');
    trendPlaceholder.innerHTML = `
        <i class="fas fa-chart-line" style="color: #3498db;"></i>
        <h4>Gráficos de Tendencia</h4>
        <p>Para: <strong>${embalse.nombre}</strong></p>
        <p>Los gráficos de tendencia se construirán próximamente</p>
        <div style="margin-top: 20px; padding: 15px; background: rgba(52, 152, 219, 0.1); border-radius: 10px;">
            <p style="margin: 0; font-size: 0.9rem; color: #2c3e50;">
                <i class="fas fa-info-circle"></i> 
                Aquí se mostrarán gráficos de evolución temporal del volumen, precipitaciones y otros indicadores.
            </p>
        </div>
    `;
}

// Limpiar información del embalse
function clearEmbalseInfo() {
    const mapPlaceholder = document.querySelector('.map-placeholder');
    mapPlaceholder.innerHTML = `
        <i class="fas fa-map"></i>
        <p>Selecciona un embalse para ver su ubicación en el mapa</p>
    `;

    const trendPlaceholder = document.querySelector('.trend-placeholder');
    trendPlaceholder.innerHTML = `
        <i class="fas fa-chart-area"></i>
        <p>Los gráficos de tendencia se construirán próximamente</p>
    `;
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
        initializeDashboard();
        populateEmbalseSelector();
        updateStatistics();
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
