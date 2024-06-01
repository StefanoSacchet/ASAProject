import Plan from "../src/plans/Plan.js";
import GoPickUp from "../src/plans/GoPickUp.js";
import GoTo from "../src/plans/GoTo.js";
import Patrolling from "../src/plans/Patrolling.js";
import GoDeliver from "../src/plans/GoDeliver.js";
import { getByValue } from "../utils/functions/gameMap_utils.js";
import { nearestDelivery } from "../utils/functions/distance.js";
import { DEBUG } from "../config.js";
import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readFile ( filePath ) {

    filePath = path.join(__dirname, filePath);
    
    return new Promise( (res, rej) => {

        fs.readFile( filePath, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })

    })

}

class PddlAction_custom extends PddlAction {
    beliefSet;
    constructor(beliefSet, ...args){
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
    // supported_intentions = ["go_to", "go_deliver", "go_pick__up"];
    supported_intentions = ["go_to"];

    current_plan;

    
    constructor(pddl) {
        this.planLibrary.push(GoDeliver);
        this.planLibrary.push(GoPickUp);
        this.planLibrary.push(GoTo);
        this.planLibrary.push(Patrolling);

        this.pddl = pddl;

        readFile('../pddl/domain-deliveroo.pddl')
            .then(data => {
                // console.log('File content:', data);
                this.domain = data;
                if(DEBUG) console.log('Domain read successfully.');
            })
            .catch(err => {
                if(DEBUG) console.error('Error reading file:', err);
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

    set_goal_pddlstring(beliefSet, predicate) {
        var dest_tile = getByValue(beliefSet.map.tiles, [predicate[1], predicate[2]]);
        
        switch (predicate[0]) {
            case "go_to":
                this.goal_pddlstring = `and (is_at tile_${dest_tile})`;
                break;
                case "go_deliver":
                let deliveryTile = nearestDelivery(beliefSet.me, beliefSet.map, beliefSet.graph);
                var dest_tile = getByValue(beliefSet.map.tiles, [deliveryTile.x, deliveryTile.y]);
                this.goal_pddlstring = `and (delivered_at tile_${dest_tile})`;
                break;
            case "go_pick_up":
                this.map_init_pddlstring += `(parcel_at tile_${dest_tile}) `;
                this.goal_pddlstring = `and (carrying parcel)`;
                break;
            default:
                throw("Predicate not supported");
                break;
        }
    }

    async execute_action(action, beliefSet) {
        try {
            switch(action) {
                case "move_right":
                    await beliefSet.client.move("right");
                    break;
                case "move_left":
                    await beliefSet.client.move("left");
                    break;
                case "move_up":
                    await beliefSet.client.move("up");
                    break;
                case "move_down":
                    await beliefSet.client.move("down");
                    break;
                case "pickup":
                    let pickup = await this.beliefSet.client.pickup();
                    console.log(pickup);
                    if (!(pickup == []) && pickup.length > 0) {
                        // if (DEBUG) console.log("picked up", id);
                        beliefSet.me.carrying.set(id, this.beliefSet.parcels.get(id));
                        beliefSet.parcels.get(id).carriedBy = this.beliefSet.me.id;
                    }
                    break;
                case "putdown":
                    await beliefSet.client.putdown();
                    await beliefSet.me.carrying.clear();
                    break;
            }
        } catch (error) {
            throw("Error");
        }
    }

    async plan_to_actions(plan, beliefSet) {

        if ( ! plan )
            return;
        
        var previousStepGoals = []

        for (const step of plan) {
            if (this.current_plan.stopped) throw ["stopped"]; // if stopped then quit
            if (step.parallel) {
                console.log( 'Starting concurrent step', step.action, ...step.args )
            }
            else {
                await Promise.all(previousStepGoals)
                previousStepGoals = []
                console.log( 'Starting sequential step', step.action, ...step.args )
            }

            let action = step.action.toLowerCase();
            // if ( !action || !action.executor ) {
            //     console.error( new Error("No executor for pddlAction" + step.action + ". Skip and continue with next plan step.") )
            //     continue;
            // }

            var exec = this.execute_action(action, beliefSet);
            if ( exec && exec.catch ) {
                exec.catch( err => { throw err } ); //new Error('Step failed');
                previousStepGoals.push( exec );
            }
            else {
                previousStepGoals.push( Promise.resolve() );
            }
        }

        // wait for last steps to complete before finish blackbox plan execution intention
        await Promise.all(previousStepGoals)
    }

    async execute(beliefSet, predicate) {
        try {
            // restore beliefs
            this.map_init_pddlstring = this.map_init_pddlstring_backup;
            this.objects_init_pddlstring = this.objects_init_pddlstring_backup;
            if(DEBUG) console.log("Executing pddl planner");
            if(DEBUG) console.log("predicate", predicate);
            this.add_agent_position(beliefSet);
            this.add_tiles_blocked_by_agents(beliefSet);
            this.set_goal_pddlstring(beliefSet, predicate);

            this.problem = new PddlProblem("deliveroo", this.objects_init_pddlstring, this.map_init_pddlstring, this.goal_pddlstring);

            // if(DEBUG) console.log(this.problem.toPddlString());
            // if(DEBUG) console.log(this.domain);
            var plan = await onlineSolver(this.domain, this.problem.toPddlString());
            if(DEBUG) console.log(plan);

            if(plan == []) throw("No valid plan available.");

            // this.init_executor(beliefSet);
            // try {
            //     if(DEBUG) console.log("Executor initialized, achieving plan");
            //     this.executor.exec(plan);
            // } catch (error) {
            //     throw("Error in executing pddl planner");
            // }
            
            await this.plan_to_actions(plan, beliefSet);

            return true;

        } catch (error) {
            if(DEBUG) console.log(error);
            throw("Error in fetching plan with onlineSolver");
        }
    }
}


// function init_executor(beliefSet) {
//             // available actions: beliefSet.client.move("right")  right, left, up, down, this.beliefSet.client.pickup(), this.beliefSet.client.putdown()
    
//             const move_right = new PddlAction(
//                 'move_right',
//                 '',
//                 '',
//                 '',
//                 async ( ...args ) => {await beliefSet.client.move("right");}
//             );
//             const move_left = new PddlAction(
//                 'move_left',
//                 '',
//                 '',
//                 '',
//                 async ( ...args ) => {await beliefSet.client.move("left");}
//             );
//             const move_up = new PddlAction(
//                 'move_up',
//                 '',
//                 '',
//                 '',
//                 async ( ...args ) => {await beliefSet.client.move("up");}
//             );
//             const move_down = new PddlAction(
//                 'move_down',
//                 '',
//                 '',
//                 '',
//                 async ( ...args ) => {await beliefSet.client.move("down");}
//             );
//             const pickup = new PddlAction(
//                 'pickup',
//                 '',
//                 '',
//                 '',
//                 async ( ...args ) => {await beliefSet.client.pickup();}
//             );
//             const putdown = new PddlAction(
//                 'putdown',
//                 '',
//                 '',
//                 '',
//                 async ( ...args ) => {await beliefSet.client.putdown();}
//             );
//             console.log(move_right);
//             console.log(move_left);
//             console.log(move_up);
//             console.log(move_down);
//             console.log(pickup);
//             console.log(putdown);
//             this.executor = new PddlExecutor(move_right, move_left, move_up, move_down, pickup, putdown);
//         }