import { DEBUG } from "../../config.js";
import Plan from "../plans/Plan.js";
import BeliefSet from "../../types/BeliefSet.js";
import Planner from "../../types/Planner.js";

/**
 * Intention
 */
export default class Intention {
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
     * planner of the parent intention
     */
    planner;

    /**
     * predicate is in the form ['go_to', x, y]
     * @param {Array<string|number>}
     */
    #predicate;

    get predicate() {
        return this.#predicate;
    }

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
     * @param {BeliefSet} beliefSet
     * @param {Planner} planner
     */
    async achieve(beliefSet, planner = undefined) {
        // Cannot start twice
        if (this.#started) return this;
        else this.#started = true;

        if (this.predicate[0] == "go_to" && this.#parent) planner = this.#parent.planner;

        if (
            planner &&
            planner.pddl &&
            planner.is_supported_intention(this.predicate[0]) &&
            (!beliefSet.collabRole || this.predicate[0] === "go_to")
        ) {
            if (this.stopped) throw ["stopped intention", ...this.predicate];
            this.#current_plan = new Plan();

            planner.current_plan = this.#current_plan;

            try {
                const plan_res = await planner.execute(beliefSet, this.predicate);
                this.log("succesful intention", ...this.predicate, "through with pddl, result:", plan_res);
                return plan_res;
            } catch (error) {
                this.log("failed intention", ...this.predicate, "through with pddl, with error:", ...error);
            }
        } else {
            // Trying all plans in the library
            for (const planClass of planner.planLibrary) {
                // if stopped then quit
                if (this.stopped) throw ["stopped intention", ...this.predicate];

                // if plan is 'statically' applicable
                if (planClass.isApplicableTo(...this.predicate)) {
                    // plan is instantiated
                    this.#current_plan = new planClass(this.#parent, beliefSet, planner);
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
        }
        // if stopped then quit
        if (this.stopped) throw ["stopped intention", ...this.predicate];

        // no plans have been found to satisfy the intention
        // this.log( 'no plan satisfied the intention ', ...this.predicate );
        throw ["no plan satisfied the intention ", ...this.predicate];
    }
}
