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
function selectDay(diaID, element) {
    if(!element) return;
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    const container = document.getElementById("events-list-container");
    if(!container) return;
    container.innerHTML = "";

    const diaSeleccionat = dadesProgramacio.find(d => d.dia_id === diaID);
    if(diaSeleccionat) {
        diaSeleccionat.actes.forEach(acte => {
            const card = document.createElement("div");
            card.className = "glass-card";
            card.style.marginBottom = "15px";
            card.onclick = () => openActe(acte.id);
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b style="font-size:17px; display:block;">${acte.titol}</b>
                        <span style="font-size:13px; color:var(--red); font-weight:700;">🕒 ${acte.hora_inici}h</span>
                    </div>
                    <span style="opacity:0.3;">〉</span>
                </div>`;
            container.appendChild(card);
        });
    }
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

// --- 7. NOTIFICACIONS PUSH (CORREGIDO) ---
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