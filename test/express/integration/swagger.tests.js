var expect = require('chai').use(require('chai-subset')).expect,
    supertest = require('supertest-as-promised'),
    express = require('express'),
    mobileApps = require('../../appFactory'),
    app, mobileApp;

// added the .sql prefix to exclude from travis tests for now. remove when SQLite is done.
describe('azure-mobile-apps.express.integration.swagger', function () {
    beforeEach(function () {
        app = express();
    });

    afterEach(mobileApps.cleanUp(mobileApps.configuration()).testTable({ name: 'swagger' }));

    // afterEach(function (done) {
    //     data(config().data).execute({ sql: 'drop table dbo.swagger' }).then(done, function () { done(); });
    // });

    it("only exposes metadata if configured", function () {
        mobileApp = mobileApps();
        app.use(mobileApp);

        return supertest(app)
            .get('/swagger')
            .expect(404)
            .expect(function (res) {
                expect(res.text).to.contain("swagger: true")
            });
    });

    it("generates basic API definitions for tables", function () {
        mobileApp = mobileApps({ swagger: true });
        mobileApp.tables.add('swagger');
        app.use(mobileApp);

        return mobileApp.tables.initialize().then(function () {
            return supertest(app)
                .get('/swagger')
                .expect(200)
                .expect(function (res) {
                    expect(res.body).to.containSubset(metadataSubset);
                });
        });
    });

    it("redirects to swagger-ui with url", function () {
        mobileApp = mobileApps({ swagger: true });
        app.use(mobileApp);

        return supertest(app)
            .get('/swagger/ui')
            .expect(302);
    });

    it("exposes swagger-ui", function () {
        mobileApp = mobileApps({ swagger: true });
        app.use(mobileApp);

        return supertest(app)
            .get('/swagger/ui/?url=http://localhost/swagger')
            .expect(200);
    });

    it("returns 404 for swagger-ui if swagger configuration option is not set", function () {
        mobileApp = mobileApps();
        app.use(mobileApp);

        return supertest(app)
            .get('/swagger/ui/?url=http://localhost/swagger')
            .expect(404)
            .expect(function (res) {
                expect(res.text).to.contain("swagger: true")
            });
    })

    var metadataSubset = {
        paths: {
            '/tables/swagger': {
                get: { parameters: [ { name: "$filter" } ] },
                post: { parameters: [ { in: 'body' } ] }
            },
            '/tables/swagger/{id}': {
                get: { parameters: [ { name: "id" } ] },
                post: { parameters: [ { name: "id" } ] },
                patch: { parameters: [ { name: "id" }, { in: 'body' } ]},
                delete: { parameters: [ { name: "id" } ] }
            }
        },
        definitions: {
            swagger: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    version: { type: 'string' },
                    deleted: { type: 'boolean' }
                }
            }
        }
    };
});
