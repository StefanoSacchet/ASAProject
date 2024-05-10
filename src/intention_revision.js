import { astar, Graph } from "../utils/astar.js";
import { distance, nearestDelivery, getCarriedRewardAndTreshold } from "../utils/functions.js";
import { Plan, IntentionRevisionReplace } from "./classes.js";
import { me, config, map, DEBUG } from "./shared.js";
import { client } from "../deliverooApi/connection.js";

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

// save seen parcels but not taken
// const notCarried = [];

function updateParcels(perceived_parcels) {
    //TODO don't remove not expired parcels
    for (const [id, parcel] of parcels.entries()) {
        if (!perceived_parcels.find((p) => p.id === id)) {
            parcels.delete(id);
            me.carrying.delete(id);
        } else {
            // update carriedBy
            if (parcel.carriedBy && parcel.carriedBy === me.id) {
                parcel.carriedBy = me.id;
            }
            // update me.carrying
            if (me.carrying.has(id)) {
                me.carrying.set(id, parcel);
                parcel.carriedBy = me.id;
            }
            // update me.carrying if found in parcels but not in me.carrying
            if (parcel.carriedBy && parcel.carriedBy === me.id) {
                me.carrying.set(id, parcel);
            }
            // if (DEBUG) console.log("me.carrying", me.carrying);
            // if (DEBUG) console.log("parcels", parcels);
        }

        // Iterate over the keys of the parcels map
        // for (const [key, value] of parcels) {
        //     // Check if the key is not present in the carrying map
        //     if (!me.carrying.has(key) && value.carriedBy === null) {
        //         // If the key is not present, add it to the notCarried array
        //         notCarried.push(value);
        //     }
        // }
        // notCarried.sort((a, b) => {
        //     const distanceA = distance({ x: me.x, y: me.y }, { x: a.x, y: a.y });
        //     const distanceB = distance({ x: me.x, y: me.y }, { x: b.x, y: b.y });
        //     return distanceA - distanceB;
        // });
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

function chooseBestOption(options, me, map, parcels, config) {
    let best_option;
    let nearest = Number.MAX_VALUE;
    const deliveryTile = nearestDelivery(me, map);
    const parcelExpiration_ms = parseInt(config.PARCEL_DECADING_INTERVAL.replace("s", "")) * 1000;
    for (const option of options) {
        if (option[0] == "go_pick_up") {
            let [go_pick_up, x, y, id] = option;

            let parcelDistanceFromMe = distance({ x, y }, me);
            let parcelDistanceFromDelivery = distance({ x, y }, deliveryTile);

            let parcelValue = parcels.get(id).reward;
            let parcelFinalValue =
                parcelValue - (parcelDistanceFromDelivery + parcelDistanceFromMe) * parcelExpiration_ms;

            if (parcelFinalValue < nearest) {
                best_option = option;
                nearest = parcelDistanceFromMe;
            }
        }
    }

    return best_option;
}

function chooseBestOtionV2(options, me, parcels) {
    // set a score for each option based on its reward and distance from me
    const PENALTY_DISTANCE = 2;
    let best_option;
    let best_score = Number.MIN_VALUE;
    for (const option of options) {
        if (option[0] !== "go_pick_up") continue;

        const [go_pick_up, x, y, id] = option;

        const parcelDistanceFromMe = distance({ x, y }, me);

        const parcelValue = parcels.get(id).reward;
        const score = parcelValue - parcelDistanceFromMe * PENALTY_DISTANCE;

        if (score > best_score) {
            best_option = option;
            best_score = score;
        }
    }

    return best_option;
}

client.onMap((width, height, tiles) => {
    // store map
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

    if (!graph) return;

    // change back to 1 where there is a tile
    map.tiles.forEach((tile) => {
        graph.grid[tile.x][tile.y].weight = 1;
    });

    // remove tiles where there is an agent
    agents.forEach((agent) => {
        // check if value is .6 or .4
        const x = Math.round(agent.x);
        const y = Math.round(agent.y);
        graph.grid[x][y].weight = 0;
    });
});

// setTimeout(() => {
//     myAgent.clear();
//     myAgent.push(["patrolling"]);
// }, 1000000);

/**
 * Options generation and filtering function
 */
client.onParcelsSensing((perceived_parcels) => {
    // remove expired parcels and update carriedBy
    updateParcels(perceived_parcels);

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
    // myAgent.push( [ 'go_pick_up', parcel.x, parcel.y, parcel.id ] )

    /**
     * Options filtering
     * TODO change this decision
     * the parcels are picked up in order of which one will give the most reward
     * when delivery tile is reached
     */
    const bestOption = chooseBestOtionV2(options, me, parcels);

    /**
     * Best option is selected
     */
    if (bestOption) {
        myAgent.push(bestOption);
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
// myAgent.idle = ["patrolling"];
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
        }
    }
}

function ifAboveDelivery() {
    if (me.carrying.size > 0) {
        for (const deliveryTile of map.deliveryTiles.values()) {
            if (me.x == deliveryTile.x && me.y == deliveryTile.y) {
                client.putdown();
                me.carrying.clear();
                break;
            }
        }
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

function getRandomTile() {
    let i = Math.round(Math.random() * map.tiles.size);
    let tile = Array.from(map.tiles.values()).at(i);
    return tile;
}

function calculateDirectionFromAgents(me, agents) {
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

function makeLittleSteps(dir) {
    //* make little random steps
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

function moveAwayFromAgents(me, agents) {
    const dir = calculateDirectionFromAgents(me, agents);
    return makeLittleSteps(dir);
}

class Patrolling extends Plan {
    static isApplicableTo(patrolling) {
        return patrolling == "patrolling";
    }

    async execute(patrolling) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        // let i = Math.round(Math.random() * map.tiles.size);
        // let tile = Array.from(map.tiles.values()).at(i);
        // if (tile) await this.subIntention(["go_to", tile.x, tile.y]);

        if (me.x === undefined || me.y === undefined) return true;

        let randomTile;

        if (map.moreNormalTilesThanSpawners) {
            //pick closest parcel spawner
            if (DEBUG) console.log("moving to spawner");
            let closestSpawner = null;
            let closestDistance = Infinity;
            for (const spawner of map.spawnerTiles.values()) {
                // Calculate distance from the current position to the spawner
                const dist = distance({ x: me.x, y: me.y }, { x: spawner.x, y: spawner.y });

                // Update closest spawner if this spawner is closer
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestSpawner = spawner;
                }
            }
            randomTile = closestSpawner;
        } else {
            if (DEBUG) console.log("Moving randonmly with little steps");
            const dir = {
                x: Math.random() < 0.5 ? -1 : 1,
                y: Math.random() < 0.5 ? -1 : 1,
            };
            randomTile = makeLittleSteps(dir);
        }

        // //  move to saved parcels
        // if (notCarried.length > 0) {
        //     console.log("Moving to saved parcel");
        //     randomTile = parcels.get(notCarried[0].id);
        //     notCarried.shift();
        // // move away from agents
        // } else if (agents.size > 0) {
        //     console.log("Moving away from agents");
        //     randomTile = moveAwayFromAgents(me, agents);
        // // move randomly
        // } else {
        //     if (DEBUG) console.log("Moving randonmly with little steps");
        //     const dir = {
        //         x: Math.random() < 0.5 ? -1 : 1,
        //         y: Math.random() < 0.5 ? -1 : 1,
        //     };
        //     randomTile = makeLittleSteps(dir);
        // }

        if (!randomTile) randomTile = getRandomTile();
        await this.subIntention(["go_to", randomTile.x, randomTile.y]);

        // parcels.delete(notCarried[0].id);
        // notCarried.shift();

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
