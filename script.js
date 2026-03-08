/**
 * ENGINE SANTA QUITÈRIA 2026 
 * Gestió de JSON (Avisos + Programació) + Temps + Pantalla Completa
 */

let dadesProgramacio = []; // Variable global per a la programació

// --- 1. NAVEGACIÓ ENTRE PESTANYES PRINCIPALS ---
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
        if (!avisos || avisos.length === 0) {
            container.innerHTML = ""; // No apareix res si el JSON està buit []
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
                </div>
            `;
        });
        container.innerHTML = htmlAvisos;
    })
    .catch(() => {
        document.getElementById("seccio-avisos").innerHTML = "";
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
        // Omplim dades textuals
        document.getElementById("modal-img").src = acte.imatge;
        document.getElementById("modal-titol").innerText = acte.titol;
        document.getElementById("modal-info").innerText = `${acte.hora_inici}h - ${acte.hora_fi}h`;
        document.getElementById("modal-desc").innerText = acte.descripcio;
        
        // MAPA INTERACTIU: Generem l'iframe dinàmicament
        const query = encodeURIComponent(acte.ubicacio + ", Almassora");
        const mapUrl = `https://maps.google.com/maps?q=${query}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
        document.getElementById("modal-map-frame").src = mapUrl;
        
        // Mostrem la pàgina de detall
        const page = document.getElementById("event-modal");
        page.style.display = "block";
        
        // Bloquegem l'scroll de l'app principal
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
}

function closeModal() {
    document.getElementById("event-modal").style.display = "none";
    document.getElementById("modal-map-frame").src = ""; // Netegem el mapa per seguretat
    
    // Tornem l'scroll a la normalitat
    document.body.style.position = '';
    document.body.style.width = '';
}

// --- 4. FILTRATGE DE PROGRAMACIÓ PER DIES ---
function selectDay(diaID, element) {
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    element.classList.add('active');

    const container = document.getElementById("events-list-container");
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
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// --- 5. LÒGICA DE L'ORATGE (API) ---
function carregarTemps() {
    const ara = new Date();
    fetch("https://api.open-meteo.com/v1/forecast?latitude=39.94&longitude=-0.06&current_weather=true&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m&daily=uv_index_max&timezone=auto")
    .then(r => r.json()).then(d => {
        const h = ara.getHours();
        
        // Icona i temperatura actual
        const icons = { 0: "☀️", 1: "🌤️", 2: "🌤️", 3: "☁️", 45: "🌫️", 61: "🌧️", 80: "🌦️" };
        const iconActual = icons[d.current_weather.weathercode] || "☁️";

        document.getElementById("weather-main").innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div><b style="font-size:18px;">Almassora Ara</b><br><small style="color:#888;">Clica per a detalls</small></div>
                <span style="font-size:32px; font-weight:900; color:var(--red);">${Math.round(d.current_weather.temperature)}°C ${iconActual}</span>
            </div>`;
        
        // Previsió per hores
        const hCont = document.getElementById("hourly-forecast");
        hCont.innerHTML = "";
        for(let i=h; i<h+12; i++) {
            const iconH = icons[d.hourly.weather_code[i]] || "☁️";
            hCont.innerHTML += `<div class="hour-item"><span>${i % 24}:00</span><span style="font-size:20px;margin:5px 0;display:block;">${iconH}</span><b>${Math.round(d.hourly.temperature_2m[i])}°</b></div>`;
        }
        
        // Widgets extra
        document.getElementById("w-wind").innerText = d.current_weather.windspeed + " km/h";
        document.getElementById("w-humidity").innerText = d.hourly.relative_humidity_2m[h] + "%";
        document.getElementById("w-rain").innerText = d.hourly.precipitation_probability[h] + "%";
        document.getElementById("w-uv").innerText = d.daily.uv_index_max[0];
    });
}

function toggleWeatherDetails() {
    const d = document.getElementById('weather-details');
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

// --- 6. INICIALITZACIÓ GENERAL ---
document.addEventListener("DOMContentLoaded", () => {
    // A. Carregar Avisos
    carregarAvisos();

    // B. Carregar Programació
    const ara = new Date();
    const avuiISO = `${ara.getFullYear()}-${String(ara.getMonth()+1).padStart(2,'0')}-${String(ara.getDate()).padStart(2,'0')}`;

    fetch('programacion.json')
    .then(r => r.json())
    .then(data => {
        dadesProgramacio = data;
        const tabsCont = document.getElementById("days-tabs");
        const avuiScroll = document.getElementById("avui-scroll");

        data.forEach((dia, index) => {
            // Crear pestanyes de dies
            const btn = document.createElement("div");
            btn.className = `day-tab ${index === 0 ? 'active' : ''}`;
            btn.innerText = dia.titol_curt;
            btn.onclick = () => selectDay(dia.dia_id, btn);
            tabsCont.appendChild(btn);

            // Omplir actes d'avui en Inici
            if(dia.data_iso === avuiISO) {
                dia.actes.forEach(acte => {
                    const mini = document.createElement("div");
                    mini.className = "event-mini-card";
                    mini.onclick = () => openActe(acte.id);
                    mini.innerHTML = `<b>${acte.hora_inici}h</b><p>${acte.titol}</p>`;
                    avuiScroll.appendChild(mini);
                });
            }
        });

        if(avuiScroll && avuiScroll.innerHTML === "") avuiScroll.innerHTML = "<p style='color:#666; padding:20px;'>No hi ha actes per a hui.</p>";
        if(data.length > 0) selectDay(data[0].dia_id, tabsCont.firstChild);
    });

    // C. Carregar Temps
    carregarTemps();

    // D. Compte Enrere
    const target = new Date("May 10, 2026 00:00:00").getTime();
    setInterval(() => {
        const diff = target - new Date().getTime();
        if(diff > 0) {
            document.getElementById("days").innerText = Math.floor(diff / 86400000).toString().padStart(2, '0');
            document.getElementById("hours").innerText = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0');
            document.getElementById("minutes").innerText = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        }
    }, 1000);
});