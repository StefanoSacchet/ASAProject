import { getCarriedRewardAndTreshold } from "../../utils/functions/parcelManagement.js";
import { chooseBestOptionV2 } from "../../utils/functions/intentions.js";
import { CollabRoles, TopicMsgEnum } from "../../types/Message.js";
import Parcel from "../../types/Parcel.js";
import BeliefSet from "../../types/BeliefSet.js";
import IntentionRevisionReplace from "../intentions/IntentionRevisionReplace.js";
import Message from "../../types/Message.js";
import Say from "../plans/communicationPlans/Say.js";

/**
 * @param {Array<Parcel>} perceived_parcels
 * @param {BeliefSet} beliefSet
 * @param {IntentionRevisionReplace} myAgent
 * @returns {Promise<void>}
 */
export default async function onParcelsSensingCallback(perceived_parcels, beliefSet, myAgent) {
    // remove expired parcels, add new ones and update carriedBy
    // console.log("onParcelsSensingCallback");
    // console.log(perceived_parcels);
    // console.log(beliefSet.parcels);
    const { isNewParcelSensed, isCarryingEmpty } = beliefSet.updateParcels(perceived_parcels);

    // clear intention if carrying is empty
    if (isCarryingEmpty && !beliefSet.isSingleCorridor) await myAgent.clear();

    const carriedArray = getCarriedRewardAndTreshold(beliefSet.me, beliefSet.config);
    const carriedReward = carriedArray[0];
    const THRESHOLD = carriedArray[1];
    // go deliver
    if (carriedReward > THRESHOLD && THRESHOLD !== 0) {
        myAgent.push(["go_deliver"]);
        return;
    }

    if (beliefSet.collabRole === CollabRoles.PICK_UP && beliefSet.isSingleCorridor && !isCarryingEmpty) {
        await myAgent.clear();
        myAgent.push(["go_deliver"]);
        return;
    }

    if (!isNewParcelSensed) return;

    // if patrolling and new parcels are observed, clear intention
    // if (myAgent.intention_queue[0]?.predicate[0] === "patrolling") {
    //     console.log("Clearing intention queue");
    //     await myAgent.clear();
    // }

    // send new parcels sensed to allay
    const msg = new Message(TopicMsgEnum.NEW_PARCELS, beliefSet.COMMUNICATION_KEY, perceived_parcels);
    await new Say(beliefSet.allayId, msg).execute(beliefSet);

    /**
     * Options generation
     */
    const options = [];
    for (const parcel of beliefSet.parcels.values())
        if (!parcel.carriedBy) options.push(["go_pick_up", parcel.x, parcel.y, parcel.id]);

    // choose parcel based on reward and distance from me
    const bestOption = chooseBestOptionV2(options, beliefSet);

    // push best option
    if (bestOption && beliefSet.collabRole !== CollabRoles.DELIVER) myAgent.push(bestOption);
}
