import { DEBUG } from "../../config.js";
import { nearestDelivery } from "../../utils/functions/distance.js";
import { canDeliverContentInTime, findAndPickUpNearParcels } from "../../utils/functions/parcelManagement.js";
import Intention from "./Intention.js";
import Plan from "../plans/Plan.js";
import BeliefSet from "../../types/BeliefSet.js";
import Planner from "../../types/Planner.js";

/**
 * Intention revision loop
 */
export default class IntentionRevision {
    /** @type {BeliefSet} */
    beliefSet;
    /** @type {Planner} */
    planner;

    /**
     * @param {BeliefSet} beliefSet
     * @param {Planner} planner
     */
    constructor(beliefSet, planner=undefined) {
        this.beliefSet = beliefSet;
        this.planner = planner;
    }

    /**
     * #intention_queue is an array of intentions to be achieved
     * @type {Array<Intention>}
     */
    #intention_queue = new Array();

    get intention_queue() {
        return this.#intention_queue;
    }
    set intention_queue(value) {
        this.#intention_queue = value;
    }

    idle = ["patrolling"];

    async loop() {
        while (true) {
            // Consumes intention_queue if not empty
            if (this.intention_queue.length > 0) {
                if (DEBUG)
                    console.log(
                        "intentionRevision.loop",
                        this.intention_queue.map((i) => i.predicate)
                    );

                // Current intention
                const intention = this.intention_queue[0];

                // Is queued intention still valid? Do I still want to achieve it?
                // TODO: cases for which intention is no more valid
                // 1) parcel can no longer be delivered in time (another agent is closer)
                // 2) goto intention will be blocked by an agent standing in the way (?)
                if (DEBUG) {
                    console.log("=========================================================");
                    console.log("Checking if intention is still valid", intention.predicate);
                    console.log("=========================================================");
                }

                //? maybe use a switch statement or a class-based approach
                switch (intention.predicate[0]) {
                    case "go_pick_up": {
                        let id = intention.predicate[3];
                        let p = this.beliefSet.parcels.get(id);
                        if (p && p.carriedBy) {
                            if (DEBUG)
                                console.log("Pick up intention isn't valid anymore. Predicate:", intention.predicate);
                            this.intention_queue.shift();
                            continue;
                        }
                        break;
                    }
                    case "patrolling": {
                        // check if new parcels have spawned near the agent
                        const new_intention = findAndPickUpNearParcels(
                            this.beliefSet.me,
                            this.beliefSet.parcels,
                            this.beliefSet.config,
                            this.beliefSet.map,
                            this.beliefSet.graph
                        );
                        if (new_intention) {
                            this.intention_queue.push(new_intention);
                            this.intention_queue.shift();
                            continue;
                        }
                        // control if the agent is carrying parcels and if the reward can be delivered in time
                        if (
                            this.beliefSet.me.carrying.size > 0 &&
                            canDeliverContentInTime(
                                this.beliefSet.me,
                                this.beliefSet.map,
                                this.beliefSet.graph,
                                this.beliefSet.config
                            )
                        ) {
                            if (DEBUG)
                                console.log(
                                    "Patrolling state entered while packages can be delivered, delivering them."
                                );
                            // go deliver
                            let new_intention = new Intention(this, ["go_deliver"]);
                            this.intention_queue.push(new_intention);
                            this.intention_queue.shift();
                            continue;
                        } else {
                            if (DEBUG)
                                console.log("Patrolling state entered while packages carried but cannot be delivered");
                            // drop parcels and keep patrolling
                            // await client.putdown();
                            // empty carrying
                            // me.carrying.clear();
                            // this.intention_queue.shift();
                            // continue;
                        }
                        break;
                    }
                    case "go_deliver": {
                        // control if the agent is carrying parcels and if the reward can be delivered in time
                        // if (!canDeliverContentInTime(me, config) && me.carrying.size > 0) {
                        //     if (DEBUG) console.log("Cannot deliver carried packages anymore, dropping them.");
                        //     // drop parcels and keep patrolling
                        //     await client.putdown();
                        //     // empty carrying
                        //     me.carrying.clear();
                        //     this.intention_queue.shift();
                        //     continue;
                        // }
                        const new_intention = findAndPickUpNearParcels(
                            this.beliefSet.me,
                            this.beliefSet.parcels,
                            this.beliefSet.config,
                            this.beliefSet.map,
                            this.beliefSet.graph
                        );
                        if (new_intention) {
                            this.intention_queue.push(new_intention);
                            this.intention_queue.shift();
                            continue;
                        }
                        break;
                    }
                    default:
                        break;
                }

                // Start achieving intention
                await intention
                    .achieve(this.beliefSet, this.planner)
                    // Catch eventual error and continue
                    .catch((error) => {
                        if (DEBUG) console.log("Failed intention", ...intention.predicate, "with error:", error);
                    });

                // Remove from the queue
                this.intention_queue.shift();
            } else if (this.beliefSet.me.id) {
                this.push(this.idle);
            }

            // Postpone next iteration at setImmediate
            await new Promise((res) => setImmediate(res));
        }
    }

    // async push ( predicate ) { }

    log(...args) {
        if (DEBUG) console.log(...args);
    }
}
