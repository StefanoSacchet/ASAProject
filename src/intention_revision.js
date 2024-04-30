import { astar, Graph } from "../utils/astar.js";
import { distance, nearestDelivery } from "../utils/functions.js";
import { Plan, IntentionRevisionReplace } from "./classes.js";
import { me, client, config, map, DEBUG } from "./shared.js";

// A* graph
export var graph;

// map matrix
export var matrix;

// store plan classes
export const planLibrary = [];

// store perceived parcels
export const parcels = new Map();

// store perceived agents
const agents = new Map();

// store map
const map = {
    width: undefined,
    height: undefined,
    tiles: new Map(),
    add: function (tile) {
        const { x, y } = tile;
        return this.tiles.set(x + 1000 * y, tile);
    },
    xy: function (x, y) {
        return this.tiles.get(x + 1000 * y);
    },
};

// A* graph
var graph;

// map matrix
var matrix;

function updateParcels(perceived_parcels) {
    //TODO don't remove not expiered parcels
    for (const [id, parcel] of parcels.entries()) {
        if (!perceived_parcels.find((p) => p.id === id)) {
            parcels.delete(id);
            me.carrying.delete(id);
        } else {
            // update carriedBy
            if (parcel.carriedBy && parcel.carriedBy.id === me.id) {
                parcel.carriedBy = me;
            }
            // update me.carrying
            if (me.carrying.has(id)) {
                me.carrying.set(id, parcel);
            }
            // update me.carrying if found in parcels but not in me.carrying
            if (parcel.carriedBy && parcel.carriedBy.id === me.id) {
                me.carrying.set(id, parcel);
            }
            if (DEBUG) console.log("me.carrying", me.carrying);
            if (DEBUG) console.log("parcels", parcels);
        }
    }
}

function updateAgents(percieved_agents) {
    // delete agents not present anymore
    for (const [id, agent] of agents.entries()) {
        if (!percieved_agents.find((agent) => agent.id === id)) agents.delete(id);
    }
    // update agents
    percieved_agents.forEach((agent) => {
        if (!agents.has(agent.id)) agents.set(agent.id, agent);
        else agents.set(agent.id, agent);
    });
}

client.onMap((width, height, tiles) => {
    // store map
    map.width = width;
    map.height = height;
    for (const t of tiles) {
        map.add(t);
    }

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

    if (!matrix && !graph) return;

    let matrix_changed = false;

    // change back to 1 where there is a tile
    map.tiles.forEach((tile) => {
        matrix[tile.x][tile.y] = 1;
        matrix_changed = true;
    });
    // remove tiles where there is an agent
    agents.forEach((agent) => {
        // check if value is .6 or .4
        let x = Math.round(agent.x);
        let y = Math.round(agent.y);
        matrix[x][y] = 0;
        matrix_changed = true;
    });

    if (matrix_changed) graph = new Graph(matrix);
});

/**
 * Options generation and filtering function
 */
client.onParcelsSensing((perceived_parcels) => {
    // remove expiered parcels and update carriedBy
    updateParcels(perceived_parcels);

    // revisit beliefset revision so to trigger option generation only in the case a new parcel is observed
    let new_parcel_sensed = false;
    for (const p of perceived_parcels) {
        if (!parcels.has(p.id)) new_parcel_sensed = true; // new parcel sensed
        parcels.set(p.id, p); // update perceived parcels
    }
    if (!new_parcel_sensed) return;

    let carriedQty = me.carrying.size;
    const TRESHOLD = (carriedQty * config.PARCEL_REWARD_AVG) / 2;
    let carriedReward = 0;
    if (me.carrying.size > 0) {
        carriedReward = Array.from(me.carrying.values()).reduce(
            (acc, parcel) => parseInt(acc) + parseInt(parcel.reward),
            0
        );
        if (DEBUG) console.log("checking carried parcels: ", carriedReward, "TRESHOLD: ", TRESHOLD);
    }

    // go deliver
    if (carriedReward > TRESHOLD && TRESHOLD !== 0) {
        if (DEBUG) console.log("go_deliver");
        myAgent.push(["go_deliver"]);
        return;
    }

    /**
     * Options generation
     */
    const options = [];
    for (const parcel of perceived_parcels.values())
        if (!parcel.carriedBy) options.push(["go_pick_up", parcel.x, parcel.y, parcel.id]);
    // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

    /**
     * Options filtering
     */
    let best_option;
    let nearest = Number.MAX_VALUE;
    for (const option of options) {
        if (option[0] == "go_pick_up") {
            let [go_pick_up, x, y, id] = option;
            let current_d = distance({ x, y }, me);
            if (current_d < nearest) {
                best_option = option;
                nearest = current_d;
            }
        }
    }

    /**
     * Best option is selected
     */
    if (best_option) {
        myAgent.push(best_option);
    }
    // else myAgent.push(["patrolling"]);
});
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )

