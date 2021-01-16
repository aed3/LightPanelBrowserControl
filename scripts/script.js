const ANI_SPEED = 250;

$(document).ready(function () {
  $('#color-slider .bar, #color-slider .circle')
    .on('mousedown touchstart', moveColorPicker);

  $('#color-slider .more').click(toggleMoreColorOptions);

  $('#more-color-options .slider-inputs input')
    .on('input', (event) =>
    changeColorManual(event.target, 'rgbSliders'));

  $('#more-color-options .number-inputs input')
    .on('input', (event) =>
    changeColorManual(event.target, 'rgbNumbers'));

  $('#more-color-options .slider-inputs input,' +
    '#more-color-options .number-inputs input')
    .change(() => changeShapeColors());

  $('#more-color-options .brightness-inputs input')
    .change(function () {
      setBrightness(Math.round(this.value * 2.55));
    });

  $('#presets').scroll(function () {
    updatePresetsFade($(this));
  });

  $('#presets').scroll();

  $('#Hexagon').each(function() {
    addCurrentSelection('Hexagon', $(this));
  });

  $('.TriPanel:not([selected])').one('click', function() {
    selectTriPanel($(this));
  });

  $('.PanelSegment:not([selected])').one('click', function() {
    selectPanelSegment($(this));
  });

  changePresetList('Hexagon');

  doubleClick($('#power-button'), switchPower, resetPower, false);
});


$(window).on('load resize', function () {
  const windowWidth = Math.min(640, $(window).width());
  const hexagonWidth = windowWidth * 0.8;
  const triWidth = hexagonWidth / 2.2;
  const spaceBetweenTris = triWidth / 10;

  const $hexagon = $('#Hexagon');
  const $tripanel = $('#tri-panel');

  $hexagon.width(hexagonWidth);
  $hexagon.height(hexagonWidth * 0.9);
  $('#Hexagon svg').width(triWidth);
  $('#Hexagon svg').height(triWidth);

  $('#Hexagon svg').css('margin-right', (spaceBetweenTris - triWidth) / 2);
  $('#top-half').css('margin-bottom', -spaceBetweenTris);
  $('#bottom-half').css('margin-top', -spaceBetweenTris);
  
  $tripanel.width(hexagonWidth);
  $tripanel.height($hexagon.height());
  $tripanel.css('top', $hexagon.offset().top);
  $tripanel.css('left', $hexagon.offset().left);

  const $colorBar = $('#color-slider .bar');
  const $colorCircle = $('#color-slider .circle');
  const oldBarWidth = $colorBar.width();
  const circleWidth = $colorCircle.width();
  const sliderPercent = (
    $colorCircle.position().left +
    circleWidth / 2 -
    $colorBar.position().left
  ) / oldBarWidth;

  $('#color-slider, #color-slider .bar rect').width(hexagonWidth);
  $colorBar.width(hexagonWidth + 12);
  $colorCircle.css('left', $colorBar.width() * sliderPercent - circleWidth / 2);

  const $presets = $('#presets');
  const $manualInputs = $('#color-slider #more-color-options');
  $presets.width(hexagonWidth);
  $presets.css('margin-left', $hexagon.css('margin-left'));
  $presets.css('top', $('body').outerHeight() -
    ($manualInputs.css('display') == 'none' ? 0 : $manualInputs.outerHeight()) - 50);
  
  $('#presets').scrollTop(Math.max(0, $('#presets').scrollTop()));
  updatePresetFontSize();
});

