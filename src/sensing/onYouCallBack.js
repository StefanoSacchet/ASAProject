import BeliefSet from "../../types/BeliefSet.js";

/**
 * @param {string} id
 * @param {string} name
 * @param {number} x
 * @param {number} y
 * @param {number} score
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onYouCallback(id, name, x, y, score, beliefSet) {
    beliefSet.me.id = id;
    beliefSet.me.name = name;
    beliefSet.me.x = x;
    beliefSet.me.y = y;
    beliefSet.me.score = score;
}
