const chosenColor = new LEDColor();

function changeShapeColors(sendColors = true) {
  const toSend = [];
  let allSameShapes = '';
  Object.entries(currentSelectionHTML)
    .forEach(([shape, selections]) =>
      selections.forEach($element => {
        const level = shape;
        let location;
        let cssAttr = 'fill';

        if ($element.is('#tri-panel')) {
          changeAllPanelSegmentColor([chosenColor]);
          return;
        }

        if (shape == 'PanelSegment') {
          const CL = currentSelection.TriPanel[0];
          const SL = currentPanelSides[$element.attr('id')[0]];

          location = { CL, SL };
          cssAttr = 'background-color';

          changePanelSegementColor($element.attr('id')[0], [chosenColor], false);
          $element = $('.LED');
        }
        else if (shape == 'LED') {
          const CL = currentSelection.TriPanel[0];
          const SL = currentSelection.PanelSegment[0];
          const LED = Number.parseInt($element.text());
          const segment = HEXAGON[CL][SL];

          location = { CL, SL, LED };
          cssAttr = 'background-color';

          segment[LED].set(chosenColor);
          changePanelSegementGradient(SL, segment);
        }
        else if (shape == 'TriPanel') {
          const CL = $element.attr('id');

          location = { CL };
          $element = $element.find('polygon');

          HEXAGON[CL].ALL.forEach(LED => LED.set(chosenColor));
        }
        else if (shape == 'Hexagon') {
          $element = $element.find('polygon');
          HEXAGON.ALL.forEach(LED => LED.set(chosenColor));
        }

        $element.css(cssAttr, chosenColor.colorCode);

        if (sendColors) {
          toSend.push({ level, location });
          allSameShapes = level == allSameShapes || !allSameShapes ? level : false;
        }
      })
    );

  if (allSameShapes && toSend.length > 1) {
    sendCollectiveColor(allSameShapes, 
      toSend.map(where => where.location), 
      chosenColor);
  }
  else {
    toSend.forEach(where =>
      send('Set Color', where, { Color: chosenColor }));
  }
}

function updateChosenColor({ r = chosenColor.r, g = chosenColor.g, b = chosenColor.b }, from) {
  const $mainSlider = $('#color-slider .circle');
  const $manualInputs = $('#color-slider #more-color-options');

  $mainSlider.children('circle')
    .css('fill', `rgb(${r}, ${g}, ${b})`);

  if (from != 'rgbSliders') {
    const $rgbSliders = $manualInputs.children('.slider-inputs');
    $rgbSliders.children('input[name=r]').val(r);
    $rgbSliders.children('input[name=g]').val(g);
    $rgbSliders.children('input[name=b]').val(b);
  }

  if (from != 'rgbNumbers') {
    const $rgbNumbers = $manualInputs.children('.number-inputs');
    $rgbNumbers.children('input[name=r]').val(r);
    $rgbNumbers.children('input[name=g]').val(g);
    $rgbNumbers.children('input[name=b]').val(b);
  }

  if (from != 'circle') {
    const { h } = rgb2hsv(r, g, b);
    $mainSlider.css('left', $('#color-slider .bar rect').width() *
      (h / 360 * 0.95 + 0.05) -
      $mainSlider.width() / 2);
  }

  chosenColor.rgb(r, g, b);

  if (from != 'changeLevel') {
    changeShapeColors(true);
  }
}

function setBrightness(Brightness) {
  Object.entries(currentSelectionHTML)
    .forEach(([shape, selections]) =>
      selections.forEach($element => {
        let level;
        let location;

        if (shape == 'TriPanel') {
          const CL = $element.attr('id');
          level = 'TriPanel';
          location = { CL };
        }
        else if (shape == 'Hexagon') {
          level = 'Hexagon';
        }
        else {
          return;
        }

        send('Set Brightness', { level, location }, { Brightness });
      })
    );
}

function moveColorPicker(event, $circle) {
  if (!$circle) {
    $circle = $('#color-slider .circle');
    const $innerCircle = $circle.children('circle');

    document.onmousemove = document.ontouchmove = (e) =>
      moveColorPicker(e, $circle);

    document.onmouseup = document.ontouchend = () => {
      document.onmouseup = document.ontouchend = null;
      document.onmousemove = document.ontouchmove = null;
      changeShapeColors(true);

      $circle.animate({
        width: 52,
        height: 52,
        top: -5,
        left: Number($circle.css('left').replace('px', '')) + 5
      }, ANI_SPEED);
      $innerCircle.animate({ cx: 26, cy: 26, r: 24 }, ANI_SPEED);
      $innerCircle.css('fill', 'none');
    };

    $circle.animate({ width: 62, height: 62, top: -10 }, ANI_SPEED);
    $innerCircle.animate({ cx: 31, cy: 31, r: 29 }, ANI_SPEED);
  }

  const $bar = $circle.prev();
  const barWidth = $bar.children('rect').width();
  const userPosition = event.type.startsWith('mouse') ? event : event.touches[0];
  const percent = Math.max(
    0,
    Math.min(1, (userPosition.clientX - $bar.position().left) / barWidth)
  );

  $circle.css('left', barWidth * percent - $circle.width() / 2);

  const color = { r: 0, g: 0, b: 0 };
  if (percent < 0.05) {
    color.r = 255;
    color.g = color.b = Math.round(255 * ((0.05 - percent) / 0.05));
  }
  else {
    const { r, g, b } = hsv2rgb((percent - 0.05) / 0.95 * 359);
    color.r = r;
    color.g = g;
    color.b = b;
  }

  updateChosenColor(color, 'circle');
}

function toggleMoreColorOptions() {
  const $manualInputs = $('#color-slider #more-color-options');
  if ($manualInputs.css('display') == 'none') {
    $manualInputs.slideDown(ANI_SPEED);
    $('#color-slider .more').animate({
      top: 210
    }, ANI_SPEED);

    for (let i = 1; i <= 10; i++) {
      setTimeout(() =>
        $('#color-slider .more polyline')
          .attr('points', `15,${7 + i} 25,${17 - i} 35,${7 + i}`),
        i * ANI_SPEED / 10);
    }
  }
  else {
    $manualInputs.slideUp(ANI_SPEED);
    $('#color-slider .more').animate({ top: 35 }, ANI_SPEED);

    for (let i = 1; i <= 10; i++) {
      setTimeout(() =>
        $('#color-slider .more polyline')
          .attr('points', `15,${17 - i} 25,${7 + i} 35,${17 - i}`),
        i * ANI_SPEED / 10);
    }
  }
}

function changeColorManual(input, from) {
  const changedColor = {};
  changedColor[input.name] = Number(input.value);
  updateChosenColor(changedColor, from);
}
