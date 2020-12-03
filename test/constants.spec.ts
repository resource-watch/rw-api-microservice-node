import chai from 'chai';
import { microservice } from 'main';

chai.should();

describe('Constants', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    it('Test constant calls', async () => {
        microservice.KOA1.should.equal('KOA1');
        microservice.KOA2.should.equal('KOA2');
        microservice.EXPRESS.should.equal('EXPRESS');
        microservice.MODE_AUTOREGISTER.should.equal('MODE_AUTOREGISTER');
        microservice.MODE_NORMAL.should.equal('MODE_NORMAL');
    });

});

