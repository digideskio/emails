CozyInstance = require '../models/cozy_instance'
Account = require '../models/account'
Settings = require '../models/settings'
Promise = require 'bluebird'
ImapReporter = require '../processes/imap_reporter'

fixtures = require 'cozy-fixtures'

module.exports.main = (req, res, next) ->
    Promise.all [
        Settings.getInstance()

        CozyInstance.getLocalePromised()
            .catch (err) -> 'en'

        Account.requestPromised 'all'
            .map (account) -> account.toObjectWithMailbox()

        ImapReporter.summary()
    ]
    .spread (settings, locale, accounts, tasks) ->
        """
            window.settings = #{JSON.stringify settings}
            window.tasks = #{JSON.stringify tasks};
            window.locale = "#{locale}";
            window.accounts = #{JSON.stringify accounts};
        """

    # for now we handle error case loosely
    .catch (err) ->
        console.log err.stack

        """
            console.log("#{err}");
            window.locale = "en"
            window.tasks = []
            window.accounts = []
        """

    .then (imports) ->
        res.render 'index.jade', {imports}


module.exports.loadFixtures = (req, res, next) ->
    fixtures.load silent: true, callback: (err) ->
        if err? then next err
        else
            res.send 200, message: 'LOAD FIXTURES SUCCESS'

module.exports.refresh = (req, res, next) ->
    if req.query?.all
        limit = undefined
        onlyFavorites = false
    else
        limit = 1000
        onlyFavorites = true

    Account.refreshAllAccounts(limit, onlyFavorites)
    .then -> res.send 200, refresh: 'done'
    .catch next

module.exports.tasks = (req, res, next) ->
    res.send 200, ImapReporter.summary()