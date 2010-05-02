// Copyright(c) Wenzhang Zhu.
// All rights reserved. 2010.

var chromeVersion = {
  version: [0, 0, 0, 0],
  getVersion: function() {
    var match = navigator.userAgent.match(/Chrome\/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      this.version[0] = parseInt(match[1]);
      this.version[1] = parseInt(match[2]);
      this.version[2] = parseInt(match[3]);
      this.version[3] = parseInt(match[4]);
    }
  },

  // Checks if it is larger or equal to given version.
  isLargerThanOrEqual: function(ver_to_check) {
    var larger_or_equal = true;
    if (this.version[0] == 0) {
      this.getVersion();
    }
    for (i = 0; i < 4; ++i) {
      if (this.version[i] > ver_to_check[i]) {
	break;
      } else if (this.version[i] < ver_to_check[i]) {
        larger_or_equal = false;
        break;
      }
    }
    return larger_or_equal;
  }
};

var local_options = {};
function Canvas() {
  this.html_canvas = document.createElement("canvas");
  this.ctx = this.html_canvas.getContext("2d");
  this.setCanvasStyle = function (stroke_style, fill_style, line_width) {
    this.html_canvas.setAttribute("width", window.innerWidth + "px");
    this.html_canvas.setAttribute("height", window.innerHeight + "px");
    this.html_canvas.setAttribute(
        "style", "z-index:100;position:fixed" +
        ";top:0px;left:0px");
    this.ctx.fillStyle = fill_style;
    this.ctx.strokeStyle = stroke_style;
    this.ctx.lineWidth = line_width;
    this.ctx.save();
  };

  this.showCanvas = function (x, y, parent_node) {
    if (!parent_node) {
      return;
    }
    if (parent_node.lastChild != this.html_canvas) {
      parent_node.appendChild(this.html_canvas);
      this.setCanvasStyle("blue", "white", 5);
    }
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  };

  this.showLineTo = function (x, y, stop) {
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    if (!stop) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
    }
  };

  this.hasCanvas = function() {
    return (this.html_canvas.parentNode &&
	    this.html_canvas.parentNode.lastChild == this.html_canvas);
  }

  this.hideCanvas = function() {
    if (this.html_canvas.parentNode &&
        this.html_canvas.parentNode.lastChild == this.html_canvas) {
      this.html_canvas.parentNode.removeChild(this.html_canvas);
    }
  };
}

var gesture = {
  in_gesture: false,
  seq: "",  // Gesture sequence
  last_pos: {x: -1, y: -1},  // Last mouse position
  start_time: 0,
  beginGesture: function(e) {
    this.in_gesture = true;
    this.seq = "";
    this.last_pos = {x: e.clientX, y:e.clientY};
    this.start_time = new Date().getTime();
    return false;
  },
  canvas: new Canvas(),

  moveGesture: function(e) {
    if (!this.in_gesture) {
      return true;
    }
    if (new Date().getTime() - this.start_time < 300) {
      // Wait for dragStart before some us time passes.
      return true;
    }
    var range = null;
    if (window.getSelection().rangeCount > 0) {
      range = window.getSelection().getRangeAt(0);
    }
    if (!this.canvas.hasCanvas() && range &&
	range.startContainer == range.endContainer &&
	(range.startContainer.nodeName == "#text" &&
	 range.startOffset < range.startContainer.length &&
	 range.endOffset < range.endContainer.length ||
	 range.startOffset == range.endOffset)) {
      this.cancelGesture(e);
      return true;
    }
    this.canvas.showCanvas(this.last_pos.x, this.last_pos.y, document.body);
    this.collectGestures(e);
    window.getSelection().empty();
    this.canvas.showLineTo(this.last_pos.x, this.last_pos.y, false);
    return false;
  },

  collectGestures: function(e) {
    if (this.last_pos.x < 0 || this.last_pos.y < 0) {
      this.last_pos = {x:e.clientX, y:e.clientY};
    } else {
      var dx = e.clientX - this.last_pos.x;
      var dy = e.clientY - this.last_pos.y;
      if (dx * dx + dy * dy < 256) {
        // Ignore short distance.
        return false;
      }
      var new_gesture;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          new_gesture = "R";
        } else {
          new_gesture = "L";
        }
      } else {
        if (dy > 0) {
          new_gesture = "D";
        } else {
          new_gesture = "U";
        }
      }
      if (this.seq.length <=0 ||
          this.seq.substr(this.seq.length - 1, 1) != new_gesture) {
        this.seq = this.seq + new_gesture;
      }
    }
    this.last_pos = {x:e.clientX, y:e.clientY};
    return false;
  },

  endGesture: function(e) {
    if (!this.in_gesture) {
      return true;
    }
    this.in_gesture = false;
    this.collectGestures(e);
    if (this.seq != "") {
      this.canvas.showLineTo(this.last_pos.x, this.last_pos.y, true);
      if (this.takeAction(this.seq)) {
        window.getSelection().empty();
      }
      this.seq = "";
      this.canvas.hideCanvas();
      if (e.preventDefault) {
        e.preventDefault ();
      }
    }
    document.removeEventListener('mousemove', mouseMove, false);
    this.last_pos = {x: -1, y: -1};
    return false;
  },

  cancelGesture: function(e) {
    this.in_gesture = false;
    this.canvas.hideCanvas();
  },

  takeAction: function(seq) {
    if (this.seq == "L") {
      history.back();
    } else if (this.seq == "R") {
      history.forward();
    } else if (this.seq == "U") {
      window.scrollBy(0, -window.innerHeight * 4 / 5);
    } else if (this.seq == "D") {
      window.scrollBy(0, window.innerHeight * 4 / 5);
    } else if (this.seq == "DR") {
      window.open('', '_self', '');
      window.close();
    } else if (this.seq == "UD") {
      location.reload(true);
    } else {
      return false;
    }
    return true;
  }
};

