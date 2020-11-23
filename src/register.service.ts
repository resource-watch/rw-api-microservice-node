import requestPromise from 'request-promise';

class RegisterService {

    static register(name:string, url:string, active:boolean, ctUrl:string) {
        const promise = requestPromise({
            uri: `${ctUrl}/api/v1/microservice`,
            json: {
                name,
                url,
                active,
            },
            method: 'POST',
        });
        return promise;
    }

}

export default RegisterService;
