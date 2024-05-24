// import { DEBUG } from "../config.js";
// import BeliefSet from "../types/BeliefSet.js";
// import { canDeliverContentInTime } from "../utils/functions/parcelManagement.js";
// import { findAndPickUpNearParcels } from "../utils/functions/parcelManagement.js";
// import Plan from "./plans/Plan.js";

/**
 * Intention
 */
// export class Intention {
//     // Plan currently used for achieving the intention
//     #current_plan;

//     // This is used to stop the intention
//     #stopped = false;
//     get stopped() {
//         return this.#stopped;
//     }
//     stop() {
//         // this.log( 'stop intention', ...this.#predicate );
//         this.#stopped = true;
//         if (this.#current_plan) this.#current_plan.stop();
//     }

//     /**
//      * #parent refers to caller
//      */
//     #parent;

//     /**
//      * predicate is in the form ['go_to', x, y]
//      * @param {Array<string|number>}
//      */
//     #predicate;

//     get predicate() {
//         return this.#predicate;
//     }

//     constructor(parent, predicate) {
//         this.#parent = parent;
//         this.#predicate = predicate;
//     }

//     log(...args) {
//         if (this.#parent && this.#parent.log) this.#parent.log("\t", ...args);
//         else if (DEBUG) console.log(...args);
//     }

//     #started = false;
//     /**
//      * Using the plan library to achieve an intention
//      * @param {Array<Plan>} planLibrary
//      * @param {BeliefSet} beliefSet
//      */
//     async achieve(planLibrary, beliefSet) {
//         // Cannot start twice
//         if (this.#started) return this;
//         else this.#started = true;

//         // Trying all plans in the library
//         for (const planClass of planLibrary) {
//             // if stopped then quit
//             if (this.stopped) throw ["stopped intention", ...this.predicate];

//             // if plan is 'statically' applicable
//             if (planClass.isApplicableTo(...this.predicate)) {
//                 // plan is instantiated
//                 this.#current_plan = new planClass(this.#parent, beliefSet, planLibrary);
//                 this.log("achieving intention", ...this.predicate, "with plan", planClass.name);
//                 // and plan is executed and result returned
//                 try {
//                     const plan_res = await this.#current_plan.execute(...this.predicate);
//                     this.log(
//                         "succesful intention",
//                         ...this.predicate,
//                         "with plan",
//                         planClass.name,
//                         "with result:",
//                         plan_res
//                     );
//                     return plan_res;
//                     // or errors are caught so to continue with next plan
//                 } catch (error) {
//                     this.log(
//                         "failed intention",
//                         ...this.predicate,
//                         "with plan",
//                         planClass.name,
//                         "with error:",
//                         ...error
//                     );
//                 }
//             }
//         }

//         // if stopped then quit
//         if (this.stopped) throw ["stopped intention", ...this.predicate];

//         // no plans have been found to satisfy the intention
//         // this.log( 'no plan satisfied the intention ', ...this.predicate );
//         throw ["no plan satisfied the intention ", ...this.predicate];
//     }
// }

// /**
//  * Intention revision loop
//  */
// export class IntentionRevision {
//     /** @type {BeliefSet} */
//     beliefSet;
//     /** @type {Array<Plan>} */
//     planLibrary;

//     /**
//      * @param {BeliefSet} beliefSet
//      * @param {Array<Plan>} planLibrary
//      */
//     constructor(beliefSet, planLibrary) {
//         this.beliefSet = beliefSet;
//         this.planLibrary = planLibrary;
//     }

//     /**
//      * #intention_queue is an array of intentions to be achieved
//      * @type {Array<Intention>}
//      */
//     #intention_queue = new Array();

//     get intention_queue() {
//         return this.#intention_queue;
//     }
//     set intention_queue(value) {
//         this.#intention_queue = value;
//     }

//     idle = ["patrolling"];

//     async loop() {
//         while (true) {
//             // Consumes intention_queue if not empty
//             if (this.intention_queue.length > 0) {
//                 if (DEBUG)
//                     console.log(
//                         "intentionRevision.loop",
//                         this.intention_queue.map((i) => i.predicate)
//                     );

//                 // Current intention
//                 const intention = this.intention_queue[0];

//                 // Is queued intention still valid? Do I still want to achieve it?
//                 // TODO: cases for which intention is no more valid
//                 // 1) parcel can no longer be delivered in time (another agent is closer)
//                 // 2) goto intention will be blocked by an agent standing in the way (?)
//                 if (DEBUG) {
//                     console.log("=========================================================");
//                     console.log("Checking if intention is still valid", intention.predicate);
//                     console.log("=========================================================");
//                 }

