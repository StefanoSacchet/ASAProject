import BeliefSet from "../../types/BeliefSet.js";
import Message from "../../types/Message.js";
import { TopicMsgEnum } from "../../types/Message.js";
import Say from "../plans/communicationPlans/Say.js";

/**
 * @param {string} id
 * @param {string} name
 * @param {number} x
 * @param {number} y
 * @param {number} score
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onYouCallback(id, name, x, y, score, beliefSet) {
    beliefSet.me.id = id;
    beliefSet.me.name = name;
    beliefSet.me.x = Math.round(x);
    beliefSet.me.y = Math.round(y);
    beliefSet.me.score = score;

    if (beliefSet.allayId) {
        const msg = new Message(TopicMsgEnum.ME, beliefSet.COMMUNICATION_KEY, beliefSet.me);
        new Say(beliefSet.allayId, msg).execute(beliefSet);
    }
}
