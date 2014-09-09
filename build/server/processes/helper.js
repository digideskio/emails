// Generated by CoffeeScript 1.8.0
var Guid, IGNORE_ATTRIBUTES, ImapConnection, ImapHelpers, Promise, cleanUpBoxTree, log, _;

Promise = require('bluebird');

Guid = require('guid');

_ = require('lodash');

ImapConnection = require('imap');

Promise.promisifyAll(ImapConnection.prototype);

log = function() {
  return console.log.apply(console, arguments);
};

module.exports = ImapHelpers = {};

IGNORE_ATTRIBUTES = ['\\HasNoChildren', '\\HasChildren'];

ImapHelpers.cleanUpBoxTree = cleanUpBoxTree = function(children, path) {
  var child, name, prepChildren, subPath;
  if (path == null) {
    path = [];
  }
  prepChildren = [];
  for (name in children) {
    child = children[name];
    subPath = path.concat([name]);
    prepChildren.push({
      id: Guid.raw(),
      label: name,
      path: subPath,
      attribs: _.difference(child.attribs, IGNORE_ATTRIBUTES),
      delimiter: child.delimiter,
      children: cleanUpBoxTree(child.children, subPath)
    });
  }
  return prepChildren;
};

ImapHelpers.getConnection = function(account) {
  var pConnection;
  pConnection = new Promise((function(_this) {
    return function(resolve, reject) {
      var connection;
      connection = new ImapConnection({
        user: account.login,
        password: account.password,
        host: account.imapServer,
        port: parseInt(account.imapPort),
        tls: account.imapSecure || true,
        tlsOptions: {
          rejectUnauthorized: false
        }
      });
      connection.once('ready', function() {
        return resolve(connection);
      });
      connection.once('error', function(err) {
        if (pConnection.isPending()) {
          return reject(err);
        } else {
          return connection.end();
        }
      });
      console.log("NEW CONNECT");
      return connection.connect();
    };
  })(this));
  return pConnection.disposer(function(connection) {
    console.log("DISPOSING");
    connection.end();
    return pConnection = null;
  });
};
