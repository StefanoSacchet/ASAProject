/**
 * Represents game cofniguration
 */
export default class Config {
    /**
     * @param {Object} config - The configuration parameters.
     * @param {number} PARCEL_PROB_DECAY - The decay rate for parcel probabilities.
     * @param {number} PARCEL_PROB_TRHESHOLD - The threshold for deciding to remove parcel.
     */
    constructor(config, PARCEL_PROB_DECAY, PARCEL_PROB_TRHESHOLD) {
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
    }

    /**
     * Sets the configuration parameters.
     * @param {Object} param - The configuration parameters.
     */
    // setConfig(param) {
    //     this.MAP_FILE = param.MAP_FILE;
    //     this.PARCELS_GENERATION_INTERVAL = param.PARCELS_GENERATION_INTERVAL;
    //     this.PARCELS_MAX = param.PARCELS_MAX;
    //     this.MOVEMENT_STEPS = param.MOVEMENT_STEPS;
    //     this.MOVEMENT_DURATION = param.MOVEMENT_DURATION;
    //     this.AGENTS_OBSERVATION_DISTANCE = param.AGENTS_OBSERVATION_DISTANCE;
    //     this.PARCELS_OBSERVATION_DISTANCE = param.PARCELS_OBSERVATION_DISTANCE;
    //     this.AGENT_TIMEOUT = param.AGENT_TIMEOUT;
    //     this.PARCEL_REWARD_AVG = param.PARCEL_REWARD_AVG;
    //     this.PARCEL_REWARD_VARIANCE = param.PARCEL_REWARD_VARIANCE;
    //     this.PARCEL_DECADING_INTERVAL = param.PARCEL_DECADING_INTERVAL;
    //     this.RANDOMLY_MOVING_AGENTS = param.RANDOMLY_MOVING_AGENTS;
    //     this.RANDOM_AGENT_SPEED = param.RANDOM_AGENT_SPEED;
    //     this.CLOCK = param.CLOCK;
    // }
}
