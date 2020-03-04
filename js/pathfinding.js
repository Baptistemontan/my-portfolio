//dimension of the grid
const ROW_NUMBER = 25;
const COL_NUMBER = 60;
const UPDATE_DELAY = 20;
let mouseHold = false,
  moveStart = false,
  moveEnd = false,
  diagonal = false,
  timeOutRef;

//Node class declaration, every grid cell has its own Node object
class Node {
  constructor(row, col) {
    //variable init
    this.row = row;
    this.col = col;
    this.isStart = false;
    this.isFinish = false;
    this.isWall = false;
    this.isVisited = false;
    this.isPath = false;
  }
  init = () => {
    //init of cell (visualy)
    //and retrieve of Jquery reference for itself
    this.cell = $('#pathfinding #' + this.row + '-' + this.col);
    this.cell.click(this.click.bind(this));
    this.cell.mousedown(this.mouseDown.bind(this));
    this.cell.mouseover(this.mouseOn.bind(this));
    this.cell.mouseup(this.mouseUp.bind(this))
  };
  /*
    the next 3 function is for wall insertion,
    when a node is cliked we change mouseHold to true (mouseDown)
    and we set it to false when the mouse stop being hold (mouseUp)
    and we use this variable to know if we add a wall when the mouse over the node
  */
  mouseDown = e => {
    mouseHold = true;
    if (this.isStart) {
      moveStart = true;
    } else if (this.isFinish) {
      moveEnd = true;
    }
    this.mouseOn(e)
  }
  mouseUp = e => {
    mouseHold = false;
    moveStart = false;
    moveEnd = false;
    clearTimeout(timeOutRef);
    timeOutRef = setTimeout(launch, 50);
  }
  mouseOn = e => {
    if (mouseHold && !this.isStart && !this.isFinish && startNode.assigned && finishNode.assigned && !moveStart && !moveEnd) {
      clearTimeout(timeOutRef);
      if (this.isWall) {
        this.isWall = false
      } else {
        this.isWall = true;
      }
      this.update();
      timeOutRef = setTimeout(launch, 50);
    }
    if (mouseHold && (moveStart || moveEnd) && !this.isWall) {
      if (moveStart) {
        nodeGrid[startNode.row][startNode.col].click();
        this.click();
      } else {
        nodeGrid[finishNode.row][finishNode.col].click();
        this.click();
      }
      launch();
    }
  }
  //happend when the node is clicked
  click = e => {
    if (this.isWall) { return false }
    if (this.isStart && finishNode.assigned) {
      this.isStart = false;
      startNode.assigned = false;
      clear();
    } else if (this.isFinish && startNode.assigned) {
      this.isFinish = false;
      finishNode.assigned = false;
      clear();
    } else if (!startNode.assigned && !this.isFinish) {
      this.isStart = true;
      startNode = {
        row: this.row,
        col: this.col,
        assigned: true
      }
    } else if (!finishNode.assigned && !this.isStart) {
      this.isFinish = true;
      finishNode = {
        row: this.row,
        col: this.col,
        assigned: true
      }
    }
    this.update();
  }
  update = () => {
    //this update the node visually, it add the class for CSS
    if (this.isStart) { this.cell.addClass('start') } else { this.cell.removeClass('start') }
    if (this.isFinish) { this.cell.addClass('end') } else { this.cell.removeClass('end') }
    if (this.isWall) { this.cell.addClass('wall') } else { this.cell.removeClass('wall') }
    if (this.isVisited && !this.isPath) { this.cell.addClass('visited') } else { this.cell.removeClass('visited') }
    if (this.isPath) { this.cell.addClass('path') } else { this.cell.removeClass('path') }
  };
  reset = () => {
    //everytime we rerun the pathfiding we need to reset those two variable
    this.isVisited = false;
    this.isPath = false;
    this.update();
  };
}

let grid = '';
let nodeGrid = [];
let startNode = {
  row: 10,
  col: 5,
  assigned: true
},
  finishNode = {
    row: 10,
    col: 45,
    assigned: true
  }

//
for (let row = 0; row < ROW_NUMBER; row++) {
  nodeGrid[row] = [];
  // grid += '<div class="node-row">';
  for (let col = 0; col < COL_NUMBER; col++) {
    nodeGrid[row][col] = new Node(row, col);
    grid += '<div id="' + row + '-' + col + '" class="node"></div>';
  }
  // grid += '</div>'
}

