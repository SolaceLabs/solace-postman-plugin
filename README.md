# EP to Postman Collections

This utility connects to the Solace Event Portal collects the consumers for an application version and outputs a Postman collections file that can then be imported to Postman. Note that the events are converted to POST requests sent to the Solace PubSub+ broker on the REST Port.

## How to run

1. git clone https://github.com/SolaceLabs/ep-api-wrapper.git
1. git clone https://github.com/gregmeldrum/ep-to-postman.git
1. cd ep-api-wrapper
1. npm install
1. cd ../ep-to-postman
1. npm install
1. export SOLACE_CLOUD_TOKEN="my solace cloud token"
1. node index.js -a "My Applicaiton Name" -av 0.1.0 -o my_postman_collection.json

Below are the following options

| Flag          | Description                                                | Type                    | Default                          |
| ------------- | ---------------------------------------------------------- | ----------------------- | -------------------------------- |
| -v, --version | Outputs the version number                                 |                         |                                  |
| -h, --host    | Destination Solace PubSub+ Broker in the form of host:port | `<host>:<port>`         | `http://localhost:9000`          |
| -u, --user    | Destination Solace PubSub+ Broker username:password        | `<username>:<password>` | `default:default`                |
| -o, --output  | Destination Solace PubSub+ Broker SEMP credentials         |                         | `<application_collections>` |
| --help        | Output file name                                           |                         |                                  |

## Development

To run this cli tool locally

1. Clone this repo
1. `npm install`
1. `node index --help`

## Contribution

To contribute to this CLI tool

1. Fork this repo
1. Update the package.json version number
1. Make a PR

## To-do

Feature requests are found as issues
