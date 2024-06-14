import { astar, Graph } from "../astar.js";
import GameMap from "../../types/GameMap.js";

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
    const res = astar.search(graph, start, end); // A* search
    if (res.length == 0) return Infinity;
    return res.length;
    // return astar.search(graph, start, end).length; // A* search
}

/**
 * @param {{x: number, y: number}} param
 * @param {GameMap} map
 * @param {Graph} graph
 * @type {Map<string, AgentModel>} 
 * @returns {{x: number, y: number}}
 */
export function nearestDelivery({ x, y }, map, graph, agents=undefined) {
    let minDistance = Infinity;
    let deliveryTile = null;
    for (const tile of map.deliveryTiles.values()) {
        
        if (agents && agents.size > 0) {
            let isAgentOnDelivery = false;
            for (const agent of agents.values()) {
                if (agent.x == tile.x && agent.y == tile.y) {
                    isAgentOnDelivery = true;
                    break;
                }
            }
            if (isAgentOnDelivery) continue;
        }

        const d = distance({ x, y }, tile, graph);
        if (d < minDistance) {
            minDistance = d;
            deliveryTile = tile;
        }
    }
    return deliveryTile;
}
