/* Synthesised sources for the audio simulators: no recordings needed */
const SR = 44100;
function mkBuf(ac, secs, fn){
  const n = Math.floor(secs * ac.sampleRate), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  fn(d, ac.sampleRate); let pk = 0; for(let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i]));
  if(pk > 0) for(let i = 0; i < n; i++) d[i] *= 0.9 / pk;
  return b;
}
/* Speech-like voice: buzzy source through formant-ish resonances, chopped into syllables and phrases */
function voiceBuffer(ac, secs = 9, seed = 3, pitch = 115){
  const r = rnd(seed);
  return mkBuf(ac, secs, (d, sr) => {
    // syllable plan
    const env = new Float32Array(d.length); let t = 0.25;
    while(t < secs - 0.3){
      const words = 3 + Math.floor(r() * 6);
      for(let w = 0; w < words && t < secs - 0.3; w++){
        const len = 0.12 + r() * 0.18, a = Math.floor(t * sr), b = Math.min(d.length, Math.floor((t + len) * sr));
        for(let i = a; i < b; i++){ const x = (i - a) / (b - a); env[i] = Math.sin(Math.PI * x) ** 0.6 * (0.6 + 0.4 * r()); }
        t += len + 0.03 + r() * 0.06;
      }
      t += 0.25 + r() * 0.45; // breath between phrases
    }
    let ph = 0, f1 = 600, f2 = 1400, y1 = 0, y2 = 0, z1 = 0, z2 = 0, nextF = 0;
    for(let i = 0; i < d.length; i++){
      if(i >= nextF){ f1 = 350 + r() * 500; f2 = 1000 + r() * 1300; nextF = i + sr * (0.08 + r() * 0.1); }
      const f0 = pitch * (1 + 0.08 * Math.sin(i / sr * 2.3) + 0.04 * Math.sin(i / sr * 7.1));
      ph += f0 / sr; if(ph > 1) ph -= 1;
      const src = (ph * 2 - 1) * 0.6 + (r() * 2 - 1) * 0.08;
      // two resonant one-pole-ish band filters
      const k1 = 2 * Math.sin(Math.PI * f1 / sr), k2 = 2 * Math.sin(Math.PI * f2 / sr);
      y1 += k1 * (src - y1 - 0.35 * y2); y2 += k1 * y1;
      z1 += k2 * (src - z1 - 0.45 * z2); z2 += k2 * z1;
      d[i] = (y1 * 0.9 + z1 * 0.6) * env[i];
    }
    let pk = 0; for(let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    for(let i = 0; i < d.length; i++) d[i] = Math.tanh(4 * d[i] / pk);
  });
}
/* Stadium crowd: filtered noise with slow swells and the odd chant */
function crowdBuffer(ac, secs = 9, seed = 5){
  const r = rnd(seed);
  return mkBuf(ac, secs, (d, sr) => {
    let b0 = 0, b1 = 0, b2 = 0, lp = 0;
    for(let i = 0; i < d.length; i++){
      const w = r() * 2 - 1; b0 = 0.997 * b0 + w * 0.03; b1 = 0.96 * b1 + w * 0.13; b2 = 0.6 * b2 + w * 0.4;
      const pink = b0 + b1 + b2 + w * 0.15; lp += 0.25 * (pink - lp);
      const t = i / sr, swell = 0.65 + 0.25 * Math.sin(t * 0.7) + 0.1 * Math.sin(t * 2.9);
      const chant = (Math.sin(2 * Math.PI * 330 * t) * 0.15 + Math.sin(2 * Math.PI * 247 * t) * 0.1) * Math.max(0, Math.sin(t * 1.3)) ** 6;
      d[i] = lp * swell + chant * 0.3;
    }
  });
}
/* Music bed: four-chord loop with bass and a kick on every beat */
function musicBuffer(ac, secs = 8, bpm = 120, transpose = 0){
  return mkBuf(ac, secs, (d, sr) => {
    const chords = [[0,4,7],[-3,0,4],[-7,-3,0],[-5,-1,2]], beat = 60 / bpm;
    for(let i = 0; i < d.length; i++){
      const t = i / sr, bar = Math.floor(t / (beat * 4)) % 4, ch = chords[bar];
      let s = 0;
      for(const n of ch){ const f = 261.6 * Math.pow(2, (n + transpose) / 12); s += Math.sin(2 * Math.PI * f * t) * 0.18 + Math.sin(4 * Math.PI * f * t) * 0.05; }
      const bf = 65.4 * Math.pow(2, (ch[0] + transpose) / 12); s += Math.sin(2 * Math.PI * bf * t) * 0.35;
      const bt = t % beat; s += Math.sin(2 * Math.PI * (55 + 120 * Math.exp(-bt * 30)) * bt) * Math.exp(-bt * 12) * 0.9;
      const ht = (t + beat / 2) % beat; s += (Math.random() * 2 - 1) * Math.exp(-ht * 60) * 0.12;
      d[i] = s;
    }
  });
}
function loopSource(ac, buf, dest){ const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(dest); s.start(); return s; }
/* Meter: peak and RMS in dBFS from an AnalyserNode */
function meterRead(an, buf){
  an.getFloatTimeDomainData(buf); let pk = 0, ss = 0;
  for(let i = 0; i < buf.length; i++){ const v = buf[i]; ss += v * v; if(Math.abs(v) > pk) pk = Math.abs(v); }
  return {peak: db(pk), rms: db(Math.sqrt(ss / buf.length)), ms: ss / buf.length};
}
/* K-weighting chain (approximate) feeding an analyser, for a LUFS-style reading */
function kWeight(ac, src){
  const hs = ac.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 1500; hs.gain.value = 4;
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38; hp.Q.value = 0.5;
  const an = ac.createAnalyser(); an.fftSize = 4096;
  src.connect(hs); hs.connect(hp); hp.connect(an); return an;
}
function drawMeter(c, x, y, w, h, rmsDb, peakDb, hold){
  const lo = -60, f = v => clamp((v - lo) / (0 - lo), 0, 1);
  c.fillStyle = '#111'; c.fillRect(x, y, w, h);
  const r = f(rmsDb), p = f(peakDb);
  const g = c.createLinearGradient(0, y + h, 0, y); g.addColorStop(0, '#2a9d8f'); g.addColorStop(0.75, '#e9c46a'); g.addColorStop(0.9, '#e76f51'); g.addColorStop(1, '#c8382f');
  c.fillStyle = g; c.fillRect(x + 2, y + h * (1 - r), w - 4, h * r);
  c.fillStyle = '#fff'; c.fillRect(x + 1, y + h * (1 - p) - 1, w - 2, 2);
  if(hold !== undefined){ c.fillStyle = '#ffd166'; c.fillRect(x + 1, y + h * (1 - f(hold)) - 1, w - 2, 2); }
}
