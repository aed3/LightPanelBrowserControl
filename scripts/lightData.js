class LEDColor {
  value = 0xffffff;

  rgb (r, g, b) {
    this.value = (r << 16) + (g << 8) + b;
  }

  hex (hex) {
    this.value = Number.parseInt(hex.replace('#', ''), 16);
  }

  set (lc) {
    this.value = lc.value;
  }

  get r() {
    return Math.floor(this.value / 65536);
  }

  get g() {
    return Math.floor(this.value / 256) % 256;
  }

  get b() {
    return this.value % 256;
  }

  get colorCode() {
    return '#' + this.value.toString(16).padStart(6, '0');
  }
}

const CornerLocation = [
  'CL_LT',
  'CL_MT',
  'CL_RT',
  'CL_RB',
  'CL_MB',
  'CL_LB',
];

const SideLocation = [
  'SL_TOP',
  'SL_RIGHT',
  'SL_BOTTOM',
  'SL_LEFT',
];

const LoopDirection = [
  'CW',
  'CCW',
];

const TYPES = {
  uint8: {
    dt: Number,
    length: 8,
  },
  uint16: {
    dt: Number,
    length: 16,
  },
  MilliSec: {
    dt: Number,
    length: 32,
  },
  LEDColor: {
    dt: LEDColor,
    length: 24,
  },
  CornerLocation: {
    dt: CornerLocation,
    length: Math.ceil(Math.log2(CornerLocation.length)),
  },
  SideLocation: {
    dt: SideLocation,
    length: Math.ceil(Math.log2(SideLocation.length)),
  },
  LoopDirection: {
    dt: LoopDirection,
    length: Math.ceil(Math.log2(LoopDirection.length)),
  },
};

const typeArrayBitCount = {
  CornerLocation: 3,
  SideLocation: 2,
  LoopDirection: 1,
};

const presets = {
  Hexagon: {
    'Breathe': {
      'Max Brightness': [TYPES.uint8, 50],
      'Fade Duration': [TYPES.MilliSec, 2000],
      'Color': [TYPES.LEDColor, '#000000'],
    },
    'Color Shift': {
      'Time Delay': [TYPES.MilliSec, 500],
      'Shifts': [TYPES.uint16, 1],
    },
    'Rainbow Timed': {
      'Duration': [TYPES.MilliSec, 5000],
      'Speed': [TYPES.uint8, 250],
    },
    'Rainbow': {
      'Loops': [TYPES.uint16, 5],
      'Speed': [TYPES.uint8, 250],
    },
    'Set Color': {
      'Color': [TYPES.LEDColor, '#000000'],
      'Time Delay': [TYPES.MilliSec, 0],
    },
    'Set Brightness': {
      'Brightness': [TYPES.uint8, 50],
    },
  },
  TriPanel: {
    'Breathe': {
      'Max Brightness': [TYPES.uint8, 50],
      'Fade Duration': [TYPES.MilliSec, 2000],
      'Color': [TYPES.LEDColor, '#000000'],
    },
    'Fade In': {
      'Max Brightness': [TYPES.uint8, 50],
      'Duration': [TYPES.MilliSec, 1000],
    },
    'Fade Out': {
      'Min Brightness': [TYPES.uint8, 0],
      'Duration': [TYPES.MilliSec, 1000],
    },
    'Fill From Corner': {
      'Percent': [TYPES.uint8, 100],
      'Color': [TYPES.LEDColor, '#000000'],
      'Duration': [TYPES.MilliSec, 1000],
      'Corner Location': [TYPES.CornerLocation, 'Default'],
    },
    'Fill To Corner': {
      'Percent': [TYPES.uint8, 100],
      'Color': [TYPES.LEDColor, '#000000'],
      'Duration': [TYPES.MilliSec, 1000],
      'Corner Location': [TYPES.CornerLocation, 'Default'],
    },
    'Color Spin': {
      'Loops': [TYPES.uint16, 5],
      'Speed': [TYPES.uint8, 250],
    },
    'Rainbow Timed': {
      'Duration': [TYPES.MilliSec, 250],
      'Speed': [TYPES.uint8, 250],
    },
    'Rainbow': {
      'Loops': [TYPES.uint16, 5],
      'Speed': [TYPES.uint8, 250],
    },
    'Set Color': {
      'Color': [TYPES.LEDColor, '#000000'],
      'Time Delay': [TYPES.MilliSec, 0],
    },
    'Set Brightness': {
      'Brightness': [TYPES.uint8, 50],
    },
  },
  PanelSegment: {
    'Set Color': {
      'Color': [TYPES.LEDColor, '#000000'],
      'Time Delay': [TYPES.MilliSec, 0],
    },
  },
  LED: {
    'Set Color': {
      'Color': [TYPES.LEDColor, '#000000'],
      'Time Delay': [TYPES.MilliSec, 0],
    },
  }
}

const HEXAGON = {
  ALL: [],
};

CornerLocation.forEach(CL => {
  HEXAGON[CL] = {
    ALL: [],
  };

  SideLocation.forEach(SL => {
    switch (CL) {
      case 'CL_LB':
      case 'CL_MT':
      case 'CL_RB': {
        if (SL == 'SL_BOTTOM') return;
        break;
      }
      default: {
        if (SL == 'SL_TOP') return;
        break;
      }
    }

    HEXAGON[CL][SL] = new Array(27);
    for (i = 0; i < HEXAGON[CL][SL].length; i++) {
      HEXAGON[CL][SL][i] = new LEDColor();
      HEXAGON.ALL.push(HEXAGON[CL][SL][i]);
      HEXAGON[CL].ALL.push(HEXAGON[CL][SL][i]);
    }
  });
});
