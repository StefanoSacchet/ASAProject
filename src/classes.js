import { parcels, planLibrary } from "./intention_revision.js";
import { me, PARCEL_REWARD_AVG, config, DEBUG } from "./shared.js";

/**
 * Intention revision loop
 */
export class IntentionRevision {
    #intention_queue = new Array();
    get intention_queue() {
        return this.#intention_queue;
    }

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
                    console.log("=====================================");
                    console.log("Checking if intention is still valid", intention.predicate);
                    console.log("=====================================");
                }

                // TODO maybe use a switch statement or a class-based approach
                // TODO this hard-coded implementation is an example
                if (intention.predicate[0] == "go_pick_up") {
                    let id = intention.predicate[3];
                    let p = parcels.get(id);
                    if (p && p.carriedBy) {
                        if (DEBUG) console.log("Skipping intention because no more valid", intention.predicate);
                        continue;
                    }
                } else if (intention.predicate[0] == "patrolling" && config) {
                    let carriedQty = me.carrying.size;
                    const TRESHOLD = (carriedQty * config.PARCEL_REWARD_AVG) / 2;
                    let carriedReward = 0;
                    if (me.carrying.size > 0) {
                        carriedReward = Array.from(me.carrying.values()).reduce(
                            (acc, parcel) => parseInt(acc) + parseInt(parcel.reward),
                            0
                        );
                        if (DEBUG) console.log("checking carried parcels: ", carriedReward, "TRESHOLD: ", TRESHOLD);
                    }
                    // control if the agent is carrying parcels and if the reward can be delivered in time
                }

                // Start achieving intention
                await intention
                    .achieve()
                    // Catch eventual error and continue
                    .catch((error) => {
                        // if (DEBUG) console.log("Failed intention", ...intention.predicate, "with error:", ...error);
                    });

                // Remove from the queue
                this.intention_queue.shift();
            } else {
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

class IntentionRevisionQueue extends IntentionRevision {
    async push(predicate) {
        // Check if already queued
        if (this.intention_queue.find((i) => i.predicate.join(" ") == predicate.join(" "))) return; // intention is already queued

        if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);
    }
}

export class IntentionRevisionReplace extends IntentionRevision {
    async push(predicate) {
        // Check if already queued
        const last = this.intention_queue.at(this.intention_queue.length - 1);
        if (last && last.predicate.join(" ") == predicate.join(" ")) {
            return; // intention is already being achieved
        }

        if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);

        // Force current intention stop
        if (last) {
            last.stop();
        }
    }
}

class IntentionRevisionRevise extends IntentionRevision {
    async push(predicate) {
        if (DEBUG) console.log("Revising intention queue. Received", ...predicate);
        // TODO
        // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
        // - eventually stop current one
        // - evaluate validity of intention
        // Check if already queued
        const last = this.intention_queue.at(this.intention_queue.length - 1);
        if (last && last.predicate.join(" ") == predicate.join(" ")) {
            return; // intention is already being achieved
        }

        if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);

        // Force current intention stop
        if (last) {
            last.stop();
        }
    }
}

/**
 * Intention
 */
export class Intention {
    // Plan currently used for achieving the intention
    #current_plan;

    // This is used to stop the intention
    #stopped = false;
    get stopped() {
        return this.#stopped;
    }
    stop() {
        // this.log( 'stop intention', ...this.#predicate );
        this.#stopped = true;
        if (this.#current_plan) this.#current_plan.stop();
    }

    /**
     * #parent refers to caller
     */
    #parent;

    /**
     * predicate is in the form ['go_to', x, y]
     */
    get predicate() {
        return this.#predicate;
    }
    #predicate;

    constructor(parent, predicate) {
        this.#parent = parent;
        this.#predicate = predicate;
    }

    log(...args) {
        if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
        else if (DEBUG) console.log(...args);
    }

    #started = false;
    /**
     * Using the plan library to achieve an intention
     */
    async achieve() {
        // Cannot start twice
        if (this.#started) return this;
        else this.#started = true;

        // Trying all plans in the library
        for (const planClass of planLibrary) {
            // if stopped then quit
            if (this.stopped) throw ["stopped intention", ...this.predicate];

            // if plan is 'statically' applicable
            if (planClass.isApplicableTo(...this.predicate)) {
                // plan is instantiated
                this.#current_plan = new planClass(this.parent);
                this.log("achieving intention", ...this.predicate, "with plan", planClass.name);
                // and plan is executed and result returned
                try {
                    const plan_res = await this.#current_plan.execute(...this.predicate);
                    this.log(
                        "succesful intention",
                        ...this.predicate,
                        "with plan",
                        planClass.name,
                        "with result:",
                        plan_res
                    );
                    return plan_res;
                    // or errors are caught so to continue with next plan
                } catch (error) {
                    this.log(
                        "failed intention",
                        ...this.predicate,
                        "with plan",
                        planClass.name,
                        "with error:",
                        ...error
                    );
                }
            }
        }

        // if stopped then quit
        if (this.stopped) throw ["stopped intention", ...this.predicate];

        // no plans have been found to satisfy the intention
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ["no plan satisfied the intention ", ...this.predicate];
    }
}

/**
 * Plan library
 */
export class Plan {
    // This is used to stop the plan
    #stopped = false;
    stop() {
        // this.log( 'stop plan' );
        this.#stopped = true;
        for (const i of this.#sub_intentions) {
            i.stop();
        }
    }
    get stopped() {
        return this.#stopped;
    }

    /**
     * #parent refers to caller
     */
    #parent;

    constructor(parent) {
        this.#parent = parent;
    }

    log(...args) {
        if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
        else if (DEBUG) console.log(...args);
    }

    // this is an array of sub intention. Multiple ones could eventually being achieved in parallel.
    #sub_intentions = [];

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate);
        this.#sub_intentions.push(sub_intention);
        return await sub_intention.achieve();
    }
}
