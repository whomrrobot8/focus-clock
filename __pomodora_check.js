
    const DEFAULTS = {
      workMinutes: 25,
      breakMinutes: 5
    };

    let workTime = DEFAULTS.workMinutes * 60;
    let breakTime = DEFAULTS.breakMinutes * 60;
    let timeLeft = workTime;
    let isWork = true;
    let timer = null;
    let completedSessions = 0;
    let totalFocusMinutes = 0;

    const elements = {
      time: document.getElementById("time"),
      modeLabel: document.getElementById("modeLabel"),
      caption: document.getElementById("caption"),
      leadText: document.getElementById("leadText"),
      workModeBtn: document.getElementById("workModeBtn"),
      breakModeBtn: document.getElementById("breakModeBtn"),
      sessionPill: document.getElementById("sessionPill"),
      timerRing: document.getElementById("timerRing"),
      progressFill: document.getElementById("progressFill"),
      task: document.getElementById("task"),
      taskTag: document.getElementById("taskTag"),
      timelineTask: document.getElementById("timelineTask"),
      nextPhase: document.getElementById("nextPhase"),
      savedState: document.getElementById("savedState"),
      completedCount: document.getElementById("completedCount"),
      focusMinutes: document.getElementById("focusMinutes"),
      stateText: document.getElementById("stateText"),
      workDisplay: document.getElementById("workDisplay"),
      breakDisplay: document.getElementById("breakDisplay"),
      workMinutes: document.getElementById("workMinutes"),
      breakMinutes: document.getElementById("breakMinutes"),
      startBtn: document.getElementById("startBtn"),
      pauseBtn: document.getElementById("pauseBtn"),
      resetBtn: document.getElementById("resetBtn"),
      applySettingsBtn: document.getElementById("applySettingsBtn"),
      classicPresetBtn: document.getElementById("classicPresetBtn"),
      deepPresetBtn: document.getElementById("deepPresetBtn")
    };

    function getCurrentTotal() {
      return isWork ? workTime : breakTime;
    }

    function updateModeButtons() {
      elements.workModeBtn.classList.toggle("active", isWork);
      elements.breakModeBtn.classList.toggle("active", !isWork);
    }

    function updateButtonStates() {
      const running = Boolean(timer);
      elements.startBtn.disabled = running;
      elements.pauseBtn.disabled = !running;
      elements.resetBtn.disabled = !running && timeLeft === workTime && isWork;
    }

    function updateDurationDisplays() {
      elements.workDisplay.textContent = `${Math.round(workTime / 60)}m`;
      elements.breakDisplay.textContent = `${Math.round(breakTime / 60)}m`;
      elements.workMinutes.value = String(Math.round(workTime / 60));
      elements.breakMinutes.value = String(Math.round(breakTime / 60));
    }

    function formatTime(value) {
      const minutes = Math.floor(value / 60);
      const seconds = value % 60;
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    function playBeep() {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.18);
      gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.26);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.28);
    }

    function saveState() {
      localStorage.setItem("pomodoro.timeLeft", String(timeLeft));
      localStorage.setItem("pomodoro.isWork", String(isWork));
      localStorage.setItem("pomodoro.task", elements.task.value);
      localStorage.setItem("pomodoro.completedSessions", String(completedSessions));
      localStorage.setItem("pomodoro.totalFocusMinutes", String(totalFocusMinutes));
      localStorage.setItem("pomodoro.workTime", String(workTime));
      localStorage.setItem("pomodoro.breakTime", String(breakTime));
      if (elements.savedState.textContent !== "Recovered") {
        elements.savedState.textContent = "Synced";
      }
    }

    function updateUI() {
      const total = getCurrentTotal();
      const safeTimeLeft = Math.max(0, Math.min(total, timeLeft));
      const progress = ((total - safeTimeLeft) / total) * 100;
      const progressDeg = Math.max(0, Math.min(360, progress * 3.6));
      const ringColor = isWork ? "var(--work)" : "var(--break)";
      const taskValue = elements.task.value.trim();

      timeLeft = safeTimeLeft;
      elements.time.textContent = formatTime(safeTimeLeft);
      elements.modeLabel.textContent = isWork ? "Work Time" : "Break Time";
      elements.caption.textContent = isWork
        ? "Protect this block from distractions."
        : "Step away, breathe, and reset.";
      elements.leadText.textContent = isWork
        ? "Lock into the task below and let the countdown do the pacing."
        : "Take a real pause, reset your attention, and come back fresh.";
      elements.sessionPill.textContent = `Round ${completedSessions + 1}`;
      elements.completedCount.textContent = completedSessions;
      elements.focusMinutes.textContent = totalFocusMinutes;
      elements.timelineTask.textContent = taskValue || "No task yet";
      elements.taskTag.textContent = taskValue ? "Locked In" : "Today";
      elements.nextPhase.textContent = isWork ? "Break after focus" : "Back to focus next";
      elements.progressFill.style.width = `${progress}%`;
      elements.timerRing.style.setProperty("--progress-deg", `${progressDeg}deg`);
      elements.timerRing.style.setProperty("--ring-color", ringColor);
      updateModeButtons();
      updateDurationDisplays();

      if (timer) {
        elements.stateText.textContent = "Running";
        elements.startBtn.textContent = "In Progress";
      }

      updateButtonStates();
      saveState();
    }

    function switchMode(nextIsWork) {
      isWork = nextIsWork;
      timeLeft = getCurrentTotal();
      if (!timer) {
        elements.stateText.textContent = "Idle";
        elements.startBtn.textContent = "Start Session";
      }
      updateUI();
    }

    function applySettings(workMinutes, breakMinutes) {
      const safeWork = Math.max(1, Math.min(90, Math.round(workMinutes)));
      const safeBreak = Math.max(1, Math.min(30, Math.round(breakMinutes)));

      workTime = safeWork * 60;
      breakTime = safeBreak * 60;
      timeLeft = isWork ? workTime : breakTime;
      elements.savedState.textContent = "Updated";
      updateUI();
    }

    function startTimer() {
      if (timer) {
        return;
      }

      elements.stateText.textContent = "Running";
      elements.savedState.textContent = "Saving...";
      elements.startBtn.textContent = "In Progress";

      timer = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft -= 1;
          updateUI();
          return;
        }

        playBeep();

        if (isWork) {
          completedSessions += 1;
          totalFocusMinutes += Math.round(workTime / 60);
        }

        isWork = !isWork;
        timeLeft = getCurrentTotal();
        updateUI();
      }, 1000);

      updateButtonStates();
    }

    function pauseTimer() {
      if (!timer) {
        elements.stateText.textContent = "Idle";
        elements.startBtn.textContent = "Start Session";
        updateUI();
        return;
      }

      clearInterval(timer);
      timer = null;
      elements.stateText.textContent = "Paused";
      elements.startBtn.textContent = "Resume";
      updateUI();
    }

    function resetTimer() {
      clearInterval(timer);
      timer = null;
      timeLeft = isWork ? workTime : breakTime;
      isWork = true;
      timeLeft = workTime;
      elements.stateText.textContent = "Idle";
      elements.startBtn.textContent = "Start Session";
      updateUI();
    }

    function loadState() {
      const savedTime = localStorage.getItem("pomodoro.timeLeft");
      const savedMode = localStorage.getItem("pomodoro.isWork");
      const savedTask = localStorage.getItem("pomodoro.task");
      const savedCompleted = localStorage.getItem("pomodoro.completedSessions");
      const savedMinutes = localStorage.getItem("pomodoro.totalFocusMinutes");
      const savedWorkTime = localStorage.getItem("pomodoro.workTime");
      const savedBreakTime = localStorage.getItem("pomodoro.breakTime");

      if (savedTime !== null) {
        const parsedTime = Number.parseInt(savedTime, 10);
        if (!Number.isNaN(parsedTime)) {
          timeLeft = parsedTime;
        }
      }

      if (savedMode !== null) {
        isWork = savedMode === "true";
      }

      if (savedTask !== null) {
        elements.task.value = savedTask;
      }

      if (savedCompleted !== null) {
        const parsedCompleted = Number.parseInt(savedCompleted, 10);
        if (!Number.isNaN(parsedCompleted)) {
          completedSessions = parsedCompleted;
        }
      }

      if (savedMinutes !== null) {
        const parsedMinutes = Number.parseInt(savedMinutes, 10);
        if (!Number.isNaN(parsedMinutes)) {
          totalFocusMinutes = parsedMinutes;
        }
      }

      if (savedWorkTime !== null) {
        const parsedWork = Number.parseInt(savedWorkTime, 10);
        if (!Number.isNaN(parsedWork) && parsedWork > 0) {
          workTime = parsedWork;
        }
      }

      if (savedBreakTime !== null) {
        const parsedBreak = Number.parseInt(savedBreakTime, 10);
        if (!Number.isNaN(parsedBreak) && parsedBreak > 0) {
          breakTime = parsedBreak;
        }
      }

      elements.savedState.textContent = "Recovered";
      updateUI();
    }

    function handleHotkeys(event) {
      const target = event.target;
      if (target instanceof HTMLInputElement) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        if (timer) {
          pauseTimer();
        } else {
          startTimer();
        }
      }

      if (event.key.toLowerCase() === "r") {
        resetTimer();
      }

      if (event.key.toLowerCase() === "w") {
        switchMode(true);
      }

      if (event.key.toLowerCase() === "b") {
        switchMode(false);
      }
    }

    elements.startBtn.addEventListener("click", startTimer);
    elements.pauseBtn.addEventListener("click", pauseTimer);
    elements.resetBtn.addEventListener("click", resetTimer);
    elements.task.addEventListener("input", updateUI);
    elements.workModeBtn.addEventListener("click", () => switchMode(true));
    elements.breakModeBtn.addEventListener("click", () => switchMode(false));
    elements.applySettingsBtn.addEventListener("click", () => {
      applySettings(
        Number.parseInt(elements.workMinutes.value, 10),
        Number.parseInt(elements.breakMinutes.value, 10)
      );
    });
    elements.classicPresetBtn.addEventListener("click", () => applySettings(25, 5));
    elements.deepPresetBtn.addEventListener("click", () => applySettings(50, 10));
    elements.workMinutes.addEventListener("change", () => {
      applySettings(
        Number.parseInt(elements.workMinutes.value, 10),
        Number.parseInt(elements.breakMinutes.value, 10)
      );
    });
    elements.breakMinutes.addEventListener("change", () => {
      applySettings(
        Number.parseInt(elements.workMinutes.value, 10),
        Number.parseInt(elements.breakMinutes.value, 10)
      );
    });
    document.addEventListener("keydown", handleHotkeys);

    loadState();
  
