import { spawn } from "child_process";

// Function to spawn child processes
function spawnProcesses() {
    const agentSlave = spawn("npm run agentSlave " + 2, { shell: true });
    const agentMaster = spawn("npm run agentMaster " + 1, { shell: true });

    agentSlave.stdout.on('data', data => {
        console.log(`Output from agentSlave: ${data}`);
    });

    agentMaster.stdout.on('data', data => {
        console.log(`Output from agentMaster: ${data}`);
    });

    agentSlave.stderr.on('data', data => {
        console.log(`Stderr from agentSlave: ${data}`);
    });

    agentMaster.stderr.on('data', data => {
        console.log(`Stderr from agentMaster: ${data}`);
    });

    // childProcess.on('close', code => {
    //     console.log(`Child process ${i} exited with code ${code}`);
    // });
}
// Start the processes
spawnProcesses();
