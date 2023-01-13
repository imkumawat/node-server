// This catchAsync module is used to catch the errors
// from async functions
// async functions always returns promise and if promise fulfilled then ok
// otherwise it will be caught in catch

exports.catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
