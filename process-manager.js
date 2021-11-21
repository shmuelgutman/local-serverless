const cluster = require('cluster');
const fs = require('fs');
const readline = require('readline');

class ProcessManager{
  constructor(options = {outfile: 'out.txt', warmingDurationInSeconds: 15}) {
    this.options = options;
    this.totalInvocation = 0;
    this.activeInstances = 0;
    this.idleWorkers = [];
    this.warmers = new Map();
    this.fd = fs.openSync(options.outfile, 'w');

  }

  _createWarmer(worker){
    this.warmers.set(worker.id, setTimeout(() => {
      this.idleWorkers.splice(this.idleWorkers.find(w => w.id === worker.id), 1);
      worker.kill();
      this.activeInstances--;
      console.log(`|master|: Worker ${worker.id} killed`);
    }, this.options.warmingDurationInSeconds * 1000));
  }

  _removeWarmer(worker){
    const currWarmer = this.warmers.get(worker.id);
    if(currWarmer){
      clearTimeout(currWarmer);
      this.warmers.delete(worker.id);
    }
  }

  _createWorker(){
    this.activeInstances++;
    const worker = cluster.fork();
    worker.on('message', (msg) => {
      console.log(`|master|: message from ${worker.id}: ${msg}`);
      switch (msg){
        case 'WORKING':
          this._removeWarmer(worker);
          break;
        case 'IDLE':
          this.idleWorkers.push(worker);
          this._createWarmer(worker);
          break;
      }
    });
    // Attach the output and forward it properly to the out file.
    // Because the process-manager is single threaded there is no worry that lines from different processes will mix with each other.
    readline.createInterface(worker.process.stdout)
      .on('line', line => {
        fs.writeSync(this.fd, line + "\n");
      })

    return new Promise(resolve => worker.on('online', () => {
      console.log(`Worker ready. Process ID: ${worker.process.pid}`);
      resolve(worker);
    }));
  }


  async sendToWorker(message){
    let worker;
    if(this.idleWorkers.length) {
      worker = this.idleWorkers.pop();
      console.log(`|master|: reusing ${worker.id}...`);
    } else {
      worker = await this._createWorker();
    }
    this.totalInvocation++;
    worker.send(message);
  }

  getStatistics(){
    return {
      active_instances: this.activeInstances,
      total_invocation: this.totalInvocation
    }
  }

}

module.exports = ProcessManager;
