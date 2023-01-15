// This catchAsync module is used to catch the errors
// from async functions, do not use for non async, use try catch for them
// async functions always return a promise and if promise fulfilled then ok
// otherwise it will be caught in catch
// this code of peice give rid of writing try catch multiple times

exports.catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
