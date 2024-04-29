import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { astar, Graph } from "../utils/astar.js";
import { distance, nearestDelivery } from "../utils/functions.js";

const client = new DeliverooApi(
    "http://localhost:8080",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY2YTA3NzU5OTVlIiwibmFtZSI6InN0ZSIsImlhdCI6MTcxMzg2NzExNn0.6aMQeOP7Bp3Plk5R0sH-shYiECbRfz6K-iOlmAdP-Yw"
);

// store plan classes
const planLibrary = [];

// store agent state
const me = { carrying: new Map() };

// store perceived parcels
const parcels = new Map();

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
    let matrix = Array(height)
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
    const TRESHOLD = (carriedQty * PARCEL_REWARD_AVG) / 2;
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
 * Intention revision loop
 */
class IntentionRevision {
    #intention_queue = new Array();
    get intention_queue() {
        return this.#intention_queue;
    }

    async loop() {
        while (true) {
            // Consumes intention_queue if not empty
            if (this.intention_queue.length > 0) {
                console.log(
                    "intentionRevision.loop",
                    this.intention_queue.map((i) => i.predicate)
                );

                // Current intention
                const intention = this.intention_queue[0];

                // Is queued intention still valid? Do I still want to achieve it?
                // TODO this hard-coded implementation is an example
                let id = intention.predicate[2];
                let p = parcels.get(id);
                if (p && p.carriedBy) {
                    console.log("Skipping intention because no more valid", intention.predicate);
                    continue;
                }

                // Start achieving intention
                await intention
                    .achieve()
                    // Catch eventual error and continue
                    .catch((error) => {
                        // console.log( 'Failed intention', ...intention.predicate, 'with error:', ...error )
                    });

                // Remove from the queue
                this.intention_queue.shift();
            }
            // Postpone next iteration at setImmediate
            await new Promise((res) => setImmediate(res));
        }
    }

    // async push ( predicate ) { }

    log(...args) {
        console.log(...args);
    }
}

class IntentionRevisionQueue extends IntentionRevision {
    async push(predicate) {
        // Check if already queued
        if (this.intention_queue.find((i) => i.predicate.join(" ") == predicate.join(" "))) return; // intention is already queued

        console.log("IntentionRevisionReplace.push", predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);
    }
}

class IntentionRevisionReplace extends IntentionRevision {
    async push(predicate) {
        // Check if already queued
        const last = this.intention_queue.at(this.intention_queue.length - 1);
        if (last && last.predicate.join(" ") == predicate.join(" ")) {
            return; // intention is already being achieved
        }

        console.log("IntentionRevisionReplace.push", predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);

        // Force current intention stop
        if (last) {
            last.stop();
        }
    }
}

class IntentionRevisionRevise extends IntentionRevision {
    async push(predicate) {
        console.log("Revising intention queue. Received", ...predicate);
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
    }
}

/**
 * Start intention revision loop
 */

// const myAgent = new IntentionRevisionQueue();
const myAgent = new IntentionRevisionReplace();
// const myAgent = new IntentionRevisionRevise();
myAgent.loop();

/**
 * Intention
 */
class Intention {
    // Plan currently used for achieving the intention
    #current_plan;

    // This is used to stop the intention
    #stopped = false;
    get stopped() {
        return this.#stopped;
    }
    stop() {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if (this.#current_plan) this.#current_plan.stop();
    }

    /**
     * #parent refers to caller
     */
    #parent;

    /**
     * predicate is in the form ['go_to', x, y]
     */
    get predicate() {
        return this.#predicate;
    }
    #predicate;

    constructor(parent, predicate) {
        this.#parent = parent;
        this.#predicate = predicate;
    }

    log(...args) {
        if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
        else console.log(...args);
    }

    #started = false;
    /**
     * Using the plan library to achieve an intention
     */
    async achieve() {
        // Cannot start twice
        if (this.#started) return this;
        else this.#started = true;

        // Trying all plans in the library
        for (const planClass of planLibrary) {
            // if stopped then quit
            if (this.stopped) throw ["stopped intention", ...this.predicate];

            // if plan is 'statically' applicable
            if (planClass.isApplicableTo(...this.predicate)) {
                // plan is instantiated
                this.#current_plan = new planClass(this.parent);
                this.log("achieving intention", ...this.predicate, "with plan", planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute(...this.predicate);
                    this.log(
                        "succesful intention",
                        ...this.predicate,
                        "with plan",
                        planClass.name,
                        "with result:",
                        plan_res
                    );
                    return plan_res;
                    // or errors are caught so to continue with next plan
                } catch (error) {
                    this.log(
                        "failed intention",
                        ...this.predicate,
                        "with plan",
                        planClass.name,
                        "with error:",
                        ...error
                    );
                }
            }
        }

        // if stopped then quit
        if (this.stopped) throw ["stopped intention", ...this.predicate];

        // no plans have been found to satisfy the intention
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ["no plan satisfied the intention ", ...this.predicate];
    }
}

/**
 * Plan library
 */
class Plan {
    // This is used to stop the plan
    #stopped = false;
    stop() {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for (const i of this.#sub_intentions) {
            i.stop();
        }
    }
    get stopped() {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */
    #parent;

    constructor(parent) {
        this.#parent = parent;
    }

    log(...args) {
        if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
        else console.log(...args);
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate);
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }
}

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
        const start = graph.grid[me.x][me.y];
        const end = graph.grid[x][y];
        const res = astar.search(graph, start, end); // A* search

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
