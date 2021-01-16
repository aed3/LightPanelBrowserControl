class ShapeCollection {
  Hexagon = [];
  TriPanel = [];
  PanelSegment = [];
  LED = [];
}

const currentSelectionHTML = new ShapeCollection();

const currentSelection = new ShapeCollection();

let currentPanelSides = [];

function addCurrentSelection(level, $element, location) {
  $element.attr('selected', true);

  if (currentSelectionHTML.Hexagon.length && level == 'TriPanel') {
    currentSelectionHTML.Hexagon.forEach(hex => hex.removeAttr('selected'));
    currentSelectionHTML.Hexagon = [];
  }
  else if (currentSelectionHTML.TriPanel.length && level == 'PanelSegment') {
    currentSelectionHTML.TriPanel.forEach(tp => tp.removeAttr('selected'));
    currentSelectionHTML.TriPanel = [];
  }
  else if (currentSelectionHTML.PanelSegment.length && level == 'LED') {
    currentSelectionHTML.PanelSegment.forEach(ps => ps.removeAttr('selected'));
    currentSelectionHTML.PanelSegment = [];
  }

  currentSelectionHTML[level].push($element);
  if (level != 'Hexagon' && location) {
    currentSelection[level].push(location);
  }
  else if (level == 'Hexagon') {
    currentSelection[level].push(1);
  }
}

function removeCurrentSelection(level, $element, location) {
  $element.removeAttr('selected');

  currentSelectionHTML[level] = currentSelectionHTML[level]
    .filter($selected => $selected.attr('id') != $element.attr('id'));

  if (level != 'Hexagon' && location) {
    currentSelection[level] = currentSelection[level]
      .filter(selected => selected != location);
  }
  else if (level == 'Hexagon') {
    currentSelection[level] = [];
  }

  if (level == 'TriPanel' && !currentSelectionHTML.TriPanel.length) {
    addCurrentSelection('Hexagon', $('#Hexagon'));
  }
  else if (level == 'PanelSegment' && !currentSelectionHTML.PanelSegment.length) {
    addCurrentSelection('TriPanel', $('#tri-panel'));
    $('#tri-panel').children().css('opacity', 1);
  }
  else if (level == 'LED' && !currentSelectionHTML.LED.length) {
    addCurrentSelection('PanelSegment', $(`[name=${currentSelection.PanelSegment[0]}]`));
  }
}


