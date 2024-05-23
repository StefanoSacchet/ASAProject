/**
 * Represents an agent
 * @class
 */
export class AgentModel {
    constructor() {
        /**
         * The ID of the agent.
         * @type {string | undefined}
         */
        this.id = undefined;

        /**
         * The name of the agent.
         * @type {string | undefined}
         */
        this.name = undefined;

        /**
         * The x-coordinate of the agent.
         * @type {number | undefined}
         */
        this.x = undefined;

        /**
         * The y-coordinate of the agent.
         * @type {number | undefined}
         */
        this.y = undefined;

        /**
         * The score of the agent.
         * @type {number | undefined}
         */
        this.score = undefined;
    }
}
