import { astar, Graph } from "../astar.js";
import GameMap from "../../types/Map.js";

//* DISTANCE

/**
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @param {Graph} graph
 * @returns {number}
 */
export function distance({ x: x1, y: y1 }, { x: x2, y: y2 }, graph) {
    const start = graph.grid[Math.round(x1)][Math.round(y1)];
    const end = graph.grid[Math.round(x2)][Math.round(y2)];
    return astar.search(graph, start, end).length; // A* search
}

/**
 * @param {{x: number, y: number}} param
 * @param {GameMap} map
 * @param {Graph} graph
 * @returns {{x: number, y: number}}
 */
export function nearestDelivery({ x, y }, map, graph) {
    let minDistance = Infinity;
    let deliveryTile = null;
    for (const tile of map.deliveryTiles.values()) {
        const d = distance({ x, y }, tile, graph);
        if (d < minDistance) {
            minDistance = d;
            deliveryTile = tile;
        }
    }
    return deliveryTile;
}
