let intervalId = null;
let currentTargetIso = null;

function pad(num) {
  return String(num).padStart(2, '0');
}

function tick() {
  const els = {
    days: document.getElementById('cd-days'),
    hours: document.getElementById('cd-hours'),
    minutes: document.getElementById('cd-minutes'),
    seconds: document.getElementById('cd-seconds'),
  };

  if (!currentTargetIso || !els.days) return;

  const diff = new Date(currentTargetIso) - new Date();

  if (diff <= 0) {
    els.days.textContent = '00';
    els.hours.textContent = '00';
    els.minutes.textContent = '00';
    els.seconds.textContent = '00';
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  els.days.textContent = String(Math.floor(totalSeconds / 86400));
  els.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
  els.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
  els.seconds.textContent = pad(totalSeconds % 60);
}

export function startCountdown(targetIso) {
  currentTargetIso = targetIso;
  tick();
  if (!intervalId) {
    intervalId = setInterval(tick, 1000);
  }
}

export function setCountdownTarget(targetIso) {
  currentTargetIso = targetIso;
  tick();
}
