import { handShakeKey, communicationKey, tokens } from "../config.js";
import Agent from "../types/Agent/Agent.js";
import onMapCallback from "./sensing/onMapCallBack.js";
import onYouCallback from "./sensing/onYouCallBack.js";
import onAgentsSensingCallback from "./sensing/onAgentSensingCallBack.js";
import onParcelsSensingCallback from "./sensing/onParcelSensingCallBack.js";
import onMsgCallback from "./communication/onMsgCallback.js";

const agentSlave = new Agent(
    onMapCallback,
    onYouCallback,
    onAgentsSensingCallback,
    onParcelsSensingCallback,
    onMsgCallback,
    tokens[1], // agentSlave token
    handShakeKey,
    communicationKey // used for all communications after handshake
);
await agentSlave.configure();
