import { DEBUG } from "../../config.js";
import { canDeliverContentInTime } from "../../utils/functions/parcelManagement.js";
import Intention from "./Intention.js";
import IntentionRevision from "./IntentionRevision.js";
import Plan from "../plans/Plan.js";

export default class IntentionRevisionReplace extends IntentionRevision {
    /**
     * @param {BeliefSet} beliefSet
     * @param {Array<Plan>} planLibrary
     * @param {Planner} planner
     */
    constructor(beliefSet, planLibrary, planner) {
        super(beliefSet, planLibrary, planner);
    }

    async push(predicate) {
        // Check if already queued
        const last = this.intention_queue.at(this.intention_queue.length - 1);
        if (last && last.predicate.join(" ") == predicate.join(" ")) {
            return; // intention is already being achieved
        }

        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);

        const current_intention = this.intention_queue[0];
        if (current_intention.predicate[0] == "go_pick_up") {
            if (
                canDeliverContentInTime(
                    this.beliefSet.me,
                    this.beliefSet.map,
                    this.beliefSet.graph,
                    this.beliefSet.config
                )
            ) {
                if (DEBUG) console.log("Picked up a package that can be delivered, going to deliver it");
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
}
