'use strict';

// general stuff
var puzzleContainer;
var steps;
var moves;
var solved;
// puzzle props
var puzzleSize;
var nrPieces;
var originalPieces;

// GENERATE
function shuffle(pieces) {
  var move, index, newPieces;
  var shuffleSteps = parseInt($('#shuffle_steps').val());
  for (var i = 0; i < shuffleSteps; i++) {
    move = Math.floor(Math.random() * 4);
    for (var index = -1, j = 0; j < nrPieces && index == -1; j++) {
      if (pieces[j] == 0) index = j;
    }
    if (move == 0) {
      newPieces = findTop(pieces, index);
    } else if (move == 1) {
      newPieces = findBottom(pieces, index);
    } else if (move == 2) {
      newPieces = findLeft(pieces, index);
    } else if (move == 3) {
      newPieces = findRight(pieces, index);
    }
    if (newPieces != null) pieces = newPieces;
  }
  return pieces;
}

function shuffledArray(size) {
  for (var a = [], i = 0; i < size; ++i) a[i] = i + 1;
  a[size - 1] = 0;
  return shuffle(a);
}

function setPieceSize() {
  var pieces = $('.puzzle-piece');
  var size = 640 / puzzleSize;
  pieces.css('width', size);
  pieces.css('height', size);
  pieces.css('line-height', '' + size + 'px');
  pieces.css('font-size', '' + size / 3 + 'px');
}

function renderPuzzle(pieces) {
  clear();
  // render pieces
  for (var i = 0; i < nrPieces; i++) {
    if (pieces[i] != 0) {
      puzzleContainer.append(
        '<div class="puzzle-piece">' + pieces[i] + '</div>'
      );
    } else {
      puzzleContainer.append(
        '<div class="puzzle-piece puzzle-piece-blank">&nbsp</div>'
      );
    }
  }
  setPieceSize();
}

function updateStats() {
  $('#nr-pieces').html('' + nrPieces);
  $('#steps').html('' + steps);
  $('#moves').html('' + moves);
}

function clear() {
  $('#puzzle-container').html('');
}

function generate() {
  // set general stuff
  puzzleContainer = $('#puzzle-container');
  steps = 0;
  moves = 0;

  // set puzzle props
  puzzleSize = parseInt($('#puzzle_size').val());
  nrPieces = puzzleSize * puzzleSize;
  do {
    originalPieces = shuffledArray(nrPieces);
  } while (solved(originalPieces));

  // render
  updateStats();
  renderPuzzle(originalPieces);
}

// SOLVE
function Node(state, parent) {
  this.state = state;
  this.parent = parent;
  this.children = [];
}

function Path(state, parent, weight) {
  this.node = new Node(state, parent);
  this.weight = weight;
}

Node.prototype.add = function(state, weight) {
  this.children.push(new Path(state, this, weight));
};

Node.prototype.toString = function() {
  return this.state;
};

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (var i = arr1.length; i--; ) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function findTop(state, index) {
  var pieces = Array.from(state);
  var newIndex = index - puzzleSize;
  if (newIndex >= 0 && newIndex < nrPieces) {
    var temp = pieces[newIndex];
    pieces[newIndex] = pieces[index];
    pieces[index] = temp;
    return pieces;
  }
  return null;
}

function findBottom(state, index) {
  var pieces = Array.from(state);
  var newIndex = index + puzzleSize;
  if (newIndex >= 0 && newIndex < nrPieces) {
    var temp = pieces[newIndex];
    pieces[newIndex] = pieces[index];
    pieces[index] = temp;
    return pieces;
  }
  return null;
}

function onSameRow(i, j) {
  return Math.floor(i / puzzleSize) == Math.floor(j / puzzleSize);
}

function findLeft(state, index) {
  var pieces = Array.from(state);
  var newIndex = index - 1;
  if (onSameRow(index, newIndex)) {
    var temp = pieces[newIndex];
    pieces[newIndex] = pieces[index];
    pieces[index] = temp;
    return pieces;
  }
  return null;
}

function findRight(state, index) {
  var pieces = Array.from(state);
  var newIndex = index + 1;
  if (onSameRow(index, newIndex)) {
    var temp = pieces[newIndex];
    pieces[newIndex] = pieces[index];
    pieces[index] = temp;
    return pieces;
  }
  return null;
}

function nextSteps(pieces) {
  for (var blank = -1, i = 0; i < nrPieces && blank == -1; i++) {
    if (pieces[i] == 0) blank = i;
  }
  var states = [
    findTop(pieces, blank),
    findBottom(pieces, blank),
    findLeft(pieces, blank),
    findRight(pieces, blank)
  ];
  return states;
}

