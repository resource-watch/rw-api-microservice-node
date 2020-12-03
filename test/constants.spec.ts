import chai from 'chai';
import { RWAPIMicroservice } from 'main';

chai.should();

describe('Constants', () => {

    before(async () => {
        if (process.env.NODE_ENV !== 'test') {
            throw Error(`Running the test suite with NODE_ENV ${process.env.NODE_ENV} may result in permanent data loss. Please use NODE_ENV=test.`);
        }
    });

    it('Test constant calls', async () => {
        RWAPIMicroservice.KOA1.should.equal('KOA1');
        RWAPIMicroservice.KOA2.should.equal('KOA2');
        RWAPIMicroservice.EXPRESS.should.equal('EXPRESS');
        RWAPIMicroservice.MODE_AUTOREGISTER.should.equal('MODE_AUTOREGISTER');
        RWAPIMicroservice.MODE_NORMAL.should.equal('MODE_NORMAL');
    });

});

