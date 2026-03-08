/**
 * ENGINE SANTA QUITÈRIA 2026 - FULLSCREEN VERSION
 */

let dadesProgramacio = [];

// --- 1. NAVEGACIÓ I MODALS ---
function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

function openActe(idActe) {
    let acte = null;
    dadesProgramacio.forEach(dia => {
        const trobat = dia.actes.find(a => a.id === idActe);
        if(trobat) acte = trobat;
    });

    if(acte) {
        document.getElementById("modal-titol").innerText = acte.titol;
        document.getElementById("modal-info").innerText = `🕒 ${acte.hora_inici}h - ${acte.hora_fi}h`;
        document.getElementById("modal-desc").innerText = acte.descripcio;
        document.getElementById("modal-img").src = acte.imatge;
        document.getElementById("modal-map").href = acte.mapa_url;
        
        const modal = document.getElementById("event-modal");
        modal.style.display = "block";
        document.body.style.overflow = "hidden"; // Bloqueja el scroll de l'app
    }
}

function closeModal() {
    document.getElementById("event-modal").style.display = "none";
    document.body.style.overflow = "auto"; // Torna el scroll
}

function toggleWeatherDetails() {
    const d = document.getElementById('weather-details');
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    return "☁️";
}

// --- 2. LÒGICA DE SELECCIÓ DE DIA ---
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

// --- 3. INICIALITZACIÓ ---
document.addEventListener("DOMContentLoaded", () => {
    const ara = new Date();
    // Forçar data per a proves o usar la real
    const y = ara.getFullYear();
    const m = String(ara.getMonth() + 1).padStart(2, '0');
    const d = String(ara.getDate()).padStart(2, '0');
    const avuiISO = `${y}-${m}-${d}`;

    fetch('programacion.json')
    .then(r => r.json())
    .then(data => {
        dadesProgramacio = data;
        const tabsCont = document.getElementById("days-tabs");
        const avuiScroll = document.getElementById("avui-scroll");

        data.forEach((dia, index) => {
            // Pestanyes horitzontals
            const btn = document.createElement("div");
            btn.className = `day-tab ${index === 0 ? 'active' : ''}`;
            btn.innerText = dia.titol_curt;
            btn.onclick = () => selectDay(dia.dia_id, btn);
            tabsCont.appendChild(btn);

            // Actes d'avui (Pestanya Inici)
            if(dia.data_iso === avuiISO) {
                dia.actes.forEach(acte => {
                    const mini = document.createElement("div");
                    mini.className = "event-mini-card";
                    mini.onclick = () => openActe(acte.id); // Obre directament el modal
                    mini.innerHTML = `<b>${acte.hora_inici}h</b><p>${acte.titol}</p>`;
                    avuiScroll.appendChild(mini);
                });
            }
        });

        if(avuiScroll.innerHTML === "") avuiScroll.innerHTML = "<p style='color:#666; padding:20px;'>No hi ha actes per a hui.</p>";
        if(data.length > 0) selectDay(data[0].dia_id, tabsCont.firstChild);
    });

    // Compte enrere
    const target = new Date("May 10, 2026 00:00:00").getTime();
    setInterval(() => {
        const diff = target - new Date().getTime();
        if(diff > 0) {
            document.getElementById("days").innerText = Math.floor(diff / 86400000).toString().padStart(2, '0');
            document.getElementById("hours").innerText = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0');
            document.getElementById("minutes").innerText = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        }
    }, 1000);

    // Temps (Simplificat per a l'exemple, manté la teua lògica d'icones)
    fetch("https://api.open-meteo.com/v1/forecast?latitude=39.94&longitude=-0.06&current_weather=true&hourly=temperature_2m,weather_code,precipitation_probability,relative_humidity_2m&daily=uv_index_max&timezone=auto")
    .then(r => r.json()).then(d => {
        const h = ara.getHours();
        const weatherMain = document.getElementById("weather-main");
        if(weatherMain) {
            weatherMain.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div><b style="font-size:18px;">Almassora Ara</b><br><small style="color:#888;">Clica per a detalls</small></div>
                    <span style="font-size:32px; font-weight:900; color:var(--red);">${Math.round(d.current_weather.temperature)}°C ${getWeatherIcon(d.current_weather.weathercode)}</span>
                </div>`;
        }
        
        const hCont = document.getElementById("hourly-forecast");
        if(hCont) {
            for(let i=h; i<h+12; i++) {
                hCont.innerHTML += `<div class="hour-item"><span>${i}:00</span><span style="font-size:20px;margin:5px 0;display:block;">${getWeatherIcon(d.hourly.weather_code[i])}</span><b>${Math.round(d.hourly.temperature_2m[i])}°</b></div>`;
            }
        }
        
        document.getElementById("w-wind").innerText = d.current_weather.windspeed + " km/h";
        document.getElementById("w-humidity").innerText = d.hourly.relative_humidity_2m[h] + "%";
        document.getElementById("w-rain").innerText = d.hourly.precipitation_probability[h] + "%";
        document.getElementById("w-uv").innerText = d.daily.uv_index_max[0];
    });
});