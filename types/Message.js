export const TopicMsgEnum = Object.freeze({
    HANDSHAKE_1: "handshake_1",
    HANDSHAKE_2: "handshake_2",
});

export default class Message {
    /** @type {TopicEnum} */
    topic;

    /** @type {string} */
    token;

    /** @type {any} */
    content;

    /**
     * @param {string} topic
     * @param {string} token
     * @param {any} content
     */
    constructor(topic, token, content) {
        this.topic = topic;
        this.token = token;
        this.content = content;
    }
}
