import Parcel from "../../types/Parcel.js";
import BeliefSet from "../../types/BeliefSet.js";
import { updateParcels, getCarriedRewardAndTreshold } from "../../utils/functions/parcelManagement.js";
import { chooseBestOptionV2 } from "../../utils/functions/intentions.js";
import IntentionRevisionReplace from "../intentions/IntentionRevisionReplace.js";

/**
 * @param {Array<Parcel>} perceived_parcels
 * @param {BeliefSet} beliefSet
 * @param {IntentionRevisionReplace} myAgent
 * @returns {Promise<void>}
 */
export default async function onParcelsSensingCallback(perceived_parcels, beliefSet, myAgent) {
    // remove expired parcels and update carriedBy
    const isCarryingEmpty = updateParcels(perceived_parcels, beliefSet);
    // clear intention if carrying is empty
    if (isCarryingEmpty) myAgent.clear();

    // revisit beliefset revision so to trigger option generation only in the case a new parcel is observed
    let new_parcel_sensed = false;
    for (const p of perceived_parcels) {
        if (!beliefSet.parcels.has(p.id)) new_parcel_sensed = true; // new parcel sensed
        beliefSet.parcels.set(p.id, p); // update perceived parcels
    }
    if (!new_parcel_sensed) return;

    // if patrolling and new parcels are observed, clear intention
    if (myAgent.intention_queue[0]?.predicate === "patrolling") myAgent.clear();

    const carriedArray = getCarriedRewardAndTreshold(beliefSet.me, beliefSet.config);
    const carriedReward = carriedArray[0];
    const THRESHOLD = carriedArray[1];

    // go deliver
    if (carriedReward > THRESHOLD && THRESHOLD !== 0) {
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
    const bestOption = chooseBestOptionV2(options, beliefSet);

    // push best option
    if (bestOption) myAgent.push(bestOption);
}
