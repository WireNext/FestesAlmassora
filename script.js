// ==========================================
// 1. DADES DE LA PROGRAMACIÓ
// ==========================================
const programacio = [
  {
    dia: "2026-03-06", // DATA D'AVUI (Assegura't que coincideix per a veure els actes)
    titol: "Divendres 6 de març",
    actes: [
      "🕙 12:00 h | 🎆 Mascletà d'inici de proves.",
      "🕗 20:00 h | 🔔 Volteig de campanes festiu.",
      "🕙 22:00 h | 🎶 Orquestra Liquid Glass a la Plaça."
    ]
  },
  {
    dia: "2026-05-10",
    titol: "Diumenge 10 de maig",
    actes: [
      "🕛 12:00 h | 🧨 Xupinazo de festes!",
      "🕧 12:30 h | 🧣 Imposició del mocador al gegant.",
      "🕧 12:30 h | 🍻 Obertura del Mesó de la Tapa."
    ]
  }
];

// ==========================================
// 2. NAVEGACIÓ ENTRE PESTANYES
// ==========================================
function showPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    window.scrollTo(0, 0);
}

// ==========================================
// 3. CONTROL DEL TEMPS (DESPLEGABLE)
// ==========================================
function toggleWeatherDetails() {
    const details = document.getElementById('weather-details');
    if (details) {
        const isHidden = details.style.display === 'none';
        details.style.display = isHidden ? 'block' : 'none';
    }
}

// ==========================================
// 4. LÒGICA PRINCIPAL (DOM LOADED)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const containerAvui = document.getElementById("avui-scroll");
    const containerEvents = document.getElementById("programacio-container");

    // --- A. Gestió de Dates (Molt important) ---
    const ara = new Date();
    // Forcem format YYYY-MM-DD local (evitant problemes de zona horària UTC)
    const y = ara.getFullYear();
    const m = String(ara.getMonth() + 1).padStart(2, '0');
    const d = String(ara.getDate()).padStart(2, '0');
    const avuiISO = `${y}-${m}-${d}`;

    console.log("Hui és:", avuiISO); // Revisa la consola (F12) per a veure si coincideix

    // Netejem contenidors abans de començar
    if(containerAvui) containerAvui.innerHTML = "";
    if(containerEvents) containerEvents.innerHTML = "";

    // --- B. Generar Actes (Calendari i Inici) ---
    programacio.forEach(diaData => {
        // 1. Omplir Calendari (Pestanya Events)
        if (containerEvents) {
            const details = document.createElement("details");
            details.innerHTML = `
                <summary>📅 ${diaData.titol}</summary>
                <ul class="actes-llista">
                    ${diaData.actes.map(a => `<li>${a}</li>`).join('')}
                </ul>
            `;
            containerEvents.appendChild(details);
        }

        // 2. Omplir Inici (Si coincideix amb el dia d'avui)
        if (diaData.dia === avuiISO && containerAvui) {
            diaData.actes.forEach(acte => {
                const parts = acte.split("|");
                const card = document.createElement("div");
                card.className = "event-mini-card";
                card.innerHTML = `<b>${parts[0].trim()}</b><p>${parts[1]?.trim() || ''}</p>`;
                containerAvui.appendChild(card);
            });
        }
    });

    // Missatge de "No hi ha actes" si l'scroll està buit
    if (containerAvui && containerAvui.innerHTML === "") {
        containerAvui.innerHTML = `<p style="color:#666; padding:15px; font-size:13px;">No hi ha actes programats per a hui (${avuiISO}).</p>`;
    }

    // --- C. Compte Enrere ---
    const target = new Date("May 10, 2026 00:00:00").getTime();
    function updateCountdown() {
        const diff = target - new Date().getTime();
        const d_el = document.getElementById("days");
        const h_el = document.getElementById("hours");
        const m_el = document.getElementById("minutes");

        if (diff > 0 && d_el && h_el && m_el) {
            d_el.innerText = Math.floor(diff / 86400000).toString().padStart(2, '0');
            h_el.innerText = Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0');
            m_el.innerText = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        }
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // --- D. API del Temps (Detallat) ---
const urlWeather = "https://api.open-meteo.com/v1/forecast?latitude=39.94&longitude=-0.06&current_weather=true&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto";

// Funció per a traduir codis de l'API a Emojis/Icones
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "☁️";
}

fetch(urlWeather)
.then(r => r.json())
.then(data => {
    const araH = new Date().getHours();

    // 1. Capçalera (Es manté igual)
    const mainW = document.getElementById("weather-main");
    if(mainW) {
        mainW.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span style="font-size:18px; font-weight:600; display:block;">Almassora</span>
                    <span style="font-size:12px; color:#888;">Clica per a la previsió</span>
                </div>
                <span style="font-size:32px; font-weight:900; color:var(--red);">${Math.round(data.current_weather.temperature)}°C ${getWeatherIcon(data.current_weather.weathercode)}</span>
            </div>
        `;
    }

    // 2. Previsió per hores AMB ICONES
    const hourlyCont = document.getElementById("hourly-forecast");
    if(hourlyCont) {
        hourlyCont.innerHTML = ""; 
        for(let i = araH; i < araH + 12; i++) {
            const temp = Math.round(data.hourly.temperature_2m[i]);
            const code = data.hourly.weather_code[i];
            const icon = getWeatherIcon(code);
            
            const item = document.createElement("div");
            item.className = "hour-item";
            item.innerHTML = `
                <span>${i}:00</span>
                <span style="font-size:20px; margin: 5px 0; display:block;">${icon}</span>
                <b>${temp}°</b>
            `;
            hourlyCont.appendChild(item);
        }
    }

    // 3. Pròxims 7 dies (Es manté igual però amb icona dinàmica si vols)
    const dailyCont = document.getElementById("daily-forecast");
    if(dailyCont) {
        dailyCont.innerHTML = "";
        const diesSetmana = ["Dg", "Dl", "Dt", "Dc", "Dj", "Dv", "Ds"];
        data.daily.time.forEach((dateStr, i) => {
            const dateObj = new Date(dateStr);
            const item = document.createElement("div");
            item.className = "daily-item";
            item.innerHTML = `
                <span>${diesSetmana[dateObj.getDay()]}</span>
                <span>${getWeatherIcon(data.current_weather.weathercode)}</span>
                <b>${Math.round(data.daily.temperature_2m_max[i])}° / ${Math.round(data.daily.temperature_2m_min[i])}°</b>
            `;
            dailyCont.appendChild(item);
        });
    }

    // 4. Widgets 2x2 (Es manté igual)
    const wind = document.getElementById("w-wind");
    const hum = document.getElementById("w-humidity");
    const rain = document.getElementById("w-rain");
    const uv = document.getElementById("w-uv");

    if(wind) wind.innerText = data.current_weather.windspeed + " km/h";
    if(hum) hum.innerText = data.hourly.relative_humidity_2m[araH] + "%";
    if(rain) rain.innerText = data.hourly.precipitation_probability[araH] + "%";
    if(uv) uv.innerText = data.daily.uv_index_max[0] || "0";
    
}).catch(err => console.error("Error temps:", err));
});