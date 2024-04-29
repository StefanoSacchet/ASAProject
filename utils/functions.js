export function distance({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    const dx = Math.abs(Math.round(x1) - Math.round(x2));
    const dy = Math.abs(Math.round(y1) - Math.round(y2));
    return dx + dy;
}

export function nearestDelivery({ x, y }, map) {
    return Array.from(map.tiles.values())
        .filter(({ delivery }) => delivery)
        .sort((a, b) => distance(a, { x, y }) - distance(b, { x, y }))[0];
}
