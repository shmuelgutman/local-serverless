# Local-Serverless

### A serverless platform for demonstration purposes, built using NodeJS cluster.

Tested on Node version 17.0.1

1. Install dependencies:  
`npm install`

2. Run the platform:  
`node server.js`  
The server is listening to port 8001 by default.

3. Make a post request to send a new message:  
`curl --header "Content-Type: application/json" --request POST --data '{"message":"txyz"}' http://localhost:8001`
4. Make a get request to view statistics:  
`curl http://localhost:8001/statistics`
5. The functions output will be printed to `out.txt` file
