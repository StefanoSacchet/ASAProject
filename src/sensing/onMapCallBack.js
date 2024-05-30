import { Graph } from "../../utils/astar.js";
import { astar } from "../../utils/astar.js";
import { GridNode } from "../../utils/astar.js";
import Tile from "../../types/Tile.js";
import BeliefSet from "../../types/BeliefSet.js";

const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
];

/**
 * @param {BeliefSet} beliefSet
 * @returns {Array<Array<GridNode>>}
 */
function pathsSpawnersToDeliveries(beliefSet) {
    const pathWithCorridors = [];
    let tmp = false;
    for (const spawner of beliefSet.map.spawnerTiles.values()) {
        for (const delivery of beliefSet.map.deliveryTiles.values()) {
            const start = beliefSet.graph.grid[spawner.x][spawner.y];
            const end = beliefSet.graph.grid[delivery.x][delivery.y];
            const path = astar.search(beliefSet.graph, start, end);
            if (path.length > 0) {
                // if path found then identify corridors
                for (const node of path) {
                    for (const [dx, dy] of directions) {
                        const nx = node.x + dx;
                        const ny = node.y + dy;
                        if (nx < 0 || nx >= beliefSet.map.width || ny < 0 || ny >= beliefSet.map.height) continue;
                        const neighbor = beliefSet.graph.grid[nx][ny];
                        if (neighbor.weight === 0) {
                            neighbor.corridor = true;
                            tmp = true;
                            // console.log("Corridor found at", nx, ny);
                        }
                    }
                }
                if (tmp) pathWithCorridors.push(path);
            }
        }
    }

    return pathWithCorridors;
}
/**
 * @param {number} width
 * @param {number} height
 * @param {Array<Tile>} tiles
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onMapCallback(width, height, tiles, beliefSet) {
    // update map
    beliefSet.map.width = width;
    beliefSet.map.height = height;
    for (const t of tiles) {
        beliefSet.map.add(t);
        if (t.delivery) beliefSet.map.addDelivery(t);
        if (t.parcelSpawner) beliefSet.map.addSpawner(t);
    }
    if (beliefSet.map.tiles.size - beliefSet.map.deliveryTiles.size > beliefSet.map.spawnerTiles.size)
        beliefSet.map.moreNormalTilesThanSpawners = true;

    // create graph for A*
    beliefSet.matrix = Array(height)
        .fill()
        .map(() => Array(width).fill(0));
    // fill in ones where there is a tile
    tiles.forEach((tile) => {
        beliefSet.matrix[tile.x][tile.y] = 1;
    });
    beliefSet.graph = new Graph(beliefSet.matrix);

    const pathWithCorridors = pathsSpawnersToDeliveries(beliefSet);
    beliefSet.pathWithCorridors = pathWithCorridors;
}
