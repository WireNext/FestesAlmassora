/**
 * ENGINE SANTA QUITÈRIA 2026 
 * Gestió de JSON (Avisos + Programació) + Temps + Pantalla Completa
 */

let dadesProgramacio = []; 

// --- 1. NAVEGACIÓ ENTRE PESTANYES ---
function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

// --- 2. GESTIÓ D'AVISOS DINÀMICS ---
function carregarAvisos() {
    fetch('avisos.json')
    .then(r => r.json())
    .then(avisos => {
        const container = document.getElementById("seccio-avisos");
        if (!container) return; // Seguridad
        if (!avisos || avisos.length === 0) {
            container.innerHTML = ""; 
            return;
        }

        let htmlAvisos = '<h2 class="label">AVISOS D\'ÚLTIMA HORA</h2>';
        avisos.forEach(a => {
            htmlAvisos += `
                <div class="avís-card ${a.tipus}">
                    <div class="avís-icon">${a.tipus === 'important' ? '⚠️' : 'ℹ️'}</div>
                    <div class="avís-contingut">
                        <b>${a.titol}</b>
                        <p>${a.text}</p>
                    </div>
                </div>`;
        });
        container.innerHTML = htmlAvisos;
    })
    .catch(() => {
        if(document.getElementById("seccio-avisos")) {
            document.getElementById("seccio-avisos").innerHTML = "";
        }
    });
}

// --- 3. PANTALLA COMPLETA DE DETALL D'ACTE ---
function openActe(idActe) {
    let acte = null;
    dadesProgramacio.forEach(dia => {
        const trobat = dia.actes.find(a => a.id === idActe);
        if(trobat) acte = trobat;
    });

    if(acte) {
        document.getElementById("modal-img").src = acte.imatge;
        document.getElementById("modal-titol").innerText = acte.titol;
        document.getElementById("modal-info").innerText = `${acte.hora_inici}h - ${acte.hora_fi}h`;
        document.getElementById("modal-desc").innerText = acte.descripcio;
        
        // Mapa interactiu
        const query = encodeURIComponent(acte.ubicacio + ", Almassora");
        const mapUrl = `https://maps.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
        document.getElementById("modal-map-frame").src = mapUrl;
        
        document.getElementById("event-modal").style.display = "block";
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
}

function closeModal() {
    document.getElementById("event-modal").style.display = "none";
    document.getElementById("modal-map-frame").src = ""; 
    document.body.style.position = '';
    document.body.style.width = '';
}

// --- 4. FILTRATGE DE PROGRAMACIÓ ---
function selectDay(diaId, btn) {
    // 1. Gestionar pestañas
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // 2. Buscar datos del día
    const dia = dadesProgramacio.find(d => d.dia_id === diaId);
    const container = document.getElementById("events-list-container");
    if (!container || !dia) return;

    container.innerHTML = "";
    const favs = getFavorits(); // Obtenemos favoritos guardados

    // 3. Generar las tarjetas con la estrella
    dia.actes.forEach(acte => {
        const isFav = favs.includes(acte.id);
        const card = document.createElement("div");
        card.className = "event-card";
        
        // Al hacer clic en la tarjeta se abre el modal
        card.onclick = () => openActe(acte.id);

        card.innerHTML = `
            <div class="event-info">
                <span class="event-time">${acte.hora_inici}h</span>
                <h3 class="event-title">${acte.titol}</h3>
                <p class="event-location">📍 ${acte.ubicacio}</p>
            </div>
            <div class="fav-button ${isFav ? 'is-fav' : ''}" 
                 onclick="toggleFavorit('${acte.id}', event)">
                ${isFav ? '★' : '☆'}
            </div>
        `;
        container.appendChild(card);
    });

    window.scrollTo(0, 0);
}
// --- 5. LÒGICA DE L'ORATGE ---
function carregarTemps() {
    const ara = new Date();
    fetch("https://api.open-meteo.com/v1/forecast?latitude=39.94&longitude=-0.06&current_weather=true&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m&daily=uv_index_max&timezone=auto")
    .then(r => r.json()).then(d => {
        const h = ara.getHours();
        const icons = { 0: "☀️", 1: "🌤️", 2: "🌤️", 3: "☁️", 45: "🌫️", 61: "🌧️", 80: "🌦️" };
        const iconActual = icons[d.current_weather.weathercode] || "☁️";

        const weatherMain = document.getElementById("weather-main");
        if(weatherMain) {
            weatherMain.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div><b style="font-size:18px;">Almassora Ara</b><br><small style="color:#888;">Clica per a detalls</small></div>
                    <span style="font-size:32px; font-weight:900; color:var(--red);">${Math.round(d.current_weather.temperature)}°C ${iconActual}</span>
                </div>`;
        }
        
        const hCont = document.getElementById("hourly-forecast");
        if(hCont) {
            hCont.innerHTML = "";
            for(let i=h; i<h+12; i++) {
                const iconH = icons[d.hourly.weather_code[i]] || "☁️";
                hCont.innerHTML += `<div class="hour-item"><span>${i % 24}:00</span><span style="font-size:20px;margin:5px 0;display:block;">${iconH}</span><b>${Math.round(d.hourly.temperature_2m[i])}°</b></div>`;
            }
        }
        
        if(document.getElementById("w-wind")) document.getElementById("w-wind").innerText = d.current_weather.windspeed + " km/h";
        if(document.getElementById("w-humidity")) document.getElementById("w-humidity").innerText = d.hourly.relative_humidity_2m[h] + "%";
        if(document.getElementById("w-rain")) document.getElementById("w-rain").innerText = d.hourly.precipitation_probability[h] + "%";
        if(document.getElementById("w-uv")) document.getElementById("w-uv").innerText = d.daily.uv_index_max[0];
    });
}

