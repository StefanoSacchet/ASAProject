import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import config from "../../config.js";
import BeliefSet from "../BeliefSet.js";
import onMapCallback from "../../src/sensing/onMapCallBack.js";
import onYouCallback from "../../src/sensing/onYouCallBack.js";
import onAgentsSensingCallback from "../../src/sensing/onAgentSensingCallBack.js";
import onParcelsSensingCallback from "../../src/sensing/onParcelSensingCallBack.js";
import IntentionRevisionReplace from "../../src/intentions/IntentionRevisionReplace.js";
import Plan from "../../src/plans/Plan.js";
import GoPickUp from "../../src/plans/GoPickUp.js";
import GoTo from "../../src/plans/GoTo.js";
import Patrolling from "../../src/plans/Patrolling.js";
import GoDeliver from "../../src/plans/GoDeliver.js";

export default class Agent {
    /** @type {DeliverooApi} */
    #apiClient;

    /** @type {BeliefSet} */
    #beliefSet;

    /** @type {Array<Plan>} */
    #planLibrary = [];

    /** @type {IntentionRevisionReplace} */
    #myAgent;

    /** @type {onMapCallback} */
    #onMapCallback;
    /** @type {onYouCallback} */
    #onYouCallback;
    /** @type {onAgentsSensingCallback} */
    #onAgentsSensingCallback;
    /** @type {onParcelsSensingCallback} */
    #onParcelsSensingCallback;

    /** @type {boolean} */
    #started;

    constructor(onMapCallback, onYouCallback, onAgentsSensingCallback, onParcelsSensingCallback) {
        this.#apiClient = new DeliverooApi(config.host, config.token);
        this.#beliefSet = new BeliefSet();
        this.#onMapCallback = onMapCallback;
        this.#onYouCallback = onYouCallback;
        this.#onAgentsSensingCallback = onAgentsSensingCallback;
        this.#onParcelsSensingCallback = onParcelsSensingCallback;
        this.#planLibrary.push(GoPickUp);
        this.#planLibrary.push(GoTo);
        this.#planLibrary.push(Patrolling);
        this.#planLibrary.push(GoDeliver);
        this.#myAgent = new IntentionRevisionReplace(this.#beliefSet, this.#planLibrary);
        this.#started = false;
    }

    async configure() {
        this.#apiClient.onConfig((config) => {
            this.#beliefSet.config = config;
            if (!this.#started) this.#started = true;
        });
        this.#apiClient.onMap((width, height, tiles) => {
            this.#onMapCallback(width, height, tiles, this.#beliefSet);
        });
        this.#apiClient.onYou(({ id, name, x, y, score }) => {
            this.#onYouCallback(id, name, x, y, score, this.#beliefSet);
        });
        this.#apiClient.onAgentsSensing((perceived_agents) => {
            this.#onAgentsSensingCallback(perceived_agents, this.#beliefSet);
        });
        this.#apiClient.onParcelsSensing((perceived_parcels) => {
            this.#onParcelsSensingCallback(perceived_parcels, this.#beliefSet, this.#myAgent);
        });

        this.#beliefSet.client = this.#apiClient;

        this.#myAgent.loop();
    }
}
