const fastq = require('fastq');

module.exports = () => {

  const queue = fastq((message, done) => {
    setTimeout(() => {
      console.log(`${message}`);
      done();
    }, 5000);
  }, 1);

  process.on('message', (message) => {
    process.send('WORKING');
    queue.push(message, done => {
      process.send('IDLE');
    });
  });

  return process.pid;
}