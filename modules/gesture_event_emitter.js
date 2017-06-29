module.exports = {
  emit: function (io, event) {
    global.PreviousEventTimestamp[event.type] = global.PreviousEventTimestamp[event.type] || 0;
    if (Date.now() - global.PreviousEventTimestamp[event.type] > 500) {
      console.log(Date.now());
      console.log(global.PreviousEventTimestamp[event.type]);
      io.sockets.emit('move', JSON.stringify(event));
      global.PreviousEventTimestamp[event.type] = Date.now();
      console.log('emit------');
      console.log(event);
    } else {
    }
  },
  init: function () {
    global.PreviousEventTimestamp = {};
  }
}