//                 //? maybe use a switch statement or a class-based approach
//                 switch (intention.predicate[0]) {
//                     case "go_pick_up": {
//                         let id = intention.predicate[3];
//                         let p = this.beliefSet.parcels.get(id);
//                         if (p && p.carriedBy) {
//                             if (DEBUG)
//                                 console.log("Pick up intention isn't valid anymore. Predicate:", intention.predicate);
//                             this.intention_queue.shift();
//                             continue;
//                         }
//                         break;
//                     }
//                     case "patrolling": {
//                         // check if new parcels have spawned near the agent
//                         const new_intention = findAndPickUpNearParcels(
//                             this.beliefSet.me,
//                             this.beliefSet.parcels,
//                             this.beliefSet.config,
//                             this.beliefSet.map,
//                             this.beliefSet.graph
//                         );
//                         if (new_intention) {
//                             this.intention_queue.push(new_intention);
//                             this.intention_queue.shift();
//                             continue;
//                         }
//                         // control if the agent is carrying parcels and if the reward can be delivered in time
//                         if (
//                             this.beliefSet.me.carrying.size > 0 &&
//                             canDeliverContentInTime(
//                                 this.beliefSet.me,
//                                 this.beliefSet.map,
//                                 this.beliefSet.graph,
//                                 this.beliefSet.config
//                             )
//                         ) {
//                             if (DEBUG)
//                                 console.log(
//                                     "Patrolling state entered while packages can be delivered, delivering them."
//                                 );
//                             // go deliver
//                             let new_intention = new Intention(this, ["go_deliver"]);
//                             this.intention_queue.push(new_intention);
//                             this.intention_queue.shift();
//                             continue;
//                         } else {
//                             if (DEBUG)
//                                 console.log("Patrolling state entered while packages carried but cannot be delivered");
//                             // drop parcels and keep patrolling
//                             // await client.putdown();
//                             // empty carrying
//                             // me.carrying.clear();
//                             // this.intention_queue.shift();
//                             // continue;
//                         }
//                         break;
//                     }
//                     case "go_deliver": {
//                         // control if the agent is carrying parcels and if the reward can be delivered in time
//                         // if (!canDeliverContentInTime(me, config) && me.carrying.size > 0) {
//                         //     if (DEBUG) console.log("Cannot deliver carried packages anymore, dropping them.");
//                         //     // drop parcels and keep patrolling
//                         //     await client.putdown();
//                         //     // empty carrying
//                         //     me.carrying.clear();
//                         //     this.intention_queue.shift();
//                         //     continue;
//                         // }
//                         const new_intention = findAndPickUpNearParcels(
//                             this.beliefSet.me,
//                             this.beliefSet.parcels,
//                             this.beliefSet.config,
//                             this.beliefSet.map,
//                             this.beliefSet.graph
//                         );
//                         if (new_intention) {
//                             this.intention_queue.push(new_intention);
//                             this.intention_queue.shift();
//                             continue;
//                         }
//                         break;
//                     }
//                     default:
//                         break;
//                 }

//                 // Start achieving intention
//                 await intention
//                     .achieve(this.planLibrary, this.beliefSet)
//                     // Catch eventual error and continue
//                     .catch((error) => {
//                         if (DEBUG) console.log("Failed intention", ...intention.predicate, "with error:", error);
//                     });

//                 // Remove from the queue
//                 this.intention_queue.shift();
//             } else if (this.beliefSet.me.id) {
//                 this.push(this.idle);
//             }

//             // Postpone next iteration at setImmediate
//             await new Promise((res) => setImmediate(res));
//         }
//     }

//     // async push ( predicate ) { }

//     log(...args) {
//         if (DEBUG) console.log(...args);
//     }
// }

// export class IntentionRevisionReplace extends IntentionRevision {
//     /**
//      * @param {BeliefSet} beliefSet
//      * @param {Array<Plan>} planLibrary
//      */
//     constructor(beliefSet, planLibrary) {
//         super(beliefSet, planLibrary);
//     }

//     async push(predicate) {
//         // Check if already queued
//         const last = this.intention_queue.at(this.intention_queue.length - 1);
//         if (last && last.predicate.join(" ") == predicate.join(" ")) {
//             return; // intention is already being achieved
//         }

//         if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
//         const intention = new Intention(this, predicate);
//         this.intention_queue.push(intention);

//         const current_intention = this.intention_queue[0];
//         if (current_intention.predicate[0] == "go_pick_up") {
//             if (
//                 canDeliverContentInTime(
//                     this.beliefSet.me,
//                     this.beliefSet.map,
//                     this.beliefSet.graph,
//                     this.beliefSet.config
//                 )
//             ) {
//                 if (DEBUG) console.log("Picked up a package that can be delivered, going to deliver it");
//                 // go deliver
//                 const new_intention = new Intention(this, ["go_deliver"]);
//                 this.intention_queue.push(new_intention);
//             }
//         }
//         // Force current intention stop
//         if (last) {
//             last.stop();
//         }
//     }

//     async clear() {
//         this.intention_queue.forEach((i) => i.stop());
//         this.intention_queue = [];
//     }
// }

// //* Other possible implementations

// class IntentionRevisionQueue extends IntentionRevision {
//     async push(predicate) {
//         // Check if already queued
//         if (this.intention_queue.find((i) => i.predicate.join(" ") == predicate.join(" "))) return; // intention is already queued

//         if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
//         const intention = new Intention(this, predicate);
//         this.intention_queue.push(intention);
//     }
// }

// class IntentionRevisionRevise extends IntentionRevision {
//     async push(predicate) {
//         if (DEBUG) console.log("Revising intention queue. Received", ...predicate);
//         // TODO
//         // - order intentions based on utility function (reward - cost) (for example, parcel score minus distance)
//         // - eventually stop current one
//         // - evaluate validity of intention
//         // Check if already queued
//         const last = this.intention_queue.at(this.intention_queue.length - 1);
//         if (last && last.predicate.join(" ") == predicate.join(" ")) {
//             return; // intention is already being achieved
//         }

//         if (DEBUG) console.log("IntentionRevisionReplace.push", predicate);
//         const intention = new Intention(this, predicate);
//         this.intention_queue.push(intention);

//         // Force current intention stop
//         if (last) {
//             last.stop();
//         }
//     }
// }
