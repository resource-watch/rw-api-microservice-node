import type Application from "koa";
import type Logger from "bunyan";
import request from "request";

declare namespace RWAPIMicroservice {
    interface RWAPIMicroservice {
        register: (opts: RWAPIMicroservice.RegisterOptions) => Promise<any>;
        requestToMicroservice: (config: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions) => Promise<Record<string, any>>;
    }

    interface RegisterOptions {
        info: Record<string, any>,
        swagger: Record<string, any>,
        mode: string,
        framework: 'KOA1' | "KOA2",
        app: Application,
        logger: Logger,
        name: string,
        baseURL: string,
        url: string,
        token: string
    }

    interface RequestToMicroserviceOptions {
        version?: string & boolean,
        application?: string,
    }
}

export default RWAPIMicroservice;
