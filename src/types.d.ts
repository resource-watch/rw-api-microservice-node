import type Application from "koa";
import type Logger from "bunyan";
import request from "request";

export interface RWAPIMicroservice {
    register: (opts: RegisterOptions) => Promise<any>;
    requestToMicroservice: (config: request.OptionsWithUri & RequestToMicroserviceOptions) => Promise<Record<string, any>>;
}

export interface RegisterOptions {
    info: Record<string, any>;
    swagger: Record<string, any>;
    mode: string;
    framework: 'KOA1' | "KOA2";
    app: Application;
    logger: Logger;
    name: string;
    baseURL: string;
    url: string;
    token: string;
}

export interface RequestToMicroserviceOptions {
    version?: string & boolean;
    application?: string;
}
