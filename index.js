#!/usr/bin/env node

const fs = require("fs");
const commander = require("commander");
const path = require("path");
const EventPortal = require("../eventportal_wrapper/src/index");
//const EventPortal = require("@solace-community/eventportal");
const ep = new EventPortal();
const jsf = require("json-schema-faker");
jsf.option('useDefaultValue', true);

async function main() {
  // Parse command line args
  commander
    .name("ep-to-postman")
    .description(
      "This CLI takes in an event portal application and creates a postman collections to send POST requests on the Solace PubSub+ REST port"
    )
    .version("1.0.0", "-v, --version")
    .usage("[OPTIONS]...")
    .requiredOption(
      "-a, --applicationName <applicationName>",
      "The name of the Event Portal Application"
    )
    .requiredOption(
      "-av, --applicationVersion <version>",
      "The version of the Event Portal Application"
    )
    .option(
      "-h, --host  <protocol>://<host>:<port>",
      "Solace PubSub+ Broker host:port",
      "http://localhost:9000"
    )
    .option(
      "-u, --user <username>:<password>",
      "Solace PubSub+ Broker username:password.",
      "default:default"
    )
    .option(
      "-o, --output <file/location/name.json>",
      "Output file name. By default: <application_collections>"
    )
    .parse(process.argv);

  const options = commander.opts();

  var outputFile = options.output
    ? options.output
    : "application" + "_Collections.json";

  const applicationIds = await ep.getApplicationIDs(options.applicationName);

  if (applicationIds.length == 0) {
    console.error("No application found with name: " + options.applicationName);
    return;
  }

  // Take the first applicaiton id
  const applicationId = applicationIds[0];

  // Get the application version id
  const applicationVersion = await ep.getApplicationVersionObject(
    applicationId,
    options.applicationVersion
  );

  if (applicationVersion === null) {
    console.error(
      "No application version found with name: " + options.applicationVersion
    );
    return;
  }

  if (applicationVersion.declaredConsumedEventVersionIds.length == 0) {
    console.info(
      "Nothing to do. No declared consumed event version found for application version: " +
        options.applicationVersion
    );
    return;
  }

  // Get the declarede consumed event version ids
  const declaredConsumedEventVersionIds =
    applicationVersion.declaredConsumedEventVersionIds;

  // Start building the collection
  const myCollection = {
    info: {
      name: options.applicationName,
      description: applicationVersion.description,
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      version: "0.1.0",
    },
    item: [],
  };

  // Get the event and schema
  for (const eventVersionId of declaredConsumedEventVersionIds) {
    console.log("eventVersionId", eventVersionId);
    const eventVersion = await ep.getEventVersionObject(eventVersionId);
    let schemaVersionObject = null;
    if (eventVersion.schemaVersionId !== null) {
        schemaVersionObject = await ep.getSchemaVersionObject(eventVersion.schemaVersionId);
    }

    const item = await createItem(eventVersion, schemaVersionObject);
    myCollection.item.push(item);
  }

  // Add on the SEMP host and port
  if (options.host !== null) {
    myCollection.variable = [
      {
        key: "SolaceHost",
        value: options.host.split("://")[1].split(":")[0],
        type: "string",
      },
      {
        key: "SolacePort",
        value: options.host.split(":")[2],
        type: "string",
      },
      {
        key: "SolaceProtocol",
        value: options.host.split("://")[0],
        type: "string",
      },
    ];
  }

  // Add on the SEMP credentials
  if (options.user !== null) {
    myCollection.auth = {
		type: "basic",
		basic: [
			{
				key: "username",
				value: options.user.split(":")[0],
                type: "string"
			},
			{
				key: "password",
				value: options.user.split(":")[1],
				type: "string"
			}
		]
	}
  }
  console.log(JSON.stringify(myCollection, null, 2));
  fs.writeFile(outputFile, JSON.stringify(myCollection, null, 2), err => {})

}

// Create each item in the collection
async function createItem(eventVersion, schemaVersion) {
  const requestName = await ep.getEventName(eventVersion.eventId);

  const path = eventVersion.deliveryDescriptor.address.addressLevels.map(
    (level) =>
      level.addressLevelType === "literal" ? level.name : `:${level.name}`
  );

  const apiEndpoint = `{{SolaceProtocol}}://{{SolaceHost}}:{{SolacePort}}/${path.join(
    "/"
  )}`;

  console.log(schemaVersion.content);
  const jsonSchema = JSON.parse(schemaVersion.content);

  const item = {
    name: `${requestName}`,

    event: [
      {
        listen: "test",
        script: {
          exec: [
            "//Check status",
            'tests["Expected status code - " + responseCode.code + " CREATED"] = responseCode.code === 200;',
          ],
          type: "text/javascript",
        },
      },
    ],

    request: {
      header: [
        {
          key: "Content-Type",
          value: "application/json",
        },
      ],
      url: {
        raw: apiEndpoint,
        protocol: "{{SolaceProtocol}}",
        host: ["{{SolaceHost}}"],
        port: "{{SolacePort}}",
        path: path,
      },
      method: "POST",
      body: {
        mode: "raw",
        raw: generateBody(jsonSchema),
      },
      auth: null,
    },

    response: [],
  };
  return item;
}

// Returns the body to be used in the REST request
function generateBody(bodySchema) {
  return JSON.stringify(jsf.generate(bodySchema), null, 2);
}

if (require.main === module) {
  main();
}