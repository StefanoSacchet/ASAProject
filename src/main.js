import Agent from "../types/Agent/Agent.js";
import onConfigCallback from "./sensing/onConfigCallBack.js";
import onMapCallback from "./sensing/onMapCallBack.js";
import onYouCallback from "./sensing/onYouCallBack.js";
import onAgentsSensingCallback from "./sensing/onAgentSensingCallBack.js";
import onParcelsSensingCallback from "./sensing/onParcelSensingCallBack.js";

const agent = new Agent(
    onConfigCallback,
    onMapCallback,
    onYouCallback,
    onAgentsSensingCallback,
    onParcelsSensingCallback
);
await agent.configure();
