import mongoose, { Schema, Model, Document } from "mongoose";

type ModelType<T extends Document> = Model<T> & {
  // Define any additional methods or properties here
};

interface MongooseClientConfig {
  userName: string;
  password: string;
  host: string;
  db?: string;
}

type ModelMap<T extends Models> = {
  [P in keyof T]: ModelType<T[P]>;
};

interface Models {
  [modelName: string]: Document;
}

export class MongooseClient<T extends Models> {
  private static connectionRegistry: {
    [key: string]: mongoose.Connection;
  } = {};

  public models: ModelMap<T>;

  constructor(
    config: MongooseClientConfig,
    modelConfig: { [P in keyof T]: Schema<T[P]> }
  ) {
    const key = JSON.stringify(config);
    const { userName, password, host, db } = config;

    let connection = MongooseClient.connectionRegistry[key];
    if (!connection) {
      connection = mongoose.createConnection(
        `mongodb+srv://${userName}:${password}@${host}/${
          db ?? ""
        }?retryWrites=true&w=majority`
      );
      MongooseClient.connectionRegistry[key] = connection;
    }
    connection.set("strictQuery", false); // todo this should be configurable

    const models = {} as ModelMap<T>;
    for (const [modelName, schema] of Object.entries(modelConfig)) {
      const model =
        connection.models[modelName] ||
        (connection.model<T[keyof T]>(modelName, schema) as ModelType<
          T[keyof T]
        >);
      models[modelName as keyof T] = model;
    }
    this.models = models;
  }
}
