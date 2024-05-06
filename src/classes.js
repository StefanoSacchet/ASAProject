import { canDeliverContentInTime, findBestParcel, getCarriedRewardAndTreshold, distance } from "../utils/functions.js";
import { parcels, planLibrary } from "./intention_revision.js";
import { me, PARCEL_REWARD_AVG, config, client, DEBUG } from "./shared.js";

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
                    console.log("=========================================================");
                    console.log("Checking if intention is still valid", intention.predicate);
                    console.log("=========================================================");
                }

                // TODO maybe use a switch statement or a class-based approach
                // TODO this hard-coded implementation is an example
                if (intention.predicate[0] == "go_pick_up") {
                    let id = intention.predicate[3];
                    let p = parcels.get(id);
                    if (p && p.carriedBy) {
                        if (DEBUG) console.log("Pick up intention isn't valid anymore. Predicate:", intention.predicate);
                        this.intention_queue.shift();
                        continue;
                    }
                }
                if (intention.predicate[0] == "patrolling" && config) {
                    // control if the agent is carrying parcels and if the reward can be delivered in time
                    if (canDeliverContentInTime(me, config)) {
                        if (DEBUG) console.log("Patrolling state entered while packages can be delivered, delivering them.");
                        // go deliver
                        let new_intention = new Intention(this, ["go_deliver"]);
                        this.intention_queue.push(new_intention);
                        this.intention_queue.shift();
                        continue;
                    } else {
                        if (DEBUG) console.log("Patrolling state entered while packages carried but cannot be delivered, dropping them.");
                        // drop parcels and keep patrolling
                        await client.putdown();

                        // empty carrying
                        me.carrying.clear();
                    }
                }
                if (intention.predicate[0] == "go_deliver" && config) {
                    // if (DEBUG) console.log("me.carrying", me.carrying);
                    // control if the agent is carrying parcels and if the reward can be delivered in time
                    if (!canDeliverContentInTime(me, config) && me.carrying.size > 0) {
                        if (DEBUG) console.log("Cannot deliver carried packages anymore, dropping them.");
                        // drop parcels and keep patrolling
                        await client.putdown();

                        // empty carrying
                        me.carrying.clear();
                    }
                    
                    if (DEBUG) console.log("Checking if any new parcels can be picked up.");
                    // if new parcels are around when delivering, control if taking them gets a higher reward
                    // save current carrying
                    let me_carrying_old = new Map(me.carrying);
                    // create new carrying to insert future best parel in
                    let me_carrying_new = new Map(me.carrying);

                    // get best option (parcel)
                    let best_option = findBestParcel(me, parcels, parcels, config);
                    if (best_option && me.carrying.size < 3) {
                        if (DEBUG) console.log("Best parcel that can be picked up is:", best_option);

                        let best_option_id = best_option[3];
                        let best_option_x = best_option[1];
                        let best_option_y = best_option[2];
                        
                        let parcelExpirationDuration;
                        if (config.PARCEL_DECADING_INTERVAL == "infinite") {
                            parcelExpirationDuration = 0;
                        } else {
                            parcelExpirationDuration = parseInt(config.PARCEL_DECADING_INTERVAL.replace("s", "")) * 1000;
                        }

                        let best_option_p = parcels.get(best_option_id);
                        if(!best_option_p && DEBUG) console.log("parcel not found!!!");
                        console.log("parcels:", parcels);
                        console.log("dist:", distance({ x:best_option_x, y:best_option_y }, me));
                        console.log("expiration:", parcelExpirationDuration);
                        best_option_p.reward = best_option_p.reward * parcelExpirationDuration - distance({ x:best_option_x, y:best_option_y }, me) * 2 * config.MOVEMENT_DURATION;
                        best_option_p.reward = best_option_p.reward / 1000;
                        let best_option_reward = best_option_p.reward;

                        // set best option in new carrying
                        me_carrying_new.set(best_option_id, best_option_p);
                        me.carrying = me_carrying_new;
                        let newParcelIsDeliverable = canDeliverContentInTime(me, config);
                        let newParcelCarriedRewardAndTreshold = getCarriedRewardAndTreshold(me, config);
                        console.log("new carrying:", me.carrying);
                        console.log("deliverable in time:", newParcelIsDeliverable);
                        console.log("carried reward:", newParcelCarriedRewardAndTreshold[0]);
                        me.carrying = me_carrying_old;

                        if (newParcelIsDeliverable) {
                            // if content is still deliverable, compare the reward of the new carrying with the old one
                            let oldParcelCarriedRewardAndTreshold = getCarriedRewardAndTreshold(me, config);
                            if (DEBUG) console.log("Taking new parcel has total reward:", newParcelCarriedRewardAndTreshold);
                            if (DEBUG) console.log("Ignoring parcel has total reward:", oldParcelCarriedRewardAndTreshold);
                            if (newParcelCarriedRewardAndTreshold[0] > oldParcelCarriedRewardAndTreshold[0]) {
                                // if the new carrying has a higher reward, deliver the old parcels and pick up the new one
                                // pick up new parcel
                                let new_intention = new Intention(this, ["go_pick_up", best_option_x, best_option_y, best_option_id]);
                                this.intention_queue.push(new_intention);
                                this.intention_queue.shift();
                                if (DEBUG) console.log("A new package can be picked up. New intention:", intention);
                                continue;
                            } else {
                                if (DEBUG) console.log("New parcel would not bring better reward.");
                            }
                        }
                    }
                    
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

        let current_intention = this.intention_queue[0];
        if (current_intention.predicate[0] == "go_pick_up" && config) {
            if (canDeliverContentInTime(me, config)) {
                if (DEBUG) console.log("Picked up a package that can be delivered, going to deliver it.");
                // go deliver
                const new_intention = new Intention(this, ["go_deliver"]);
                this.intention_queue.push(new_intention);
            } 
        }
        // Force current intention stop
        if (last) {
            last.stop();
        }
    }

    async clear() {
        this.intention_queue = [];
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
