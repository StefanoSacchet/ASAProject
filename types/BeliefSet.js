import Config from "./Config.js";
import AgentModel from "./AgentModel.js";
import GameMap from "./GameMap.js";
import Me from "./Me.js";
import Parcel from "./Parcel.js";
import { Graph } from "../utils/astar.js";
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

export default class BeliefSet {
    /** @type {Config} */
    config;
    /** @type {Me} */
    me;
    /** @type {GameMap} */
    map;
    /** @type {Map<string, AgentModel>} */
    agents;
    /** @type {Map<string, Parcel>} */
    parcels;

    /** @type {DeliverooApi} */
    client;

    /** @type {string} */
    communicationKey;

    /** @type {Array<Array<number>>} */
    matrix;
    /** @type {Graph} */
    graph;

    constructor() {
        this.me = new Me();
        this.map = new GameMap();
        this.agents = new Map();
        this.parcels = new Map();
    }
}
