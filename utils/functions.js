import { graph } from "../src/intention_revision.js";
import { DEBUG, map } from "../src/shared.js";
import { astar } from "./astar.js";

export function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2));
    const dy = Math.abs(Math.round(y1) - Math.round(y2));
    return dx + dy;
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
        if (DEBUG) console.log("checking carried parcels: ", carriedReward, "TRESHOLD: ", TRESHOLD);
    }
    return [carriedReward, TRESHOLD];
}

export function canDeliverInTime(me, config) {
    let deliveryTile = nearestDelivery(me, map);
    let carriedReward = getCarriedRewardAndTreshold(me, config)[0];

    const start = graph.grid[me.x][me.y];
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
