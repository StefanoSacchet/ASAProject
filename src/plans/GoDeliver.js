import { nearestDelivery } from "../../utils/functions/distance.js";
import Plan from "./Plan.js";
import BeliefSet from "../../types/BeliefSet.js";

export default class GoDeliver extends Plan {
    /**
     * @param {BeliefSet} beliefSet
     * @param {Array<Plan>} planLibrary
     */
    constructor(parent, beliefSet, planLibrary) {
        super(parent, beliefSet, planLibrary);
    }

    static isApplicableTo(go_deliver) {
        return go_deliver == "go_deliver";
    }

    async execute(go_deliver) {
        let deliveryTile = nearestDelivery(this.beliefSet.me, this.beliefSet.map, this.beliefSet.graph);

        await this.subIntention(["go_to", deliveryTile.x, deliveryTile.y]);
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        await this.beliefSet.client.putdown();
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        // empty carrying
        this.beliefSet.me.carrying.clear();

        return true;
    }
}
