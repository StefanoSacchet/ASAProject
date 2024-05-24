import { DEBUG } from "../../config.js";
import Plan from "./Plan.js";
import BeliefSet from "../../types/BeliefSet.js";
import { distance } from "../../utils/functions/distance.js";
import Tile from "../../types/Tile.js";

export default class Patrolling extends Plan {
    // Initialize last selected spawner index
    static #lastSpawnerIndex = -1;

    /**
     * @param {BeliefSet} beliefSet
     * @param {Array<Plan>} planLibrary
     */
    constructor(parent, beliefSet, planLibrary) {
        super(parent, beliefSet, planLibrary);
    }

    moveToSpawner() {
        // Create an array of spawner tiles with their distances from the current position
        const spawnersWithDistances = Array.from(this.beliefSet.map.spawnerTiles.values()).map((spawner) => {
            const dist = distance(
                { x: this.beliefSet.me.x, y: this.beliefSet.me.y },
                { x: spawner.x, y: spawner.y },
                this.beliefSet.graph
            );
            return { spawner, dist };
        });

        // Sort the array by distance
        spawnersWithDistances.sort((a, b) => a.dist - b.dist);

        // Return an array of spawner tiles sorted by distance
        return spawnersWithDistances.map((item) => item.spawner);
    }

    /**
     * @returns {Tile}
     */
    getRandomTile() {
        let i = Math.round(Math.random() * this.beliefSet.map.tiles.size);
        let tile = Array.from(this.beliefSet.map.tiles.values()).at(i);
        return tile;
    }

    /**
     * @returns {{x: number, y: number}}
     */
    calculateDirectionFromAgents() {
        let directionX = 0;
        let directionY = 0;
        for (const agent of this.beliefSet.agents.values()) {
            const dx = this.beliefSet.me.x - agent.x;
            const dy = this.beliefSet.me.y - agent.y;

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

    /**
     * @param {{x: number, y: number}} dir
     * @returns {Tile}
     */
    makeLittleSteps(dir) {
        // make little random steps
        const CONST = 5;
        let randomTile;
        for (let i = 0; i < 5; i++) {
            const newX = this.beliefSet.me.x + Math.floor((Math.floor(Math.random() * CONST) + 1) * dir.x);
            const newY = this.beliefSet.me.y + Math.floor((Math.floor(Math.random() * CONST) + 1) * dir.y);
            const newKey = newX + 1000 * newY;

            if (this.beliefSet.map.tiles.has(newKey)) {
                randomTile = this.beliefSet.map.tiles.get(newKey);
                break;
            }
        }

        if (!randomTile) randomTile = this.getRandomTile();
        return randomTile;
    }

    /**
     * @returns {Tile}
     */
    moveAwayFromAgents() {
        const dir = this.calculateDirectionFromAgents();
        return this.makeLittleSteps(dir);
    }

    static isApplicableTo(patrolling) {
        return patrolling == "patrolling";
    }

    async execute(patrolling) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        let randomTile;

        // move to spawner tile if there are more normal tiles than spawners
        if (this.beliefSet.map.moreNormalTilesThanSpawners) {
            if (DEBUG) console.log("Moving to spawner");
            const spawners = this.moveToSpawner();
            Patrolling.#lastSpawnerIndex = (Patrolling.#lastSpawnerIndex + 1) % spawners.length; // Move to the next spawner in the list
            randomTile = spawners[Patrolling.#lastSpawnerIndex];
        } else if (this.beliefSet.agents.size > 0) {
            // move away from agents
            if (DEBUG) console.log("Moving away from agents");
            randomTile = this.moveAwayFromAgents();
        } else {
            // move randomly
            if (DEBUG) console.log("Moving randonmly");
            randomTile = this.getRandomTile();
        }

        if (!randomTile) randomTile = this.getRandomTile();
        await this.subIntention(["go_to", randomTile.x, randomTile.y]);

        if (this.stopped) throw ["stopped"]; // if stopped then quit
        return true;
    }
}
