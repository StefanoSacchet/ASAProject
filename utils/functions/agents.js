import { agents } from "../../src/shared.js";
import { map } from "../../src/shared.js";
import { graph } from "../../src/intention_revision.js";

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

export function updateGraph() {
    map.tiles.forEach((tile) => {
        graph.grid[tile.x][tile.y].weight = 1;
    });
    // remove tiles where there is an agent
    agents.forEach((agent) => {
        // check if value is .6 or .4
        const x = Math.round(agent.x);
        const y = Math.round(agent.y);
        graph.grid[x][y].weight = 0;
    });
}
