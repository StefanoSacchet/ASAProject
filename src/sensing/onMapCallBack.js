import { Graph } from "../../utils/astar.js";
import { astar } from "../../utils/astar.js";
import { GridNode } from "../../utils/astar.js";
import Tile from "../../types/Tile.js";
import BeliefSet from "../../types/BeliefSet.js";
import { distance } from "../../utils/functions/distance.js";
import Planner from "../../types/Planner.js";
import { getByValue } from "../../utils/functions/gameMap_utils.js";

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
    let tmp = 0;
    let isSingleCorridor = false;
    for (const spawner of beliefSet.map.spawnerTiles.values()) {
        for (const delivery of beliefSet.map.deliveryTiles.values()) {
            const start = beliefSet.graph.grid[spawner.x][spawner.y];
            const end = beliefSet.graph.grid[delivery.x][delivery.y];
            const path = astar.search(beliefSet.graph, start, end);
            if (path.length > 0) {
                // if path found then identify corridors
                let nodeCounter = 0;
                for (const node of path) {
                    let dirCounter = 0;
                    for (const [dx, dy] of directions) {
                        const nx = node.x + dx;
                        const ny = node.y + dy;
                        if (nx < 0 || nx >= beliefSet.map.width || ny < 0 || ny >= beliefSet.map.height) continue;
                        const neighbor = beliefSet.graph.grid[nx][ny];
                        if (neighbor.weight === 0) {
                            dirCounter++;
                            neighbor.corridor = true;
                            tmp = true;
                        }
                    }
                    if (dirCounter >= 2) {
                        nodeCounter++;
                    }
                }
                if (nodeCounter === path.length) isSingleCorridor = true;
                if (tmp) pathWithCorridors.push(path);
            }
        }
    }

    return { pathWithCorridors, isSingleCorridor };
}

// setup the objects and init portion of the pddl problem string.
// objects can be fully initialized, init cannot - we only fill it with tile positions here
/**
 * @param {Planner} planner
 * @param {Map<Tile>} tiles
*/
function update_planner_map_info(planner, tiles) {
    tiles.forEach(function(tile, tile_id) {
        planner.objects_init_pddlstring += "tile_" + tile_id.toString() + ", ";

        let near_tiles_pddl = "";
        let near_tiles_positions = ["left_of ", "right_of ", "down_of ", "up_of "];

        [[tile.x-1, tile.y],[tile.x+1, tile.y],[tile.x, tile.y-1],[tile.x, tile.y+1]]
            .forEach((near_tile, near_tile_number) => {
                let near_tile_index = getByValue(tiles, near_tile);
                if (near_tile_index != -1) {
                    //                  (               left_of                         2                ,       1        )
                    near_tiles_pddl += "(" + near_tiles_positions[near_tile_number] + "tile_" + near_tile_index + ", " + "tile_" + tile_id + ") ";
                }
            })

        planner.map_init_pddlstring += near_tiles_pddl;
    });
    planner.objects_init_pddlstring += "parcel";

    planner.map_init_pddlstring_backup = planner.map_init_pddlstring;
    planner.objects_init_pddlstring_backup = planner.objects_init_pddlstring;
    // console.log("Planner map init:");
    // console.log(planner.map_init_pddlstring);
    // console.log("Planner obj init:");
    // console.log(planner.objects_init_pddlstring);
}

/**
 * @param {number} width
 * @param {number} height
 * @param {Array<Tile>} tiles
 * @param {BeliefSet} beliefSet
 * @param {Planner} planner
 * @returns {Promise<void>}
 */
export default async function onMapCallback(width, height, tiles, beliefSet, planner) {
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

    const { pathWithCorridors, isSingleCorridor } = pathsSpawnersToDeliveries(beliefSet);
    beliefSet.pathWithCorridors = pathWithCorridors;
    beliefSet.isSingleCorridor = isSingleCorridor;
    console.log("isSingleCorridor", isSingleCorridor);

    update_planner_map_info(planner, beliefSet.map.tiles);

}