/*
this is the main function, here the idea of how it work
i will try my best to explain it
i often refers some nodes as neighbours, most of the time is the most distant visited nodes of the origin
we start at a node, and we look at all its neighbours if its the goal node.
if its the goal, then its over
otherwise we add the node to an array of neighbours
this will give an array of node that are exactly at a distance of exactly 1 of the origin
then we call the function again but on the array of neighbours
so each node in the array will look at its neighbours
and will add it to a general array for all the neigbours
that will give an array of all the node that are at a distance of exactly 2 of the origin
ten we call the function again on the neighbours of the neighbours of the origin
and this goes on
*/
function pathfinding(previousNodes, goalRow, goalCol, animation = false, iteration = 0) {
  //if there is no nodes to check, no need to run the function
  if (previousNodes.length < 1) { return false }
  //here is the array where nodes add there neigbours
  let neighboursNodes = [];
  //this function is called when the goal is founded
  const isPath = (path) => {
    console.timeEnd('timer')
    path.forEach((node, index) => {
      if (!node.node.isStart) {
        const pathAnimation = () => {
          node.node.isPath = true;
          node.node.update();
        }
        if (animation) { setTimeout(pathAnimation, UPDATE_DELAY * (iteration + 1 + index)) } else { pathAnimation() }
      }
    })
    return true;
  }
  //thats the function that retrieve the neigbours of the current node
  const testNeighbours = (row, col, path) => {
    //if its of limit, we dont try
    if (row < ROW_NUMBER && row >= 0 && col < COL_NUMBER && col >= 0) {
      //if its our goal, we return true
      if (row == goalRow && col == goalCol) {
        return true
      }
      const neighboursNode = nodeGrid[row][col];
      //if its a neigbour, a wall or the start node we dont want it
      if (neighboursNode.isVisited || neighboursNode.isWall || neighboursNode.isStart) {
        return false
      }
      // if its not the goal, not a wall and not visited we want it
      //we set visited to true and update it
      neighboursNode.isVisited = true;
      const visitedAnimation = () => neighboursNode.update();
      if (animation) { setTimeout(visitedAnimation, UPDATE_DELAY * iteration) } else { visitedAnimation() }

      //then we push it to the general array of neighbours
      neighboursNodes.push({
        node: neighboursNode,
        // here we keep track of the path it took to get to this node
        path: path
      });
    } else { return false }
  }
  //here its a forEach loop but its stop when the iteration return true 
  //and if a iteration return true, the forEach return true
  if (previousNodes.some(node => {
    //we get the row and col
    const nodeRow = node.node.row;
    const nodeCol = node.node.col;
    //here we just want to make a clone of the array,
    //we dont want to modify the path of previous nodes
    let path = node.path.slice();
    //and we push the current node to the path
    path.push(node);
    //then we test all the neigbours node
    //and if testNeighbours return true, we call the isPath function
    //which always return true, so the forEach stops and return true
    if (testNeighbours(nodeRow - 1, nodeCol, path)) { return isPath(path) }
    if (testNeighbours(nodeRow + 1, nodeCol, path)) { return isPath(path) }
    if (testNeighbours(nodeRow, nodeCol + 1, path)) { return isPath(path) }
    if (testNeighbours(nodeRow, nodeCol - 1, path)) { return isPath(path) }
    if (diagonal) {
      if (testNeighbours(nodeRow - 1, nodeCol + 1, path)) { return isPath(path) }
      if (testNeighbours(nodeRow - 1, nodeCol - 1, path)) { return isPath(path) }
      if (testNeighbours(nodeRow + 1, nodeCol + 1, path)) { return isPath(path) }
      if (testNeighbours(nodeRow + 1, nodeCol - 1, path)) { return isPath(path) }
    }
  })) { return true }// and it make the function return true, and the recursion stops
  return pathfinding(neighboursNodes, goalRow, goalCol, animation, iteration + 1);
  //if the goal is not founded, we start again with the neighbours
}

function clear() {
  nodeGrid.forEach(row => row.forEach(node => node.reset()));
}

//function to call when we want to launch the pathfinding algorithms
function launch(animation = false) {
  if (startNode.assigned != false && finishNode.assigned != false) {
    console.time('timer');
    clear();
    pathfinding([{ node: nodeGrid[startNode.row][startNode.col], path: [] }], finishNode.row, finishNode.col, animation)
  }
}

$(() => {
  //initialisation of the script when the DOM is ready
  $('#pathfinding #grid').html(grid).css('grid-template-columns', 'repeat(' + COL_NUMBER + ', 1fr)')
  //initialisation of every node
  nodeGrid.forEach(row => row.forEach(e => e.init()))
  //setting up start and end node
  nodeGrid[startNode.row][startNode.col].isStart = true;
  nodeGrid[startNode.row][startNode.col].update();
  nodeGrid[finishNode.row][finishNode.col].isFinish = true;
  nodeGrid[finishNode.row][finishNode.col].update();

  $("#pathfinding #visualize").click(() => {
    launch(true);
  })
  $("#pathfinding #digonal").click(() => {
    if (diagonal) {
      diagonal = false;
      launch(true);
    } else {
      diagonal = true;
      launch(true);
    }
  })
  $("#pathfinding #clearwalls").click(() => {
    nodeGrid.forEach(row => row.forEach(node => {
      node.isWall = false;
      node.update();
    }))
    launch();
  })
})