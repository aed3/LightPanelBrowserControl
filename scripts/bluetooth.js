const BTDeviceUUID = '00000000-0000-0000-0000-000000000000';
const WriteUUID = '00000000-0000-0000-0000-000000000001';

let BTDevice;
let WriteChar;

const sendQueue = [];
let sendInterval = 0;

const requiredBitsLength = 7;

function levelToNum(level) {
  switch (level) {
    case 'Hexagon': {
      return 0;
    }
    case 'TriPanel': {
      return 1;
    }
    case 'PanelSegment': {
      return 2;
    }
    case 'LED': {
      return 3;
    }
  }
}

function fnName2Num(level, fnName) {
  return Object.keys(presets[level]).indexOf(fnName);
}

function local2Num(where) {
  let CL = 0, 
    SL = 0, 
    LED = 0,
    localBits = 0;

  switch (where.level) {
    case 3:
    case 'LED':
      LED = where.location.LED;
      localBits += 7;
    case 2:
    case 'PanelSegment':
      SL = SideLocation.indexOf(where.location.SL);
      localBits += TYPES.SideLocation.length;
    case 1:
    case 'TriPanel':
      CL = CornerLocation.indexOf(where.location.CL);
      localBits += TYPES.CornerLocation.length;
  }

  return {CL, SL, LED, localBits};
}

function requiredBits(fnName, where) {
  const level = levelToNum(where.level);
  const arduinoFn = fnName2Num(where.level, fnName);
  const {CL, SL, LED, localBits} = local2Num(where);

  const firstBits = (LED << 12) + (SL << 10) + (CL << 7) + (arduinoFn << 2) + level;

  return {firstBits, localBits};
}

function standardSendStart(fnName, where) {
  const {firstBits, localBits} = requiredBits(fnName, where);
  const levelFunctionList = presets[where.level][fnName];
  const extraBitCount = Object.values(levelFunctionList)
    .reduce((total, [bitCount]) => {
      return total + bitCount.length;
    }, 0);

  return {firstBits, extraBitCount, localBits};
}

function paramToNumber(val, [type, defaultVal]) {
  const valBitLength = type.length;

  if (val == undefined) {
    val = defaultVal;
  }
  
  switch (type) {
    case TYPES.LEDColor: {
      if (typeof val == 'number') {
        break;
      }

      const color = new LEDColor();
      if (val instanceof LEDColor) {
        color.set(val);
      }
      else if (typeof val == 'string') {
        color.hex(val);
      }

      val = color.value;
      break;
    }
    case (TYPES.CornerLocation):
    case (TYPES.SideLocation): 
    case (TYPES.LoopDirection):{
      val = type.dt.indexOf(val);
      break;
    }
  }

  return {val, valBitLength};
}

function queueData(binary, bitCount, data) {
  for (let i = 0; i < data.length; i++) {
    const normalStart = bitCount - 8 * (i + 1);
    const start = Math.max(0, normalStart);
    const length = 8 + Math.min(0, normalStart);
    data[i] = Number.parseInt(binary.substr(start, length), 2);
  }

  if (sendQueue.length) {
    if (sendQueue.length == 10) {
      sendQueue.shift();
    }
  }
  else {
    sendInterval = setInterval(() => {
      if (!sendQueue.length) {
        clearInterval(sendInterval);
        return;
      }
      WriteChar.writeValue(sendQueue.shift());
    }, 1);
  }

  sendQueue.push(data);
}

function toBinaryStr(num, length) {
  return num.toString(2).padStart(length, 0);
}

