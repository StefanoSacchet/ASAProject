import { DEBUG } from "../../config.js";
import { canDeliverContentInTime } from "../../utils/functions/parcelManagement.js";
import Intention from "./Intention.js";
import IntentionRevision from "./IntentionRevision.js";
import Plan from "../plans/Plan.js";

export default class IntentionRevisionReplace extends IntentionRevision {
    /**
     * @param {BeliefSet} beliefSet
     * @param {Array<Plan>} planLibrary
     */
    constructor(beliefSet, planLibrary) {
        super(beliefSet, planLibrary);
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

    // async clear() {
    //     this.intention_queue.forEach((i) => i.stop());
    //     this.intention_queue = [];
    // }
}

//* Other possible implementations

class IntentionRevisionQueue extends IntentionRevision {
    async push(predicate) {
        // Check if already queued
        if (this.intention_queue.find((i) => i.predicate.join(" ") == predicate.join(" "))) return; // intention is already queued

        if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
        const intention = new Intention(this, predicate);
        this.intention_queue.push(intention);
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
