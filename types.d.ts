import type Application from "koa";
import { Context, Next } from "koa";
import type Logger from "bunyan";
import request from "request";

declare namespace RWAPIMicroservice {
    interface RWAPIMicroservice {
        register: (opts: RWAPIMicroservice.RegisterOptions) => Promise<any>;
        requestToMicroservice: (config: request.OptionsWithUri & RWAPIMicroservice.RequestToMicroserviceOptions) => request.Request;
    }

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

    interface KoaService {
        registerCTRoutes: (ctx: Context, info: Record<string, any>, swagger: Record<string, any>, next: Next, logger: Logger) => Promise<any>
        getLoggedUser: (ctx: Context, next: Next, logger: Logger, serverURL: string) => Promise<any>
    }
}

export default RWAPIMicroservice;
