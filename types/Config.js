/**
 * Represents game cofniguration
 */
export default class Config {
    /**
     * @param {Object} config - The configuration parameters.
     * @param {number} PARCEL_PROB_DECAY - The decay rate for parcel probabilities.
     * @param {number} PARCEL_PROB_TRHESHOLD - The threshold for deciding to remove parcel.
     * @param {number} AGENT_PROB_DECAY - The decay rate for agent probabilities.
     * @param {number} AGENT_PROB_TRHESHOLD - The threshold for deciding to remove agent.
     */
    constructor(config, PARCEL_PROB_DECAY, PARCEL_PROB_TRHESHOLD, AGENT_PROB_DECAY, AGENT_PROB_TRHESHOLD) {
        /**
         * The file path of the map.
         * @type {string | undefined}
         */
        this.MAP_FILE = config.MAP_FILE;

        /**
         * The interval at which parcels are generated.
         * @type {number | undefined}
         */
        this.PARCELS_GENERATION_INTERVAL = config.PARCELS_GENERATION_INTERVAL;

        /**
         * The maximum number of parcels.
         * @type {number | undefined}
         */
        this.PARCELS_MAX = config.PARCELS_MAX;

        /**
         * The number of movement steps an agent can take.
         * @type {number | undefined}
         */
        this.MOVEMENT_STEPS = config.MOVEMENT_STEPS;

        /**
         * The duration of each movement step.
         * @type {number | undefined}
         */
        this.MOVEMENT_DURATION = config.MOVEMENT_DURATION;

        /**
         * The distance at which an agent can observe other agents.
         * @type {number | undefined}
         */
        this.AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;

        /**
         * The distance at which an agent can observe parcels.
         * @type {number | undefined}
         */
        this.PARCELS_OBSERVATION_DISTANCE = config.PARCELS_OBSERVATION_DISTANCE;

        /**
         * The timeout duration for an agent.
         * @type {number | undefined}
         */
        this.AGENT_TIMEOUT = config.AGENT_TIMEOUT;

        /**
         * The average reward value for a parcel.
         * @type {number | undefined}
         */
        this.PARCEL_REWARD_AVG = config.PARCEL_REWARD_AVG;

        /**
         * The variance of reward values for parcels.
         * @type {number | undefined}
         */
        this.PARCEL_REWARD_VARIANCE = config.PARCEL_REWARD_VARIANCE;

        /**
         * The interval at which parcel rewards decay.
         * @type {number | undefined}
         */
        this.PARCEL_DECADING_INTERVAL = config.PARCEL_DECADING_INTERVAL;

        /**
         * Indicates whether agents move randomly.
         * @type {boolean | undefined}
         */
        this.RANDOMLY_MOVING_AGENTS = config.RANDOMLY_MOVING_AGENTS;

        /**
         * The speed of randomly moving agents.
         * @type {number | undefined}
         */
        this.RANDOM_AGENT_SPEED = config.RANDOM_AGENT_SPEED;

        /**
         * The clock value for the simulation.
         * @type {number | undefined}
         */
        this.CLOCK = config.CLOCK;

        /**
         * The decay rate for parcel probabilities.
         * @type {number | undefined}
         */
        this.PARCEL_PROB_DECAY = PARCEL_PROB_DECAY;
        /** @type {number} */
        this.PARCEL_PROB_TRHESHOLD = PARCEL_PROB_TRHESHOLD;

        /** @type {number} */
        this.AGENT_PROB_DECAY = AGENT_PROB_DECAY;
        /** @type {number} */
        this.AGENT_PROB_TRHESHOLD = AGENT_PROB_TRHESHOLD;
    }
}
