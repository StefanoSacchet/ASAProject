import Message from "../../../types/Message.js";
import BeliefSet from "../../../types/BeliefSet.js";

export default class Ask {
    /** @type {string} */
    #to;

    /** @type {Message} */
    #msg;

    /**
     * @param {string} to
     * @param {Message} msg
     */
    constructor(to, msg) {
        this.#to = to;
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
        return await beliefSet.client.ask(this.#to, this.#msg);
    }
}