function solved(pieces) {
  if (pieces == null) return false;
  for (var i = 0; i < nrPieces - 1; i++) {
    if (pieces[i] != i + 1) return false;
  }
  return true;
}

function isPreviousState(state, root) {
  var queue = [root];
  var node;
  while (queue.length > 0) {
    // check first in queue
    node = queue.shift();
    //console.log('state: ' + state + ', previous: ' + node.state);
    if (arraysEqual(state, node.state)) return true;

    // add his children
    for (var i = 0; i < node.children.length; i++) {
      queue.push(node.children[i].node);
    }
  }
  return false;
}

// search short term memory
function isPreviousStateFromSTM(state, stm) {
  for (var i = 0; i < stm.length; i++) {
    if (arraysEqual(state, stm)) return true;
  }
  return false;
}

function solveBFS() {
  var root = new Node(originalPieces, new Node([], null));
  var queue = [root];
  var node = new Node([], null);
  var stm = [];
  var stmSize = nrPieces / 1.5;
  while (queue.length > 0 && !solved(node.state)) {
    // get first in queue
    node = queue.shift();
    console.log('current node: ' + node.state);
    //debugger;

    // generate possible moves, add them as children
    var states = nextSteps(node.state);
    for (var i = 0; i < states.length; i++) {
      if (
        states[i] != null &&
        !arraysEqual(states[i], node.parent.state) &&
        !isPreviousStateFromSTM(states[i], stm)
      ) {
        node.add(states[i], 1);
      }
    }

    // add children states to queue
    console.log('possible moves:');
    for (var i = 0; i < node.children.length; i++) {
      queue.push(node.children[i].node);
      if (stm.length == stmSize) stm.shift();
      stm.push(node.children[i].node.state);
      console.log(node.children[i].node.state);
    }

    steps = steps + 1;
    if (steps / stmSize > nrPieces * 100) stmSize = stmSize * puzzleSize * 1.2;
  }

  // render
  renderPuzzle(node.state);
  while (node.parent != null) {
    moves = moves + 1;
    node = node.parent;
  }
  updateStats();

  alert('Woo hooo! Always winning!');
}

function howFit(state) {
  var fitness = 0;
  var x, y;
  var sx, sy;
  for (var i = 0; i < state.length; i++) {
    if (state[i] != 0) {
      x = i % puzzleSize;
      y = Math.floor(i / puzzleSize);
      sx = (state[i] - 1) % puzzleSize;
      sy = Math.floor((state[i] - 1) / puzzleSize);
      fitness += Math.abs(x - sx) + Math.abs(y - sy);
      //fitness += Math.abs(i + 1 - state[i]);
    } else {
      //fitness += Math.abs(i + 1 - state.length);
    }
  }
  return fitness;
}

function solveGBFS() {
  var root = new Node(originalPieces, new Node([], null));
  var stack = [root];
  var node = new Node([], null);
  //var stm = [];
  //var stmSize = nrPieces / 1.5;
  while (stack.length > 0 && !solved(node.state)) {
    // get first in queue
    node = stack.pop();
    console.log('current node: ' + node.state);
    //debugger;

    if (!solved(node.state)) {
      // generate possible moves, add them as children
      var states = nextSteps(node.state);
      for (var i = 0; i < states.length; i++) {
        if (
          states[i] != null &&
          !arraysEqual(states[i], node.parent.state) &&
          !isPreviousState(states[i], root)
          //!isPreviousStateFromSTM(states[i], stm)
        ) {
          node.add(states[i], howFit(states[i]));
        }
      }

      var aux;
      for (var i = 0; i < node.children.length - 1; i++) {
        for (var j = i; j < node.children.length; j++) {
          if (node.children[i].weight < node.children[j].weight) {
            aux = node.children[i];
            node.children[i] = node.children[j];
            node.children[j] = aux;
          }
        }
      }

      console.log(node.children);
      // add children states to stack
      for (var i = 0; i < node.children.length; i++) {
        stack.push(node.children[i].node);
        //if (stm.length == stmSize) stm.shift();
        //stm.push(node.children[i].node.state);
      }

      steps = steps + 1;
      //if (steps / stmSize > nrPieces * 100) stmSize = stmSize * puzzleSize * 1.2;
    }
  }

  // render
  renderPuzzle(node.state);
  while (node.parent != null) {
    moves = moves + 1;
    node = node.parent;
  }
  moves = moves - 1;
  updateStats();

  alert('Woo hooo! Always winning!');
}

$('document').ready(function() {
  generate();

  $('#generate').on('click', generate);
  $('#solve-bfs').on('click', solveBFS);
  $('#solve-gbfs').on('click', solveGBFS);
});
