let audioCtx = null;
let currentSrc = null;
let seq = 0;                      // global sequence for race control
let lastKey = null;               // last spoken question key
let lastKeyAt = 0;                // timestamp to de-dupe rapid duplicates

function killCurrent() {
  try { currentSrc?.stop(0); } catch {}
  currentSrc = null;
}

export function stopTTS() {
  killCurrent();
}

/**
 * Speak text once. If another speak is in flight or playing, it is cancelled.
 * key: a stable key per question (e.g., `${idx}:${text}`)
 * rate: playback rate (0.9 = calmer)
 */
export async function speakTTS(text, { key = "", rate = 0.9 } = {}) {
  if (!text) return;

  // De-dupe: if the same key tries to play again within 800ms, ignore.
  const now = Date.now();
  if (key && lastKey === key && now - lastKeyAt < 800) return;
  lastKey = key; lastKeyAt = now;

  // Cancel anything already playing
  killCurrent();

  // Race guard: only the latest invocation is allowed to actually play
  const mySeq = ++seq;

  // Fetch audio
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const buf = await res.arrayBuffer();

  if (mySeq !== seq) return; // a newer speak started while we fetched

  // Decode & play
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuf = await audioCtx.decodeAudioData(buf);

  if (mySeq !== seq) return; // check again before starting

  const src = audioCtx.createBufferSource();
  src.buffer = audioBuf;
  src.playbackRate.value = rate;
  src.connect(audioCtx.destination);
  currentSrc = src;
  src.onended = () => { if (currentSrc === src) currentSrc = null; };
  src.start(0);
}

export function isSpeaking() {
  return !!currentSrc;
}
