import { nearestDelivery } from "../../utils/functions/distance.js";
import Plan from "./Plan.js";
import BeliefSet from "../../types/BeliefSet.js";
import { CollabRoles, TopicMsgEnum } from "../../types/Message.js";
import { GridNode, astar } from "../../utils/astar.js";
import Message from "../../types/Message.js";
import Say from "./communicationPlans/Say.js";

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

    /**
     * @param {Array<GridNode>} path
     * @returns {GridNode}
     */
    findDeliveryTileBeforeCorridor(path) {
        // for every tile in the path check if it is a corridor by looking at the graph and see if there are 3 or more neighbors
        for (let i = path.length - 1; i >= 0; i--) {
            const tile = path[i];
            let neighbors = 0;
            if (tile.x > 0 && this.beliefSet.graph.grid[tile.x - 1][tile.y].weight > 0) neighbors++;
            if (tile.x < this.beliefSet.map.width - 1 && this.beliefSet.graph.grid[tile.x + 1][tile.y].weight > 0)
                neighbors++;
            if (tile.y > 0 && this.beliefSet.graph.grid[tile.x][tile.y - 1].weight > 0) neighbors++;
            if (tile.y < this.beliefSet.map.height - 1 && this.beliefSet.graph.grid[tile.x][tile.y + 1].weight > 0)
                neighbors++;
            if (neighbors > 2) return tile;
        }
    }

    async execute(go_deliver) {
        let deliveryTile = nearestDelivery(this.beliefSet.me, this.beliefSet.map, this.beliefSet.graph);

        //   the agent with pick_up role is the master
        if (this.beliefSet.collabRole === CollabRoles.PICK_UP) {
            let x = Math.round(this.beliefSet.me.x);
            let y = Math.round(this.beliefSet.me.y);
            const start = this.beliefSet.graph.grid[x][y];
            const end = this.beliefSet.graph.grid[deliveryTile.x][deliveryTile.y];
            /** @type {Array<GridNode>} */
            const path = astar.search(this.beliefSet.graph, start, end);
            if (path.length === 0) {
                const msg = new Message(TopicMsgEnum.NEW_INTENTION, this.beliefSet.COMMUNICATION_KEY, ["go_deliver"]);
                await new Say(this.beliefSet.allayId, msg).execute(this.beliefSet);
                // if no path found then quit
                throw ["no path found"];
            }
            deliveryTile = this.findDeliveryTileBeforeCorridor(path); // delivery tile just before the corridor
            if (!deliveryTile) deliveryTile = path[Math.round(path.length / 2) - 1]; // middle of the path

            if (this.beliefSet.isSingleCorridor) {
                deliveryTile = path[Math.round(path.length / 2) - 1]; // middle of the path
            }

            // tell the other agent to go pick up the parcel
            const intention = [
                "go_pick_up",
                deliveryTile.x,
                deliveryTile.y,
                this.beliefSet.me.carrying.values().next().value.id,
            ];
            const msg = new Message(TopicMsgEnum.NEW_INTENTION, this.beliefSet.COMMUNICATION_KEY, intention);
            await new Say(this.beliefSet.allayId, msg).execute(this.beliefSet);
        }

        await this.subIntention(["go_to", deliveryTile.x, deliveryTile.y]);
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        await this.beliefSet.client.putdown();
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        // empty carrying
        this.beliefSet.me.carrying.clear();

        if (this.beliefSet.collabRole === CollabRoles.PICK_UP && this.beliefSet.isSingleCorridor) {
            await this.subIntention(["patrolling"]);
        }

        // await this.subIntention(["patrolling"]);

        return true;
    }
}
