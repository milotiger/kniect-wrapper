var Joints = {
  'LEFT_HAND': 7,
  'RIGHT_HAND': 11,
  'HEAD': 3
}

var HandStates = {
  'CLOSE': 3,
  'OPEN': 2
}

const UD_OFFSET = 0.025;
const WAVE_OFFSET = 0.03;

const CLICK_DELAY = 500; //ms
const RETURN_DELAY = 2000; //ms
const TURN_DELAY = 1000; //ms

function set_standard_position() {
  if (global.CurrentState == {} || !global.CurrentState) {
    console.log('Not ready!');
    return;
  }
  var joint = global.CurrentState;
  // console.log(global.CurrentState);
  var head = joint[Joints.HEAD];
  global.StandardPosition.Head = {X: head.cameraX, Y: head.cameraY, Z: head.cameraZ};
  var left_hand = joint[Joints.LEFT_HAND];
  global.StandardPosition.LeftHand = {X: left_hand.depthX, Y: left_hand.depthY};
  var right_hand = joint[Joints.RIGHT_HAND];
  global.StandardPosition.leftHand = {X: right_hand.depthX, Y: right_hand.depthY};
  global.StandardPosition.isSet = true;
  console.log('position reset!');
}

function calculate_offset() {
  if (global.StandardPosition.isSet == false){
    return {};
  }
  var joint = global.CurrentState;
  var head = joint[Joints.HEAD];
  var left_hand = joint[Joints.LEFT_HAND];
  var right_hand = joint[Joints.RIGHT_HAND];

  var offset = {
    Head: {
      X: head.cameraX - global.StandardPosition.Head.X,
      Y: head.cameraY - global.StandardPosition.Head.Y,
      Z: head.cameraZ - global.StandardPosition.Head.Z
    },
    LeftHand: {
      X: left_hand.depthX - global.StandardPosition.LeftHand.X,
      Y: left_hand.depthY - global.StandardPosition.LeftHand.Y,
    },
    leftHand: {
      X: right_hand.depthX - global.StandardPosition.leftHand.X,
      Y: right_hand.depthY - global.StandardPosition.leftHand.Y,
    }
  }
  global.OffsetValues = offset;
}

function detect(body_frame) {
  global.CurrentState = body_frame.joints;
  var result = [];
  if (!global.StandardPosition.isSet)
    return result;

  calculate_offset();

  // if (global.OffsetValues.Head.X > LR_OFFSET) {
  //   result.push({type: 'move-right', value: global.OffsetValues.Head.X});
  // }
  // if (global.OffsetValues.Head.X < -LR_OFFSET) {
  //   result.push({type: 'move-left', value: -global.OffsetValues.Head.X});
  // }
  if (global.PreviousState[Joints.RIGHT_HAND]
    && Math.abs(global.CurrentState[Joints.RIGHT_HAND].depthX - global.PreviousState[Joints.RIGHT_HAND].depthX) >= WAVE_OFFSET
    && Date.now() - global.LastTurn > TURN_DELAY) {
    var value = global.CurrentState[Joints.RIGHT_HAND].depthX - global.PreviousState[Joints.RIGHT_HAND].depthX;
    if (value > 0)
      result.push({type: 'move-right', value: value});
    if (value < 0)
      result.push({type: 'move-left', value: -value});
    global.LastTurn = Date.now();
  }
  if (global.OffsetValues.Head.Z > UD_OFFSET) {
    result.push({type: 'move-backward', value: global.OffsetValues.Head.Z});
  }
  if (global.OffsetValues.Head.Z < -UD_OFFSET) {
    result.push({type: 'move-forward', value: -global.OffsetValues.Head.Z});
  }
  if (body_frame.leftHandState == HandStates.OPEN
    && global.PreviousHandState == HandStates.CLOSE
    && Date.now() - global.LastClick > CLICK_DELAY) {
    result.push({type: 'click', value: 1});
    global.LastClick = Date.now();
  }
  if (global.PreviousState[Joints.LEFT_HAND]
    && Math.abs(global.CurrentState[Joints.LEFT_HAND].depthX - global.PreviousState[Joints.LEFT_HAND].depthX) >= WAVE_OFFSET
    && Date.now() - global.LastReturn > RETURN_DELAY) {
    result.push({type: 'return', value: 1});
    global.LastReturn = Date.now();
  }
  global.PreviousState = global.CurrentState;
  global.PreviousHandState = body_frame.leftHandState;
  return result;
}

module.exports = {
  detect: detect,
  set_standard_position: set_standard_position,
  init: function () {
    global.StandardPosition = {
      Head: {
        X: 0,
        Y: 0,
        Z: 0,
      },
      leftHand: {
        X: 0,
        Y: 0
      },
      LeftHand: {
        X: 0,
        Y: 0
      },
      isSet: false
    }
    global.OffsetValues = {
      Head: {
        X: 0,
        Y: 0,
        Z: 0
      },
      LeftHand: {
        X: 0,
        Y: 0,
      },
      leftHand: {
        X: 0,
        Y: 0,
      }
    }
    global.CurrentState = {};
    global.PreviousState = {};
    global.PreviousHandState = null;
    global.LastClick = 0;
    global.LastReturn = 0;
    global.LastTurn = 0;
  }
}