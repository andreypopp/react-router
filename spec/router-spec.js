require('./helper');
var Router = require('../lib/router');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe("when a router's pattern matches the URL", function () {
  it('match() returns an array with that router', function () {
    var router = Router('/a/b/c', App);

    var match = router.match('a/b/c');
    assert(match);
    expect(match.length).toEqual(1);

    var rootMatch = lastItem(match);
    expect(rootMatch.router).toBe(router);
    expect(rootMatch.params).toEqual({});
  });

  describe('and it contains dynamic segments', function () {
    it('match() returns an array with that router and its params', function () {
      var router = Router('/posts/:id/edit', App);

      var match = router.match('posts/abc/edit');
      assert(match);
      expect(match.length).toEqual(1);

      var rootMatch = lastItem(match);
      expect(rootMatch.router).toBe(router);
      expect(rootMatch.params).toEqual({ id: 'abc' });
    });
  });
});

describe("when a router's pattern does not match the URL", function () {
  it('match() returns null', function () {
    var router = Router('/a/b/c', App);

    var match = router.match('not-found');
    expect(match).toBe(null);
  });
});

describe("when a nested router matches the URL", function () {
  describe('and it has all the dynamic segments of its ancestors', function () {
    it('match() returns the appropriate params for each match', function () {
      var nestedRouter;
      var router = Router('/posts/:id', App, function (route) {
        nestedRouter = route('/posts/:id/comments/:commentId', App);
      });

      var match = router.match('posts/abc/comments/123');
      assert(match);
      expect(match.length).toEqual(2);

      var rootMatch = lastItem(match);
      expect(rootMatch.router).toBe(nestedRouter);
      expect(rootMatch.params).toEqual({ id: 'abc', commentId: '123' });

      var firstMatch = match[0];
      expect(firstMatch.router).toBe(router);
      expect(firstMatch.params).toEqual({ id: 'abc' });
    });
  });

  describe('but it is missing some dynamic segments of its ancestors', function () {
    it('match() throws an Error', function () {
      var router = Router('/comments/:id', App, function (route) {
        route('/comments/:commentId/edit', App);
      });

      expect(function () {
        router.match('comments/abc/edit');
      }).toThrow(Error);
    });
  });
});

describe('when multiple nested routers match the URL', function () {
  it('match() returns the first one in the subtree, depth-first', function () {
    var expectedRouter;
    var router = Router('/', App, function (route) {
      route('/a', App, function (route) {
        expectedRouter = route('/a/b', App);
      });

      route('/a/b', App);
    });

    var match = router.match('a/b');
    assert(match);
    expect(match.length).toEqual(3);

    var rootMatch = lastItem(match);
    expect(rootMatch.router).toBe(expectedRouter);
  });
});

describe('a router with a named component', function () {
  it('has the correct toString representation', function () {
    var router = Router('/', App);
    expect(router + '').toEqual('<AppRouter>');
  });
});

function lastItem(array) {
  return array[array.length - 1];
}
