// js/geolocator.js

// --- DEFINIÇÃO DAS LOJAS COM COORDENADAS ---
// ATENÇÃO: Seus dados do DB devem ser usados aqui, mas para o frontend funcionar, usamos esses MOCKs.
export const UNIDADES = [
    { id_loja: 1, nome_loja: 'Mooca', coords: { lat: -23.5670, lon: -46.5997 } },    // Exemplo para Mooca
    { id_loja: 2, nome_loja: 'Tatuapé', coords: { lat: -23.5420, lon: -46.5610 } }, // Exemplo para Tatuapé
    { id_loja: 3, nome_loja: 'Ipiranga', coords: { lat: -23.5900, lon: -46.6110 } },// Exemplo para Ipiranga
    { id_loja: 4, nome_loja: 'Santos', coords: { lat: -23.9630, lon: -46.3360 } }   // Exemplo para Santos
];
export const CHATEAU_SELECTED_STORE_KEY = 'chateau_selected_store';

// --- FUNÇÕES AUXILIARES DE CÁLCULO GEOGRÁFICO (Haversine) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// --- FUNÇÕES DE ARMAZENAMENTO E INTERFACE ---
function setSelectedStore(storeId, storeName, distance = null) {
    const locationSpan = document.getElementById('unidade-proxima');
    const changeBtn = document.getElementById('change-store-btn');
    
    localStorage.setItem(CHATEAU_SELECTED_STORE_KEY, JSON.stringify({ id: storeId, name: storeName }));
    
    let display = `📍 ${storeName}`;
    if (distance !== null) {
        display += ` (${distance.toFixed(1)} km)`;
    
    }

    if (locationSpan) locationSpan.textContent = display;
    if (changeBtn) changeBtn.style.display = 'inline'; 
    
    // Dispara um evento customizado para que o home.js saiba que deve recarregar
    window.dispatchEvent(new Event('chateauStoreChanged'));
}

function loadInitialStore() {
    const savedStore = localStorage.getItem(CHATEAU_SELECTED_STORE_KEY);
    if (savedStore) {
        const { id, name } = JSON.parse(savedStore);
        setSelectedStore(id, name);
        return true;
    }
    return false;
}

function findNearestStore(userLat, userLon) {
    let nearestStore = null;
    let minDistance = Infinity;

    UNIDADES.forEach(store => {
        const dist = getDistance(userLat, userLon, store.coords.lat, store.coords.lon);
        if (dist < minDistance) {
            minDistance = dist;
            nearestStore = store;
        }
    });

    if (nearestStore) {
        setSelectedStore(nearestStore.id_loja, nearestStore.nome_loja, minDistance);
    }
}


// --- FUNÇÃO PRINCIPAL DE GEOLOCALIZAÇÃO ---

export function initGeolocation() {
    const locationSpan = document.getElementById('unidade-proxima');
    
    // 1. Tenta carregar do LocalStorage (se já foi salvo)
    if (loadInitialStore()) {
        return; 
    }

    if (locationSpan) locationSpan.textContent = "Buscando localização (Aguarde permissão)...";

    // 2. Tenta obter a localização via navegador
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                findNearestStore(lat, lon); 
            },
            (error) => {
                // Usuário negou ou houve erro - Define padrão (Mooca)
                console.warn("[GeoLocator] Erro/Negação:", error.message);
                if (locationSpan) locationSpan.textContent = "📍 Geolocalização negada. Usando Mooca (Padrão)";
                setSelectedStore(UNIDADES[0].id_loja, UNIDADES[0].nome_loja, null); 
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
    } else {
        // 3. Navegador não suporta - Define padrão (Mooca)
        if (locationSpan) locationSpan.textContent = "📍 Geolocalização não suportada. Usando Mooca (Padrão)";
        setSelectedStore(UNIDADES[0].id_loja, UNIDADES[0].nome_loja, null);
    }
}

// --- FUNÇÃO DE TROCA MANUAL DE LOJA ---

function setupManualStoreChange() {
    const changeBtn = document.getElementById('change-store-btn');
    if (!changeBtn) return;

    changeBtn.addEventListener('click', () => {
        let promptMessage = "Digite o ID da loja para qual deseja trocar:\n";
        UNIDADES.forEach(u => promptMessage += `${u.id_loja}=${u.nome_loja}\n`);
        
        const newStoreId = prompt(promptMessage);

        if (newStoreId) {
            const idNum = parseInt(newStoreId);
            const selected = UNIDADES.find(u => u.id_loja === idNum);

            if (selected) {
                setSelectedStore(selected.id_loja, selected.nome_loja, null);
                alert(`Troca realizada! Agora você vê os produtos de ${selected.nome_loja}.`);
                window.location.reload(); 
            } else {
                alert("ID de loja inválido.");
            }
        }
    });
}


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initGeolocation();
    setupManualStoreChange();
});