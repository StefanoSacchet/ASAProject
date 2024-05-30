import { PddlDomain, PddlAction, PddlProblem, PddlExecutor, onlineSolver, Beliefset } from "@unitn-asa/pddl-client";

let req_body = {
    "domain":"(define (domain BLOCKS) (:requirements :strips) (:predicates (on ?x ?y) (ontable ?x) (clear ?x) (handempty) (holding ?x) ) (:action pick-up :parameters (?x) :precondition (and (clear ?x) (ontable ?x) (handempty)) :effect (and (not (ontable ?x)) (not (clear ?x)) (not (handempty)) (holding ?x))) (:action put-down :parameters (?x) :precondition (holding ?x) :effect (and (not (holding ?x)) (clear ?x) (handempty) (ontable ?x))) (:action stack :parameters (?x ?y) :precondition (and (holding ?x) (clear ?y)) :effect (and (not (holding ?x)) (not (clear ?y)) (clear ?x) (handempty) (on ?x ?y))) (:action unstack :parameters (?x ?y) :precondition (and (on ?x ?y) (clear ?x) (handempty)) :effect (and (holding ?x) (clear ?y) (not (clear ?x)) (not (handempty)) (not (on ?x ?y)))))",
    "problem":"(define (problem BLOCKS-4-0) (:domain BLOCKS) (:objects D B A C ) (:INIT (CLEAR C) (CLEAR A) (CLEAR B) (CLEAR D) (ONTABLE C) (ONTABLE A) (ONTABLE B) (ONTABLE D) (HANDEMPTY)) (:goal (AND (ON D C) (ON C B) (ON B A))) )"
    };

let pddl_actions = await onlineSolver(
    req_body["domain"],
    req_body["problem"]
);

console.log(pddl_actions);

