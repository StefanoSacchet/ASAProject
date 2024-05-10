import { DEBUG, map, me } from "../../src/shared.js";
import { distance } from "./distance.js";

//* PATROLLING

// export function moveToSpawner() {
//     let closestSpawner = null;
//     let closestDistance = Infinity;
//     for (const spawner of map.spawnerTiles.values()) {
//         // Calculate distance from the current position to the spawner
//         const dist = distance({ x: me.x, y: me.y }, { x: spawner.x, y: spawner.y });

//         // Update closest spawner if this spawner is closer
//         if (dist < closestDistance) {
//             closestDistance = dist;
//             closestSpawner = spawner;
//         }
//     }
//     return closestSpawner;
// }

export function moveToSpawner() {
    // Create an array of spawner tiles with their distances from the current position
    const spawnersWithDistances = Array.from(map.spawnerTiles.values()).map(spawner => {
        const dist = distance({ x: me.x, y: me.y }, { x: spawner.x, y: spawner.y });
        return { spawner, dist };
    });

    // Sort the array by distance
    spawnersWithDistances.sort((a, b) => a.dist - b.dist);

    // Return an array of spawner tiles sorted by distance
    return spawnersWithDistances.map(item => item.spawner);
}

export function makeLittleSteps(dir) {
    // make little random steps
    const CONST = 3;
    let randomTile;
    for (let i = 0; i < 5; i++) {
        const newX = me.x + Math.floor((Math.floor(Math.random() * CONST) + 1) * dir.x);
        const newY = me.y + Math.floor((Math.floor(Math.random() * CONST) + 1) * dir.y);
        const newKey = newX + 1000 * newY;

        if (map.tiles.has(newKey)) {
            randomTile = map.tiles.get(newKey);
            break;
        }
    }

    if (!randomTile) randomTile = getRandomTile();
    return randomTile;
}

function calculateDirectionFromAgents(agents) {
    let directionX = 0;
    let directionY = 0;

    for (const agent of agents.values()) {
        const dx = me.x - agent.x;
        const dy = me.y - agent.y;

        // Calculate the inverse square distance to give more weight to distant agents
        const inverseDistance = 1 / (dx ** 2 + dy ** 2);

        // Add the weighted direction
        directionX += dx * inverseDistance;
        directionY += dy * inverseDistance;
    }

    // Normalize the direction vector
    const magnitude = Math.sqrt(directionX ** 2 + directionY ** 2);
    if (magnitude !== 0) {
        directionX /= magnitude;
        directionY /= magnitude;
    }

    return { x: directionX, y: directionY };
}

export function moveAwayFromAgents(agents) {
    const dir = calculateDirectionFromAgents(me, agents);
    return makeLittleSteps(dir);
}

export function getRandomTile() {
    let i = Math.round(Math.random() * map.tiles.size);
    let tile = Array.from(map.tiles.values()).at(i);
    return tile;
}
