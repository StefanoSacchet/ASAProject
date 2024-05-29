import { DEBUG } from "../../config.js";
import { TopicMsgEnum } from "../../types/Message.js";
import BeliefSet from "../../types/BeliefSet.js";
import Message from "../../types/Message.js";
import Say from "../plans/communicationPlans/Say.js";

/**
 * @param {string} id
 * @param {string} name
 * @param {Message} msg
 * @param {function(string): any} reply
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onMsgCallback(id, name, msg, reply, beliefSet) {
    // handshake from master
    if (msg.topic === TopicMsgEnum.HANDSHAKE_1 && msg.token === beliefSet.HANDSHAKE_KEY) {
        const msg = new Message(TopicMsgEnum.HANDSHAKE_2, beliefSet.HANDSHAKE_KEY, "Hello, I am here!");
        await new Say(id, msg).execute(beliefSet);
        beliefSet.allayId = id;
        return;
    }

    // handshake from slave
    if (msg.topic === TopicMsgEnum.HANDSHAKE_2 && msg.token === beliefSet.HANDSHAKE_KEY) {
        beliefSet.allayId = id;
        return;
    }

    // check if the message is from allay
    if (msg.token !== beliefSet.COMMUNICATION_KEY) {
        console.log("message arrived from an unknown source");
        return;
    }

    switch (msg.topic) {
        case TopicMsgEnum.NEW_PARCELS: // new parcels sensed
            if (DEBUG) console.log("New parcels arrived");
            beliefSet.updateParcels(msg.content);
            break;

        case TopicMsgEnum.NEW_AGENTS: // new agents sensed
            if (DEBUG) console.log("New agents arrived");
            beliefSet.updateAgents(msg.content);
            break;
    }
}
