//Contains the additional properties of each lambda function.
export const java11=  `
      MemorySize: 512
      Environment: # More info about Env Vars: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#environment-object
        Variables:
          PARAM1: VALUE
`;

/*
export const dotnetcore3 = `
      MemorySize: 256
      Environment: # More info about Env Vars: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#environment-object
        Variables:
          PARAM1: VALUE
`
*/

export const python37 = ``

export const nodejs14 = ``

//export const ruby27 = ``

/*
//Contains the additional properties of each lambda function.
export const java11= {
    Runtime: "java11",
    Handler: "helloworld.App::handleRequest",
    MemorySize: 512,
    Environment: {
        Variables: {
            PARAM1: "VALUE"
        }
    }
}

export const dotnetcore3 = {
    Runtime: "dotnetcore3.1",
    Handler: "HelloWorld::HelloWorld.Function::FunctionHandler",
    MemorySize: 256,
    Environment: {
        Variables: {
            PARAM1: "VALUE"
        }
    }
}

export const python39 = {
    Runtime: "python3.9",
    Handler: "app.lambda_handler"
}

export const ruby27 = {
    Runtime: "ruby2.7",
    Handler: "app.lambda_handler"
}

export const nodejs14 = {
    Runtime: "nodejs14.x",
    Handler: "app.lambdaHandler"
}
*/
