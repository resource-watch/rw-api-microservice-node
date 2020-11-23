import type Application from "koa";
import type Logger from "bunyan";

declare namespace RWAPIMicroservice {
    interface RegisterOptions {
        info: Record<string, any>,
        swagger: Record<string, any>,
        mode: string,
        framework: string,
        app: Application,
        logger: Logger,
        name: string,
        ctUrl: string,
        url: string,
        token: string,
        active: boolean
    }

    interface RequestToMicroserviceOptions {
        version?: string & boolean,
        application?: string,
    }
}

export default RWAPIMicroservice;
