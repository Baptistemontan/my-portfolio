//everything is inside an anonymous function who is directly call after its declaration so that its global variables are contained in itself
(function () {
  //global variables and constant declaration
  const ROW_NUMBER = 25;
  const COL_NUMBER = 60;
  const UPDATE_DELAY = 30;
  let mouseHold = false,
    addWall = false,
    removeWall = false,
    moveStart = false,
    moveEnd = false,
    diagonal = false,
    toggleVisited = true,
    launchID,
    timeOutRef,
    grid = '',
    nodeGrid = [],
    startNode = {
      row: 13,
      col: 9,
      assigned: false
    },
    finishNode = {
      row: 13,
      col: 49,
      assigned: false
    }

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
      this.weight = 1;
      this.distance = undefined;
    }
    init = () => {
      //we retrieve the Jquery reference for itself
      //and add all the event callbacks
      this.cell = $('#pathfinding #' + this.row + '-' + this.col);
      //we bind itself to the function
      this.cell.click(this.click.bind(this));
      this.cell.mousedown(this.mouseDown.bind(this));
      this.cell.mouseover(this.mouseOn.bind(this));
      this.cell.mouseup(this.mouseUp.bind(this));
    };
    //this function if to detect when an user press the mouse on the node,
    //if its on a wall/empty space, we know that he want to remove/add wall,
    //on the start/end node that he want to move it
    mouseDown = e => {
      mouseHold = true;
      if (this.isWall) {
        removeWall = true
      } else if (!this.isStart && !this.isFinish) {
        addWall = true;
      }
      if (this.isStart) {
        moveStart = true;
      } else if (this.isFinish) {
        moveEnd = true;
      }
      //we have to trigger the mouseOn function manually because the hover event happen before the mouse down
      this.mouseOn(e)
    }
    //here its to clear all the variable when the user release the mouse
    mouseUp = e => {
      mouseHold = false;
      moveStart = false;
      addWall = false;
      removeWall = false;
      moveEnd = false;
      clearTimeout(timeOutRef);
      timeOutRef = setTimeout(launch, 50);
    }
    //here its when the user hover the node
    mouseOn = e => {
      //if no start node is present we add an hover effect to show him he can put one down
      if (!startNode.assigned && !this.isWall && !this.isFinish) {
        $('#pathfinding .start').removeClass('start');
        this.cell.addClass('start');
      }
      //same but for end node
      if (!finishNode.assigned && !this.isWall && !this.isStart) {
        $('#pathfinding .end').removeClass('end');
        this.cell.addClass('end');
      }
      //here its for adding/removing walls
      if (mouseHold && !this.isStart && !this.isFinish && startNode.assigned && finishNode.assigned && !moveStart && !moveEnd) {
        //the timeout is here to prevent the re-render of the path if the user create lot of walls at once
        clearTimeout(timeOutRef);
        if (this.isWall && removeWall == true) {
          this.isWall = false
        } else if (!this.isWall && addWall == true) {
          this.isWall = true;
        }
        this.update();
        timeOutRef = setTimeout(launch, 50);
      }
      //here its when th user drag the end/start node
      //we could do the same timeout as the walls but the animation is way much crappier
      if (mouseHold && ((moveStart && !this.isFinish) || (moveEnd && !this.isStart)) && !this.isWall) {
        if (moveStart) {
          nodeGrid[startNode.row][startNode.col].click();
          this.click();
        } else if (moveEnd) {
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
      if (this.isVisited && !this.isPath && toggleVisited) { this.cell.addClass('visited') } else { this.cell.removeClass('visited') }
      if (this.isPath) { this.cell.addClass('path') } else { this.cell.removeClass('path') }
    };
    reset = () => {
      //everytime we rerun the pathfiding we need to reset those variables
      this.isVisited = false;
      this.isPath = false;
      this.isChecked = false;
      this.distance = undefined;
      this.parentNode = undefined;
      this.update();
    };
  }

  //nodeGrid and html grid init
  for (let row = 0; row < ROW_NUMBER; row++) {
    nodeGrid[row] = [];
    for (let col = 0; col < COL_NUMBER; col++) {
      nodeGrid[row][col] = new Node(row, col);
      grid += '<div id="' + row + '-' + col + '" class="node"><div><i class="far fa-dot-circle iend"></i><i class="far fa-compass istart"></i></div></div>';
    }
  }


  function dijkstra(parentNode, nodeQueue = [], goalRow, goalCol, ID, animation = false, iteration = 0) {
    const vectors = [{ row: 1, col: 0 }, { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 0, col: -1 }];
    const pathFounded = parent => {
      if (!parent.isStart) {
        parent.isPath = true;
        parent.update();
        pathFounded(parent.parentNode);
      }
    }
    const testNeighbour = (row, col) => {
      //if its off limit,checked, a wall or the start node we dont want it
      if (row < ROW_NUMBER && row >= 0 && col < COL_NUMBER && col >= 0) {
        //we retrieve the node
        const neighbourNode = nodeGrid[row][col];
        let founded = false;
        if (neighbourNode.isWall || neighbourNode.isChecked || neighbourNode.isStart) {
          return false
        }
        if (row == goalRow && col == goalCol) {
          founded = true;
        }

        if (neighbourNode.distance == undefined && !founded) {
          nodeQueue.push(neighbourNode);
        }
        if (neighbourNode.weight + parentNode.distance < neighbourNode.distance || neighbourNode.distance == undefined) {
          neighbourNode.distance = neighbourNode.weight + parentNode.distance;
          neighbourNode.parentNode = parentNode;
        }
        if (founded) {
          return neighbourNode;
        }
        neighbourNode.isVisited = true;
        neighbourNode.update();
        // // if its not the goal, not a wall and not visited we want it
        // //we set visited to true
        // neighbourNode.isVisited = true;
        // //see launch declaration for lauchID explanation
        // //this function update the node
        // const visitedAnimation = () => { if (launchID == ID) { neighbourNode.update() } };
        // //if the animations are on, we set a timeout, otherwise we just execute the function 
        // if (animation && toggleVisited) { setTimeout(visitedAnimation, UPDATE_DELAY * iteration) } else { visitedAnimation() }
        //if its our goal, we return true

      } else { return false }
    }
    if (vectors.some((vector, index) => {
      let result = testNeighbour(parentNode.row + vector.row, parentNode.col + vector.col);
      if (result) {
        nodeQueue.sort((a, b) => a.distance - b.distance);
        if (result.distance - result.weight <= nodeQueue[0].distance) {
          console.timeEnd('dijkstra')
          pathFounded(result.parentNode);
          return true
        }
      }
    })) {
      nodeQueue.sort((a, b) => a.distance - b.distance);
      return true
    }

    const nextNode = nodeQueue[0];
    nodeQueue.shift();
    nodeQueue.isChecked = true;
    return dijkstra(nextNode, nodeQueue, goalRow, goalCol, ID, animation, iteration)
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
  function pathfinding(previousNodes, goalRow, goalCol, ID, animation = false, iteration = 0) {
    //if there is no nodes to check, no need to run the function
    if (previousNodes.length < 1) { return false }
    //here is the array where nodes add there neigbours
    let neighboursNodes = [];
    //this function is called when the goal is founded
    const isPath = (path) => {
      console.timeEnd('myPathFinder')
      //here we update the path, we go through each node and update them
      path.forEach((node, index) => {
        //we skip the start node
        if (!node.node.isStart) {
          //this function is call for the rendering
          const pathAnimation = () => {
            //see the launch function description for the launchID, it prevent artefact from rerendering
            if (launchID == ID) {
              node.node.isPath = true;
              node.node.update();
            }
          }
          //if animations are on, we set a timeout, otherwise we just execute the function
          if (animation) { setTimeout(pathAnimation, UPDATE_DELAY * ((toggleVisited ? iteration : 0) + index)) } else { pathAnimation() }
        }
      })
      //and we return true to end the recursion
      return true;
    }
    //thats the function that retrieve the neigbours of the current node
    const testNeighbours = (row, col, path) => {
      //if its off limit, we dont try
      if (row < ROW_NUMBER && row >= 0 && col < COL_NUMBER && col >= 0) {
        //if its our goal, we return true
        if (row == goalRow && col == goalCol) {
          return true
        }
        //we retrieve the node
        const neighboursNode = nodeGrid[row][col];
        //if its visited, a wall or the start node we dont want it
        if (neighboursNode.isVisited || neighboursNode.isWall || neighboursNode.isStart) {
          return false
        }
        // if its not the goal, not a wall and not visited we want it
        //we set visited to true
        neighboursNode.isVisited = true;
        //see launch declaration for lauchID explanation
        //this function update the node
        const visitedAnimation = () => { if (launchID == ID) { neighboursNode.update() } };
        //if the animations are on, we set a timeout, otherwise we just execute the function 
        if (animation && toggleVisited) { setTimeout(visitedAnimation, UPDATE_DELAY * iteration) } else { visitedAnimation() }

        //then we push it to the general array of neighbours
        neighboursNodes.push({
          node: neighboursNode,
          // here we keep track of the path it took to get to this node
          path: path
        });
      } else { return false }
    }
    //here is the array of vectors
    const vectors = [{ row: 1, col: 0 }, { row: -1, col: 0 }, { row: 0, col: 1 }, { row: 0, col: -1 }]
    //if diagonal is  on, we add the diagonal vectors
    if (diagonal) { vectors.push({ row: 1, col: 1 }, { row: -1, col: 1 }, { row: -1, col: -1 }, { row: 1, col: -1 }) }
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
      //then we test all the neigbours node (based on the vectors)
      //and if testNeighbours return true, we call the isPath function
      //which always return true, so the forEach stops and return true
      return vectors.some(vector => {
        if (testNeighbours(nodeRow + vector.row, nodeCol + vector.col, path)) { return isPath(path) }
      })
    })) { return true }// and it make the function return true, and the recursion stops
    return pathfinding(neighboursNodes, goalRow, goalCol, ID, animation, iteration + 1);
    //if the goal is not founded, we start again with the neighbours
  }

  //those two functions does exactly what their name say
  function clear() {
    nodeGrid.forEach(row => row.forEach(node => node.reset()));
  }
  function clearWalls() {
    nodeGrid.forEach(row => row.forEach(node => {
      node.isWall = false;
      node.update();
    }))
  }

  //function to call when we want to launch the pathfinding algorithms
  function launch(animation = false) {
    //we verify that the start/end nodes are placed
    if (startNode.assigned != false && finishNode.assigned != false) {
      //the lauchId is just here to prevent rendering artefact if we render at the middle of one,
      //if we didnt had that, due to the setTimeout we could have artefact from the previous rendering
      //so we give it a random ID, so that if we rerender it stop the previous rendering
      launchID = Math.random();
      console.time('myPathFinder');
      clear();
      pathfinding([{ node: nodeGrid[startNode.row][startNode.col], path: [] }], finishNode.row, finishNode.col, launchID, animation)
      // clear();
      // nodeGrid[startNode.row][startNode.col].distance = 0;
      // dijkstra(nodeGrid[startNode.row][startNode.col], [], finishNode.row, finishNode.col, launchID, animation);
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
    startNode.assigned = true;
    nodeGrid[finishNode.row][finishNode.col].isFinish = true;
    nodeGrid[finishNode.row][finishNode.col].update();
    finishNode.assigned = true;
    //launch the pathfinding visualizer but with the animations
    $("#pathfinding #visualize").click(() => {
      launch(true);
    })
    //allow/prevent the algorithm to go diagonally
    $("#pathfinding #digonal").click(() => {
      if (diagonal) {
        diagonal = false;
        launch(true);
      } else {
        diagonal = true;
        launch(true);
      }
    })
    //clear the walls and rerender
    $("#pathfinding #clearwalls").click(() => {
      clearWalls();
      launch();
    })
    //clear and stop current rendering
    $('#pathfinding #clear').click(() => {
      launchID = Math.random();
      clear();
    })
    //show/hide visited nodes and rerender
    $('#pathfinding #togglevisited').click(function () {
      if (toggleVisited) {
        $(this).removeClass('true').addClass('false')
        toggleVisited = false;
      } else {
        $(this).removeClass('false').addClass('true')
        toggleVisited = true;
      }
      launch(true);
    })
    $('#pathfinding #djikstra').click(e => {
      console.time('dijkstra');
      clear();
      nodeGrid[startNode.row][startNode.col].distance = 0;
      dijkstra(nodeGrid[startNode.row][startNode.col], [], finishNode.row, finishNode.col);
    })
  })
})()