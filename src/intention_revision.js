import { astar, Graph } from "../utils/astar.js";
import { Plan, IntentionRevisionReplace } from "./classes.js";
import { DEBUG, config, me, map, parcels, agents } from "./shared.js";
import { client } from "../deliverooApi/connection.js";
import { nearestDelivery } from "../utils/functions/distance.js";
import { chooseBestOptionV2 } from "../utils/functions/intentions.js";
import { getCarriedRewardAndTreshold, updateParcels } from "../utils/functions/parcelManagement.js";
import { moveToSpawner, makeLittleSteps, getRandomTile, moveAwayFromAgents } from "../utils/functions/patrolling.js";
import { updateAgents, updateGraph } from "../utils/functions/agents.js";
import { isAboveDelivery, isAbovePickup } from "../utils/functions/movement.js";

// A* graph
export var graph;

// map matrix
export var matrix;

// store plan classes
export const planLibrary = [];

client.onConfig((param) => {
    config.setConfig(param);
});

client.onMap((width, height, tiles) => {
    // update map
    map.width = width;
    map.height = height;
    for (const t of tiles) {
        map.add(t);
        if (t.delivery) map.addDelivery(t);
        if (t.parcelSpawner) map.addSpawner(t);
    }
    if (map.tiles.size - map.deliveryTiles.size > map.spawnerTiles.size) map.moreNormalTilesThanSpawners = true;

    // create graph for A*
    matrix = Array(height)
        .fill()
        .map(() => Array(width).fill(0));
    // fill in ones where there is a tile
    tiles.forEach((tile) => {
        matrix[tile.x][tile.y] = 1;
    });
    graph = new Graph(matrix);
});

client.onYou(({ id, name, x, y, score }) => {
    me.id = id;
    me.name = name;
    me.x = x;
    me.y = y;
    me.score = score;
});

/*
if agent.x = 2.6 --> he's moving from 2 to 3
if agent.x = 2.4 --> he's moving from 3 to 2
*/
client.onAgentsSensing((percieved_agents) => {
    updateAgents(percieved_agents);
});

/**
 * Options generation and filtering function
 */
client.onParcelsSensing((perceived_parcels) => {
    // remove expired parcels and update carriedBy
    const isCarryingEmpty = updateParcels(perceived_parcels);

    if (isCarryingEmpty) {
        myAgent.clear();
        myAgent.isIdle = true;
    }

    // revisit beliefset revision so to trigger option generation only in the case a new parcel is observed
    let new_parcel_sensed = false;
    for (const p of perceived_parcels) {
        if (!parcels.has(p.id)) new_parcel_sensed = true; // new parcel sensed
        parcels.set(p.id, p); // update perceived parcels
    }
    if (!new_parcel_sensed) return;

    const carriedArray = getCarriedRewardAndTreshold(me, config);
    const carriedReward = carriedArray[0];
    const TRESHOLD = carriedArray[1];

    // go deliver
    if (carriedReward > TRESHOLD && TRESHOLD !== 0) {
        // if (DEBUG) console.log("go_deliver");
        myAgent.push(["go_deliver"]);
        return;
    }

    /**
     * Options generation
     */
    const options = [];
    for (const parcel of perceived_parcels.values())
        if (!parcel.carriedBy) options.push(["go_pick_up", parcel.x, parcel.y, parcel.id]);

    // choose parcel based on reward and distance from me
    const bestOption = chooseBestOptionV2(options);

    // push best option
    if (bestOption) myAgent.push(bestOption);
});

/**
 * Start intention revision loop
 */
// const myAgent = new IntentionRevisionQueue();
const myAgent = new IntentionRevisionReplace();
// const myAgent = new IntentionRevisionRevise();
myAgent.loop();

class GoPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == "go_pick_up";
    }

    async execute(go_pick_up, x, y, id) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit
        let go_to = await this.subIntention(["go_to", x, y]);
        if (this.stopped) throw ["stopped"];
        let pickup = await client.pickup();
        if (this.stopped) throw ["stopped"];
        if (go_to && !(pickup == []) && pickup.length > 0) {
            if (DEBUG) console.log("Gopickup", go_to, pickup);
            // if (DEBUG) console.log("picked up", id);
            me.carrying.set(id, parcels.get(id));
            parcels.get(id).carriedBy = me.id;
            // const carriedArray = getCarriedRewardAndTreshold(me, config);
            // const carriedReward = carriedArray[0];
            // const TRESHOLD = carriedArray[1];

            // // go deliver
            // if (carriedReward > TRESHOLD && TRESHOLD !== 0) {
            //     // if (DEBUG) console.log("go_deliver");
            //     myAgent.push(["go_deliver"]);
            //     return;
            // }
            return true;
        } else if (DEBUG) {
            console.log("pickup failed");
        }
    }
}

class GoTo extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        updateGraph();

        const start = graph.grid[me.x][me.y];
        const end = graph.grid[x][y];
        const res = astar.search(graph, start, end); // A* search

        if (res.length == 0) throw ["no path found"]; // if no path found then quit

        let status_x = false;
        let status_y = false;

        // move to each node in the path
        for (let i = 0; i < res.length; i++) {
            if (isAboveDelivery()) {
                client.putdown();
                me.carrying.clear();
            }
            const parcel = isAbovePickup();
            if (parcel) {
                client.pickup();
                me.carrying.set(parcel.id, parcel);
            }

            if (this.stopped) throw ["stopped"]; // if stopped then quit
            let next = res[i];
            if (next.x > me.x) status_x = await client.move("right");
            else if (next.x < me.x) status_x = await client.move("left");
            if (next.y > me.y) status_y = await client.move("up");
            else if (next.y < me.y) status_y = await client.move("down");

            if (status_x) me.x = next.x;
            if (status_y) me.y = next.y;
        }

        if (me.x == x && me.y == y) return true;
        else throw ["no path found"];
    }
}

// Initialize last selected spawner index
let lastSpawnerIndex = -1;

class Patrolling extends Plan {
    static isApplicableTo(patrolling) {
        return patrolling == "patrolling";
    }

    async execute(patrolling) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        if (me.x === undefined || me.y === undefined) return true;

        let randomTile;

        // move to spawner tile if there are more normal tiles than spawners
        if (map.moreNormalTilesThanSpawners) {
            if (DEBUG) console.log("Moving to spawner");
            const spawners = moveToSpawner();
            lastSpawnerIndex = (lastSpawnerIndex + 1) % spawners.length; // Move to the next spawner in the list
            randomTile = spawners[lastSpawnerIndex];
        } else if (agents.size > 0) {
            // move away from agents
            if (DEBUG) console.log("Moving away from agents");
            randomTile = moveAwayFromAgents(agents);
        } else {
            // move randomly
            if (DEBUG) console.log("Moving randonmly");
            // const dir = {
            //     x: Math.random() < 0.5 ? -1 : 1,
            //     y: Math.random() < 0.5 ? -1 : 1,
            // };
            // randomTile = makeLittleSteps(dir);
            randomTile = getRandomTile();
        }

        if (!randomTile) randomTile = getRandomTile();
        await this.subIntention(["go_to", randomTile.x, randomTile.y]);

        if (this.stopped) throw ["stopped"]; // if stopped then quit
        return true;
    }
}

class GoDeliver extends Plan {
    static isApplicableTo(go_deliver) {
        return go_deliver == "go_deliver";
    }

    async execute(go_deliver) {
        let deliveryTile = nearestDelivery(me, map);

        await this.subIntention(["go_to", deliveryTile.x, deliveryTile.y]);
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        await client.putdown();
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        // empty carrying
        me.carrying.clear();

        return true;
    }
}

// plan classes are added to plan library
planLibrary.push(GoPickUp);
planLibrary.push(GoTo);
planLibrary.push(Patrolling);
planLibrary.push(GoDeliver);
