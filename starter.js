import { spawn } from "child_process";

// Function to spawn child processes
function spawnProcesses() {
    const agentSlave = spawn("npm run agentSlave", { shell: true });
    const agentMaster = spawn("npm run agentMaster", { shell: true });

    // childProcess.stdout.on('data', data => {
    //     console.log(`Output from ${i}: ${data}`);
    // });

    // childProcess.stderr.on('data', data => {
    //     console.error(`Error from ${i}: ${data}`);
    // });

    // childProcess.on('close', code => {
    //     console.log(`Child process ${i} exited with code ${code}`);
    // });
}
// Start the processes
spawnProcesses();