var drag_and_go = {
  in_drag: false,
  drag_selection: {type: "text", data: ""},
  start_x: -1,
  start_y: -1,

  // Extract the link from the given text if any.
  // Otherwise return empty string.
  getTextLink: function(text) {
    var re = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([-\w\/_~\.,#%=\*:]*(\?\S+)?)?)?/;
    var re2 = /www\.[-\w\.]+(\/[\S]*)*/;
    var link = "";
    var matches = text.match(re);
    if (matches) {
      link = matches[0];
    } else {
      matches = text.match(re2);
      if (matches) {
        link = "http://" + matches[0];
      }
    }
    return link;
  },

  getDragSelection: function(e) {
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
  },

  dragStart: function(e) {
    if (local_options["alt_key"] == "true" && e.altKey ||
        local_options["ctrl_key"] == "true" && e.ctrlKey) {
      return true;
    }
    this.in_drag = true;
    this.start_x = e.clientX;
    this.start_y = e.clientY;
    this.drag_selection = this.getDragSelection(e);
    if (this.drag_selection.type == "text") {
      var link = this.getTextLink(this.drag_selection.data);
      if (link != "") {
        this.drag_selection.type = "link";
        this.drag_selection.data = link;
      } else {
        return true;
      }
    }
    return false;
  },

  dragOver: function(e) {
    if (!this.in_drag) {
      return true;
    }
    if (e.preventDefault) {
      e.preventDefault ();
    }
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.dropEffect = "copy";
    return false;
  },

  drop: function(e) {
    if (!this.in_drag) {
      return true;
    }
    this.in_drag = false;
    var d = local_options["restricted_distance"];
    if (d >= 100) {
      d = 99;
    }
    if ((e.clientX - this.start_x) * (e.clientX - this.start_x) +
        (e.clientY - this.start_y) * (e.clientY - this.start_y) < d * d) {
      // If the drag distrance is too small (within 16 pixels from
      // the starting point), then no go action.
      return true;
    }
    var x_dir = 1;
    if (e.preventDefault) {
      e.preventDefault ();
    }
    if (e.clientX < this.start_x) {
      x_dir = -1;
    }
    var y_dir = 1;
    if (e.clientY < this.start_y) {
      y_dir = -1;
    }
    this.start_x = -1;
    this.start_y = -1;
    if (this.drag_selection.data) {
      chrome.extension.connect().postMessage({
        message: 'drag_and_go', selection: this.drag_selection,
        x_dir: x_dir, y_dir: y_dir});
      return false;
    }
    return true;
  },

  dragEnd: function(e) {
    this.in_drag = false;
  }
};

function dragStart(e) {
  gesture.cancelGesture(e);
  return drag_and_go.dragStart(e);
}

function dragOver(e) {
  return drag_and_go.dragOver(e);
}

function dragEnd(e) {
  if (!chromeVersion.isLargerThanOrEqual([5, 0, 371, 0]) &&
    chromeVersion.isLargerThanOrEqual([4, 1, 249, 0])) {
    return drag_and_go.drop(e);
  }
  return drag_and_go.dragEnd(e);
}

function drop(e) {
  if (!chromeVersion.isLargerThanOrEqual([5, 0, 371, 0]) &&
      chromeVersion.isLargerThanOrEqual([4, 1, 249, 0])) {
    if (e.dataTransfer.dropEffect == "copy") {
      return drag_and_go.drop(e);
    }
    return true;
  }
  return drag_and_go.drop(e);
}

function mouseDown(e) {
  var use_gesture = local_options["enable_gesture"] == "true";
  if (use_gesture && !e.ctrlKey && !e.altKey &&
      e.clientX + 20 < window.innerWidth &&
      e.clientY + 20 < window.innerHeight &&
      !gesture.in_gesture) {
    document.addEventListener('mousemove', mouseMove, false);
    return gesture.beginGesture(e);
  } else {
    gesture.cancelGesture(e);
    return true;
  }
}

function mouseUp(e) {
  var use_gesture = local_options["enable_gesture"] == "true";
  if (use_gesture) {
    return gesture.endGesture(e);
  }
}

function mouseMove(e) {
  var use_gesture = local_options["enable_gesture"] == "true";
  if (!drag_and_go.in_drag && use_gesture) {
    return gesture.moveGesture(e);
  }
  document.removeEventListener('mousemove', mouseMove, false);
  return true;
}

document.addEventListener('dragstart', dragStart, false);
document.addEventListener('dragover', dragOver, false);
if (!chromeVersion.isLargerThanOrEqual([5, 0, 371, 0]) &&
    chromeVersion.isLargerThanOrEqual([4, 1, 249, 0])) {
  document.addEventListener('dragend', drop, false);
} else {
  document.addEventListener('drop', drop, false);
  document.addEventListener('dragend', dragEnd, false);
}
document.addEventListener('mousedown', mouseDown, false);
document.addEventListener('mouseup', mouseUp, false);

chrome.extension.sendRequest({message: 'get_options'}, function(response) {
  local_options = response;
});
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.message == "set_options") {
      local_options = request.options;
    }
  });
