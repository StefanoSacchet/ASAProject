import { astar } from "../../utils/astar.js";
import Plan from "./Plan.js";
import BeliefSet from "../../types/BeliefSet.js";
import { CollabRoles } from "../../types/Message.js";

export default class GoTo extends Plan {
    /**
     * @param {BeliefSet} beliefSet
     * @param {Planner} planner
     */
    constructor(parent, beliefSet, planner=undefined) {
        super(parent, beliefSet, planner);
    }

    isAboveDelivery() {
        if (this.beliefSet.me.carrying.size > 0) {
            for (const deliveryTile of this.beliefSet.map.deliveryTiles.values()) {
                if (this.beliefSet.me.x == deliveryTile.x && this.beliefSet.me.y == deliveryTile.y) return true;
            }
        }
        return false;
    }

    isAbovePickup() {
        for (const parcel of this.beliefSet.parcels.values()) {
            if (parcel.x == this.beliefSet.me.x && parcel.y == this.beliefSet.me.y) return parcel;
        }
        return false;
    }

    updateGraph() {
        this.beliefSet.map.tiles.forEach((tile) => {
            this.beliefSet.graph.grid[tile.x][tile.y].weight = 1;
        });
        // remove tiles where there is an agent
        this.beliefSet.agents.forEach((agent) => {
            // check if value is .6 or .4
            const x = Math.round(agent.x);
            const y = Math.round(agent.y);
            this.beliefSet.graph.grid[x][y].weight = 0;
        });
    }

    static isApplicableTo(go_to, x, y) {
        return go_to == "go_to";
    }

    async execute(go_to, x, y) {
        if (this.stopped) throw ["stopped"]; // if stopped then quit

        this.updateGraph();

        const start = this.beliefSet.graph.grid[this.beliefSet.me.x][this.beliefSet.me.y];
        const end = this.beliefSet.graph.grid[x][y];
        const res = astar.search(this.beliefSet.graph, start, end); // A* search

        if (res.length == 0 && (this.beliefSet.me.x != x || this.beliefSet.me.y != y)) throw ["no path found"]; // if no path found then quit

        let status_x = false;
        let status_y = false;

        // move to each node in the path
        for (let i = 0; i < res.length; i++) {
            if (this.isAboveDelivery()) {
                this.beliefSet.client.putdown();
                this.beliefSet.me.carrying.clear();
            }
            if (this.beliefSet.collabRole === CollabRoles.DELIVER || !this.beliefSet.collabRole) {
                const parcel = this.isAbovePickup();
                if (parcel) {
                    this.beliefSet.client.pickup();
                    this.beliefSet.me.carrying.set(parcel.id, parcel);
                }
            }

            if (this.stopped) throw ["stopped"]; // if stopped then quit
            let next = res[i];
            if (next.x > this.beliefSet.me.x) status_x = await this.beliefSet.client.move("right");
            else if (next.x < this.beliefSet.me.x) status_x = await this.beliefSet.client.move("left");
            if (next.y > this.beliefSet.me.y) status_y = await this.beliefSet.client.move("up");
            else if (next.y < this.beliefSet.me.y) status_y = await this.beliefSet.client.move("down");

            if (status_x) this.beliefSet.me.x = next.x;
            if (status_y) this.beliefSet.me.y = next.y;
        }

        if (this.beliefSet.me.x == x && this.beliefSet.me.y == y) return true;
        else throw ["no path found"];
    }
}
