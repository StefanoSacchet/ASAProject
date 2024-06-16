import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";
import { TopicMsgEnum } from "../Message.js";
import config from "../../config.js";
import BeliefSet from "../BeliefSet.js";
import Planner from "../Planner.js";
import onMapCallback from "../../src/sensing/onMapCallBack.js";
import onYouCallback from "../../src/sensing/onYouCallBack.js";
import onAgentsSensingCallback from "../../src/sensing/onAgentSensingCallBack.js";
import onParcelsSensingCallback from "../../src/sensing/onParcelSensingCallBack.js";
import onMsgCallback from "../../src/communication/onMsgCallback.js";
import IntentionRevisionReplace from "../../src/intentions/IntentionRevisionReplace.js";
import Message from "../Message.js";
import Shout from "../../src/plans/communicationPlans/Shout.js";
import Config from "../Config.js";
import { nearestDelivery } from "../../utils/functions/distance.js";
import { CollabRoles } from "../Message.js";
import { distance } from "../../utils/functions/distance.js";
import { DEBUG } from "../../config.js";

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
        this.#use_pddl = true; // set this value to true/false depending if usage of pddl is wanted or not
        this.#planner = new Planner(this.#use_pddl);
        this.#beliefSet.HANDSHAKE_KEY = handShakeKey;
        this.#beliefSet.COMMUNICATION_KEY = communicationKey;
        this.#onMapCallback = onMapCallback;
        this.#onYouCallback = onYouCallback;
        this.#onAgentsSensingCallback = onAgentsSensingCallback;
        this.#onParcelsSensingCallback = onParcelsSensingCallback;
        this.#onMsgCallback = onMsgCallback;
        this.#myAgent = new IntentionRevisionReplace(this.#beliefSet, this.#planner);
        this.#started = false;
    }

    /** @param {Config} config
     * @returns {Object}
     */
    getAdditionalConfig(config) {
        const PARCEL_PROB_DECAY = 0.05;
        const PARCEL_PROB_TRHESHOLD = 0.5;
        const AGENT_PROB_DECAY = 0.1;
        const AGENT_PROB_TRHESHOLD = 0.6;

        return { PARCEL_PROB_DECAY, PARCEL_PROB_TRHESHOLD, AGENT_PROB_DECAY, AGENT_PROB_TRHESHOLD };
    }

    async loop() {
        while (true) {
            if (this.#beliefSet.graph && this.#beliefSet.me.id && this.#beliefSet.allayInfo) {
                if (this.#beliefSet.pathWithCorridors.length < 3) {
                    console.log("No path with corridors");
                    break;
                }

                // if the two agents can not reach each other don't collaborate
                let dis = distance(this.#beliefSet.me, this.#beliefSet.allayInfo, this.#beliefSet.graph);
                if (dis === 0) break;

                if (DEBUG) console.log("Distance between agents:", dis);

                // if there are a lot of reachable delivery tiles, don't collaborate
                let tmp = [];
                for (const delivery of this.#beliefSet.map.deliveryTiles.values()) {
                    dis = distance(this.#beliefSet.me, delivery, this.#beliefSet.graph);
                    if (dis !== Infinity) tmp.push(delivery);
                }
                if (tmp.length > 3) break;

                if (DEBUG) console.log("Number of reachable delivery tiles:", tmp.length);

                // loop for every delivery tile and check if they are close to each other
                if (!this.#beliefSet.isSingleCorridor) {
                    let nearTiles = [];
                    for (let i = 0; i < tmp.length - 1; i++) {
                        const delivery1 = tmp[i];
                        const delivery2 = tmp[i + 1];
                        dis = distance(delivery1, delivery2, this.#beliefSet.graph);
                        // if (dis === 0) dis = Infinity;
                        if (dis < 3) {
                            nearTiles.push(delivery1);
                        }
                    }
                    // if all the delivery tiles are close to each other don't collaborate
                    if (nearTiles.length === tmp.length - 1) break;

                    if (DEBUG) console.log("Number", nearTiles.length);
                }

                // calculate the agent closer to the delivery
                const myTile = nearestDelivery(this.#beliefSet.me, this.#beliefSet.map, this.#beliefSet.graph);
                let myDistance = distance(this.#beliefSet.me, myTile, this.#beliefSet.graph);
                // if (myDistance === 0) myDistance = Infinity;

                const allayTile = nearestDelivery(
                    this.#beliefSet.allayInfo,
                    this.#beliefSet.map,
                    this.#beliefSet.graph
                );
                let allayDistance = distance(this.#beliefSet.allayInfo, allayTile, this.#beliefSet.graph);
                // if (allayDistance === 0) allayDistance = Infinity;

                // if the two agents are at the same distance from the delivery, the one with the smallest id is the deliverer
                const myId = this.#apiClient.id;
                const allayId = this.#beliefSet.allayId;
                if (myDistance === allayDistance || (myDistance === Infinity && allayDistance === Infinity)) {
                    if (myId.localeCompare(allayId) > 0) {
                        allayDistance = 2;
                        myDistance = 1;
                    } else {
                        myDistance = 2;
                        allayDistance = 1;
                    }
                }

                // decide the role of the two agents
                if (myDistance < allayDistance) this.#beliefSet.collabRole = CollabRoles.DELIVER;
                else this.#beliefSet.collabRole = CollabRoles.PICK_UP;
                console.log("Collaboration role:", this.#beliefSet.collabRole);

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
            const msg = new Message(TopicMsgEnum.HANDSHAKE_1, this.#beliefSet.HANDSHAKE_KEY, "Hello, I am here!");
            new Shout(msg).execute(this.#beliefSet);
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
            this.#onMsgCallback(id, name, msg, reply, this.#beliefSet, this.#myAgent);
        });

        this.#beliefSet.client = this.#apiClient;

        this.loop();
        this.#myAgent.loop();
    }
}
