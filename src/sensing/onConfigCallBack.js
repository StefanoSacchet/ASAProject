import Config from "../../types/Config.js";
import BeliefSet from "../../types/BeliefSet.js";

/**
 * @param {Config} param - The received configuration parameter
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onConfigCallback(param, beliefSet) {
    beliefSet.config = param;
}
