import { spawn } from "child_process";

// Function to spawn child processes
function spawnProcesses() {
    for (let i = 0; i < 5; i++){
        const agentSlave = spawn("npm run agentSlave " + i, { shell: true });
        const agentMaster = spawn("npm run agentMaster " + i, { shell: true });
    }

    // const agentSlave = spawn("npm run agentSlave", { shell: true });
    // const agentMaster = spawn("npm run agentMaster", { shell: true });

    // agentSlave.stdout.on('data', data => {
    //     console.log(`Output from agentSlave: ${data}`);
    // });

    // agentMaster.stdout.on('data', data => {
    //     console.log(`Output from agentMaster: ${data}`);
    // });

    // agentSlave.stderr.on('data', data => {
    //     console.log(`Stderr from agentSlave: ${data}`);
    // });

    // agentMaster.stderr.on('data', data => {
    //     console.log(`Stderr from agentMaster: ${data}`);
    // });


    // childProcess.on('close', code => {
    //     console.log(`Child process ${i} exited with code ${code}`);
    // });
}
// Start the processes
spawnProcesses();
