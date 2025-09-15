// 📅 Programació (exemple)
const programacio = [
  {
    dia: "2025-05-10",
    titol: "Dissabte 10 de maig",
    actes: [
      { hora: "10:00", nom: "Cercavila amb la banda municipal" },
      { hora: "12:00", nom: "Mascletà a la plaça Major" },
      { hora: "23:00", nom: "Concert de música al recinte fester" }
    ]
  },
  {
    dia: "2025-05-11",
    titol: "Diumenge 11 de maig",
    actes: [
      { hora: "09:00", nom: "Concurs de paelles al parc" },
      { hora: "18:00", nom: "Partida de pilota valenciana" }
    ]
  }
];

const container = document.getElementById("programacio");
const avui = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD

programacio.forEach(dia => {
  const diaDiv = document.createElement("div");
  diaDiv.className = "dia";

  const header = document.createElement("div");
  header.className = "dia-header";
  header.innerHTML = `${dia.titol} <span>+</span>`;

  const actesDiv = document.createElement("div");
  actesDiv.className = "dia-actes";

  dia.actes.forEach(acte => {
    const acteDiv = document.createElement("div");
    acteDiv.className = "acte";
    acteDiv.textContent = `${acte.hora} - ${acte.nom}`;
    actesDiv.appendChild(acteDiv);
  });

  header.addEventListener("click", () => {
    const isOpen = actesDiv.style.display === "block";
    actesDiv.style.display = isOpen ? "none" : "block";
    header.querySelector("span").textContent = isOpen ? "+" : "−";
  });

  diaDiv.appendChild(header);
  diaDiv.appendChild(actesDiv);
  container.appendChild(diaDiv);

  // 🗓 Obrir automàticament si és el dia actual
  if (dia.dia === avui) {
    actesDiv.style.display = "block";
    header.querySelector("span").textContent = "−";
  }
});
