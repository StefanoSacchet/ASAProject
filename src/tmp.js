import { astar, Graph } from "../utils/astar.js";

var graph = new Graph([
    [1, 1, 1, 1],
    [0, 1, 1, 0],
    [0, 0, 1, 1],
]);

var start = graph.grid[0][0];
var end = graph.grid[2][3];
var result = astar.search(graph, start, end);
console.log(result);
