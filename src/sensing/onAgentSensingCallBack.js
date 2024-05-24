import AgentModel from "../../types/AgentModel.js";
import BeliefSet from "../../types/BeliefSet.js";

/**
 * @param {Array<AgentModel>} perceived_agents
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onAgentsSensingCallback(perceived_agents, beliefSet) {
    // delete agents not present anymore
    for (const [id, agent] of beliefSet.agents.entries()) {
        if (!perceived_agents.find((agent) => agent.id === id)) beliefSet.agents.delete(id);
    }
    // update agents
    perceived_agents.forEach((agent) => {
        if (!beliefSet.agents.has(agent.id)) beliefSet.agents.set(agent.id, agent);
        else beliefSet.agents.set(agent.id, agent);
    });
}
