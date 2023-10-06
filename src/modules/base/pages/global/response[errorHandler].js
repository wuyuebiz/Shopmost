/* eslint-disable global-require */
/* eslint-disable guard-for-in */
/* eslint-disable import/no-import-module-exports */
const isErrorHandlerTriggered = require('@lib/middleware/isErrorHandlerTriggered');
const { render } = require('@lib/response/render');
const { get } = require('@lib/util/get');
const isDevelopmentMode = require('@lib/util/isDevelopmentMode');

module.exports = async (request, response, delegate, next) => {
  /** Get all promise delegate */
  const promises = [];
  Object.keys(delegate).forEach((id) => {
    // Check if middleware is async
    if (delegate[id] instanceof Promise) {
      promises.push(delegate[id]);
    }
  });

  try {
    /** Wait for all async middleware to be completed */
    await Promise.all(promises);

    /** If a rejected middleware called next(error) without throwing an error */
    if (isErrorHandlerTriggered(response)) {
      return;
    } else {
      const route = request.currentRoute;
      // eslint-disable-next-line max-len
      // Check if `$body` is empty or not. If yes, we consider the content is already generated by previous middlewares
      // eslint-disable-next-line no-lonely-if
      if (response.$body && response.$body !== '') {
        response.send(response.$body);
      } else {
        response.context.route = {
          id: route.id,
          path: route.path,
          method: route.method,
          isApi: route.isApi,
          isAdmin: route.isAdmin
        };
        if (
          (isDevelopmentMode() &&
            request.query &&
            request.query.fashRefresh === 'true') ||
          (request.query && request.query.ajax === 'true')
        ) {
          response.json({
            success: true,
            eContext: {
              graphqlResponse: get(response, 'locals.graphqlResponse', {}),
              propsMap: get(response, 'locals.propsMap', {})
            }
          });
        } else {
          render(request, response);
        }
      }
    }
  } catch (error) {
    if (!isErrorHandlerTriggered(response)) {
      next(error);
    } else {
      // Do nothing here since the next(error) is already called
      // when the error is thrown on each middleware
    }
  }
};
