# ASA Project

*Deliveroo.js* is minimalistic parcels delivering web-based game developed specifically for Autonomous Software Agent course and for educational purposes. The goal of this project is to develop an autonomous software that will autonomously play earning points by collecting as many parcels as possible and delivering them in the delivery zone:
* Using a BDI architecture
* Sensing the environment and managing Beliefs
* Deliberating Intentions 
* Select plans from a library
* Using an external planner component
* Execute a plan (actions)
* Defining strategies and behaviours
* Replanning and redeliberating

## Project structure

ASAProject
```
├── config.js
├── ddosAgents.js # spawn arbitray number of agents
├── package-lock.json
├── package.json
├── pddl
│  ├── domain-deliveroo.pddl
│  └── test.js
├── README.md
├── src # project logic
│  ├── agentMaster.js
│  ├── agentSlave.js
│  ├── communication
│  │  └── onMsgCallback.js
│  ├── intentions
│  │  ├── Intention.js
│  │  ├── IntentionRevision.js
│  │  └── IntentionRevisionReplace.js
│  ├── main.js # single agent
│  ├── plans
│  │  ├── communicationPlans
│  │  │  ├── Ask.js
│  │  │  ├── Say.js
│  │  │  └── Shout.js
│  │  ├── GoDeliver.js
│  │  ├── GoPickUp.js
│  │  ├── GoTo.js
│  │  ├── Patrolling.js
│  │  └── Plan.js
│  └── sensing
│     ├── onAgentSensingCallBack.js
│     ├── onMapCallBack.js
│     ├── onParcelSensingCallBack.js
│     └── onYouCallBack.js
├── starter.js
├── types
│  ├── Agent
│  │  └── Agent.js
│  ├── AgentModel.js
│  ├── BeliefSet.js
│  ├── Config.js
│  ├── GameMap.js
│  ├── Me.js
│  ├── Message.js
│  ├── Parcel.js
│  ├── Planner.js
│  └── Tile.js
├── update.sh
└── utils
   ├── astar.js
   └── functions
      ├── crypto.js
      ├── distance.js
      ├── gameMap_utils.js
      ├── intentions.js
      └── parcelManagement.js
```

## Requirements

* [Node.js](https://nodejs.org/en)
* npm
* [Deliveroo.js](https://github.com/unitn-ASA/Deliveroo.js)

## Getting started

1. Clone the repository
```sh
git clone https://github.com/StefanoSacchet/ASAProject.git

cd ASAProject
```

2. Install dependencies
```sh
npm install
```

## How to run it

Inside `config.js` there are some possible settings like:
* Object **config**: choose which url to connect and the token for single agent
* **DEBUG**: boolean that toggles logging
* Secret keys used for multi-agent communication

The project accepts an additional argument to choose the agent name.

To start, run *Deliveroo.js* server and then choose between the following:

### Single agent
```sh
npm start
```
Will run:
```sh
node src/main.js
```

### Multi agent
```sh
node starter.js
```

Will spawn two processes running:
```sh
node `src/agentSlave.js 2` 
node `src/agentMaster.js 1`
```
