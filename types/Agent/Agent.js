import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { TopicMsgEnum } from "../Message.js";
import config from "../../config.js";
import BeliefSet from "../BeliefSet.js";
import onMapCallback from "../../src/sensing/onMapCallBack.js";
import onYouCallback from "../../src/sensing/onYouCallBack.js";
import onAgentsSensingCallback from "../../src/sensing/onAgentSensingCallBack.js";
import onParcelsSensingCallback from "../../src/sensing/onParcelSensingCallBack.js";
import onMsgCallback from "../../src/communication/onMsgCallback.js";
import IntentionRevisionReplace from "../../src/intentions/IntentionRevisionReplace.js";
import Plan from "../../src/plans/Plan.js";
import GoPickUp from "../../src/plans/GoPickUp.js";
import GoTo from "../../src/plans/GoTo.js";
import Patrolling from "../../src/plans/Patrolling.js";
import GoDeliver from "../../src/plans/GoDeliver.js";
import Message from "../Message.js";
import Shout from "../../src/plans/communicationPlans/Shout.js";
import Config from "../Config.js";

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
    /** @type {onMsgCallback} */
    #onMsgCallback;

    /** @type {boolean} */
    #started;

    /**
     * @param {onMapCallback} onMapCallback
     * @param {onYouCallback} onYouCallback
     * @param {onAgentsSensingCallback} onAgentsSensingCallback
     * @param {onParcelsSensingCallback} onParcelsSensingCallback
     * @param {onMsgCallback} onMsgCallback
     * @param {string} token
     * @param {string} handShakeKey
     * @param {string} communicationKey
     */
    constructor(
        onMapCallback,
        onYouCallback,
        onAgentsSensingCallback,
        onParcelsSensingCallback,
        onMsgCallback,
        token = undefined,
        handShakeKey = "",
        communicationKey = ""
    ) {
        if (token === undefined) token = config.token;
        this.#apiClient = new DeliverooApi(config.host, token);
        this.#beliefSet = new BeliefSet();
        this.#beliefSet.HANDSHAKE_KEY = handShakeKey;
        this.#beliefSet.COMMUNICATION_KEY = communicationKey;
        this.#onMapCallback = onMapCallback;
        this.#onYouCallback = onYouCallback;
        this.#onAgentsSensingCallback = onAgentsSensingCallback;
        this.#onParcelsSensingCallback = onParcelsSensingCallback;
        this.#onMsgCallback = onMsgCallback;
        this.#planLibrary.push(GoPickUp);
        this.#planLibrary.push(GoTo);
        this.#planLibrary.push(Patrolling);
        this.#planLibrary.push(GoDeliver);
        this.#myAgent = new IntentionRevisionReplace(this.#beliefSet, this.#planLibrary);
        this.#started = false;
    }

    async configure() {
        this.#apiClient.onConfig((config) => {
            this.#beliefSet.config = new Config(config, config.CLOCK / 1000, 0.5);
            if (!this.#started) this.#started = true;
            const msg = new Message(TopicMsgEnum.HANDSHAKE_1, this.#beliefSet.HANDSHAKE_KEY, "Hello, I am here!");
            new Shout(msg).execute(this.#beliefSet);
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
        this.#apiClient.onMsg((id, name, msg, reply) => {
            this.#onMsgCallback(id, name, msg, reply, this.#beliefSet);
        });

        this.#beliefSet.client = this.#apiClient;

        this.#myAgent.loop();
    }
}
