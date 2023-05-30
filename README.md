# OCP Quickstart: Build an app

Build a sample app from start to finish in Optimizely Connect Platform (OCP) that allows customers to sync data from an Azure storage account to Optimizely Data Platform (ODP). 

This repository contains the source code for the app that you build in the OCP [Quickstart: Build an app](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-overview) guide. To build the app, follow each page of the quickstart guide in order:
1. [Overview](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-overview)
2. [Scaffold the app and define its schema](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-scaffold-an-app)
3. [Publish to the ODP sandbox](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-publish-an-app-to-odp-sandbox)
4. [Configure and authenticate the app](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-config-and-authenticate)
5. [Write a function](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-write-a-function)
6. [Write a job](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-write-a-job)
7. [Publish the app in ODP App Directory](https://docs.developers.optimizely.com/optimizely-connect-platform/docs/ocp-quickstart-publish-in-app-directory)


OCP apps run on node 18 and are packaged using [yarn](https://yarnpkg.com/lang/en/). Ensure you have node and yarn installed, then run the `yarn` command to install dependencies.

You should write OCP apps in [TypeScript](https://www.typescriptlang.org/). [Visual Studio Code](https://code.visualstudio.com/) is a great free integrated development environment (IDE) for TypeScript projects.

For more information on building apps in OCP, see the the [OCP developer documentation](https://docs.developers.optimizely.com/optimizely-connect-platform/docs).

## Build and test

You can use any test framework you like, but Jest comes pre-installed with an OCP app.
To run your unit tests, run the following command:
```
yarn test
```

Before you upload an app to OCP, you can validate your app package to ensure it is ready for upload by running the following command:
```
yarn validate
```
