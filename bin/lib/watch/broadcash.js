const { getRoutes } = require('@shopmost/shopmost/src/lib/router/Router');

module.exports.broadcash = function broadcash() {
  const routes = getRoutes();
  routes.forEach((route) => {
    if (
      !route.isApi &&
      !['staticAsset', 'adminStaticAsset'].includes(route.id)
    ) {
      const hotMiddleware = route.hotMiddleware;
      if (hotMiddleware) {
        hotMiddleware.publish({
          action: 'serverReloaded'
        });
      }
    } else {
      return;
    }
  });
};