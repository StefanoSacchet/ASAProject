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
import { nearestDelivery } from "../../utils/functions/distance.js";
import { astar } from "../../utils/astar.js";
import { CollabRoles } from "../Message.js";

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

    /** @param {Config} config
     * @returns {Object}
     */
    getAdditionalConfig(config) {
        const PARCEL_PROB_DECAY = config.CLOCK / 1000;
        const PARCEL_PROB_TRHESHOLD = 0.5;
        const AGENT_PROB_DECAY = 0.1;
        const AGENT_PROB_TRHESHOLD = 0.6;

        return { PARCEL_PROB_DECAY, PARCEL_PROB_TRHESHOLD, AGENT_PROB_DECAY, AGENT_PROB_TRHESHOLD };
    }

    async loop() {
        while (true) {
            if (
                this.#beliefSet.pathWithCorridors?.length > 0 &&
                this.#beliefSet.graph &&
                this.#beliefSet.me.id &&
                this.#beliefSet.allayInfo
            ) {
                // if the two agents can not reach each other don't collaborate
                let start =
                    this.#beliefSet.graph.grid[Math.round(this.#beliefSet.me.x)][Math.round(this.#beliefSet.me.y)];
                let end =
                    this.#beliefSet.graph.grid[Math.round(this.#beliefSet.allayInfo.x)][
                        Math.round(this.#beliefSet.allayInfo.y)
                    ];
                const path = astar.search(this.#beliefSet.graph, start, end);
                if (path.length === 0) break;

                // calculate the agent closer to the delivery
                const myTile = nearestDelivery(this.#beliefSet.me, this.#beliefSet.map, this.#beliefSet.graph);
                start = this.#beliefSet.graph.grid[Math.round(this.#beliefSet.me.x)][Math.round(this.#beliefSet.me.y)];
                end = this.#beliefSet.graph.grid[myTile.x][myTile.y];
                const myDistance = astar.search(this.#beliefSet.graph, start, end);

                const allayTile = nearestDelivery(
                    this.#beliefSet.allayInfo,
                    this.#beliefSet.map,
                    this.#beliefSet.graph
                );
                start =
                    this.#beliefSet.graph.grid[Math.round(this.#beliefSet.allayInfo.x)][
                        Math.round(this.#beliefSet.allayInfo.y)
                    ];
                end = this.#beliefSet.graph.grid[allayTile.x][allayTile.y];
                const allayDistance = astar.search(this.#beliefSet.graph, start, end);

                if (myDistance.length < allayDistance.length) this.#beliefSet.collabRole = CollabRoles.DELIVER;
                else this.#beliefSet.collabRole = CollabRoles.PICK_UP;

                break;
            }

            // Postpone next iteration at setImmediate
            await new Promise((res) => setImmediate(res));
        }
    }

    async configure() {
        this.#apiClient.onConfig((config) => {
            const { PARCEL_PROB_DECAY, PARCEL_PROB_TRHESHOLD, AGENT_PROB_DECAY, AGENT_PROB_TRHESHOLD } =
                this.getAdditionalConfig(config);
            this.#beliefSet.config = new Config(
                config,
                PARCEL_PROB_DECAY,
                PARCEL_PROB_TRHESHOLD,
                AGENT_PROB_DECAY,
                AGENT_PROB_TRHESHOLD
            );
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
            this.#onMsgCallback(id, name, msg, reply, this.#beliefSet, this.#myAgent);
        });

        this.#beliefSet.client = this.#apiClient;

        this.loop();
        this.#myAgent.loop();
    }
}