function toggleWeatherDetails() {
    const d = document.getElementById('weather-details');
    if(d) d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

// --- 6. COMPTE ENRERE ---
function actualitzarCompteEnrere() {
    const target = new Date("May 16, 2026 00:00:00").getTime();
    
    const x = setInterval(() => {
        const ara = new Date().getTime();
        const diff = target - ara;
        const timerWrapper = document.getElementById("timer-wrapper");

        if (diff <= 0) {
            clearInterval(x);
            if (timerWrapper) {
                timerWrapper.innerHTML = `
                    <div style="text-align:center; padding: 10px; animation: pulse 1.5s infinite;">
                        <h2 style="margin:0; color:var(--red); font-size: 24px; font-weight:900; letter-spacing:1px;">
                            🎉 JA ESTEM EN FESTES!
                        </h2>
                    </div>`;
            }
        } else {
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);

            if(document.getElementById("days")) {
                document.getElementById("days").innerText = d.toString().padStart(2, '0');
                document.getElementById("hours").innerText = h.toString().padStart(2, '0');
                document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
                document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
            }
        }
    }, 1000);
}



// --- 7. NOTIFICACIONS PUSH ---
async function inicializarNotificaciones() {
    const firebaseConfig = {
        apiKey: "AIzaSyCBRrz5GzVQ-eSGKyoiy-2DWoVU9msxPwA",
        authDomain: "alertes-festes.firebaseapp.com",
        projectId: "alertes-festes",
        storageBucket: "alertes-festes.firebasestorage.app",
        messagingSenderId: "560447529511",
        appId: "1:560447529511:web:500e93ab4a1434a3e1e402",
        measurementId: "G-W5MV8950LK"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const messaging = firebase.messaging();
    const db = firebase.firestore(); // Esto ahora funcionará gracias al index.html nuevo

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const reg = await navigator.serviceWorker.ready;
            const token = await messaging.getToken({ 
                vapidKey: 'BPQe3gAfktjRHBj3YqtsFszFpLdptoNm3537STs61t-zSDKcbYKJBpxTpydwQILJijjpelA-9tJHHNy2nrG-aDE',
                serviceWorkerRegistration: reg
            });
            
            if (token) {
                // GUARDAR EN FIRESTORE
                await db.collection("usuarios_avisos").doc(token).set({
                    token: token,
                    pueblo: "Almassora",
                    fecha: new Date(),
                    plataforma: "web"
                });
                console.log("Token guardado con éxito en Firestore.");
            }
        }
    } catch (error) {
        console.error("Error en notificaciones:", error);
    }
}

