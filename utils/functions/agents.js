import { agents } from "../../src/shared.js";

//* AGENTS

export function updateAgents(percieved_agents) {
    // delete agents not present anymore
    for (const [id, agent] of agents.entries()) {
        if (!percieved_agents.find((agent) => agent.id === id)) agents.delete(id);
    }
    // update agents
    percieved_agents.forEach((agent) => {
        if (!agents.has(agent.id)) agents.set(agent.id, agent);
        else agents.set(agent.id, agent);
    });
}
