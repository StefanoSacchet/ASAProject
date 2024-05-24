/**
 * Represents a parcel
 */
export default class Parcel {
    constructor() {
        /**
         * The ID of the parcel.
         * @type {string | undefined}
         */
        this.id = undefined;

        /**
         * The x-coordinate of the parcel.
         * @type {number | undefined}
         */
        this.x = undefined;

        /**
         * The y-coordinate of the parcel.
         * @type {number | undefined}
         */
        this.y = undefined;

        /**
         * The reward of the parcel.
         * @type {string | undefined}
         */
        this.carriedBy = undefined;

        /**
         * The reward of the parcel.
         * @type {number | undefined}
         */
        this.reward = undefined;
    }
}
