var fs = require("fs"),
    path = require('path'),
    Linter = require('tslint').Linter,
    tslintrc = {};


if (fs.existsSync('./tslint.json')) {
    tslintrc = JSON.parse(fs.readFileSync('./tslint.json', 'utf8'));
}

function lint(config) {
    if (typeof config !== 'object') {
        config = {};
    }

    if (!Array.isArray(config.extensions)) {
        config.extensions = ['.ts'];
    }

    return {
        type: 'tslint',
        review: function(files, done) {
            var log = {
                    success: true,
                    errors: []
                },
                promises = [];

            files.forEach(function(filename) {
                if (config.extensions.indexOf(path.extname(filename)) === -1) {
                    return;
                }

                var promise = new Promise(function(resolve, reject) {
                    fs.readFile(filename, {
                        encoding: 'utf8'
                    }, function(err, fileData) {
                        if (err) {
                            throw err;
                        }

                        var linter = new Linter({
                            formatter: "json"
                        });

                        try {
                            linter.lint(filename, fileData, tslintrc);

                            var result = linter.getResult();

                            JSON.parse(result.output).forEach(function(ruleFailure) {
                                log.errors.push({
                                    filename: filename,
                                    line: ruleFailure.startPosition.line + 1,
                                    column: ruleFailure.startPosition.character + 1,
                                    rule: ruleFailure.ruleName,
                                    message: String(ruleFailure.failure).replace("\n", '')
                                });
                            })
                        } catch (error) {
                            log.errors.push({
                                filename: 'TSlint',
                                line: 0,
                                column: 0,
                                rule: '',
                                message: error.message
                            });
                        }

                        resolve();
                    });
                });

                promises.push(promise);
            });

            Promise.all(promises).then(function() {
                if (log.errors.length) {
                    log.success = false;
                }
                done(log);
            });
        }
    };
}

module.exports = lint;