/**
 * Start intention revision loop
 */

// const myAgent = new IntentionRevisionQueue();
const myAgent = new IntentionRevisionReplace();
myAgent.idle = ["patrolling"];
// const myAgent = new IntentionRevisionRevise();
myAgent.loop();

class GoPickUp extends Plan {
    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == "go_pick_up";
    }

    async execute(go_pick_up, x, y, id) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit
        await this.subIntention(["go_to", x, y]);
        if (this.stopped) throw ["stopped"];
        await client.pickup();
        if (this.stopped) throw ["stopped"];
        else {
            if (DEBUG) console.log("picked up", id);
            me.carrying.set(id, parcels.get(id));
            return true;
        }
    }
}

function ifAboveDelivery() {
    if (me.carrying.size > 0) {
        let deliveryTile = nearestDelivery(me, map);
        if (me.x == deliveryTile.x && me.y == deliveryTile.y) client.putdown();
    }
}

function ifAbovePickup() {
    for (const parcel of parcels.values()) {
        if (parcel.x == me.x && parcel.y == me.y) {
            client.pickup();
            me.carrying.set(parcel.id, parcel);
            break;
        }
    }
}

class GoTo extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        while (me.x != x || me.y != y) {
            if (this.stopped) throw ["stopped"]; // if stopped then quit

            const start = graph.grid[me.x][me.y];
            const end = graph.grid[x][y];
            const res = astar.search(graph, start, end); // A* search

            if (res.length == 0) throw ["no path found"]; // if no path found then quit

            let status_x = false;
            let status_y = false;

            // move to each node in the path
            for (let i = 0; i < res.length; i++) {
                ifAboveDelivery();
                ifAbovePickup();

                if (this.stopped) throw ["stopped"]; // if stopped then quit
                let next = res[i];
                if (next.x > me.x) status_x = await client.move("right");
                else if (next.x < me.x) status_x = await client.move("left");
                if (next.y > me.y) status_y = await client.move("up");
                else if (next.y < me.y) status_y = await client.move("down");

                if (status_x) me.x = next.x;
                if (status_y) me.y = next.y;
            }
        }

        return true;
    }
}

class Patrolling extends Plan {
    static isApplicableTo(patrolling) {
        return patrolling == "patrolling";
    }

    async execute(patrolling) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        //TODO fix this
        // move away from other agents
        // let tile;
        // for (const agent of agents.values()) {
        //     if (this.stopped) throw ["stopped"]; // if stopped then quit
        //     if (agent.id == me.id) continue;
        //     // call subintention go_to random tile away from agent
        //     tile = map.tiles.get(agent.x + 1 + 1000 * agent.y);
        //     if (tile) break;
        // }

        // await this.subIntention(["go_to", tile.x, tile.y]);
        // if (this.stopped) throw ["stopped"]; // if stopped then quit

        let i = Math.round(Math.random() * map.tiles.size);
        let tile = Array.from(map.tiles.values()).at(i);
        if (tile) await this.subIntention(["go_to", tile.x, tile.y]);
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
