import { graph } from "../src/intention_revision.js";
import { DEBUG, config, map, me, parcels, agents } from "../src/shared.js";
import { Intention } from "../src/classes.js";
import { astar } from "./astar.js";

export function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    // const dx = Math.abs(Math.round(x1) - Math.round(x2));
    // const dy = Math.abs(Math.round(y1) - Math.round(y2));
    // return dx + dy;
    const start = graph.grid[Math.round(x1)][Math.round(y1)];
    const end = graph.grid[Math.round(x2)][Math.round(y2)];
    return astar.search(graph, start, end).length; // A* search
}

// export function nearestDelivery({ x, y }, map) {
//     return Array.from(map.tiles.values())
//         .filter(({ delivery }) => delivery)
//         .sort((a, b) => distance(a, { x, y }) - distance(b, { x, y }))[0];
// }

export function nearestDelivery({ x, y }, map) {
    let minDistance = Infinity;
    let deliveryTile = null;
    for (const tile of map.deliveryTiles.values()) {
        const d = distance({ x, y }, tile);
        if (d < minDistance) {
            minDistance = d;
            deliveryTile = tile;
        }
    }
    return deliveryTile;
}

export function updateAgents(percieved_agents) {
    // delete agents not present anymore
    for (const [id, agent] of agents.entries()) {
        if (!percieved_agents.find((agent) => agent.id === id)) agents.delete(id);
    }
    // update agents
    agents.forEach((agent) => {
        if (!agents.has(agent.id)) agents.set(agent.id, agent);
        else agents.set(agent.id, agent);
    });
}

//* ********************** */
//* SELECT BEST INENTION

export function chooseBestOption(options) {
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

export function chooseBestOtionV2(options) {
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

//* ********************** */
//* PARCEL MANAGEMENT

export function updateParcels(perceived_parcels) {
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
        }
    }
}

export function getCarriedRewardAndTreshold(me, config) {
    let carriedQty = me.carrying.size;
    // TODO revise TRESHOLD computation
    const TRESHOLD = (carriedQty * config.PARCEL_REWARD_AVG) / 2;
    let carriedReward = 0;
    if (me.carrying && me.carrying.size > 0) {
        carriedReward = Array.from(me.carrying.values()).reduce(
            (acc, parcel) => (parcel && parcel.reward ? parseInt(acc) + parseInt(parcel.reward) : acc),
            0
        );
        // if (DEBUG) console.log("checking carried parcels: ", carriedReward, "TRESHOLD: ", TRESHOLD);
    }
    return [carriedReward, TRESHOLD];
}

export function canDeliverContentInTime(me, config) {
    if (!me || me.x == undefined || me.y == undefined || graph.grid === undefined || me.carrying.size == 0)
        return false;

    let deliveryTile = nearestDelivery(me, map);
    let carriedReward = getCarriedRewardAndTreshold(me, config)[0];

    const start = graph.grid[Math.round(me.x)][Math.round(me.y)];
    const end = graph.grid[deliveryTile.x][deliveryTile.y];
    const distanceFromDeliveryTile = astar.search(graph, start, end); // A* search

    if (distanceFromDeliveryTile.length == 0) return false; // if no path found then quit

    let timeToDeliver = distanceFromDeliveryTile.length * config.MOVEMENT_DURATION;
    var timeForCarriedExpiration;
    if (config) {
        if (config.PARCEL_DECADING_INTERVAL == "infinite") {
            return true;
            timeForCarriedExpiration = timeToDeliver + 1;
        } else {
            // convert "1s", "2s", "3s" to 1, 2, 3 removing the s
            let parcelExpirationDuration = parseInt(config.PARCEL_DECADING_INTERVAL.replace("s", "")) * 1000;

            timeForCarriedExpiration = carriedReward * parcelExpirationDuration;
        }
    } else {
        timeForCarriedExpiration = timeToDeliver + 1;
    }

    // console.log("timeToDeliver", timeToDeliver);
    // console.log("timeForCarriedExpiration", timeForCarriedExpiration);

    if (timeToDeliver < timeForCarriedExpiration) {
        return true;
    }

    return false;
}

