import mongoose from "mongoose";

type ModelType<T extends Document> = mongoose.Model<T> & {
  // Define any additional methods or properties here
};

export interface MongooseClientConfig {
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
  // regardless of where a client is created, we want to share connections with the same config
  private static connectionRegistry: {
    [key: string]: mongoose.Connection;
  } = {};

  public connection: mongoose.Connection;
  public models: ModelMap<T>;

  private getOrCreateConnection(config: MongooseClientConfig): mongoose.Connection {
    const key = JSON.stringify(config);
    let connection = MongooseClient.connectionRegistry[key];

    if (!connection) {
      const { userName, password, host, db } = config;
      connection = mongoose.createConnection(
        `mongodb+srv://${userName}:${password}@${host}/${
          db ?? ""
        }?retryWrites=true&w=majority`
      );
      MongooseClient.connectionRegistry[key] = connection;
    }
    connection.set("strictQuery", false); // todo this should be configurable
    return connection;
  }
  
  private installModels(modelConfig: { [P in keyof T]: mongoose.Schema<T[P]> }) {
    const models = {} as ModelMap<T>;
    for (const [modelName, schema] of Object.entries(modelConfig)) {
      models[modelName as keyof T] =
        this.connection.models[modelName] ||
        (this.connection.model<T[keyof T]>(modelName, schema) as ModelType<
          T[keyof T]
        >);
    }
    return models;
  }
  
  public constructor(
    config: MongooseClientConfig,
    modelConfig: { [P in keyof T]: mongoose.Schema<T[P]> }
  ) {
    this.connection = this.getOrCreateConnection(config);
    this.models = this.installModels(modelConfig);
  }
}
