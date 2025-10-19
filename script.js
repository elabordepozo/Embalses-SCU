// Variable para almacenar los datos de los embalses
let embalsesData = [];

// Variables globales
let filteredData = [...embalsesData];
let percentageChart = null;
let volumeChart = null;
let modalChart = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadEmbalsesData();
        initializeDashboard();
        setupEventListeners();
        renderEmbalses();
        updateStatistics();
        createCharts();
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        showErrorMessage('Error al cargar los datos de los embalses. Verifique que el archivo CSV esté disponible.');
    }
});

// Cargar datos desde CSV
async function loadEmbalsesData() {
    try {
        const response = await fetch('BD/embalses_santiago_cuba.csv');
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
    searchInput.addEventListener('input', handleSearch);

    // Filtros
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });

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

// Manejar búsqueda
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredData = embalsesData.filter(embalse => 
        embalse.nombre.toLowerCase().includes(searchTerm) ||
        embalse.municipio.toLowerCase().includes(searchTerm)
    );
    renderEmbalses();
    updateStatistics();
}

// Manejar filtros
function handleFilter(event) {
    const filter = event.target.dataset.filter;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Aplicar filtro
    if (filter === 'all') {
        filteredData = [...embalsesData];
    } else {
        filteredData = embalsesData.filter(embalse => embalse.categoria === filter);
    }
    
    renderEmbalses();
    updateStatistics();
}

// Renderizar embalses
function renderEmbalses() {
    const grid = document.getElementById('embalsesGrid');
    grid.innerHTML = '';

    if (filteredData.length === 0) {
        grid.innerHTML = '<div class="no-results">No se encontraron embalses que coincidan con los criterios de búsqueda.</div>';
        return;
    }

    filteredData.forEach((embalse, index) => {
        const card = createEmbalseCard(embalse, index);
        grid.appendChild(card);
    });
}

// Crear tarjeta de embalse
function createEmbalseCard(embalse, index) {
    const card = document.createElement('div');
    card.className = 'embalse-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const porcentaje = embalse.porcentaje;
    const categoria = embalse.categoria;

    card.innerHTML = `
        <div class="embalse-header">
            <div class="embalse-name">${embalse.nombre}</div>
            <div class="embalse-percentage percentage-${categoria}">${porcentaje}%</div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill progress-${categoria}" style="width: ${porcentaje}%"></div>
        </div>
        <div class="embalse-details">
            <div class="detail-item">
                <span>Municipio:</span>
                <span>${embalse.municipio}</span>
            </div>
            <div class="detail-item">
                <span>Capacidad:</span>
                <span>${embalse.capacidad} hm³</span>
            </div>
            <div class="detail-item">
                <span>Actual:</span>
                <span>${embalse.volumenActual} hm³</span>
            </div>
            <div class="detail-item">
                <span>Uso:</span>
                <span>${embalse.uso}</span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => openModal(embalse));
    return card;
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

// Crear gráficos
function createCharts() {
    createPercentageChart();
    createVolumeChart();
}

// Gráfico de distribución por porcentaje
function createPercentageChart() {
    const ctx = document.getElementById('percentageChart').getContext('2d');
    
    const highCount = embalsesData.filter(e => e.categoria === 'high').length;
    const mediumCount = embalsesData.filter(e => e.categoria === 'medium').length;
    const lowCount = embalsesData.filter(e => e.categoria === 'low').length;

    percentageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Alto (>70%)', 'Medio (40-70%)', 'Bajo (<40%)'],
            datasets: [{
                data: [highCount, mediumCount, lowCount],
                backgroundColor: [
                    '#27ae60',
                    '#f39c12',
                    '#e74c3c'
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

// Gráfico de volumen
function createVolumeChart() {
    const ctx = document.getElementById('volumeChart').getContext('2d');
    
    const sortedData = [...embalsesData].sort((a, b) => b.volumenActual - a.volumenActual);
    
    volumeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(e => e.nombre.split(' ')[0]), // Solo primera palabra
            datasets: [{
                label: 'Volumen Actual (hm³)',
                data: sortedData.map(e => e.volumenActual),
                backgroundColor: sortedData.map(e => {
                    switch(e.categoria) {
                        case 'high': return '#27ae60';
                        case 'medium': return '#f39c12';
                        case 'low': return '#e74c3c';
                        default: return '#3498db';
                    }
                }),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
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

// Función para actualizar gráficos
function updateCharts() {
    // Actualizar gráfico de porcentajes
    if (percentageChart) {
        const highCount = embalsesData.filter(e => e.categoria === 'high').length;
        const mediumCount = embalsesData.filter(e => e.categoria === 'medium').length;
        const lowCount = embalsesData.filter(e => e.categoria === 'low').length;
        
        percentageChart.data.datasets[0].data = [highCount, mediumCount, lowCount];
        percentageChart.update();
    }

    // Actualizar gráfico de volúmenes
    if (volumeChart) {
        const sortedData = [...embalsesData].sort((a, b) => b.volumenActual - a.volumenActual);
        volumeChart.data.labels = sortedData.map(e => e.nombre.split(' ')[0]);
        volumeChart.data.datasets[0].data = sortedData.map(e => e.volumenActual);
        volumeChart.data.datasets[0].backgroundColor = sortedData.map(e => {
            switch(e.categoria) {
                case 'high': return '#27ae60';
                case 'medium': return '#f39c12';
                case 'low': return '#e74c3c';
                default: return '#3498db';
            }
        });
        volumeChart.update();
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
    renderEmbalses();
    updateStatistics();
    updateCharts();
}

// Actualizar datos cada 30 segundos (opcional)
// setInterval(updateData, 30000);

// Función para actualizar datos desde el servidor
async function refreshData() {
    try {
        showLoadingMessage('Actualizando datos...');
        await loadEmbalsesData();
        initializeDashboard();
        renderEmbalses();
        updateStatistics();
        updateCharts();
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

// Agregar botones al header
document.addEventListener('DOMContentLoaded', function() {
    const headerContent = document.querySelector('.header-content');
    
    // Botón de actualización
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Datos';
    refreshBtn.className = 'refresh-btn';
    refreshBtn.onclick = refreshData;
    headerContent.appendChild(refreshBtn);
    
    // Botón de exportación
    const exportBtn = document.createElement('button');
    exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar Datos';
    exportBtn.className = 'export-btn';
    exportBtn.onclick = exportData;
    headerContent.appendChild(exportBtn);
});

// Estilos adicionales para botones y mensajes
const exportStyles = `
.export-btn, .refresh-btn {
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 15px;
    margin-right: 10px;
}

.export-btn {
    background: linear-gradient(135deg, #27ae60, #2ecc71);
}

.refresh-btn {
    background: linear-gradient(135deg, #3498db, #2980b9);
}

.export-btn:hover, .refresh-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

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
styleSheet.textContent = exportStyles;
document.head.appendChild(styleSheet);
