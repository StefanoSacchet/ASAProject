import { graph } from "../src/intention_revision.js";
import { DEBUG, map } from "../src/shared.js";
import { astar } from "./astar.js";

export function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    // const dx = Math.abs(Math.round(x1) - Math.round(x2));
    // const dy = Math.abs(Math.round(y1) - Math.round(y2));
    // return dx + dy;
    const start = graph.grid[Math.round(x1)][Math.round(y1)];
    const end = graph.grid[Math.round(x2)][Math.round(y2)];
    return astar.search(graph, start, end).length; // A* search
}

export function nearestDelivery({ x, y }, map) {
    return Array.from(map.tiles.values())
        .filter(({ delivery }) => delivery)
        .sort((a, b) => distance(a, { x, y }) - distance(b, { x, y }))[0];
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

    if (!me || me.x === undefined || me.y === undefined || !graph) return false;

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

    /**
     * Options filtering
     * TODO change this decision
     * the parcels are picked up in order of which one will give the most reward
     * when delivery tile is reached
     */
    let best_option;
    let nearest = Number.MAX_VALUE;

    let parcelExpirationDuration;
    // TODO set this check in the official version too
    if (config.PARCEL_DECADING_INTERVAL == "infinite") {
        parcelExpirationDuration = 0;
    } else {
        parcelExpirationDuration = parseInt(config.PARCEL_DECADING_INTERVAL.replace("s", "")) * 1000;
    }
    for (const option of options) {
        if (option[0] == "go_pick_up") {
            let [go_pick_up, x, y, id] = option;
            let deliveryTile = nearestDelivery({x, y}, map);
            
            let parcelDistanceFromMe = distance({ x, y }, me);
            let parcelDistanceFromDelivery = distance({ x, y }, deliveryTile);

            let parcelValue = parcels.get(id).reward;
            let parcelFinalValue =
                parcelValue - (parcelDistanceFromDelivery + parcelDistanceFromMe) * parcelExpirationDuration;

            if (parcelFinalValue < nearest) {
                best_option = option;
                nearest = parcelDistanceFromMe;
            }
        }
    }

    return best_option;
}