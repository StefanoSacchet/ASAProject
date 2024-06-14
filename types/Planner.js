import Plan from "../src/plans/Plan.js";
import GoPickUp from "../src/plans/GoPickUp.js";
import GoTo from "../src/plans/GoTo.js";
import Patrolling from "../src/plans/Patrolling.js";
import GoDeliver from "../src/plans/GoDeliver.js";
import { getByValue } from "../utils/functions/gameMap_utils.js";
import { nearestDelivery } from "../utils/functions/distance.js";
import { DEBUG } from "../config.js";
import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver } from "@unitn-asa/pddl-client";
import BeliefSet from "./BeliefSet.js";
import { CollabRoles } from "./Message.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readFile(filePath) {
    filePath = path.join(__dirname, filePath);

    return new Promise((res, rej) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) rej(err);
            else res(data);
        });
    });
}

class PddlAction_custom extends PddlAction {
    beliefSet;
    constructor(beliefSet, ...args) {
        super(args);
        this.beliefSet = beliefSet;
    }
}

export default class Planner {
    /** @type {Array<Plan>} */
    planLibrary = [];

    /** @type {boolean} */
    pddl;

    /** @type {string} */
    domain;

    /** @type {PddlProblem} */
    problem;

    /** @type {PddlExecutor} */
    executor;

    /** @type {string} */
    map_init_pddlstring;

    /** @type {string} */
    objects_init_pddlstring;

    /** @type {string} */
    map_init_pddlstring_backup;

    /** @type {string} */
    objects_init_pddlstring_backup;

    /** @type {string} */
    goal_pddlstring;

    /** @type {Array<string>} */
    // supported_intentions = ["go_to", "go_deliver", "go_pick_up"];
    supported_intentions = ["go_to"];

    current_plan;

    plan;

    id;

    constructor(pddl) {
        this.planLibrary.push(GoDeliver);
        this.planLibrary.push(GoPickUp);
        this.planLibrary.push(GoTo);
        this.planLibrary.push(Patrolling);

        this.pddl = pddl;

        readFile("../pddl/domain-deliveroo.pddl")
            .then((data) => {
                // console.log('File content:', data);
                this.domain = data;
                if (DEBUG) console.log("Domain read successfully.");
            })
            .catch((err) => {
                if (DEBUG) console.error("Error reading file:", err);
            });

        this.map_init_pddlstring = "";
        this.objects_init_pddlstring = "";
        this.goal_pddlstring = "";
    }

    is_supported_intention(predicate) {
        return this.supported_intentions.find((p) => p === predicate) != undefined;
    }

    add_agent_position(beliefSet) {
        // add agent position
        const x = Math.round(beliefSet.me.x);
        const y = Math.round(beliefSet.me.y);
        var tile = getByValue(beliefSet.map.tiles, [x, y]);
        this.map_init_pddlstring += `(is_at tile_${tile}) `;
    }

    add_tiles_blocked_by_agents(beliefSet) {
        // remove tiles where there is an agent
        beliefSet.agents.forEach((agent) => {
            // check if value is .6 or .4
            const x = Math.round(agent.x);
            const y = Math.round(agent.y);
            var tile = getByValue(beliefSet.map.tiles, [x, y]);
            this.map_init_pddlstring += `(is_blocked tile_${tile}) `;
        });
    }

    /** @param {BeliefSet} beliefSet */
    set_goal_pddlstring(beliefSet, predicate) {
        var dest_tile = getByValue(beliefSet.map.tiles, [predicate[1], predicate[2]]);

        switch (predicate[0]) {
            case "go_to":
                this.goal_pddlstring = `and (is_at tile_${dest_tile})`;
                break;
            case "go_deliver":
                let deliveryTile = nearestDelivery(beliefSet.me, beliefSet.map, beliefSet.graph, beliefSet.agents);
                var dest_tile = getByValue(beliefSet.map.tiles, [deliveryTile.x, deliveryTile.y]);
                this.goal_pddlstring = `and (delivered_at parcel tile_${dest_tile})`;
                this.map_init_pddlstring += `(carrying parcel)`;
                break;
            case "go_pick_up":
                this.id = predicate[3];
                this.map_init_pddlstring += `(parcel_at parcel tile_${dest_tile}) `;
                this.goal_pddlstring = `and (carrying parcel)`;
                break;
            default:
                throw "Predicate not supported";
                break;
        }
    }

