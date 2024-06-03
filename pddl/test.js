import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";

let req_body = {
    domain: `(define (domain deliveroo) 
    (:requirements :strips :disjunctive-preconditions :typing) 
    (:types Tile Parcel)
    (:predicates 
        (left_of ?x - Tile ?y - Tile) 
        (right_of ?x - Tile ?y - Tile) 
        (up_of ?x - Tile ?y - Tile) 
        (down_of ?x - Tile ?y - Tile) 
        (is_at ?x - Tile) 
        (parcel_at ?p - Parcel ?x - Tile) 
        (delivered_at ?p - Parcel ?x - Tile) 
        (is_blocked ?y - Tile) 
        (carrying ?parcel - Parcel)
    ) 
    (:action move_right 
        :parameters (?x - Tile ?y - Tile) 
        :precondition (and (is_at ?x) (left_of ?x ?y) (not (is_blocked ?y))) 
        :effect (and (not (is_at ?x)) (is_at ?y))
    ) 
    (:action move_left 
        :parameters (?x - Tile ?y - Tile) 
        :precondition (and (is_at ?x) (right_of ?x ?y) (not (is_blocked ?y))) 
        :effect (and (not (is_at ?x)) (is_at ?y))
    ) 
    (:action move_down 
        :parameters (?x - Tile ?y - Tile) 
        :precondition (and (is_at ?x) (up_of ?x ?y) (not (is_blocked ?y))) 
        :effect (and (not (is_at ?x)) (is_at ?y))
    ) 
    (:action move_up 
        :parameters (?x - Tile ?y - Tile) 
        :precondition (and (is_at ?x) (down_of ?x ?y) (not (is_blocked ?y))) 
        :effect (and (not (is_at ?x)) (is_at ?y))
    ) 
    (:action pickup :parameters (?parcel_tile - Tile ?parcel - Parcel) 
        :precondition (and (is_at ?parcel_tile) (parcel_at ?parcel ?parcel_tile)) 
        :effect (and (carrying ?parcel) (not (parcel_at ?parcel ?parcel_tile)))
    ) 
    (:action putdown :parameters (?delivery_tile - Tile ?parcel - Parcel) 
        :precondition (and (carrying ?parcel) (is_at ?delivery_tile)) 
        :effect (and (parcel_at ?parcel ?delivery_tile) (delivered_at ?parcel ?delivery_tile) (not (carrying ?parcel)))
    )
    
    ) `,
    problem: `(define (problem blocksworld-prob1)
    (:domain deliveroo)
    (:objects d1 - Tile d2 - Tile p - Parcel)
    (:init (is_at d2) (carrying p))
    (:goal (and (delivered_at p d1)))
)`,
};

let pddl_actions = await onlineSolver(req_body["domain"], req_body["problem"]);

console.log(pddl_actions);
