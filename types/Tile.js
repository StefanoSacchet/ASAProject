export default class Tile {
    /** @type {number} */
    x;

    /**@type {number} */
    y;

    /** @type {boolean} */
    delivery;

    constructor(x, y, delivery) {
        this.x = x;
        this.y = y;
        this.delivery = delivery;
    }
}
