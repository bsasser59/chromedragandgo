function dragOver (e) {
  if (start_x == -1 || start_y == -1) {
    // The dragover event is from external, keep original action.
    return true;
  }
  if (e.preventDefault) {
    e.preventDefault ();
  }
  return false;
}

function dragStart(e) {
  start_x = e.screenX;
  start_y = e.screenY;
}

function getDragSelection(e) {
  var data;
  var data_type = "text";
  var selection = window.getSelection();
  var parent_node = e.srcElement.parentNode;
  while(parent_node && parent_node.nodeName != "A") {
    parent_node = parent_node.parentNode;
  }
  if (parent_node) {
    if (parent_node.href.substr(0, 11) != "javascript:") {
      data = parent_node.href;
    }
  } else if (e.srcElement.nodeName == "IMG") {
    data_type = "img";
    data = e.srcElement.src;
  } else {
    data = e.dataTransfer.getData('Text');
    if (!data) {
      data = selection.toString();
    }
  }
  return {"type": data_type, "data": data};
}

function dragEnd(e) {
  if (start_x == -1 || start_y == -1) {
    // The drop event is from external, keep original action.
    return true;
  }
  var x_dir = 1;
  if (e.preventDefault) {
    e.preventDefault ();
  }
  if (e.screenX < start_x) {
    x_dir = -1;
  }
  var y_dir = 1;
  if (e.screenY < start_y) {
    y_dir = -1;
  }
  start_x = -1;
  start_y = -1;
  var sel = getDragSelection(e);
  if (sel.data) {
    chrome.extension.connect().postMessage({
      message: 'drag_and_go', selection: sel, x_dir: x_dir, y_dir: y_dir});
    return false;
  }
  return true;
}
start_x = -1;
start_y = -1;
document.addEventListener('dragstart', dragStart, false);
document.addEventListener('dragover', dragOver, false);
document.addEventListener('drop', dragEnd, false);
document.addEventListener('dragend', dragEnd, false);
