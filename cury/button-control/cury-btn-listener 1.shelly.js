/**
 * @title Cury Button Listener Passive Scan
 * @description Listens for a specific BLU button using address-filtered passive BLE scanning and controls the paired Cury animation script.
 * @status under development
 * @link https://github.com/ALLTERCO/shelly-script-examples/blob/main/cury/button-control/cury-btn-listener%201.shelly.js
 */

var ANIM_ID  = 1;
var BLU_ADDR = "bc:02:6e:c3:a3:0e";
var lastPid  = -1;

function bthomeParseByte(svc, objId) {
  var i = 1;
  while (i + 1 < svc.length) {
    if (svc.charCodeAt(i) === objId) return svc.charCodeAt(i + 1);
    i += 2;
  }
  return -1;
}

function onTap() {
  print("[Cury] BTN: next color");
  Shelly.call("Script.Eval", { id: ANIM_ID, code: "nextColor();" });
}

function onDoubleTap() {
  print("[Cury] BTN: stop animation");
  Shelly.call("Script.Stop",    { id: ANIM_ID });
  Shelly.call("Cury.Set",       { id: 0, slot: "right", on: false });
  Shelly.call("Cury.Set",       { id: 0, slot: "left",  on: false });
  Shelly.call("Cury.SetConfig", { id: 0, config: {
    ambient: { enable: false, brightness: 0 },
    ui:      { mode: "level", brightness: 100 }
  }});
}

function onLongPress() {
  print("[Cury] BTN: start animation");
  Shelly.call("Script.Start", { id: ANIM_ID });
}

// active:false = passive scan (no SCAN_REQ sent, less BLE traffic)
// addr filter  = callback only fires for our button, not every device in range
BLE.Scanner.Subscribe(function(ev, res) {
  if (ev !== BLE.Scanner.SCAN_RESULT) return;
  if (!res || res.addr !== BLU_ADDR) return;
  var svc = res.service_data && res.service_data["fcd2"];
  if (!svc) return;
  var pid = bthomeParseByte(svc, 0x00);
  var btn = bthomeParseByte(svc, 0x3A);
  if (pid >= 0 && pid === lastPid) return;
  lastPid = pid;
  if (btn <= 0) return;
  if (btn === 1) { onTap();       return; }
  if (btn === 2) { onDoubleTap(); return; }
  if (btn === 4) { onLongPress(); return; }
}, { addr: BLU_ADDR, active: false });
