(define (domain deliveroo)
    (:requirements :strips)
    (:predicates 
        (left_of ?x ?y)
        (right_of ?x ?y)
        (up_of ?x ?y)
        (down_of ?x ?y)
        
        (is_at ?x)
        (parcel_at ?x)
        (delivered_at ?x)
        
        (is_blocked ?y)
        
        (carrying ?parcel)
    )
    (:action move_right
        :parameters (?x ?y)
        :precondition (and (is_at ?x) (left_of ?x ?y) (not (is_blocked ?y)))
        :effect (and (not (is_at ?x)) (is_at ?y))
    )
    (:action move_left
        :parameters (?x ?y)
        :precondition (and (is_at ?x) (right_of ?x ?y) (not (is_blocked ?y)))
        :effect (and (not (is_at ?x)) (is_at ?y))
    )
    (:action move_down
        :parameters (?x ?y)
        :precondition (and (is_at ?x) (up_of ?x ?y) (not (is_blocked ?y)))
        :effect (and (not (is_at ?x)) (is_at ?y))
    )
    (:action move_up
        :parameters (?x ?y)
        :precondition (and (is_at ?x) (down_of ?x ?y) (not (is_blocked ?y)))
        :effect (and (not (is_at ?x)) (is_at ?y))
    )
    (:action pickup
        :parameters (?parcel_tile ?parcel)
        :precondition (and (is_at ?parcel_tile) (parcel_at ?parcel_tile) (not (carrying ?parcel)))
        :effect (and (carrying ?parcel) (not (parcel_at ?parcel_tile)))
    )
    (:action putdown
        :parameters (?delivery_tile ?parcel)
        :precondition (and (carrying ?parcel) (is_at ?delivery_tile) (not (parcel_at ?delivery_tile)))
        :effect (and (parcel_at ?delivery_tile) (not (carrying ?parcel)) (delivered_at ?delivery_tile))
    )
)