export class ApiKeyError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super();
        this.name = 'ApiKeyError';
        this.statusCode = statusCode;
        this.message = message;
    }
}
