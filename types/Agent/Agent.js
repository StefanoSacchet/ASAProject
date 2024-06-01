import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import config from "../../config.js";
import BeliefSet from "../BeliefSet.js";
import Planner from "../Planner.js";
import onMapCallback from "../../src/sensing/onMapCallBack.js";
import onYouCallback from "../../src/sensing/onYouCallBack.js";
import onAgentsSensingCallback from "../../src/sensing/onAgentSensingCallBack.js";
import onParcelsSensingCallback from "../../src/sensing/onParcelSensingCallBack.js";
import onMsgCallback from "../../src/communication/onMsgCallback.js";
import IntentionRevisionReplace from "../../src/intentions/IntentionRevisionReplace.js";

export default class Agent {
    /** @type {DeliverooApi} */
    #apiClient;

    /** @type {BeliefSet} */
    #beliefSet;

    /** @type {Planner} */
    #planner;

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
    /** @type {onMsgCallback} */
    #onMsgCallback;

    /** @type {boolean} */
    #started;

    /** @type {boolean} */
    #use_pddl;

    /**
     * @param {onMapCallback} onMapCallback
     * @param {onYouCallback} onYouCallback
     * @param {onAgentsSensingCallback} onAgentsSensingCallback
     * @param {onParcelsSensingCallback} onParcelsSensingCallback
     * @param {onMsgCallback} onMsgCallback
     * @param {string} token
     * @param {string} communicationKey
     */
    constructor(
        onMapCallback,
        onYouCallback,
        onAgentsSensingCallback,
        onParcelsSensingCallback,
        onMsgCallback,
        token = undefined,
        communicationKey = ""
    ) {
        if (token === undefined) token = config.token;
        this.#apiClient = new DeliverooApi(config.host, token);
        this.#beliefSet = new BeliefSet();
        this.#use_pddl = true;     // set this value to true/false depending if usage of pddl is wanted or not
        this.#planner = new Planner(this.#use_pddl);
        this.#beliefSet.communicationKey = communicationKey;
        this.#onMapCallback = onMapCallback;
        this.#onYouCallback = onYouCallback;
        this.#onAgentsSensingCallback = onAgentsSensingCallback;
        this.#onParcelsSensingCallback = onParcelsSensingCallback;
        this.#onMsgCallback = onMsgCallback;
        this.#myAgent = new IntentionRevisionReplace(this.#beliefSet, this.#planner);
        this.#started = false;
    }

    async configure() {
        this.#apiClient.onConfig((config) => {
            this.#beliefSet.config = config;
            if (!this.#started) this.#started = true;
            // this.#beliefSet.client.shout("Hello, I am here!");
        });
        this.#apiClient.onMap((width, height, tiles) => {
            this.#onMapCallback(width, height, tiles, this.#beliefSet, this.#planner);
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
        this.#apiClient.onMsg((id, name, msg, reply) => {
            this.#onMsgCallback(id, name, msg, reply, this.#beliefSet);
        });

        this.#beliefSet.client = this.#apiClient;

        this.#myAgent.loop();
    }
}
