export const error = (msg) => console.error(msg);

module.exports.log = function(...args) {
  console.log.apply(console, args);
};
