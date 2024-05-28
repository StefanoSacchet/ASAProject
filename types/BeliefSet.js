import { Graph } from "../utils/astar.js";
import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { DEBUG } from "../config.js";
import Config from "./Config.js";
import AgentModel from "./AgentModel.js";
import GameMap from "./GameMap.js";
import Me from "./Me.js";
import Parcel from "./Parcel.js";

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
    HANDSHAKE_KEY;
    /** @type {string} */
    COMMUNICATION_KEY;

    /** @type {string} */
    allayId;

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

    /**
     * @param {Array<Parcel>} perceived_parcels
     * @returns {{isNewParcelSensed: boolean, isCarryingEmpty: boolean}}
     */
    updateParcelsFromMsg(perceived_parcels) {
        let isNewParcelSensed = false;
        let isCarryingEmpty = false;

        for (const p of perceived_parcels) {
            if (!this.parcels.has(p.id)) isNewParcelSensed = true; // new parcel sensed
            else this.parcels.get(p.id).probability = 1;
            p.probability = 1;
            this.parcels.set(p.id, p); // update perceived parcels
        }

        for (let parcel of this.parcels.values()) {
            if (!perceived_parcels.find((p) => p.id === parcel.id)) {
                // remove expired parcels
                // beliefSet.parcels.delete(parcel.id);
                parcel.probability -= this.config.PARCEL_PROB_DECAY;
                if (this.me.carrying.has(parcel.id)) {
                    this.me.carrying.delete(parcel.id);
                    if (this.me.carrying.size === 0) isCarryingEmpty = true;
                }
            } else {
                // update carriedBy
                if (parcel.carriedBy && parcel.carriedBy === this.me.id) {
                    parcel.carriedBy = this.me.id;
                }
                // update me.carrying
                if (this.me.carrying.has(parcel.id)) {
                    this.me.carrying.set(parcel.id, parcel);
                    parcel.carriedBy = this.me.id;
                }
                // update me.carrying if found in parcels but not in me.carrying
                if (parcel.carriedBy && parcel.carriedBy === this.me.id) {
                    this.me.carrying.set(parcel.id, parcel);
                }
            }

            if (parcel.probability < this.config.PARCEL_PROB_TRHESHOLD) {
                if (DEBUG) console.log("Parcel probability is below threshold, deleting parcel");
                this.parcels.delete(parcel.id);
            }
        }

        return {isNewParcelSensed, isCarryingEmpty};
    }
}
