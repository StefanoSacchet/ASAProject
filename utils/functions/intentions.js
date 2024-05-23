import { distance, nearestDelivery } from "./distance.js";
import { config, map, me, parcels } from "../../src/shared.js";

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

/**
 * Chooses the best option from a list of options based on reward and distance from the current position
 * @param {Array<string|number>} options - The list of options to choose from
 * @returns {string|number|undefined} The best option from the list
 */
export function chooseBestOptionV2(options) {
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
