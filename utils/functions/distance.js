
import { astar } from "../astar.js";
import { graph } from "../../src/agentSolo/intention_revision.js";

//* DISTANCE

export function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    // const dx = Math.abs(Math.round(x1) - Math.round(x2));
    // const dy = Math.abs(Math.round(y1) - Math.round(y2));
    // return dx + dy;
    const start = graph.grid[Math.round(x1)][Math.round(y1)];
    const end = graph.grid[Math.round(x2)][Math.round(y2)];
    return astar.search(graph, start, end).length; // A* search
}

// export function nearestDelivery({ x, y }, map) {
//     return Array.from(map.tiles.values())
//         .filter(({ delivery }) => delivery)
//         .sort((a, b) => distance(a, { x, y }) - distance(b, { x, y }))[0];
// }

export function nearestDelivery({ x, y }, map) {
    let minDistance = Infinity;
    let deliveryTile = null;
    for (const tile of map.deliveryTiles.values()) {
        const d = distance({ x, y }, tile);
        if (d < minDistance) {
            minDistance = d;
            deliveryTile = tile;
        }
    }
    return deliveryTile;
}
