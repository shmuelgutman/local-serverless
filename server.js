const cluster = require('cluster');
const express = require('express');

if(cluster.isWorker){
  /*---------- We are in worker process ---------------*/
  const bootstrapWorker = require('./bootstrap-worker');

  const pid = bootstrapWorker()

} else {
  /*---------- We are in the master process ---------------*/

  cluster.setupMaster({
    silent: true
  });

  const ProcessManager = require('./process-manager');
  const processManager = new ProcessManager();

  const app = express();
  app.use(express.json());

  app.post('/messages', (req, res, next) => {
    processManager.sendToWorker(req.body.message)
      .then(() => res.send('OK'))
      .catch(next);

  });

  app.get('/statistics', (req, res, next) => {
    res.send(processManager.getStatistics());
  });

  const port = process.env.NODE_APP_PORT || 8001;
  app.listen(port, () => {
    console.log('Manager listening to port ' + port)
  });

}