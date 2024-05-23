/**
 * Represents the game map
 */
export class GameMap {
    constructor() {
        /**
         * The width of the game map.
         * @type {number | undefined}
         */
        this.width = undefined;

        /**
         * The height of the game map.
         * @type {number | undefined}
         */
        this.height = undefined;

        /**
         * A map of tiles on the game map.
         * @type {Map<number, Tile>}
         */
        this.tiles = new Map();

        /**
         * A map of delivery tiles on the game map.
         * @type {Map<number, Tile>}
         */
        this.deliveryTiles = new Map();

        /**
         * A map of spawner tiles on the game map.
         * @type {Map<number, Tile>}
         */
        this.spawnerTiles = new Map();

        /**
         * Indicates whether there are more normal tiles than spawner tiles on the game map.
         * @type {boolean}
         */
        this.moreNormalTilesThanSpawners = false;
    }

    /**
     * Adds a tile to the game map.
     * @param {Tile} tile - The tile to add.
     * @returns {Map<number, Tile>} - The updated map of tiles.
     */
    add(tile) {
        const { x, y } = tile;
        return this.tiles.set(x + 1000 * y, tile);
    }

    /**
     * Adds a delivery tile to the game map.
     * @param {Tile} tile - The delivery tile to add.
     * @returns {Map<number, Tile>} - The updated map of delivery tiles.
     */
    addDelivery(tile) {
        const { x, y } = tile;
        return this.deliveryTiles.set(x + 1000 * y, tile);
    }

    /**
     * Adds a spawner tile to the game map.
     * @param {Tile} tile - The spawner tile to add.
     * @returns {Map<number, Tile>} - The updated map of spawner tiles.
     */
    addSpawner(tile) {
        const { x, y } = tile;
        return this.spawnerTiles.set(x + 1000 * y, tile);
    }

    /**
     * Retrieves a tile from the game map based on its coordinates.
     * @param {number} x - The x-coordinate of the tile.
     * @param {number} y - The y-coordinate of the tile.
     * @returns {Tile | undefined} - The tile at the specified coordinates, or undefined if not found.
     */
    xy(x, y) {
        return this.tiles.get(x + 1000 * y);
    }
}
