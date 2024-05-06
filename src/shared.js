import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

export const client = new DeliverooApi(
    "http://localhost:8080",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4NzBjZTY1OThkIiwibmFtZSI6InN0ZSIsImlhdCI6MTcxNTAzMTE4OX0.sTbi-WlgNbKzxwAHNkjBMawXYeJef0QDnUTmKrGxa-I"
);

export const DEBUG = true;

// store agent state
export const me = { carrying: new Map() };

// used to compute threshold
export var PARCEL_REWARD_AVG;
export var config;

// store map
export const map = {
    width: undefined,
    height: undefined,
    tiles: new Map(),
    add: function (tile) {
        const { x, y } = tile;
        return this.tiles.set(x + 1000 * y, tile);
    },
    xy: function (x, y) {
        return this.tiles.get(x + 1000 * y);
    },
};

client.onConfig((param) => {
    PARCEL_REWARD_AVG = param.PARCEL_REWARD_AVG;
    config = new Config(param);
});

export class Config {
    constructor(param) {
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
