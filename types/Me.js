/**
 * Represents Me agent
 * @class
 */
export class Me {
    constructor() {
        /**
         * The ID of the Me instance.
         * @type {string | undefined}
         */
        this.id = undefined;
        
        /**
         * The name of the Me instance.
         * @type {string | undefined}
         */
        this.name = undefined;
        
        /**
         * The x-coordinate of the Me instance.
         * @type {numebr | undefined}
         */
        this.x = undefined;
        
        /**
         * The y-coordinate of the Me instance.
         * @type {number | undefined}
         */
        this.y = undefined;
        
        /**
         * The score of the Me instance.
         * @type {number | undefined}
         */
        this.score = undefined;
        
        /**
         * The items being carried by the Me instance.
         * @type {Map<number, Tile>}
         */
        this.carrying = new Map();
    }
}
