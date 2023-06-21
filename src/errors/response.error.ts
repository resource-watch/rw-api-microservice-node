export class ResponseError extends Error {
    statusCode: number;
    error: any;
    private response: any;

    constructor(statusCode: number, body: any, response?: any) {
        super();
        this.name = 'ResponseError';
        this.statusCode = statusCode;
        this.message = statusCode + ' - ' + (JSON && JSON.stringify ? JSON.stringify(body) : body);
        this.error = body; // legacy attribute
        this.response = response;
    }
}
