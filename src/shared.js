import { GameMap } from "../types/map.js";
import { Agent } from "../types/Agent.js";
import { Parcel } from "../types/Parcel.js";
import { Config } from "../types/Config.js";
import { Me } from "../types/Me.js";

export const DEBUG = false;

// store map
export const map = new GameMap();

// store config
export const config = new Config();

// store agent state
export const me = new Me();

/**
 * store perceived parcels
 * @type {Map<string, Parcel>}
 */
export const parcels = new Map();

/**
 * store perceived agents
 * @type {Map<string, Agent>}
 */
export const agents = new Map();
