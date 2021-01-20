let presetChangeTimeout = 0;

function changePresetList(level) {
  $('.preset, #LED-holder').each(function() {
    $(this).fadeOut(ANI_SPEED, 'swing', () => $(this).remove());
  });

  clearTimeout(presetChangeTimeout);
  presetChangeTimeout = setTimeout(() => {
    if (level == 'PanelSegment') {
      const CL = currentSelection.TriPanel[0];
      const SL = currentSelection.PanelSegment[0];
      const $LEDHolder = $(`<div id="LED-holder"></div>`);

      for (const LED in HEXAGON[CL][SL]) {
        const $LED = $(`<div id="${LED}-LED" class="LED">${LED}</div>`);
        $LED.css('background-color', HEXAGON[CL][SL][LED].colorCode);
        $LED.one('click', () => 
          selectLED($LED));
        $LEDHolder.append($LED);
      }

      $('#presets').append($LEDHolder);
    }
    else {
      const presetList = Object.entries(presets[level]);
      if (level == 'Hexagon') {
        presetList.push(['Match TV', 1]);
      }
      presetList.forEach(([name, details]) => {
        const $preset = $(`<section class="preset" id="${name.replace(/ /g, '')}"> \
        <label><input type="checkbox"><span class="checkmark"></span></label> \
          <svg width="6" height="50" style="position: relative; top: 10px; left: 70px; display: block;"> \
            <polyline points="0,0 0,50" fill="none" stroke-linecap="round" stroke-width="6" stroke="#00aeef"> \
          </svg> \
          <div class="preset-name">${name}</div> \
        </section>`);
        
        $preset.hide();
        if (typeof details == 'object') {
          $preset.append('<button>Details</button>');
          $preset.children('button').click(() =>
            showDetails(details, level, name));
          $preset.find('input[type=checkbox]').change(function() {
            if (this.checked) {
              sendSelectedFunction(name, level);
              setTimeout(() => this.checked = false, 1000);
            }
          });
        }
        else {
          $preset.find('input[type=checkbox]').change(function() {
            if (!this.checked) {
              queueData(toBinaryStr((details << 2) + levelToNum(level), 7), 7, new Uint8Array(1));
            }
            else {
              queueData(toBinaryStr(((details ^ 31) << 2) + levelToNum(level), 7), 7, new Uint8Array(1));
            }
          });
        }

        $('#presets').append($preset);
        $preset.fadeIn(ANI_SPEED);
      });

      updatePresetFontSize();
      $('#presets').scrollTop(0);
    }
  },
  ANI_SPEED);
}

function sendSelectedFunction(name, level) {
  const sendParameters = {};
  Object.entries(presets[level][name]).forEach(([option, [, val]]) => {
    sendParameters[option] = val;
  });

  currentSelection[level].forEach(location => {
    if (level == 'TriPanel') {
      location = {CL: location};
    }
    else if (level == 'PanelSegment') {
      location = {
        CL: currentSelection.PanelSegment[0],
        SL: location,
      };
    }
    send(name, {level, location}, sendParameters);
  });
}

function updatePresetFontSize() {
  $('.preset-name').each(function() {
    const parentWidth = $(this).parent().width();
    const maxWidth = parentWidth - 170;
    $(this).width(maxWidth);
    let factor = 8;

    if ($(this).width() > maxWidth)  {
      $(this).attr('data-revert-width', parentWidth);
      $(this).attr('data-revert', true);
      factor = 3;
    }
    else if ($(this).attr('data-revert-width') < parentWidth) {
      $(this).removeAttr('data-revert-width');
      $(this).removeAttr('data-revert', true);
    }

    $(this).width(maxWidth / ($(this).attr('data-revert') ? 2 : 1));
  
    $(this).css('font-size', Math.max(Math.min($(this).width() / factor, 50), 28));
    $(this).css('top', 45 - $(this).height() / 2 - 12);
  });
}

function updatePresetsFade($presets) {
  const top = $presets.position().top;
  const height = $presets.height();
  const bottom = top + height;

  const topFadeStart = top + height * 0.2;
  const bottomFadeStart = bottom - height * 0.2;

  $presets.find('section, .LED').each(function() {
    const $section = $(this);
    const upperY = $section.offset().top;
    const lowerY = upperY + $section.height();
    
    if (upperY < top || lowerY > bottom) {
      $section.css('opacity', 0);
    }
    else if (upperY < topFadeStart) {
      $section.css('opacity', (upperY - top) / (topFadeStart - top));
    }
    else if (lowerY > bottomFadeStart) {
      $section.css('opacity', (bottom - lowerY) / (bottom - bottomFadeStart));
    }
    else {
      $section.css('opacity', 1);
    }
  });
}

function showDetails(options, level, name) {
  $('#modal h3').text(name);
  $('#modal .option').each(function() {
    $(this).remove();
  });
  const optionValues = {};

  Object.entries(options).forEach(([optionName, optionType]) => {
    const checkboxID = 'checkbox-' + optionName.replace(/ /g, '');
    const [type, defaultVal] = optionType;

    let $inputHTML = $('<input>');

    if (type == TYPES.LEDColor) {
      $inputHTML.attr('type', 'color');
      $inputHTML.attr('value', defaultVal);
    }
    else if (type == TYPES.CornerLocation ||
      type == TYPES.SideLocation || 
      type == TYPES.LoopDirection) {
      $inputHTML = $('<select></select>');
      $inputHTML.append(`<option value="${defaultVal}">${defaultVal}</option>`);
  
      type.dt.forEach(op => {
        if (op != defaultVal)
          $inputHTML.append(`<option value="${op}">${op}</option>`);
      });
    }
    else {
      $inputHTML.attr('type', 'number');
      $inputHTML.attr('pattern', 'pattern="\\d+"');
      $inputHTML.attr('placeholder', defaultVal);
      $inputHTML.attr('min', '0');
      $inputHTML.attr('max', 2 ** type.length);
    }

    $inputHTML.addClass('option-value');
    const $option = $(`<div class="option"> \
      <input class="change-option" id="${checkboxID}" type="checkbox"> \
      <div class="option-input"> \
        <div class="option-holder"> \
          ${$inputHTML[0].outerHTML} \
          <label class="apply-option-label" for="${checkboxID}"> \
            <button class="apply-option-button" type="button">Apply</button> \
          </label> \
          <label class="change-option-label" for="${checkboxID}">${optionName}</label> \
        </div> \
      </div> \
    </div>`);

    $option.find('input:not(.change-option), select').on('input', function() {
      let val = $(this).val();
      val = Number.parseInt(val) || val;

      presets[level][name][optionName][1] = val;
    });

    $('#modal').append($option);
    optionValues[optionName] = $option.find('.option-value');
  });

  $('#modal-holder').fadeIn(ANI_SPEED);

  $('#modal').mouseleave(() =>
    $('#modal-holder').on('click', () => $('#modal-holder').fadeOut(ANI_SPEED)));
  $('#modal').mouseenter (() =>
    $('#modal-holder').off('click'));
  $('#modal').mouseleave();

  $('#modal .apply-option-label').click((e) => {
    if ($(e.target).prev().length) {
      sendSelectedFunction(name, level);
      $(`#presets #${name} input[type=checkbox]`).prop('checked', true);
    }
  })
}


