function hsv2rgb(h, s = 100, v = 100) {
  let r, g, b;

  h = Math.max(0, Math.min(360, h)) / 60;
  s = Math.max(0, Math.min(100, s)) / 100;
  v = Math.max(0, Math.min(100, v)) / 100;

  if (s == 0) {
    r = g = b = Math.round(v * 255);
    return {r, g, b};
  }

  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));

  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    default: r = v; g = p; b = q;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rgb2hsv(r, g, b) {
  const max = Math.max.apply(Math, [r, g, b]);
  const min = Math.min.apply(Math, [r, g, b]);
  const chr = max - min;
  let h = 0;
  let s = 0;
  let v = max;

  if (v > 0) {
    s = chr / v;
    if (s > 0) {
      if (r == max) {
        h = 60 * (((g - min) - (b - min)) / chr);
        if (h < 0) { h += 360; }
      } else if (g == max) {
        h = 120 + 60 * (((b - min) - (r - min)) / chr);
      } else if (b == max) {
        h = 250 + 60 * (((r - min) - (g - min)) / chr);
      }
    }
  }
  return { h: h, s: Math.round(s * 100), v: Math.round(v * 100) };
}

function doubleClick($this, single, double, offAfterClick = true) {
  let timer = 0;
  let prevent = false;
  let prevClick = false;
  
  $this.on('click', () => {
    if (!prevClick) {
      timer = setTimeout(() => {
        if (!prevent && single) {
          if (offAfterClick) {
            $this.off('click');
          }
          single($this);
        }

        prevent = false;
        prevClick = false;
      }, 200);
      prevClick = true;
    }
    else {
      clearTimeout(timer);
      prevent = true;
      prevClick = false;
      double($this);
    }
  });
}
