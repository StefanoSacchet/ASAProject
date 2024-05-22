/**
 * Represents game cofniguration
 */
export class Config {
    constructor() {
        /**
         * The file path of the map.
         * @type {string}
         */
        this.MAP_FILE = undefined;

        /**
         * The interval at which parcels are generated.
         * @type {number}
         */
        this.PARCELS_GENERATION_INTERVAL = undefined;

        /**
         * The maximum number of parcels.
         * @type {number}
         */
        this.PARCELS_MAX = undefined;

        /**
         * The number of movement steps an agent can take.
         * @type {number}
         */
        this.MOVEMENT_STEPS = undefined;

        /**
         * The duration of each movement step.
         * @type {number}
         */
        this.MOVEMENT_DURATION = undefined;

        /**
         * The distance at which an agent can observe other agents.
         * @type {number}
         */
        this.AGENTS_OBSERVATION_DISTANCE = undefined;

        /**
         * The distance at which an agent can observe parcels.
         * @type {number}
         */
        this.PARCELS_OBSERVATION_DISTANCE = undefined;

        /**
         * The timeout duration for an agent.
         * @type {number}
         */
        this.AGENT_TIMEOUT = undefined;

        /**
         * The average reward value for a parcel.
         * @type {number}
         */
        this.PARCEL_REWARD_AVG = undefined;

        /**
         * The variance of reward values for parcels.
         * @type {number}
         */
        this.PARCEL_REWARD_VARIANCE = undefined;

        /**
         * The interval at which parcel rewards decay.
         * @type {number}
         */
        this.PARCEL_DECADING_INTERVAL = undefined;

        /**
         * Indicates whether agents move randomly.
         * @type {boolean}
         */
        this.RANDOMLY_MOVING_AGENTS = undefined;

        /**
         * The speed of randomly moving agents.
         * @type {number}
         */
        this.RANDOM_AGENT_SPEED = undefined;

        /**
         * The clock value for the simulation.
         * @type {number}
         */
        this.CLOCK = undefined;
    }

    /**
     * Sets the configuration parameters.
     * @param {Object} param - The configuration parameters.
     */
    setConfig(param) {
        this.MAP_FILE = param.MAP_FILE;
        this.PARCELS_GENERATION_INTERVAL = param.PARCELS_GENERATION_INTERVAL;
        this.PARCELS_MAX = param.PARCELS_MAX;
        this.MOVEMENT_STEPS = param.MOVEMENT_STEPS;
        this.MOVEMENT_DURATION = param.MOVEMENT_DURATION;
        this.AGENTS_OBSERVATION_DISTANCE = param.AGENTS_OBSERVATION_DISTANCE;
        this.PARCELS_OBSERVATION_DISTANCE = param.PARCELS_OBSERVATION_DISTANCE;
        this.AGENT_TIMEOUT = param.AGENT_TIMEOUT;
        this.PARCEL_REWARD_AVG = param.PARCEL_REWARD_AVG;
        this.PARCEL_REWARD_VARIANCE = param.PARCEL_REWARD_VARIANCE;
        this.PARCEL_DECADING_INTERVAL = param.PARCEL_DECADING_INTERVAL;
        this.RANDOMLY_MOVING_AGENTS = param.RANDOMLY_MOVING_AGENTS;
        this.RANDOM_AGENT_SPEED = param.RANDOM_AGENT_SPEED;
        this.CLOCK = param.CLOCK;
    }
}
