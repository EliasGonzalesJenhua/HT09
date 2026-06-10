const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".operation-panel");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const loadingScreen = document.querySelector("#loadingScreen");
const loadingVideo = loadingScreen?.querySelector("video");
const logoutButton = document.querySelector("#logoutButton");
const authKey = "ht09-valorant-authenticated";
let loadingVideoWatchdog = null;

if (sessionStorage.getItem(authKey) === "true") {
  document.body.classList.remove("auth-locked");
}

function playLoadingVideo() {
  if (!loadingVideo) return;

  loadingVideo.muted = true;
  loadingVideo.loop = true;
  loadingVideo.playsInline = true;
  loadingVideo.preload = "auto";

  const startPlayback = () => {
    loadingVideo.play().catch(() => {});
  };

  clearInterval(loadingVideoWatchdog);

  try {
    loadingVideo.currentTime = 0;
  } catch {
    // El navegador puede bloquear el salto hasta cargar metadatos.
  }

  if (loadingVideo.readyState >= 2) {
    startPlayback();
  } else {
    loadingVideo.load();
    loadingVideo.addEventListener("canplay", startPlayback, { once: true });
    loadingVideo.addEventListener("loadeddata", startPlayback, { once: true });
  }

  loadingVideoWatchdog = setInterval(() => {
    if (!document.body.classList.contains("loading-active")) {
      clearInterval(loadingVideoWatchdog);
      return;
    }

    if (loadingVideo.paused || loadingVideo.readyState < 2) {
      startPlayback();
    }
  }, 900);
}

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const user = document.querySelector("#loginUser")?.value.trim();
    const password = document.querySelector("#loginPassword")?.value.trim();

    if (!user || !password) {
      if (loginError) loginError.textContent = "Completa usuario y clave para entrar.";
      return;
    }

    if (loginError) loginError.textContent = "";
    if (loadingScreen) {
      loadingScreen.hidden = false;
      document.body.classList.add("loading-active");
      playLoadingVideo();
    }

    setTimeout(() => {
      sessionStorage.setItem(authKey, "true");
      document.body.classList.remove("auth-locked");
      document.body.classList.remove("loading-active");
      if (loadingScreen) loadingScreen.hidden = true;
      clearInterval(loadingVideoWatchdog);
      if (loadingVideo) loadingVideo.pause();
    }, 45000);
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(authKey);
    document.body.classList.add("auth-locked");
    document.body.classList.remove("loading-active");
    if (loadingScreen) loadingScreen.hidden = true;
    clearInterval(loadingVideoWatchdog);
    if (loadingVideo) loadingVideo.pause();
    if (loginForm) loginForm.reset();
    if (loginError) loginError.textContent = "";
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.id === target;
      panel.classList.toggle("active", isActive);
      panel.hidden = !isActive;
    });
  });
});

const materialSlides = document.querySelectorAll(".materials-slide");
const materialsNext = document.querySelector(".materials-control.next");
const materialsPrevious = document.querySelector(".materials-control.previous");
let materialIndex = 0;

function showMaterialSlide(nextIndex) {
  if (!materialSlides.length) return;
  materialSlides[materialIndex].classList.remove("active");
  materialIndex = (nextIndex + materialSlides.length) % materialSlides.length;
  materialSlides[materialIndex].classList.add("active");
}

if (materialSlides.length && materialsNext && materialsPrevious) {
  materialsNext.addEventListener("click", () => showMaterialSlide(materialIndex + 1));
  materialsPrevious.addEventListener("click", () => showMaterialSlide(materialIndex - 1));

  document.addEventListener("keydown", (event) => {
    const section = document.querySelector(".materials-section");
    if (!section) return;

    const box = section.getBoundingClientRect();
    const isVisible = box.top < window.innerHeight * 0.75 && box.bottom > window.innerHeight * 0.25;
    if (!isVisible) return;

    if (event.key === "ArrowRight") showMaterialSlide(materialIndex + 1);
    if (event.key === "ArrowLeft") showMaterialSlide(materialIndex - 1);
  });
}

const checks = document.querySelectorAll(".checklist input");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const checklistKey = "ht09-checklist";

function updateProgress() {
  const total = checks.length;
  const done = [...checks].filter((check) => check.checked).length;
  const percent = total ? (done / total) * 100 : 0;

  progressText.textContent = `${done} de ${total} completados`;
  progressBar.style.width = `${percent}%`;
  if (checks.length) {
    localStorage.setItem(checklistKey, JSON.stringify([...checks].map((check) => check.checked)));
  }
}

if (checks.length && progressText && progressBar) {
  const saved = JSON.parse(localStorage.getItem(checklistKey) || "[]");
  checks.forEach((check, index) => {
    check.checked = Boolean(saved[index]);
  });
  checks.forEach((check) => check.addEventListener("change", updateProgress));
  updateProgress();
}

