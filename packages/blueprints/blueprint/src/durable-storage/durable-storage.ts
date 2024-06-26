import * as fs from 'fs';
import * as path from 'path';
import { Blueprint } from '../blueprint';

export class DurableStorage {
  /**
   * Absolute path for where the durable storage is stored
   */
  storagePath: string;
  blueprint: Blueprint;

  constructor(blueprint: Blueprint, durableStoragePathAbs: string) {
    this.blueprint = blueprint;
    this.storagePath = durableStoragePathAbs;
  }

  exists(id: string): boolean {
    const stateLocation = path.join(this.storagePath, id);
    return fs.existsSync(stateLocation);
  }

  set<T extends Object>(id: string, jsonable: T) {
    const stateLocation = path.join(this.storagePath, id);
    if (!fs.existsSync(stateLocation)) {
      fs.mkdirSync(path.dirname(stateLocation), { recursive: true });
    }
    fs.writeFileSync(stateLocation, JSON.stringify(jsonable));
  }

  get<T extends Object>(id: string): T | undefined {
    if (this.exists(id)) {
      const stateLocation = path.join(this.storagePath, id);
      return JSON.parse(fs.readFileSync(stateLocation).toString());
    }
    return undefined;
  }

  clear(id: string) {
    if (this.exists(id)) {
      const stateLocation = path.join(this.storagePath, id);
      fs.rmSync(stateLocation);
    }
  }
}