// --- 8. INICIALITZACIÓ GENERAL ---
document.addEventListener("DOMContentLoaded", () => {
    // ... (Mantén igual el registro del Service Worker y llamadas a funciones)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('firebase-messaging-sw.js').then(reg => {
            inicializarNotificaciones();
        });
    }

// --- 9. LÒGICA D'INSTAL·LACIÓ PWA ---
let deferredPrompt;
const installContainer = document.getElementById('install-container');
const btnInstalar = document.getElementById('btn-instalar');

// Función para saber si ya estamos en la App instalada
function isRunningStandalone() {
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator.standalone) || 
           document.referrer.includes('android-app://');
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Solo actuar si es móvil/tablet y NO está ya instalado
    const isMobile = window.innerWidth <= 1024;

    if (isMobile && !isRunningStandalone()) {
        e.preventDefault();
        deferredPrompt = e;
        // Mostrar el contenedor
        if(installContainer) installContainer.style.display = 'block';
    }
});

if(btnInstalar) {
    btnInstalar.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                if(installContainer) installContainer.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
}

// Si se instala correctamente, ocultamos todo
window.addEventListener('appinstalled', () => {
    if(installContainer) installContainer.style.display = 'none';
    deferredPrompt = null;
});

    carregarAvisos();
    carregarTemps();
    actualitzarCompteEnrere();

    const ara = new Date();
    // Formato YYYY-MM-DD
    const avuiISO = `${ara.getFullYear()}-${String(ara.getMonth()+1).padStart(2,'0')}-${String(ara.getDate()).padStart(2,'0')}`;

    fetch('programacion.json')
    .then(r => r.json())
    .then(data => {
        dadesProgramacio = data;
        const tabsCont = document.getElementById("days-tabs");
        const avuiScroll = document.getElementById("avui-scroll");

        if(!tabsCont) return;

        let indexDiaSeleccionat = 0; // Por defecto el primero

        data.forEach((dia, index) => {
            // Comprobamos si este día es hoy
            const esAvui = dia.data_iso === avuiISO;
            if (esAvui) {
                indexDiaSeleccionat = index;
            }

            const btn = document.createElement("div");
            // Quitamos el 'active' de aquí, lo pondremos luego dinámicamente
            btn.className = `day-tab`; 
            btn.innerText = dia.titol_curt;
            btn.onclick = () => selectDay(dia.dia_id, btn);
            tabsCont.appendChild(btn);

            // Llenar scroll horizontal de inicio si es hoy
            if(esAvui && avuiScroll) {
                dia.actes.forEach(acte => {
                    const mini = document.createElement("div");
                    mini.className = "event-mini-card";
                    mini.onclick = () => openActe(acte.id);
                    mini.innerHTML = `<b>${acte.hora_inici}h</b><p>${acte.titol}</p>`;
                    avuiScroll.appendChild(mini);
                });
            }
        });

        // Mensaje si no hay nada hoy en el inicio
        if(avuiScroll && avuiScroll.innerHTML === "") {
            avuiScroll.innerHTML = "<p style='color:#666; padding:20px;'>No hi ha actes per a hui.</p>";
        }

        // --- EL TRUCO ESTÁ AQUÍ ---
        // Seleccionamos el botón correspondiente al index encontrado (hoy o el primero)
        const botoPerDefecte = tabsCont.children[indexDiaSeleccionat];
        if(data.length > 0 && botoPerDefecte) {
            selectDay(data[indexDiaSeleccionat].dia_id, botoPerDefecte);
            
            // Opcional: Hacer scroll automático para que se vea el botón del día actual si hay muchos
            botoPerDefecte.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
    });
});

// --- GESTIÓ DE FAVORITS ---

// Obté la llista de IDs favorits del localStorage
function getFavorits() {
    return JSON.parse(localStorage.getItem('festes_favs') || "[]");
}

