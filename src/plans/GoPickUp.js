import { DEBUG } from "../../config.js";
import Plan from "./Plan.js";
import BeliefSet from "../../types/BeliefSet.js";

export default class GoPickUp extends Plan {
    /**
     * @param {BeliefSet} beliefSet
     * @param {Planner} planner
     */
    constructor(parent, beliefSet, planner=undefined) {
        super(parent, beliefSet, planner);
    }

    static isApplicableTo(go_pick_up, x, y, id) {
        return go_pick_up == "go_pick_up";
    }

    async execute(go_pick_up, x, y, id) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit
        let go_to = await this.subIntention(["go_to", x, y]);
        if (this.stopped) throw ["stopped"];
        let pickup = await this.beliefSet.client.pickup();
        if (this.stopped) throw ["stopped"];
        if (go_to && !(pickup == []) && pickup.length > 0) {
            if (DEBUG) console.log("Gopickup", go_to, pickup);
            // if (DEBUG) console.log("picked up", id);
            this.beliefSet.me.carrying.set(id, this.beliefSet.parcels.get(id));
            this.beliefSet.parcels.get(id).carriedBy = this.beliefSet.me.id;
            // const carriedArray = getCarriedRewardAndTreshold(me, config);
            // const carriedReward = carriedArray[0];
            // const TRESHOLD = carriedArray[1];

            // // go deliver
            // if (carriedReward > TRESHOLD && TRESHOLD !== 0) {
            //     // if (DEBUG) console.log("go_deliver");
            //     myAgent.push(["go_deliver"]);
            //     return;
            // }
            return true;
        } else if (DEBUG) {
            console.log("pickup failed");
        }
    }
}