function sendCollectiveColor(level, locals, color) {
  const levelNum = levelToNum(level);
  const {CL, SL, LED, localBits} = local2Num({level: levelNum - 1, location: locals[0]});

  const firstBits = (LED << 12) + (SL << 10) + (CL << 7) + (0b11111 << 2) + levelNum;
  const {val: colorBits, valBitLength: colorBitLength} =
    paramToNumber(color, [TYPES.LEDColor, '#000000']);

  let shapesChosenBits = 0;
  let localVarient = '';
  let extraBits = 0;
  let arrayForIndex;

  switch (level) {
    case 'TriPanel': {
      localVarient = 'CL';
      extraBits = 6;
      arrayForIndex = CornerLocation;
      break;
    }
    case 'PanelSegment': {
      localVarient = 'SL';
      extraBits = 4;
      arrayForIndex = SideLocation;
      break;
    }
    case 'LED': {
      localVarient = 'LED';
      extraBits = 28;
      break;
    }
  }

  locals.forEach(location => {
    let index = 0;
    if (arrayForIndex) {
      index = arrayForIndex.indexOf(location[localVarient]);
    }
    else {
      index = location[localVarient];
    }
    shapesChosenBits += 1 << index;
  });

  const bitCount = (requiredBitsLength + localBits + extraBits + colorBitLength);
  const data = new Uint8Array(Math.ceil(bitCount / 8));

  const finalValue = toBinaryStr(shapesChosenBits, extraBits) +
    toBinaryStr(colorBits, colorBitLength) +
    toBinaryStr(firstBits, requiredBitsLength + localBits);

  queueData(finalValue, bitCount, data);
}

function send(fnName, where, params) {
  const {firstBits, extraBitCount, localBits} =
    standardSendStart(fnName, where);
  const bitCount = requiredBitsLength + extraBitCount + localBits;
  const data = new Uint8Array(Math.ceil(bitCount / 8));

  let paramBits = '';
  Object.entries(presets[where.level][fnName])
    .forEach(([name, details]) => {
      const {val, valBitLength} = paramToNumber(params[name], details);
      paramBits = toBinaryStr(val, valBitLength) + paramBits;
    });

  const finalValue = paramBits + toBinaryStr(firstBits, requiredBitsLength + localBits);

  queueData(finalValue, bitCount, data);
}

function switchPower() {
  const data = new Uint8Array(1);
  WriteChar.writeValue(data);
}

function resetPower() {
  const data = new Uint8Array(1);
  data[0] = 255;
  WriteChar.writeValue(data);
}

function receive(event) {
  // console.log(event.target.value.getUint8());
}

function stopBT() {
  $('#title-screen').fadeIn(ANI_SPEED);
  $('#title-screen h3').html('Bluetooth device has been disconnected.</br>Try Connecting Again');
}

function startBT() {
  navigator.bluetooth.requestDevice({
    filters: [{
      name: 'Light_Lights'
    }],
    optionalServices: [BTDeviceUUID]
  })
  .then(device => {
    $('#title-screen h3').html(`<svg x="0px" y="0px" \ 
      viewBox="-20 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve" \
      style="width: 20vw; min-width: 200px"> \ 
      <circle fill="#fff" stroke="none" cx="6" cy="50" r="6"> \ 
        <animateTransform  \ 
          attributeName="transform"  \ 
          dur="1s"  \ 
          type="translate"  \ 
          values="0 15 ; 0 -15; 0 15"  \ 
          repeatCount="indefinite"  \ 
          begin="0.1"/> \ 
      </circle> \ 
      <circle fill="#fff" stroke="none" cx="30" cy="50" r="6"> \ 
        <animateTransform  \ 
          attributeName="transform"  \ 
          dur="1s"  \ 
          type="translate"  \ 
          values="0 10 ; 0 -10; 0 10"  \ 
          repeatCount="indefinite"  \ 
          begin="0.2"/> \ 
      </circle> \ 
      <circle fill="#fff" stroke="none" cx="54" cy="50" r="6"> \ 
        <animateTransform  \ 
          attributeName="transform"  \ 
          dur="1s"  \ 
          type="translate"  \ 
          values="0 5 ; 0 -5; 0 5"  \ 
          repeatCount="indefinite"  \ 
          begin="0.3"/> \ 
      </circle> \ 
    </svg>`);
    BTDevice = device;
    BTDevice.addEventListener('gattserverdisconnected', stopBT);
    return device.gatt.connect();
  })
  .then(server =>
    server.getPrimaryService(BTDeviceUUID))
  .then(service =>
    service.getCharacteristic(WriteUUID))
  .then(Tx => {
    WriteChar = Tx;
    
    $('#title-screen').fadeOut(ANI_SPEED);
    setTimeout(() => $('#title-screen h3').html(''), ANI_SPEED);
  })
  .catch(error =>
    $('#title-screen h3').text(error));
}