function toggleFavorit(id, event) {
    if (event) event.stopPropagation();
    let favs = getFavorits();
    favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
    localStorage.setItem('festes_favs', JSON.stringify(favs));
    
    // Refrescar si estamos en programa.html
    const activeTab = document.querySelector('.day-tab.active');
    if (activeTab && typeof selectDay === 'function') {
        const dia = dadesProgramacio.find(d => d.titol_curt === activeTab.innerText);
        if(dia) selectDay(dia.dia_id, activeTab);
    }
    renderFavoritsIndex(); 
}

// 2. Función para renderizar favoritos en INDEX.HTML
function renderFavoritsIndex() {
    const container = document.getElementById("favorits-container");
    const section = document.getElementById("seccio-favorits");
    if (!container || !section) return;

    const favIds = getFavorits();
    if (favIds.length === 0) {
        section.style.display = "none";
        return;
    }

    section.style.display = "block";
    container.innerHTML = "";

    dadesProgramacio.forEach(dia => {
        dia.actes.forEach(acte => {
            if (favIds.includes(acte.id)) {
                const mini = document.createElement("div");
                mini.className = "event-mini-card fav-item";
                mini.onclick = () => openActe(acte.id);
                mini.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%;">
                        <b>${acte.hora_inici}h</b>
                        <span style="color:#ffcc00">★</span>
                    </div>
                    <p>${acte.titol}</p>`;
                container.appendChild(mini);
            }
        });
    });
}

// Modifica la funció on renderitzes els actes (dins de selectDay) 
// per a incloure el botó d'estrella:
function renderizarActes(actes) {
    const container = document.getElementById("events-list-container");
    container.innerHTML = "";
    const favs = getFavorits();

    actes.forEach(acte => {
        const isFav = favs.includes(acte.id);
        const card = document.createElement("div");
        card.className = "event-card";
        // Al hacer clic en la card se abre el modal, pero NO si pulsamos en la estrella
        card.onclick = () => openActe(acte.id);

        card.innerHTML = `
            <div class="event-info">
                <span class="event-time">${acte.hora_inici}h</span>
                <h3 class="event-title">${acte.titol}</h3>
                <p class="event-location">📍 ${acte.ubicacio}</p>
            </div>
            <div class="fav-button ${isFav ? 'is-fav' : ''}" onclick="toggleFavorit('${acte.id}', event)">
                ${isFav ? '★' : '☆'}
            </div>
        `;
        container.appendChild(card);
    });
}

function carregarProgramacio() {
    fetch('programacion.json')
    .then(r => r.json())
    .then(data => {
        dadesProgramacio = data;
        const avuiScroll = document.getElementById("avui-scroll");
        const seccioAvui = document.getElementById("seccio-avui");

        // Obtener fecha de hoy en formato local (evita errores de zona horaria)
        const ahora = new Date();
        const hoyStr = ahora.getFullYear() + '-' + 
                       String(ahora.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(ahora.getDate()).padStart(2, '0');

        let actosHoyContador = 0;
        if (avuiScroll) avuiScroll.innerHTML = ""; 

        data.forEach(dia => {
            if (dia.data_iso === hoyStr && avuiScroll) {
                dia.actes.forEach(acte => {
                    actosHoyContador++;
                    const mini = document.createElement("div");
                    mini.className = "event-mini-card";
                    mini.onclick = () => openActe(acte.id);
                    mini.innerHTML = `<b>${acte.hora_inici}h</b><p>${acte.titol}</p>`;
                    avuiScroll.appendChild(mini);
                });
            }
        });

        // Control de visibilidad: si hay actos hoy, mostramos la sección entera
        if (seccioAvui) {
            seccioAvui.style.display = (actosHoyContador > 0) ? "block" : "none";
        }

        renderFavoritsIndex();
    });
}

function mostrarInfoVioleta() {
    // Puedes personalizar la ubicación según donde se instale este año
    const ubicacioPunt = "Per determinar";
    
    const missatge = `💜 PUNT VIOLETA\n\nEspai segur d'informació, prevenció i acompanyament.\n\n📍 Ubicació: ${ubicacioPunt}\n\nSi necessites ajuda immediata i no pots arribar-hi, prem d'acord per a trucar al 016 (Atenció 24h).`;

    if (confirm(missatge)) {
        window.location.href = "tel:016";
    }
}