function markChecklist(index) {
  const saved = JSON.parse(localStorage.getItem(checklistKey) || "[]");
  const next = Array.from({ length: 6 }, (_, itemIndex) => Boolean(saved[itemIndex]));
  next[index] = true;
  localStorage.setItem(checklistKey, JSON.stringify(next));
}

document.querySelectorAll(".simulator").forEach((simulator) => {
  const type = simulator.dataset.sim;
  const result = simulator.querySelector(".sim-result");
  const nodes = simulator.querySelectorAll(".sim-node");
  const terminal = simulator.querySelector("[data-terminal]");

  function stamp() {
    return new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function log(message, level = "info") {
    if (!terminal) return;
    const prefix = level === "error" ? "ERROR" : level === "ok" ? "OK" : level === "warn" ? "WARN" : "INFO";
    terminal.textContent += `\n[${stamp()}] ${prefix}: ${message}`;
    terminal.scrollTop = terminal.scrollHeight;
  }

  if (type === "intro") {
    simulator.querySelector(".sim-button").addEventListener("click", () => {
      const lab = simulator.querySelector(".impact-sim-lab");
      const availability = simulator.querySelector("[data-metric='availability']");
      const downtime = simulator.querySelector("[data-metric='downtime']");
      const continuity = simulator.querySelector("[data-metric='continuity']");
      lab.classList.remove("impact-recovering");
      lab.classList.add("impact-failure");
      availability.textContent = "41%";
      downtime.textContent = "18 min";
      continuity.textContent = "Baja";
      result.textContent = "Fallo simulado: el servicio critico se interrumpe y los usuarios pierden acceso.";
      markChecklist(0);
      log("Se detecto caida en servicio IA critico.", "error");
      log("Disponibilidad cae a 41%. Usuarios pierden acceso temporal.", "warn");

      setTimeout(() => {
        lab.classList.remove("impact-failure");
        lab.classList.add("impact-recovering");
        availability.textContent = "99.5%";
        downtime.textContent = "1 min";
        continuity.textContent = "Alta";
        result.textContent = "Con HA: el servicio se recupera desde un nodo alterno y la interrupcion se reduce.";
        log("Nodo alterno responde correctamente. Servicio restaurado.", "ok");
        log("Conclusion: HA reduce interrupcion de 18 min a 1 min.", "ok");
      }, 1800);
    });
  }

  if (type === "options") {
    simulator.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const messages = {
          "active-active": "Active-active: ambos nodos atienden carga. Si uno falla, el otro continua con menor interrupcion.",
          "active-passive": "Active-passive: el nodo pasivo toma el servicio cuando el principal falla.",
          n1: "N+1: un nodo adicional queda disponible para absorber la caida de un host."
        };
        const lab = simulator.querySelector(".ha-choice-lab");
        lab.className = `ha-choice-lab mode-${button.dataset.option}`;
        simulator.querySelectorAll("[data-option]").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        result.textContent = messages[button.dataset.option];
        markChecklist(0);
        log(`Opcion seleccionada: ${button.textContent}.`, "info");
        log(messages[button.dataset.option], "ok");
      });
    });
  }

  if (type === "risk") {
    simulator.querySelectorAll("[data-component]").forEach((button) => {
      button.addEventListener("click", () => {
        const messages = {
          database: "Base de datos: criticidad alta. Requiere HA, backups, replicacion y RPO bajo.",
          network: "Red: criticidad media-alta. Requiere enlaces redundantes para evitar aislamiento.",
          storage: "Almacenamiento: criticidad alta. Si falla, las VM no pueden migrar correctamente.",
          reports: "Reportes: criticidad media. Puede tener recuperacion menos urgente que datos o entrenamiento."
        };
        const lab = simulator.querySelector(".risk-sim-lab");
        const meter = simulator.querySelector(".risk-meter strong");
        const scores = { database: "92%", network: "72%", storage: "96%", reports: "48%" };
        lab.dataset.active = button.dataset.component;
        meter.style.width = scores[button.dataset.component];
        meter.textContent = scores[button.dataset.component];
        simulator.querySelectorAll("[data-component]").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        result.textContent = messages[button.dataset.component];
        markChecklist(1);
        log(`Componente analizado: ${button.textContent}. Criticidad calculada: ${scores[button.dataset.component]}.`, "info");
        log(messages[button.dataset.component], button.dataset.component === "reports" ? "warn" : "ok");
      });
    });
  }

  if (type === "cluster") {
    simulator.querySelector(".sim-button").addEventListener("click", () => {
      const lab = simulator.querySelector(".ha-lab");
      const steps = simulator.querySelectorAll(".sim-steps span");
      lab.classList.remove("failover-complete");
      void lab.offsetWidth;
      lab.classList.add("failover-running");
      result.textContent = "Detectando fallo del Host 1...";
      markChecklist(2);
      markChecklist(3);
      log("Heartbeat perdido en Host 1. Iniciando diagnostico.", "error");

      steps.forEach((step) => step.classList.remove("step-active"));
      steps[0].classList.add("step-active");

      setTimeout(() => {
        steps[1].classList.add("step-active");
        result.textContent = "Alta disponibilidad activada: preparando nodo de respaldo.";
        log("Politica HA activada. Host 2 validado como nodo disponible.", "info");
      }, 700);

      setTimeout(() => {
        steps[2].classList.add("step-active");
        result.textContent = "Migrando VM1 y VM2 hacia Host 2...";
        log("Migrando VM1 y VM2 hacia Host 2 usando almacenamiento compartido.", "warn");
      }, 1400);

      setTimeout(() => {
        steps[3].classList.add("step-active");
        lab.classList.remove("failover-running");
        lab.classList.add("failover-complete");
        result.textContent = "Failover ejecutado: las VM criticas se reinician en Host 2 y el servicio continua.";
        log("Failover completado. VM criticas operativas en Host 2.", "ok");
        log("Resultado: servicio continuo con interrupcion minima.", "ok");
      }, 2400);
    });
  }

  if (type === "failure") {
    simulator.querySelectorAll("[data-failure]").forEach((button) => {
      button.addEventListener("click", () => {
        const messages = {
          host: "Fallo de host: failover automatico. RTO esperado bajo, RPO sin perdida si el almacenamiento esta disponible.",
          network: "Fallo de red: activar enlace redundante o alerta. RTO medio segun topologia.",
          storage: "Fallo de almacenamiento: usar replica o ruta secundaria. RPO critico porque puede haber perdida de datos.",
          hypervisor: "Fallo de hipervisor: reinicio o migracion de VM. Impacto alto si no existe nodo alterno."
        };
        const lab = simulator.querySelector(".incident-lab");
        const rto = simulator.querySelector("[data-rto]");
        const rpo = simulator.querySelector("[data-rpo]");
        const values = {
          host: ["2-5 min", "0-1 min"],
          network: ["5-10 min", "0 min"],
          storage: ["10-30 min", "5-15 min"],
          hypervisor: ["5-15 min", "0-5 min"]
        };
        lab.classList.remove("incident-run");
        void lab.offsetWidth;
        lab.classList.add("incident-run");
        rto.textContent = values[button.dataset.failure][0];
        rpo.textContent = values[button.dataset.failure][1];
        simulator.querySelectorAll("[data-failure]").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        result.textContent = messages[button.dataset.failure];
        markChecklist(4);
        markChecklist(5);
        log(`Incidente seleccionado: fallo de ${button.textContent}.`, "error");
        log(`RTO estimado: ${values[button.dataset.failure][0]}. RPO estimado: ${values[button.dataset.failure][1]}.`, "warn");
        log(messages[button.dataset.failure], "info");
      });
    });
  }

  if (type === "improvement") {
    const selected = new Set();
    const meter = simulator.querySelector(".sim-meter span");
    simulator.querySelectorAll("[data-improve]").forEach((button) => {
      button.addEventListener("click", () => {
        selected.add(button.dataset.improve);
        button.classList.add("selected");
        const score = 35 + selected.size * 15;
        const orb = simulator.querySelector(".availability-orb strong");
        const orbBox = simulator.querySelector(".availability-orb");
        const upgrades = simulator.querySelectorAll(".upgrade-grid span");
        meter.style.width = `${score}%`;
        orb.textContent = `${score}%`;
        orbBox.style.background = `radial-gradient(circle at center, var(--white) 56%, transparent 57%), conic-gradient(var(--neon) ${score}%, #dce8f8 0)`;
        upgrades.forEach((upgrade) => {
          upgrade.classList.toggle("active", selected.has(upgrade.dataset.upgrade));
        });
        result.textContent = `Preparacion actual: ${score}%. Mejoras activadas: ${selected.size} de 4.`;
        markChecklist(5);
        log(`Mejora activada: ${button.textContent}.`, "ok");
        log(`Nivel de preparacion actualizado a ${score}%.`, score >= 80 ? "ok" : "info");
      });
    });
  }
});

document.querySelectorAll(".qa-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".qa-item");
    item.classList.toggle("open");
  });
});

const spotlightHide = document.querySelector(".spotlight-hide");
if (spotlightHide) {
  spotlightHide.addEventListener("click", () => {
    const reflector = document.querySelector("#spotlightReflector");
    if (reflector) reflector.style.display = "none";
    spotlightHide.style.display = "none";
  });
}
