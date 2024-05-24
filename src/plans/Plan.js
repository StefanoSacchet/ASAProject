import { DEBUG } from "../../config.js";
import BeliefSet from "../../types/BeliefSet.js";
import Intention from "../intentions/Intention.js";

/**
 * Plan library
 */
export default class Plan {
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

    /**
     * @param {BeliefSet} beliefSet
     * @param {Array<Plan>} planLibrary
     */
    constructor(parent, beliefSet, planLibrary) {
        this.#parent = parent;
        this.beliefSet = beliefSet;
        this.planLibrary = planLibrary;
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
        return await sub_intention.achieve(this.planLibrary, this.beliefSet);
    }
}