export function findBestParcel(me, perceived_parcels, parcels, config) {
    const options = [];
    for (const parcel of perceived_parcels.values())
        if (!parcel.carriedBy) options.push(["go_pick_up", parcel.x, parcel.y, parcel.id]);

    if (DEBUG) console.log("Options for picking up parcels:", options);

    /**
     * Options filtering
     * TODO change this decision
     * the parcels are picked up in order of which one will give the most reward
     * when delivery tile is reached
     */
    let best_option;
    let best_parcel_value = Number.MIN_VALUE;

    let parcelExpirationDuration;
    let notInfinite = 1;
    // TODO set this check in the official version too
    if (config.PARCEL_DECADING_INTERVAL == "infinite") {
        parcelExpirationDuration = 1;
        notInfinite = 0;
    } else {
        parcelExpirationDuration = parseInt(config.PARCEL_DECADING_INTERVAL.replace("s", "")) * 1000;
    }
    for (const option of options) {
        if (option[0] == "go_pick_up") {
            let [go_pick_up, x, y, id] = option;
            let deliveryTile = nearestDelivery({ x, y }, map);

            let parcelDistanceFromMe = distance({ x, y }, me);
            let parcelDistanceFromDelivery = distance({ x, y }, deliveryTile);

            let parcelValue = parcels.get(id).reward;
            let parcelFinalValue;
            if (notInfinite) {
                parcelFinalValue =
                    parcelValue * parcelExpirationDuration -
                    (parcelDistanceFromDelivery + parcelDistanceFromMe) * config.MOVEMENT_DURATION * notInfinite;
            } else {
                parcelFinalValue = parcelValue - 2 * parcelDistanceFromMe;
            }
            if (parcelFinalValue > best_parcel_value) {
                best_option = option;
                best_parcel_value = parcelDistanceFromMe;
            }
        }
    }
    if (DEBUG) console.log("Best parcel that can be picked up is:", best_option);
    return best_option;
}

export function findAndPickUpNearParcels(me, parcels, config) {
    if (DEBUG) console.log("Checking if any new parcels can be picked up.");
    // if new parcels are around when delivering, control if taking them gets a higher reward
    // save current carrying
    let me_carrying_old = new Map(me.carrying);
    // create new carrying to insert future best parel in
    let me_carrying_new = new Map(me.carrying);

    // get best option (parcel)
    let best_option = findBestParcel(me, parcels, parcels, config);
    if (best_option && me.carrying.size < 3) {
        if (DEBUG) console.log("Best parcel that can be picked up is:", best_option);

        let best_option_id = best_option[3];
        let best_option_x = best_option[1];
        let best_option_y = best_option[2];

        let parcelExpirationDuration,
            notInfinite = 1;
        if (config.PARCEL_DECADING_INTERVAL == "infinite") {
            parcelExpirationDuration = 1;
            notInfinite = 0;
        } else {
            parcelExpirationDuration = parseInt(config.PARCEL_DECADING_INTERVAL.replace("s", "")) * 1000;
        }

        let best_option_p = parcels.get(best_option_id);
        if (!best_option_p && DEBUG) console.log("parcel not found!!!");
        // console.log("parcels:", parcels);
        // console.log("dist:", distance({ x:best_option_x, y:best_option_y }, me));
        // console.log("expiration:", parcelExpirationDuration);
        best_option_p.reward =
            best_option_p.reward * parcelExpirationDuration -
            distance({ x: best_option_x, y: best_option_y }, me) * 2 * config.MOVEMENT_DURATION * notInfinite;
        if (notInfinite) best_option_p.reward = best_option_p.reward / 1000;
        let best_option_reward = best_option_p.reward;

        // set best option in new carrying
        me_carrying_new.set(best_option_id, best_option_p);
        me.carrying = me_carrying_new;
        let newParcelIsDeliverable = canDeliverContentInTime(me, config);
        let newParcelCarriedRewardAndTreshold = getCarriedRewardAndTreshold(me, config);
        // console.log("new carrying:", me.carrying);
        // console.log("deliverable in time:", newParcelIsDeliverable);
        // console.log("carried reward:", newParcelCarriedRewardAndTreshold[0]);
        me.carrying = me_carrying_old;

        if (newParcelIsDeliverable) {
            // if content is still deliverable, compare the reward of the new carrying with the old one
            let oldParcelCarriedRewardAndTreshold = getCarriedRewardAndTreshold(me, config);
            if (DEBUG) console.log("Taking new parcel has total reward:", newParcelCarriedRewardAndTreshold);
            if (DEBUG) console.log("Ignoring parcel has total reward:", oldParcelCarriedRewardAndTreshold);
            if (newParcelCarriedRewardAndTreshold[0] > oldParcelCarriedRewardAndTreshold[0]) {
                // if the new carrying has a higher reward, deliver the old parcels and pick up the new one
                // pick up new parcel
                let new_intention = new Intention(this, ["go_pick_up", best_option_x, best_option_y, best_option_id]);

                if (DEBUG) console.log("A new package can be picked up. New intention:", new_intention);
                return new_intention;
            } else {
                if (DEBUG) console.log("New parcel would not bring better reward.");
            }
        }
        return null;
    }
}

//* ********************** */
//* MOVEMENT

export function isAboveDelivery() {
    if (me.carrying.size > 0) {
        for (const deliveryTile of map.deliveryTiles.values()) {
            if (me.x == deliveryTile.x && me.y == deliveryTile.y) return true;
        }
    }
    return false;
}

export function isAbovePickup() {
    for (const parcel of parcels.values()) {
        if (parcel.x == me.x && parcel.y == me.y) return parcel;
    }
    return false;
}

//* ********************** */
//* PATROLLING

export function moveToSpawner() {
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
    return closestSpawner;
}

export function makeLittleSteps(dir) {
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
