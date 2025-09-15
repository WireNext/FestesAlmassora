const programacio = [
  {
    dia: "Dissabte 10 de maig",
    actes: [
      { hora: "10:00", nom: "Cercavila amb la banda municipal" },
      { hora: "12:00", nom: "Mascletà a la plaça Major" },
      { hora: "23:00", nom: "Concert de música al recinte fester" }
    ]
  },
  {
    dia: "Diumenge 11 de maig",
    actes: [
      { hora: "09:00", nom: "Concurs de paelles al parc" },
      { hora: "18:00", nom: "Partida de pilota valenciana" }
    ]
  }
];

const container = document.getElementById("programacio");

programacio.forEach(dia => {
  const diaDiv = document.createElement("div");
  diaDiv.className = "dia";
  diaDiv.innerHTML = `<h2>${dia.dia}</h2>`;
  
  dia.actes.forEach(acte => {
    const acteDiv = document.createElement("div");
    acteDiv.className = "acte";
    acteDiv.textContent = `${acte.hora} - ${acte.nom}`;
    diaDiv.appendChild(acteDiv);
  });

  container.appendChild(diaDiv);
});
