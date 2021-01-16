function changePanelSegementGradient(SL, colorList) {
  const $segmentGrad = $('#line-' + $(`[name=${SL}]`).attr('id')[0]);

  $segmentGrad.empty();
  colorList.forEach((color, i) => {
    const stop = `<stop offset=${100 * i / colorList.length}% \
      stop-color="${color.colorCode}" />`;
  
    $segmentGrad.html($segmentGrad.html() + stop);
  });
}

function changePanelSegementColor(panel, colorList, update = true) {
  const CL = currentSelection.TriPanel[0];
  const SL = $(`#${panel}-segment`).attr('name');
  const list2Light = HEXAGON[CL][SL].length / colorList.length;
  changePanelSegementGradient(SL, colorList);

  if (update && colorList.length == 1 && !currentSelection.LED.length) {
    send('Set Color', {level: 'PanelSegment', location: {CL, SL}}, {Color: colorList[0]});
  }

  colorList.forEach((color, i) => {
    for (let n = i * list2Light; n < (i + 1) * list2Light; n++) {
      const updateColor = update && 
        colorList.length > 1 &&
        HEXAGON[CL][SL][n].value != color.value;

      HEXAGON[CL][SL][n].set(color);
      if (updateColor) {
        send('Set Color', {level: 'PanelSegment', location: {CL, SL, LED: n}}, {Color: color});
      }
    }
  });
}

function changeAllPanelSegmentColor(colorList) {
  changePanelSegementColor('0', colorList, false);
  changePanelSegementColor('1', colorList, false);
  changePanelSegementColor('2', colorList, false);

  const CL = currentSelection.TriPanel[0];
  sendCollectiveColor('PanelSegment', 
    currentPanelSides.map(SL => {
      return {
        SL,
        CL,
      }
    }),
    colorList[0]);
}

function resetAllPanelSegmentColor(CL, aSL, bSL, cSL) {
  $('#0-segment').attr('name', aSL);
  $('#1-segment').attr('name', bSL);
  $('#2-segment').attr('name', cSL);
  changePanelSegementGradient(aSL, HEXAGON[CL][aSL]);
  changePanelSegementGradient(bSL, HEXAGON[CL][bSL]);
  changePanelSegementGradient(cSL, HEXAGON[CL][cSL]);

  currentPanelSides = [aSL, bSL, cSL];
}

function selectLED($this) {
  $this.css('transition', ANI_SPEED / 1000 + 's');
  addCurrentSelection('LED', $this, $this.text());

  $this.one('click', () =>
    unselectLED($this));

  $('#more-color-options .brightness-inputs').css('opacity', 0.25);
  $('#more-color-options .brightness-inputs input').attr('disabled', true);

  setTimeout(() => {
    $this.css('transition', '');
  }, ANI_SPEED);
}

function unselectLED($this) {
  $this.css('transition', ANI_SPEED / 1000 + 's');
  removeCurrentSelection('LED', $this, $this.text());

  $this.one('click', () =>
    selectLED($this));

  setTimeout(() => {
    $this.css('transition', '');
  }, ANI_SPEED);
}

function selectPanelSegment($this) {
  $this.css('opacity', 1);
  $this.off('click');

  currentSelectionHTML.LED.forEach(LED =>
    unselectLED(LED));
 
  addCurrentSelection('PanelSegment', $this, $this.attr('name'));
  $this.siblings('polygon:not([selected])').css('opacity', 0.5);

  if (currentSelectionHTML.PanelSegment.length == 1) {
    changePresetList('PanelSegment');
  }
  else if (currentSelectionHTML.PanelSegment.length == 2) {
   changePresetList('TriPanel');
  }

  $this.siblings(`[href="#${$this.attr('id')}"]`).fadeIn(ANI_SPEED);

  $('#more-color-options .brightness-inputs').css('opacity', 0.25);
  $('#more-color-options .brightness-inputs input').attr('disabled', true);

  $this.one('click', () =>
    unselectPanelSegment($this));
}

function unselectPanelSegment($this) {
  $('.LED[selected]').each(function () {
    unselectLED($(this));
  });
  $this.off('click');
  removeCurrentSelection('PanelSegment', $this, $this.attr('name'));

  $this.one('click', () => selectPanelSegment($this));

  switch (currentSelectionHTML.PanelSegment.length) {
    case 1: {
      changePresetList('PanelSegment');
      break;
    }
    case 0:
      $('#more-color-options .brightness-inputs').css('opacity', 1);
      $('#more-color-options .brightness-inputs input').removeAttr('disabled');
    case 2: {
      changePresetList('TriPanel');
      break;
    }
  }

  if (currentSelectionHTML.PanelSegment.length) {
    $this.css('opacity', 0.5);
  }

  $this.siblings(`[href="#${$this.attr('id')}"]`).fadeOut(ANI_SPEED);
}