    /** @param {BeliefSet} beliefSet */
    async execute_action(action, beliefSet) {
        try {
            var res = true;
            let status_x = 0;
            let status_y = 0;
            switch (action) {
                case "move_right":
                    res = await beliefSet.client.move("right");
                    if (res) status_x = 1;
                    break;
                case "move_left":
                    res = await beliefSet.client.move("left");
                    if (res) status_x = -1;
                    break;
                case "move_up":
                    res = await beliefSet.client.move("up");
                    status_y = 1;
                    break;
                case "move_down":
                    res = await beliefSet.client.move("down");
                    status_y = -1;
                    break;
                case "pickup":
                    let pickup = await beliefSet.client.pickup();
                    console.log(pickup);
                    if (!(pickup == []) && pickup.length > 0) {
                        beliefSet.me.carrying.set(this.id, beliefSet.parcels.get(this.id));
                        beliefSet.parcels.get(this.id).carriedBy = beliefSet.me.id;
                        if (DEBUG) console.log("picked up", this.id);
                    }
                    break;
                case "putdown":
                    await beliefSet.client.putdown();
                    await beliefSet.me.carrying.clear();
                    break;
            }
            if (!res) throw ["Action failed"];
            else {
                beliefSet.me.x += status_x;
                beliefSet.me.y += status_y;
            }
        } catch (error) {
            throw ["Error while executing action with error:", error];
        }
    }

    // isAboveDelivery(beliefSet) {
    //     if (beliefSet.me.carrying.size > 0) {
    //         for (const deliveryTile of beliefSet.map.deliveryTiles.values()) {
    //             if (beliefSet.me.x == deliveryTile.x && beliefSet.me.y == deliveryTile.y) return true;
    //         }
    //     }
    //     return false;
    // }

    async isAbovePickup(beliefSet) {
        for (const parcel of beliefSet.parcels.values()) {
            // round down to nearest integer my position
            if (parcel.x == beliefSet.me.x && parcel.y == beliefSet.me.y) {
                let pickup = await beliefSet.client.pickup();
                // console.log(pickup);
                // console.log(beliefSet.me.x, beliefSet.me.y);
                // console.log(parcel.x, parcel.y);
                await beliefSet.me.carrying.set(parcel.id, parcel);
            }
        }
    }

    async plan_to_actions(plan, beliefSet) {
        if (!plan) return;

        var previousStepGoals = [];

        for (const step of plan) {
            if (this.current_plan.stopped) throw ["stopped"]; // if stopped then quit
            if (step.parallel) {
                if (DEBUG) console.log("Starting concurrent step", step.action, ...step.args);
            } else {
                await Promise.all(previousStepGoals).catch((err) => {
                    throw [err];
                });
                previousStepGoals = [];
                if (DEBUG) console.log("Starting sequential step", step.action, ...step.args);
            }

            let action = step.action.toLowerCase();
            // if ( !action || !action.executor ) {
            //     console.error( new Error("No executor for pddlAction" + step.action + ". Skip and continue with next plan step.") )
            //     continue;
            // }

            try {
                // console.log("Executing action");
                var exec = this.execute_action(action, beliefSet);
                if (exec && exec.catch) {
                    exec.catch((err) => {
                        // throw [err];
                        console.error("An error occurred:", err);
                        return false;
                    }); //new Error('Step failed');
                    previousStepGoals.push(exec);
                } else {
                    previousStepGoals.push(Promise.resolve());
                }
            } catch (error) {
                if (DEBUG) console.log("Error while executing action", action, "with error", error);
                return false;
                throw ("Error while executing action", action, "with error", error);
            }

            // if (this.isAboveDelivery(beliefSet)) {
            //     beliefSet.client.putdown();
            //     beliefSet.me.carrying.clear();
            // }
            if (beliefSet.collabRole === CollabRoles.DELIVER || !beliefSet.collabRole) {
                await this.isAbovePickup(beliefSet);
                // console.log(parcel);
                // if (parcel) {
                //     beliefSet.client.pickup();
                //     beliefSet.me.carrying.set(parcel.id, parcel);
                // }
            }
        }

        // console.log("In planner, waiting for last steps to complete");
        // wait for last steps to complete before finish blackbox plan execution intention
        await Promise.all(previousStepGoals).catch((err) => {
            throw [err];
        });
        return true;
    }

    async execute(beliefSet, predicate) {
        try {
            // restore beliefs
            this.map_init_pddlstring = this.map_init_pddlstring_backup;
            this.objects_init_pddlstring = this.objects_init_pddlstring_backup;
            if (DEBUG) console.log("Executing pddl planner");
            if (DEBUG) console.log("predicate", predicate);
            this.add_agent_position(beliefSet);
            this.add_tiles_blocked_by_agents(beliefSet);
            this.set_goal_pddlstring(beliefSet, predicate);

            this.problem = new PddlProblem(
                "deliveroo",
                this.objects_init_pddlstring,
                this.map_init_pddlstring,
                this.goal_pddlstring
            );

            // this.problem.saveToFile();
            // if (DEBUG) console.log(this.problem.toPddlString());
            // if (DEBUG) console.log(this.domain);
            try {
                var plan = await onlineSolver(this.domain, this.problem.toPddlString());
                if (!plan) throw "No valid plan available.";
            } catch (error) {
                throw ["Error while solving pddl with error", error];
            }
            // if (DEBUG) console.log(plan);
            this.plan = plan;
            // try {
            //     let res = await this.plan_to_actions(plan, beliefSet);
            //     if (!res) throw ["Action failed"];
            // } catch (error) {
            //     throw ["Error while turning plan to actions with error", ...error];
            // }
            return true;
        } catch (error) {
            if (DEBUG) console.log(error);
            throw [error];
        }
    }
}
