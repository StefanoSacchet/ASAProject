import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { astar, Graph } from "../utils/astar.js";
import { distance, nearestDelivery } from "../utils/functions.js";
import { Plan, IntentionRevisionReplace } from "./classes.js";

const client = new DeliverooApi(
    "http://localhost:8080",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY2YTA3NzU5OTVlIiwibmFtZSI6InN0ZSIsImlhdCI6MTcxMzg2NzExNn0.6aMQeOP7Bp3Plk5R0sH-shYiECbRfz6K-iOlmAdP-Yw"
);

// store plan classes
export const planLibrary = [];

// store perceived parcels
export const parcels = new Map();

// store agent state
const me = { carrying: new Map() };

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
let graph;

// used to compute threshold
let PARCEL_REWARD_AVG;

// map matrix
var matrix;

client.onConfig((param) => {
    PARCEL_REWARD_AVG = param.PARCEL_REWARD_AVG;
});

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

client.onAgentsSensing((agents) => {
    if (!matrix && !graph) return;

    // recompute matrix for A* with agents
    agents.forEach((agent) => {
        // check if agent.x and agent.y are integers
        if (!Number.isInteger(agent.x) || !Number.isInteger(agent.y)) return;

        matrix[agent.x][agent.y] = 0;
    });
    graph = new Graph(matrix);
});

client.onParcelsSensing(async (perceived_parcels) => {
    // update perceived parcels
    for (const p of perceived_parcels) {
        parcels.set(p.id, p);
    }

    //TODO don't remove not expiered parcels
    // remove expiered parcels
    for (const [id, parcel] of parcels.entries()) {
        if (!perceived_parcels.find((p) => p.id === id)) {
            parcels.delete(id);
            me.carrying.delete(id);
        }
    }
});

/**
 * Options generation and filtering function
 */
client.onParcelsSensing((parcels) => {
    // TODO revisit beliefset revision so to trigger option generation only in the case a new parcel is observed

    let carriedQty = me.carrying.size;
    // const TRESHOLD = (carriedQty * PARCEL_REWARD_AVG) / 2;
    const TRESHOLD = PARCEL_REWARD_AVG / 2;
    let carriedReward = Array.from(me.carrying.values()).reduce((acc, parcel) => acc + parcel.reward, 0);

    // go deliver
    if (carriedReward > TRESHOLD && TRESHOLD !== 0) {
        myAgent.push(["go_deliver"]);
        return;
    }

    /**
     * Options generation
     */
    const options = [];
    for (const parcel of parcels.values())
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
    } else myAgent.push(["patrolling"]);
});
// client.onAgentsSensing( agentLoop )
// client.onYou( agentLoop )

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
        await this.subIntention(["go_to", x, y]);
        if (this.stopped) throw ["stopped"];
        await client.pickup();
        if (this.stopped) throw ["stopped"];
        me.carrying.set(id, parcels.get(id));
        return true;
    }
}

class GoTo extends Plan {
    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        while (me.x != x || me.y != y) {
            const start = graph.grid[me.x][me.y];
            const end = graph.grid[x][y];
            const res = astar.search(graph, start, end); // A* search

            if (res.length == 0) throw ["no path found"]; // if no path found then quit

            // move to each node in the path
            for (let i = 0; i < res.length; i++) {
                if (this.stopped) throw ["stopped"]; // if stopped then quit
                let next = res[i];
                if (next.x > me.x) await client.move("right");
                else if (next.x < me.x) await client.move("left");
                if (next.y > me.y) await client.move("up");
                else if (next.y < me.y) await client.move("down");
                me.x = next.x;
                me.y = next.y;
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
