import Plan from "../src/plans/Plan.js";
import GoPickUp from "../src/plans/GoPickUp.js";
import GoTo from "../src/plans/GoTo.js";
import Patrolling from "../src/plans/Patrolling.js";
import GoDeliver from "../src/plans/GoDeliver.js";
import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";

export default class Planner {
    /** @type {Array<Plan>} */
    planLibrary = [];

    /** @type {boolean} */
    pddl;
    
    constructor(pddl) {
        this.planLibrary.push(GoDeliver);
        this.planLibrary.push(GoPickUp);
        this.planLibrary.push(GoTo);
        this.planLibrary.push(Patrolling);

        this.pddl = pddl;
    }
}