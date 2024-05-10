import { map, me, parcels } from "../../src/shared.js";

//* MOVEMENT

export function isAboveDelivery() {
    if (me.carrying.size > 0) {
        for (const deliveryTile of map.deliveryTiles.values()) {
            if (me.x == deliveryTile.x && me.y == deliveryTile.y) return true;
        }
    }
    return false;
}

export function isAbovePickup() {
    for (const parcel of parcels.values()) {
        if (parcel.x == me.x && parcel.y == me.y) return parcel;
    }
    return false;
}
