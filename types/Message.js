export const TopicMsgEnum = Object.freeze({
    HANDSHAKE_1: "handshake_1",
    HANDSHAKE_2: "handshake_2",
    NEW_PARCELS: "new_parcels",
    NEW_AGENTS: "new_agents",
    ME: "me",
    COLLAB: "collab",
    NEW_INTENTION: "new_intention",
    INTENTION_COMPLETED: "intention_completed",
});

export const CollabRoles = Object.freeze({
    DELIVER: "deliver",
    PICK_UP: "pick_up",
});

export default class Message {
    /** @type {TopicMsgEnum} */
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
