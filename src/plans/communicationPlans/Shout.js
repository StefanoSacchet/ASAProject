import Message from "../../../types/Message.js";
import BeliefSet from "../../../types/BeliefSet.js";

export default class Shout {
    /** @type {Message} */
    #msg;

    /**
     * @param {Message} msg
     */
    constructor(msg) {
        this.#msg = msg;
    }

    /**
     * @param {BeliefSet} beliefSet
     * @return {Promise<(Object | false)>}
     */
    async execute(beliefSet) {
        // Convert Map to object
        if (this.#msg.content instanceof Map) {
            this.#msg.content = Object.fromEntries(this.#msg.content);
        }

        // send the message
        return await beliefSet.client.shout(this.#msg);
    }
}
