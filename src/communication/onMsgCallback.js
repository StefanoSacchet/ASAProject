import { DEBUG } from "../../config.js";
import { TopicMsgEnum } from "../../types/Message.js";
import BeliefSet from "../../types/BeliefSet.js";
import Message from "../../types/Message.js";

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
    if (msg.topic === TopicMsgEnum.HANDSHAKE_1 && msg.token === beliefSet.handShakeKey) {
        beliefSet.client.say(id, new Message(TopicMsgEnum.HANDSHAKE_2, beliefSet.handShakeKey, "Hello, I am here!"));
        beliefSet.allayId = id;
    }

    // handshake from slave
    if (msg.topic === TopicMsgEnum.HANDSHAKE_2 && msg.token === beliefSet.handShakeKey) {
        beliefSet.allayId = id;
    }

    // check if the message is from a known source
    if (msg.token !== beliefSet.handShakeKey) {
        if (DEBUG) console.log("message arrived from an unknown source");
        return;
    }
}