function selectTriPanel($this) {
  const CL = $this.attr('id');
  let tx = 15;
  let ty = 15;

  switch (CL) {
    case 'CL_LT':
    case 'CL_MT':
    case 'CL_RT':
      ty *= -1;
  }

  switch (CL) {
    case 'CL_LT':
    case 'CL_LB': {
      tx *= -1;
      break;
    }
    case 'CL_MT':
    case 'CL_MB': {
      tx = 0;
      break;
    }
  }

  addCurrentSelection('TriPanel', $this, CL);
  $this.css('transform', `scale(1.15) translateX(${tx}px) translateY(${ty}px)`);
  doubleClick($this, unselectTriPanel, openTriPanel);

  $('#more-color-options .brightness-inputs').css('opacity', 1);
  $('#more-color-options .brightness-inputs input').removeAttr('disabled');
}

function unselectTriPanel($this) {
  $this.css('transform', 'scale(1)');
  removeCurrentSelection('TriPanel', $this, $this.attr('id'));
  $this.off('click');
  $this.one('click', () => selectTriPanel($this));
}

function openTriPanel($panel) {
  const $tripanel = $('#tri-panel');
  const $hexagon = $('#Hexagon');
  const CL = $panel.attr('id');

  $panel.css('opacity', 0);
  $panel.css('transition', '');

  $tripanel.width($panel.width() * 1.15);
  $tripanel.height($panel.height() * 1.15);
  $tripanel.css('top', $panel.offset().top);
  $tripanel.css('left', $panel.offset().left);
  $tripanel.css('display', 'block');
  $tripanel.attr('name', CL);
  
  switch (CL) {
    case 'CL_LB':
    case 'CL_MT':
    case 'CL_RB': {
      $tripanel.css('transform', 'rotate(180deg)');
      resetAllPanelSegmentColor(CL, 'SL_LEFT', 'SL_TOP', 'SL_RIGHT');
      break;
    }
    default: {
      $tripanel.css('transform', '');
      resetAllPanelSegmentColor(CL, 'SL_RIGHT', 'SL_BOTTOM', 'SL_LEFT');
      break;
    }
  }

  changePresetList('TriPanel');
  doubleClick($('#tri-panel rect'), null, closeTriPanel);
  $panel.off('click');

  $hexagon.css('opacity', 0);
  $hexagon.css('transition', ANI_SPEED / 1000 + 's');

  setTimeout(() => {
    $tripanel.css('transition', ANI_SPEED / 1000 + 's');
  
    $tripanel.width($hexagon.width());
    $tripanel.height($hexagon.height());
    $tripanel.css('top', $hexagon.offset().top);
    $tripanel.css('left', $hexagon.offset().left);
  }, ANI_SPEED / 20);

  setTimeout(() => {
    $hexagon.css('visibility', 'hidden');
    $hexagon.css('transition', '');
    $tripanel.css('transition', '');
    
    $panel.css('opacity', 1);
  }, ANI_SPEED);

  $(`.TriPanel[selected]:not(#${CL})`).each(function () {
    unselectTriPanel($(this));
  });

  currentSelectionHTML.Hexagon = [];
  currentSelectionHTML.TriPanel = [$tripanel];

  currentSelection.Hexagon = [];
  currentSelection.TriPanel = [CL];
}

function closeTriPanel() {
  if (currentSelectionHTML.PanelSegment.length ||
    currentSelectionHTML.LED.length) {
    $('.PanelSegment[selected]').each(function () {
      unselectPanelSegment($(this));
    });
    if ($('.LED[selected]').length) {
      unselectPanelSegment($(`[name=${currentSelection.PanelSegment[0]}]`));
    }
    return;
  }

  const $tripanel = $('#tri-panel');
  const $hexagon = $('#Hexagon');
  const $panel = $('#' + $tripanel.attr('name'));

  $panel.css('opacity', 0);

  $tripanel.css('transition', ANI_SPEED / 1000 + 's');
  $tripanel.width($panel.width() * 1.15);
  $tripanel.height($panel.height() * 1.15);
  $tripanel.css('top', $panel.offset().top);
  $tripanel.css('left', $panel.offset().left);
  
  $hexagon.css('transition', ANI_SPEED / 1000 + 's');
  $hexagon.css('opacity', 1);
  $hexagon.css('visibility', 'initial');

  changePresetList('Hexagon');
  $('#tri-panel rect').off('click');

  setTimeout(() => {
    $tripanel.fadeOut();
    $hexagon.css('transition', '');
    $panel.css('opacity', 1);
  }, ANI_SPEED);

  const panelColor = HEXAGON[$panel.attr('id')].ALL[0];
  currentSelectionHTML.Hexagon = [];
  currentSelectionHTML.TriPanel = [];
  currentSelection.Hexagon = [1];

  selectTriPanel($panel);
  $panel.children('polygon').css('fill', panelColor.colorCode);
  updateChosenColor({r: panelColor.r, g: panelColor.g, b: panelColor.b}, 'changeLevel');
}

