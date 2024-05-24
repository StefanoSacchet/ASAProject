import { Graph } from "../../utils/astar.js";
import Tile from "../../types/Tile.js";
import BeliefSet from "../../types/BeliefSet.js";

/**
 * @param {number} width
 * @param {number} height
 * @param {Array<Tile}
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
}
