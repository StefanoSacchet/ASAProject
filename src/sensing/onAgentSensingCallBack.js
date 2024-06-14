import { TopicMsgEnum } from "../../types/Message.js";
import AgentModel from "../../types/AgentModel.js";
import BeliefSet from "../../types/BeliefSet.js";
import Message from "../../types/Message.js";
import Say from "../plans/communicationPlans/Say.js";

/**
 * @param {Array<AgentModel>} perceived_agents
 * @param {BeliefSet} beliefSet
 * @returns {Promise<void>}
 */
export default async function onAgentsSensingCallback(perceived_agents, beliefSet) {
    beliefSet.updateAgents(perceived_agents);

    // if no agents sensed, return
    if (perceived_agents.length === 0) return;

    // send new agents sensed to allay
    const msg = new Message(TopicMsgEnum.NEW_AGENTS, beliefSet.COMMUNICATION_KEY, perceived_agents);
    await new Say(beliefSet.allayId, msg).execute(beliefSet);
}
